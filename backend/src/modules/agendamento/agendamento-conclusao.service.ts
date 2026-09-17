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
} from '@/modules/agendamento/contracts';
import {
  calcularValorPago,
  calcularValorPendente,
} from '@/modules/agendamento/agendamento-utils';
import { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';

@Injectable()
export class AgendamentoConclusaoService {
  constructor(
    private readonly agendamentoRepository: AgendamentoRepository,
    private readonly agendamentoService: AgendamentoService,
    private readonly agendamentoValidator: AgendamentoValidator,
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

    const concluido = await this.agendamentoRepository.concluir({
      id,
      salaoId,
      // O faturamento usa a data da conclusão, não a de `inicio_em`.
      ocorreuEm: new Date(),
      cobranca: this.montarCobranca({
        metodoPagamento,
        valorPendente,
        usuarioSalaoId,
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
}
