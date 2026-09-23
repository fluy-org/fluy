import { Injectable } from '@nestjs/common';
import {
  dataHoraCivilParaUtc,
  utcParaDataHoraCivil,
} from '@/shared/horario-salao/horario-salao.utils';
import type {
  AvaliacaoHorarioAgendamento,
  AvaliarHorarioAgendamentoInput,
  JanelaEfetiva,
  ListarHorariosLivresInput,
} from '@/modules/agendamento/contracts';

@Injectable()
export class AgendamentoDisponibilidadeService {
  avaliarHorario(
    input: AvaliarHorarioAgendamentoInput,
  ): AvaliacaoHorarioAgendamento {
    const inicioAgendamento = dataHoraCivilParaUtc({
      data: input.data,
      hora: input.horaInicio,
      fusoHorario: input.fusoHorario,
    });
    const fimAgendamento = this.adicionarMinutosAoHorario({
      dataHora: inicioAgendamento,
      minutos: input.duracaoMin,
    });

    // Dia fechado é decisão consciente do salão, não encaixe fora da janela.
    if (this.todasAsProfissionaisEstaoFechadas(input.profissionais)) {
      return this.criarAvaliacaoDeHorarioIndisponivel({
        bloqueios: ['dia_fechado'],
      });
    }

    if (input.bloquearInicioPassado && inicioAgendamento < input.agora) {
      return this.criarAvaliacaoDeHorarioIndisponivel({
        bloqueios: ['inicio_passado'],
      });
    }

    const bloqueios = this.listarBloqueiosPorCruzamentoDeMeiaNoite({
      fimAgendamento,
      input,
    });

    if (bloqueios.length > 0) {
      return this.criarAvaliacaoDeHorarioIndisponivel({ bloqueios });
    }

    const profissionaisSemConflito = this.filtrarProfissionaisSemConflito({
      dadosDaDisponibilidade: input,
      inicioAgendamento,
      fimAgendamento,
    });

    if (profissionaisSemConflito.length === 0) {
      return this.criarAvaliacaoDeHorarioIndisponivel({
        bloqueios: ['sem_profissional_disponivel'],
      });
    }

    const profissionalRegular = profissionaisSemConflito.find((profissional) =>
      this.horarioCabeNaJanelaEGrade({
        janelas: profissional.janelas,
        horaInicio: input.horaInicio,
        duracaoMin: input.duracaoMin,
        granularidadeMin: input.granularidadeMin,
      }),
    );
    const avisos = this.listarAvisosDaDataDoAgendamento({
      inicioAgendamento,
      input,
    });

    if (profissionalRegular) {
      return this.criarAvaliacaoDeHorarioDisponivel({
        avisos,
        profissionalId: profissionalRegular.id,
      });
    }

    if (
      profissionaisSemConflito.some((profissional) =>
        this.horarioEstaDentroDaJanelaForaDaGrade({
          janelas: profissional.janelas,
          horaInicio: input.horaInicio,
          granularidadeMin: input.granularidadeMin,
        }),
      )
    ) {
      return this.criarAvaliacaoDeHorarioIndisponivel({
        bloqueios: ['fora_da_grade'],
      });
    }

    return this.criarAvaliacaoDeHorarioDisponivel({
      avisos: [...avisos, 'fora_janela'],
      profissionalId: profissionaisSemConflito[0].id,
    });
  }

  listarHorariosLivres(input: ListarHorariosLivresInput): string[] {
    const horariosCandidatos = new Set(
      input.profissionais.flatMap(({ janelas }) =>
        janelas.flatMap((janela) =>
          this.gerarHorariosDaJanela({
            janela,
            duracaoMin: input.duracaoMin,
            granularidadeMin: input.granularidadeMin,
          }),
        ),
      ),
    );

    return Array.from(horariosCandidatos)
      .filter(
        (horaInicio) =>
          this.avaliarHorario({ ...input, horaInicio }).status !==
          'indisponivel',
      )
      .sort((primeiro, segundo) => primeiro.localeCompare(segundo));
  }

  private todasAsProfissionaisEstaoFechadas(
    profissionais: AvaliarHorarioAgendamentoInput['profissionais'],
  ): boolean {
    if (profissionais.length === 0) {
      return false;
    }

    return profissionais.every((profissional) => profissional.fechado);
  }

  private filtrarProfissionaisSemConflito({
    dadosDaDisponibilidade,
    inicioAgendamento,
    fimAgendamento,
  }: {
    dadosDaDisponibilidade: Pick<
      AvaliarHorarioAgendamentoInput,
      'profissionais' | 'ocupacoes'
    >;
    inicioAgendamento: Date;
    fimAgendamento: Date;
  }) {
    return dadosDaDisponibilidade.profissionais.filter(
      (profissional) =>
        !this.profissionalTemConflitoComOcupacoes({
          profissionalId: profissional.id,
          inicioAgendamento,
          fimAgendamento,
          ocupacoes: dadosDaDisponibilidade.ocupacoes,
        }),
    );
  }

  private listarBloqueiosPorCruzamentoDeMeiaNoite({
    fimAgendamento,
    input,
  }: {
    fimAgendamento: Date;
    input: AvaliarHorarioAgendamentoInput;
  }) {
    const dataFim = utcParaDataHoraCivil({
      dataHora: fimAgendamento,
      fusoHorario: input.fusoHorario,
    }).data;

    return dataFim === input.data ? [] : ['cruza_meia_noite' as const];
  }

  private profissionalTemConflitoComOcupacoes({
    profissionalId,
    inicioAgendamento,
    fimAgendamento,
    ocupacoes,
  }: {
    profissionalId: string;
    inicioAgendamento: Date;
    fimAgendamento: Date;
    ocupacoes: AvaliarHorarioAgendamentoInput['ocupacoes'];
  }): boolean {
    return ocupacoes.some((ocupacao) => {
      if (ocupacao.profissional_id !== profissionalId) {
        return false;
      }

      const fimOcupacao = this.adicionarMinutosAoHorario({
        dataHora: ocupacao.inicio_em,
        minutos: ocupacao.duracao_min,
      });

      return (
        inicioAgendamento < fimOcupacao && fimAgendamento > ocupacao.inicio_em
      );
    });
  }

  private horarioCabeNaJanelaEGrade({
    janelas,
    horaInicio,
    duracaoMin,
    granularidadeMin,
  }: {
    janelas: JanelaEfetiva[];
    horaInicio: string;
    duracaoMin: number;
    granularidadeMin: number;
  }): boolean {
    const inicioEmMinutos = this.minutosDaHora({ hora: horaInicio });
    const fimEmMinutos = inicioEmMinutos + duracaoMin;

    return janelas.some((janela) => {
      const inicioJanela = this.minutosDaHora({ hora: janela.hora_inicio });
      const fimJanela = this.minutosDaHora({ hora: janela.hora_fim });

      return (
        inicioEmMinutos >= inicioJanela &&
        fimEmMinutos <= fimJanela &&
        (inicioEmMinutos - inicioJanela) % granularidadeMin === 0
      );
    });
  }

  private horarioEstaDentroDaJanelaForaDaGrade({
    janelas,
    horaInicio,
    granularidadeMin,
  }: {
    janelas: JanelaEfetiva[];
    horaInicio: string;
    granularidadeMin: number;
  }): boolean {
    const inicioEmMinutos = this.minutosDaHora({ hora: horaInicio });

    return janelas.some((janela) => {
      const inicioJanela = this.minutosDaHora({ hora: janela.hora_inicio });
      const fimJanela = this.minutosDaHora({ hora: janela.hora_fim });

      return (
        inicioEmMinutos >= inicioJanela &&
        inicioEmMinutos < fimJanela &&
        (inicioEmMinutos - inicioJanela) % granularidadeMin !== 0
      );
    });
  }

  private listarAvisosDaDataDoAgendamento({
    inicioAgendamento,
    input,
  }: {
    inicioAgendamento: Date;
    input: AvaliarHorarioAgendamentoInput;
  }) {
    if (inicioAgendamento < input.agora) {
      return ['inicio_passado' as const];
    }

    return this.listarAvisosDeAntecedencia({
      inicioAgendamento,
      agora: input.agora,
      antecedenciaMinHoras: input.antecedenciaMinHoras,
      antecedenciaMaxDias: input.antecedenciaMaxDias,
    });
  }

  private listarAvisosDeAntecedencia({
    inicioAgendamento,
    agora,
    antecedenciaMinHoras,
    antecedenciaMaxDias,
  }: {
    inicioAgendamento: Date;
    agora: Date;
    antecedenciaMinHoras: number;
    antecedenciaMaxDias: number;
  }) {
    const inicioMinimo = this.adicionarMinutosAoHorario({
      dataHora: agora,
      minutos: antecedenciaMinHoras * 60,
    });

    if (inicioAgendamento < inicioMinimo) {
      return ['antes_antecedencia_minima' as const];
    }

    const inicioMaximo = this.adicionarMinutosAoHorario({
      dataHora: agora,
      minutos: antecedenciaMaxDias * 24 * 60,
    });

    return inicioAgendamento > inicioMaximo
      ? ['apos_antecedencia_maxima' as const]
      : [];
  }

  private criarAvaliacaoDeHorarioDisponivel({
    avisos,
    profissionalId,
  }: {
    avisos: AvaliacaoHorarioAgendamento['avisos'];
    profissionalId: string;
  }): AvaliacaoHorarioAgendamento {
    return {
      status: avisos.length === 0 ? 'disponivel' : 'requer_confirmacao',
      avisos,
      bloqueios: [],
      profissionalId,
    };
  }

  private criarAvaliacaoDeHorarioIndisponivel({
    bloqueios,
  }: {
    bloqueios: AvaliacaoHorarioAgendamento['bloqueios'];
  }): AvaliacaoHorarioAgendamento {
    return {
      status: 'indisponivel',
      avisos: [],
      bloqueios,
      profissionalId: undefined,
    };
  }

  private gerarHorariosDaJanela({
    janela,
    duracaoMin,
    granularidadeMin,
  }: {
    janela: JanelaEfetiva;
    duracaoMin: number;
    granularidadeMin: number;
  }): string[] {
    const inicioJanela = this.minutosDaHora({ hora: janela.hora_inicio });
    const fimJanela = this.minutosDaHora({ hora: janela.hora_fim });
    const horarios: string[] = [];

    for (
      let inicio = inicioJanela;
      inicio + duracaoMin <= fimJanela;
      inicio += granularidadeMin
    ) {
      horarios.push(this.horaDosMinutos({ minutos: inicio }));
    }

    return horarios;
  }

  private minutosDaHora({ hora }: { hora: string }): number {
    const [horas, minutos] = hora.split(':').map(Number);

    return horas * 60 + minutos;
  }

  private horaDosMinutos({ minutos }: { minutos: number }): string {
    return `${Math.floor(minutos / 60)
      .toString()
      .padStart(2, '0')}:${(minutos % 60).toString().padStart(2, '0')}`;
  }

  private adicionarMinutosAoHorario({
    dataHora,
    minutos,
  }: {
    dataHora: Date;
    minutos: number;
  }): Date {
    return new Date(dataHora.getTime() + minutos * 60_000);
  }
}
