import type {
  AgendamentoAgendaResponseDto,
  ResumoAgendaResponseDto,
} from '@fluy/schema';
import { ESTADOS_ENCERRADOS } from './agenda-data';
import type { GradeDoMes, GruposDaAgenda } from './contracts';

export function adicionarDiasNaData({
  data,
  dias,
}: {
  data: string;
  dias: number;
}): string {
  const [ano, mes, dia] = data.split('-').map(Number);

  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

// `en-CA` formata como YYYY-MM-DD, que e o formato de data civil do contrato.
export function extrairDataCivil({
  instante,
  fusoHorario,
}: {
  instante: string;
  fusoHorario: string;
}): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: fusoHorario }).format(
    new Date(instante),
  );
}

// A data civil do salao nao carrega instante; formatar com o fuso do
// dispositivo deslocaria o dia exibido.
export function formatarDataPorExtenso(data: string): string {
  const [ano, mes, dia] = data.split('-').map(Number);

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date(Date.UTC(ano, mes - 1, dia)));
}


export function extrairMesDaData(data: string): string {
  return data.slice(0, 7);
}

export function calcularIntervaloDoMes(mes: string): {
  dataInicio: string;
  dataFim: string;
} {
  return {
    dataInicio: montarData({ mes, dia: 1 }),
    dataFim: montarData({ mes, dia: contarDiasDoMes(mes) }),
  };
}

export function adicionarMesesNoMes({
  mes,
  meses,
}: {
  mes: string;
  meses: number;
}): string {
  const { ano, numeroDoMes } = separarMes(mes);
  const resultado = new Date(Date.UTC(ano, numeroDoMes - 1 + meses, 1));
  const mesResultado = resultado.getUTCMonth() + 1;

  return `${resultado.getUTCFullYear().toString().padStart(4, '0')}-${mesResultado
    .toString()
    .padStart(2, '0')}`;
}

export function formatarMesPorExtenso(mes: string): string {
  const { ano, numeroDoMes } = separarMes(mes);

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(ano, numeroDoMes - 1, 1)));
}

export function gerarGradeDoMes({
  mes,
  contagens,
}: {
  mes: string;
  contagens: ResumoAgendaResponseDto['dias'];
}): GradeDoMes {
  const diaDaSemanaInicial = calcularDiaDaSemanaInicial(mes);
  const totalPorData = new Map(
    contagens.map(({ data, total }) => [data, total]),
  );

  // As células nulas do início empurram o dia 1 para a coluna certa; a grade
  // do template quebra a linha a cada sete, então o mês termina onde acaba.
  return Array.from(
    { length: diaDaSemanaInicial + contarDiasDoMes(mes) },
    (_, indice) => {
      const dia = indice - diaDaSemanaInicial + 1;

      if (dia < 1) {
        return null;
      }

      const data = montarData({ mes, dia });

      return { data, dia, total: totalPorData.get(data) ?? 0 };
    },
  );
}

export function agruparPorEncerramento(
  agendamentos: AgendamentoAgendaResponseDto[],
): GruposDaAgenda {
  return {
    ativos: agendamentos.filter(
      (agendamento) => !ESTADOS_ENCERRADOS.includes(agendamento.estado),
    ),
    encerrados: agendamentos.filter((agendamento) =>
      ESTADOS_ENCERRADOS.includes(agendamento.estado),
    ),
  };
}

export function formatarDuracao(duracaoMin: number): string {
  const horas = Math.floor(duracaoMin / 60);
  const minutos = duracaoMin % 60;

  if (horas === 0) {
    return `${minutos}min`;
  }

  return minutos === 0 ? `${horas}h` : `${horas}h${minutos}min`;
}

function separarMes(mes: string): { ano: number; numeroDoMes: number } {
  const [ano, numeroDoMes] = mes.split('-').map(Number);

  return { ano, numeroDoMes };
}

function montarData({ mes, dia }: { mes: string; dia: number }): string {
  return `${mes}-${dia.toString().padStart(2, '0')}`;
}

// Dia 0 de um mês é o último dia do mês anterior, então pedir o dia 0 do mês
// seguinte devolve quantos dias o mês pedido tem.
function contarDiasDoMes(mes: string): number {
  const { ano, numeroDoMes } = separarMes(mes);

  return new Date(Date.UTC(ano, numeroDoMes, 0)).getUTCDate();
}

function calcularDiaDaSemanaInicial(mes: string): number {
  const { ano, numeroDoMes } = separarMes(mes);

  return new Date(Date.UTC(ano, numeroDoMes - 1, 1)).getUTCDay();
}
