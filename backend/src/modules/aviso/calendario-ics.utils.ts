import type {
  CalendarioIcsResultado,
  GerarCalendarioIcsInput,
} from '@/modules/aviso/contracts';

export function gerarCalendarioIcs({
  agendamento,
  salao,
  agora = new Date(),
}: GerarCalendarioIcsInput): CalendarioIcsResultado {
  const cancelado = agendamento.estado === 'cancelado';
  const metodo = cancelado ? 'CANCEL' : 'REQUEST';
  const fim = new Date(
    agendamento.inicio_em.getTime() + agendamento.duracao_min * 60_000,
  );
  const linhas = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Fluy//Agendamento//PT-BR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    `METHOD:${metodo}`,
    'BEGIN:VEVENT',
    `UID:agendamento-${agendamento.id}@fluy`,
    `DTSTAMP:${formatarDataIcs(agora)}`,
    `DTSTART:${formatarDataIcs(agendamento.inicio_em)}`,
    `DTEND:${formatarDataIcs(fim)}`,
    `SEQUENCE:${agendamento.remarcado_vezes}`,
    `STATUS:${cancelado ? 'CANCELLED' : 'CONFIRMED'}`,
    `SUMMARY:${escaparTextoIcs(`${agendamento.procedimento.nome} - ${salao.nome}`)}`,
    `DESCRIPTION:${escaparTextoIcs(`Agendamento de ${agendamento.cliente.nome} pelo Fluy.`)}`,
    `LOCATION:${escaparTextoIcs(salao.endereco)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return {
    conteudo: `${linhas.map(dobrarLinhaIcs).join('\r\n')}\r\n`,
    metodo,
    nomeArquivo: `agendamento-${agendamento.id}.ics`,
  };
}

function formatarDataIcs(data: Date): string {
  return data
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function escaparTextoIcs(valor: string): string {
  return valor
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function dobrarLinhaIcs(linha: string): string {
  const partes: string[] = [];
  let parte = '';

  for (const caractere of linha) {
    if (Buffer.byteLength(parte + caractere, 'utf8') > 75) {
      partes.push(parte);
      parte = ` ${caractere}`;
      continue;
    }

    parte += caractere;
  }

  partes.push(parte);
  return partes.join('\r\n');
}
