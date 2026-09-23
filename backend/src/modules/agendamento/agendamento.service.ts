import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AvaliarHorarioAgendamentoQueryDto,
  CriarAgendamentoDto,
  ListarAgendaDiaQueryDto,
  ListarHorariosLivresQueryDto,
  ListarResumoAgendaQueryDto,
} from '@fluy/schema';
import {
  dataHoraCivilParaUtc,
  utcParaDataHoraCivil,
} from '@/shared/horario-salao/horario-salao.utils';
import type {
  AgendaDoDiaResultado,
  AgendamentoDaAgendaPersistido,
  AgendamentoDaAgendaResultado,
  AgendamentoDetalheResultado,
  AvaliarHorarioAgendamentoInput,
  DadosParaAvaliacaoHorario,
  ResumoDaAgendaResultado,
} from '@/modules/agendamento/contracts';
import {
  calcularAcoesDoAgendamento,
  calcularValorPago,
  calcularValorPendente,
  calcularValorSinalDoProcedimento,
  contarAgendamentosPorDia,
} from '@/modules/agendamento/agendamento-utils';
import { AgendamentoDisponibilidadeService } from '@/modules/agendamento/agendamento-disponibilidade.service';
import { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';
import { DisponibilidadeService } from '@/modules/disponibilidade/disponibilidade.service';
import { ProcedimentoService } from '@/modules/procedimento/procedimento.service';
import { SalaoConfiguracaoService } from '@/modules/salao-configuracao/salao-configuracao.service';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import { ClienteService } from '@/modules/cliente/cliente.service';

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
    private readonly clienteService: ClienteService,
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
        duracaoMin: dadosParaAvaliacao.procedimento.duracao_min,
      });

    return {
      data: dados.data,
      horarios: this.agendamentoDisponibilidadeService
        .listarHorariosLivres(dadosParaAvaliarDisponibilidade)
        .map((hora_inicio) => ({ hora_inicio })),
    };
  }

  async listarAgendaDoDia({
    salaoId,
    dados,
  }: {
    salaoId: string;
    dados: ListarAgendaDiaQueryDto;
  }): Promise<AgendaDoDiaResultado> {
    const fusoHorario =
      await this.salaoConsultaService.obterFusoHorario(salaoId);
    const data = dados.data ?? this.resolverHoje(fusoHorario);
    const agendamentos = await this.agendamentoRepository.listarDoDia({
      salaoId,
      data,
      fusoHorario,
    });

    return {
      data,
      fusoHorario,
      agendamentos: agendamentos.map((agendamento) =>
        this.acrescentarValores(agendamento),
      ),
    };
  }

  async listarResumoDoPeriodo({
    salaoId,
    dados,
  }: {
    salaoId: string;
    dados: ListarResumoAgendaQueryDto;
  }): Promise<ResumoDaAgendaResultado> {
    const fusoHorario =
      await this.salaoConsultaService.obterFusoHorario(salaoId);
    const instantes = await this.agendamentoRepository.listarInstantesDoPeriodo(
      {
        salaoId,
        dataInicio: dados.data_inicio,
        dataFim: dados.data_fim,
        fusoHorario,
      },
    );

    return { dias: contarAgendamentosPorDia({ instantes, fusoHorario }) };
  }

  async buscarDetalhe({
    id,
    salaoId,
  }: {
    id: string;
    salaoId: string;
  }): Promise<AgendamentoDetalheResultado> {
    const [fusoHorario, configuracao, agendamento] = await Promise.all([
      this.salaoConsultaService.obterFusoHorario(salaoId),
      this.salaoConfiguracaoService.buscar(salaoId),
      this.agendamentoRepository.buscarDetalhe({ id, salaoId }),
    ]);

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    return {
      ...this.acrescentarValores(agendamento),
      remarcado_vezes: agendamento.remarcado_vezes,
      fusoHorario,
      ...calcularAcoesDoAgendamento({
        estado: agendamento.estado,
        inicioEm: agendamento.inicio_em,
        toleranciaAtrasoMin: configuracao.tolerancia_atraso_min,
        agora: new Date(),
      }),
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
        duracaoMin: dadosParaAvaliacao.procedimento.duracao_min,
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
    await this.clienteService.buscarPorId({
      id: dados.cliente_id,
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
        duracaoMin: dadosParaAvaliacao.procedimento.duracao_min,
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
      valorSinal: calcularValorSinalDoProcedimento(procedimento),
    });

    if (!agendamento) {
      throw new ConflictException('O horário deixou de estar disponível.');
    }

    return agendamento;
  }

  montarDadosParaAvaliarDisponibilidade({
    dadosParaAvaliacao,
    data,
    horaInicio,
    duracaoMin,
  }: {
    dadosParaAvaliacao: DadosParaAvaliacaoHorario;
    data: string;
    horaInicio: string;
    duracaoMin: number;
  }): AvaliarHorarioAgendamentoInput {
    return {
      data,
      horaInicio,
      duracaoMin,
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

  async buscarDadosParaAvaliacaoHorario({
    salaoId,
    procedimentoId,
    data,
    ignorarAgendamentoId,
  }: {
    salaoId: string;
    procedimentoId: string;
    data: string;
    ignorarAgendamentoId?: string;
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
      ignorarAgendamentoId,
    });

    return {
      configuracao,
      fusoHorario,
      ocupacoes,
      procedimento,
      profissionais,
    };
  }

  private resolverHoje(fusoHorario: string): string {
    return utcParaDataHoraCivil({ dataHora: new Date(), fusoHorario }).data;
  }

  private acrescentarValores(
    agendamento: AgendamentoDaAgendaPersistido,
  ): AgendamentoDaAgendaResultado {
    const valorPago = calcularValorPago({
      pagamentos: agendamento.pagamentos,
    });

    return {
      ...agendamento,
      valorPago,
      valorPendente: calcularValorPendente({
        precoTotal: agendamento.preco_total,
        valorPago,
      }),
    };
  }
}
