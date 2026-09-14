import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AvaliarHorarioAgendamentoQueryDto,
  CriarAgendamentoDto,
  ListarHorariosLivresQueryDto,
} from '@fluy/schema';
import { dataHoraCivilParaUtc } from '@/shared/horario-salao/horario-salao.utils';
import type {
  AvaliarHorarioAgendamentoInput,
  DadosParaAvaliacaoHorario,
} from '@/modules/agendamento/contracts';
import { AgendamentoDisponibilidadeService } from '@/modules/agendamento/agendamento-disponibilidade.service';
import { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';
import { DisponibilidadeService } from '@/modules/disponibilidade/disponibilidade.service';
import { ProcedimentoService } from '@/modules/procedimento/procedimento.service';
import { SalaoConfiguracaoService } from '@/modules/salao-configuracao/salao-configuracao.service';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';

@Injectable()
export class AgendamentoService {
  constructor(
    private readonly agendamentoRepository: AgendamentoRepository,
    private readonly agendamentoDisponibilidadeService: AgendamentoDisponibilidadeService,
    private readonly agendamentoValidator: AgendamentoValidator,
    private readonly disponibilidadeService: DisponibilidadeService,
    private readonly procedimentoService: ProcedimentoService,
    private readonly salaoConfiguracaoService: SalaoConfiguracaoService,
    private readonly salaoConsultaService: SalaoConsultaService,
  ) {}

  async listarHorariosLivres({
    salaoId,
    dados,
  }: {
    salaoId: string;
    dados: ListarHorariosLivresQueryDto;
  }) {
    const dadosParaAvaliacao = await this.buscarDadosParaAvaliacaoHorario({
      salaoId,
      procedimentoId: dados.procedimento_id,
      data: dados.data,
    });
    const dadosParaAvaliarDisponibilidade =
      this.montarDadosParaAvaliarDisponibilidade({
        dadosParaAvaliacao,
        data: dados.data,
        horaInicio: '00:00',
      });

    return {
      data: dados.data,
      horarios: this.agendamentoDisponibilidadeService
        .listarHorariosLivres(dadosParaAvaliarDisponibilidade)
        .map((hora_inicio) => ({ hora_inicio })),
    };
  }

  async avaliarHorario({
    salaoId,
    dados,
  }: {
    salaoId: string;
    dados: AvaliarHorarioAgendamentoQueryDto;
  }) {
    const dadosParaAvaliacao = await this.buscarDadosParaAvaliacaoHorario({
      salaoId,
      procedimentoId: dados.procedimento_id,
      data: dados.data,
    });

    return this.agendamentoDisponibilidadeService.avaliarHorario(
      this.montarDadosParaAvaliarDisponibilidade({
        dadosParaAvaliacao,
        data: dados.data,
        horaInicio: dados.hora_inicio,
      }),
    );
  }

  async criar({
    salaoId,
    dados,
  }: {
    salaoId: string;
    dados: CriarAgendamentoDto;
  }) {
    await this.garantirClienteAtivaDoSalao({
      clienteId: dados.cliente_id,
      salaoId,
    });
    const dadosParaAvaliacao = await this.buscarDadosParaAvaliacaoHorario({
      salaoId,
      procedimentoId: dados.procedimento_id,
      data: dados.data,
    });

    const avaliacao = this.agendamentoDisponibilidadeService.avaliarHorario(
      this.montarDadosParaAvaliarDisponibilidade({
        dadosParaAvaliacao,
        data: dados.data,
        horaInicio: dados.hora_inicio,
      }),
    );
    this.agendamentoValidator.validarCriacao({
      avaliacao,
      confirmarExcecoes: dados.confirmar_excecoes,
    });
    const procedimento = dadosParaAvaliacao.procedimento;
    const inicioEm = dataHoraCivilParaUtc({
      data: dados.data,
      hora: dados.hora_inicio,
      fusoHorario: dadosParaAvaliacao.fusoHorario,
    });
    const agendamento = await this.agendamentoRepository.criar({
      dataAgendamento: dados.data,
      salaoId,
      clienteId: dados.cliente_id,
      procedimentoId: dados.procedimento_id,
      profissionalId: avaliacao.profissionalId!,
      inicioEm,
      duracaoMin: procedimento.duracao_min,
      precoTotal: procedimento.preco,
      valorSinal: this.calcularValorSinalDoProcedimento(procedimento),
    });

    if (!agendamento) {
      throw new ConflictException('O horário deixou de estar disponível.');
    }

    return agendamento;
  }

  private montarDadosParaAvaliarDisponibilidade({
    dadosParaAvaliacao,
    data,
    horaInicio,
  }: {
    dadosParaAvaliacao: DadosParaAvaliacaoHorario;
    data: string;
    horaInicio: string;
  }): AvaliarHorarioAgendamentoInput {
    return {
      data,
      horaInicio,
      duracaoMin: dadosParaAvaliacao.procedimento.duracao_min,
      fusoHorario: dadosParaAvaliacao.fusoHorario,
      granularidadeMin: dadosParaAvaliacao.configuracao.granularidade_min,
      antecedenciaMinHoras:
        dadosParaAvaliacao.configuracao.antecedencia_min_horas,
      antecedenciaMaxDias:
        dadosParaAvaliacao.configuracao.antecedencia_max_dias,
      agora: new Date(),
      profissionais: dadosParaAvaliacao.profissionais,
      ocupacoes: dadosParaAvaliacao.ocupacoes,
    };
  }

  private async buscarDadosParaAvaliacaoHorario({
    salaoId,
    procedimentoId,
    data,
  }: {
    salaoId: string;
    procedimentoId: string;
    data: string;
  }): Promise<DadosParaAvaliacaoHorario> {
    const [fusoHorario, configuracao, procedimento, profissionais] =
      await Promise.all([
        this.salaoConsultaService.obterFusoHorario(salaoId),
        this.salaoConfiguracaoService.buscar(salaoId),
        this.procedimentoService.buscarParaAgendamentoManual({
          id: procedimentoId,
          salaoId,
        }),
        this.disponibilidadeService.listarProfissionaisComJanelasNoDia({
          salaoId,
          data,
        }),
      ]);
    const ocupacoes = await this.agendamentoRepository.listarOcupacoesDoDia({
      salaoId,
      data,
      fusoHorario,
    });

    return {
      configuracao,
      fusoHorario,
      ocupacoes,
      procedimento,
      profissionais,
    };
  }

  private async garantirClienteAtivaDoSalao({
    clienteId,
    salaoId,
  }: {
    clienteId: string;
    salaoId: string;
  }): Promise<void> {
    // TODO(2.1b): mover para ClienteService quando ClienteModule existir.
    const clienteAtiva = await this.agendamentoRepository.buscarClienteAtivo({
      clienteId,
      salaoId,
    });

    if (!clienteAtiva) {
      throw new NotFoundException('Cliente não encontrada.');
    }
  }

  private calcularValorSinalDoProcedimento(procedimento: {
    preco: string;
    tipo_sinal: 'percentual' | 'fixo';
    valor_sinal: string;
  }): string {
    if (procedimento.tipo_sinal === 'fixo') {
      return this.formatarCentavos({
        valor: this.emCentavos({ valor: procedimento.valor_sinal }),
      });
    }

    const precoEmCentavos = this.emCentavos({ valor: procedimento.preco });
    const percentualEmCentimos = this.emCentavos({
      valor: procedimento.valor_sinal,
    });
    const valorSinalEmCentavos =
      (precoEmCentavos * percentualEmCentimos + 5_000n) / 10_000n;

    return this.formatarCentavos({ valor: valorSinalEmCentavos });
  }

  private emCentavos({ valor }: { valor: string }): bigint {
    const [inteiro, decimal = ''] = valor.split('.');
    const centavos = decimal.padEnd(2, '0').slice(0, 2);

    return BigInt(inteiro) * 100n + BigInt(centavos);
  }

  private formatarCentavos({ valor }: { valor: bigint }): string {
    const sinal = valor < 0n ? '-' : '';
    const absoluto = valor < 0n ? -valor : valor;
    const inteiro = absoluto / 100n;
    const centavos = (absoluto % 100n).toString().padStart(2, '0');

    return `${sinal}${inteiro}.${centavos}`;
  }
}
