import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AvaliarHorarioRemarcacaoQueryDto,
  ListarHorariosLivresRemarcacaoQueryDto,
} from '@fluy/schema';
import { dataHoraCivilParaUtc } from '@/shared/horario-salao/horario-salao.utils';
import type {
  AgendamentoDetalhePersistido,
  AgendamentoDetalheResultado,
  AvaliacaoDaRemarcacao,
  AvaliacaoHorarioAgendamento,
  AvaliarHorarioAgendamentoInput,
  AvaliarRemarcacaoInput,
  BuscarAgendamentoInput,
  RemarcarAgendamentoInput,
} from '@/modules/agendamento/contracts';
import { AgendamentoDisponibilidadeService } from '@/modules/agendamento/agendamento-disponibilidade.service';
import { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';

@Injectable()
export class AgendamentoRemarcacaoService {
  constructor(
    private readonly agendamentoDisponibilidadeService: AgendamentoDisponibilidadeService,
    private readonly agendamentoRepository: AgendamentoRepository,
    private readonly agendamentoService: AgendamentoService,
    private readonly agendamentoValidator: AgendamentoValidator,
  ) {}

  async listarHorariosLivres({
    id,
    salaoId,
    dados,
  }: {
    id: string;
    salaoId: string;
    dados: ListarHorariosLivresRemarcacaoQueryDto;
  }) {
    const agendamento = await this.buscarAgendamento({ id, salaoId });
    const horariosLivres =
      this.agendamentoDisponibilidadeService.listarHorariosLivres(
        await this.montarDados({
          salaoId,
          agendamento,
          data: dados.data,
          horaInicio: '00:00',
        }),
      );

    return {
      data: dados.data,
      horarios: horariosLivres.map((hora_inicio) => ({ hora_inicio })),
    };
  }

  async avaliarHorario({
    id,
    salaoId,
    dados,
  }: {
    id: string;
    salaoId: string;
    dados: AvaliarHorarioRemarcacaoQueryDto;
  }): Promise<AvaliacaoHorarioAgendamento> {
    const { avaliacao } = await this.avaliar({
      id,
      salaoId,
      data: dados.data,
      horaInicio: dados.hora_inicio,
    });

    return avaliacao;
  }

  async remarcar({
    id,
    salaoId,
    dados,
  }: RemarcarAgendamentoInput): Promise<AgendamentoDetalheResultado> {
    const { agendamento, avaliacao, inicioEm } = await this.avaliar({
      id,
      salaoId,
      data: dados.data,
      horaInicio: dados.hora_inicio,
    });

    this.agendamentoValidator.validarRemarcacao({
      estado: agendamento.estado,
      inicioEmAtual: agendamento.inicio_em,
      inicioEmNovo: inicioEm,
      avaliacao,
      confirmarExcecoes: dados.confirmar_excecoes,
    });

    const remarcado = await this.agendamentoRepository.remarcar({
      id,
      salaoId,
      profissionalId: agendamento.profissional_id,
      dataAgendamento: dados.data,
      inicioEm,
      duracaoMin: agendamento.duracao_min,
      ocorreuEm: new Date(),
    });

    if (!remarcado) {
      throw new ConflictException(
        await this.descreverConflito({ id, salaoId }),
      );
    }

    return this.agendamentoService.buscarDetalhe({ id, salaoId });
  }

  private async avaliar({
    id,
    salaoId,
    data,
    horaInicio,
  }: AvaliarRemarcacaoInput): Promise<AvaliacaoDaRemarcacao> {
    const agendamento = await this.buscarAgendamento({ id, salaoId });
    const dadosParaAvaliar = await this.montarDados({
      salaoId,
      agendamento,
      data,
      horaInicio,
    });

    return {
      agendamento,
      avaliacao:
        this.agendamentoDisponibilidadeService.avaliarHorario(dadosParaAvaliar),
      inicioEm: dataHoraCivilParaUtc({
        data,
        hora: horaInicio,
        fusoHorario: dadosParaAvaliar.fusoHorario,
      }),
    };
  }

  private async montarDados({
    salaoId,
    agendamento,
    data,
    horaInicio,
  }: {
    salaoId: string;
    agendamento: AgendamentoDetalhePersistido;
    data: string;
    horaInicio: string;
  }): Promise<AvaliarHorarioAgendamentoInput> {
    const dadosParaAvaliacao =
      await this.agendamentoService.buscarDadosParaAvaliacaoHorario({
        salaoId,
        procedimentoId: agendamento.procedimento_id,
        data,
        ignorarAgendamentoId: agendamento.id,
      });

    return this.agendamentoService.montarDadosParaAvaliarDisponibilidade({
      dadosParaAvaliacao: {
        ...dadosParaAvaliacao,
        profissionais: dadosParaAvaliacao.profissionais.filter(
          (profissional) => profissional.id === agendamento.profissional_id,
        ),
      },
      data,
      horaInicio,
      duracaoMin: agendamento.duracao_min,
    });
  }

  private async buscarAgendamento({
    id,
    salaoId,
  }: BuscarAgendamentoInput): Promise<AgendamentoDetalhePersistido> {
    const agendamento = await this.agendamentoRepository.buscarDetalhe({
      id,
      salaoId,
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    return agendamento;
  }

  // `undefined` do repository tem duas causas; reler o estado diz qual foi.
  private async descreverConflito({
    id,
    salaoId,
  }: BuscarAgendamentoInput): Promise<string> {
    const agendamento = await this.agendamentoRepository.buscarDetalhe({
      id,
      salaoId,
    });

    return agendamento?.estado === 'agendado'
      ? 'O horário deixou de estar disponível.'
      : 'Este agendamento já foi encerrado.';
  }
}
