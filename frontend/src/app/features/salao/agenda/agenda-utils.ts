import type { AgendamentoAgendaResponseDto } from '@fluy/schema';
import { ESTADOS_ENCERRADOS } from './agenda-data';
import type { GruposDaAgenda } from './contracts';

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

export function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarWhatsapp(whatsapp: string): string {
  const digitos = whatsapp.replace(/\D/g, '').replace(/^55/, '');

  if (digitos.length < 10 || digitos.length > 11) {
    return whatsapp;
  }

  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const meio = numero.length === 9 ? numero.slice(0, 5) : numero.slice(0, 4);

  return `(${ddd}) ${meio}-${numero.slice(meio.length)}`;
}

export function formatarDuracao(duracaoMin: number): string {
  const horas = Math.floor(duracaoMin / 60);
  const minutos = duracaoMin % 60;

  if (horas === 0) {
    return `${minutos}min`;
  }

  return minutos === 0 ? `${horas}h` : `${horas}h${minutos}min`;
}
