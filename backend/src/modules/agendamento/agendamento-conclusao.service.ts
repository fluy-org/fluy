import { PERIODO_MANUTENCAO_MAXIMO_DIAS } from '@fluy/schema';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AgendamentoDetalheResultado,
  CobrancaManualDaConclusao,
  ConcluirAgendamentoInput,
  LembreteDaConclusao,
  ProcedimentoDoAgendamentoPersistido,
} from '@/modules/agendamento/contracts';
import {
  calcularValorPago,
  calcularValorPendente,
} from '@/modules/agendamento/agendamento-utils';
import { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import {
  adicionarDiasNaData,
  utcParaDataHoraCivil,
} from '@/shared/horario-salao/horario-salao.utils';

@Injectable()
export class AgendamentoConclusaoService {
  constructor(
    private readonly agendamentoRepository: AgendamentoRepository,
    private readonly agendamentoService: AgendamentoService,
    private readonly agendamentoValidator: AgendamentoValidator,
    private readonly salaoConsultaService: SalaoConsultaService,
  ) {}

  async concluir({
    id,
    salaoId,
    usuarioSalaoId,
    dados,
  }: ConcluirAgendamentoInput): Promise<AgendamentoDetalheResultado> {
    const agendamento = await this.agendamentoRepository.buscarDetalhe({
      id,
      salaoId,
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    const valorPendente = calcularValorPendente({
      precoTotal: agendamento.preco_total,
      valorPago: calcularValorPago({ pagamentos: agendamento.pagamentos }),
    });

    const metodoPagamento = dados.metodo_pagamento;

    this.agendamentoValidator.validarConclusao({
      estado: agendamento.estado,
      valorPendente,
      metodoPagamento,
    });

    // O faturamento usa a data da conclusão, não a de `inicio_em`.
    const ocorreuEm = new Date();

    const concluido = await this.agendamentoRepository.concluir({
      id,
      salaoId,
      ocorreuEm,
      cobranca: this.montarCobranca({
        metodoPagamento,
        valorPendente,
        usuarioSalaoId,
      }),
      lembrete: await this.montarLembrete({
        salaoId,
        ocorreuEm,
        procedimento: agendamento.procedimento,
      }),
    });

    if (!concluido) {
      throw new ConflictException('Este agendamento já foi encerrado.');
    }

    return this.agendamentoService.buscarDetalhe({ id, salaoId });
  }

  // "Não recebeu" não gera cobrança: no MVP a pendência fica em aberto.
  private montarCobranca({
    metodoPagamento,
    valorPendente,
    usuarioSalaoId,
  }: {
    metodoPagamento: ConcluirAgendamentoInput['dados']['metodo_pagamento'];
    valorPendente: string;
    usuarioSalaoId: string | null;
  }): CobrancaManualDaConclusao | undefined {
    if (!metodoPagamento) {
      return undefined;
    }

    if (!usuarioSalaoId) {
      throw new BadRequestException(
        'Não foi possível identificar quem registrou o pagamento.',
      );
    }

    return {
      valor: valorPendente,
      metodo: metodoPagamento,
      registradaPor: usuarioSalaoId,
    };
  }

  // A data alvo parte do dia civil da conclusão no fuso do salão: concluir às
  // 23h não pode empurrar o lembrete para o dia seguinte em UTC.
  private async montarLembrete({
    salaoId,
    ocorreuEm,
    procedimento,
  }: {
    salaoId: string;
    ocorreuEm: Date;
    procedimento: ProcedimentoDoAgendamentoPersistido;
  }): Promise<LembreteDaConclusao | undefined> {
    const periodo = procedimento.periodo_manutencao_dias;

    // Procedimentos gravados antes do teto podem ter período sem data
    // representável: sem lembrete, mas a conclusão e o pagamento seguem.
    if (!periodo || periodo <= 0 || periodo > PERIODO_MANUTENCAO_MAXIMO_DIAS) {
      return undefined;
    }

    const fusoHorario =
      await this.salaoConsultaService.obterFusoHorario(salaoId);
    const dataConclusao = utcParaDataHoraCivil({
      dataHora: ocorreuEm,
      fusoHorario,
    }).data;

    return {
      texto: `Retorno de manutenção — ${procedimento.nome}`,
      dataAlvo: adicionarDiasNaData({ data: dataConclusao, dias: periodo }),
    };
  }
}
