type PartesDataHora = {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
};

export type DataHoraCivil = {
  data: string;
  hora: string;
};

export function dataHoraCivilParaUtc({
  data,
  hora,
  fusoHorario,
}: DataHoraCivil & {
  fusoHorario: string;
}): Date {
  const desejada = parseDataHoraCivil({ data, hora });
  const instanteInicial = Date.UTC(
    desejada.ano,
    desejada.mes - 1,
    desejada.dia,
    desejada.hora,
    desejada.minuto,
  );
  let instante = instanteInicial;

  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const partes = partesNoFuso({
      dataHora: new Date(instante),
      fusoHorario,
    });
    const diferenca =
      Date.UTC(
        desejada.ano,
        desejada.mes - 1,
        desejada.dia,
        desejada.hora,
        desejada.minuto,
      ) -
      Date.UTC(
        partes.ano,
        partes.mes - 1,
        partes.dia,
        partes.hora,
        partes.minuto,
      );

    if (diferenca === 0) {
      return new Date(instante);
    }

    instante += diferenca;
  }

  const resultado = new Date(instante);
  const partes = partesNoFuso({ dataHora: resultado, fusoHorario });

  if (!partesIguais(partes, desejada)) {
    throw new Error('Data e horário inválidos para o fuso do salão.');
  }

  return resultado;
}

export function utcParaDataHoraCivil({
  dataHora,
  fusoHorario,
}: {
  dataHora: Date;
  fusoHorario: string;
}): DataHoraCivil {
  const partes = partesNoFuso({ dataHora, fusoHorario });

  return {
    data: `${partes.ano.toString().padStart(4, '0')}-${partes.mes
      .toString()
      .padStart(2, '0')}-${partes.dia.toString().padStart(2, '0')}`,
    hora: `${partes.hora.toString().padStart(2, '0')}:${partes.minuto
      .toString()
      .padStart(2, '0')}`,
  };
}

export function adicionarDiasNaData({
  data,
  dias,
}: {
  data: string;
  dias: number;
}): string {
  const [ano, mes, dia] = data.split('-').map(Number);
  const resultado = new Date(Date.UTC(ano, mes - 1, dia + dias));

  return `${resultado.getUTCFullYear().toString().padStart(4, '0')}-${resultado
    .getUTCMonth()
    .toString()
    .padStart(2, '0')}-${resultado.getUTCDate().toString().padStart(2, '0')}`;
}

function parseDataHoraCivil({ data, hora }: DataHoraCivil): PartesDataHora {
  const [ano, mes, dia] = data.split('-').map(Number);
  const [horaNumero, minuto] = hora.split(':').map(Number);
  const dataUtc = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    dataUtc.getUTCFullYear() !== ano ||
    dataUtc.getUTCMonth() !== mes - 1 ||
    dataUtc.getUTCDate() !== dia ||
    horaNumero < 0 ||
    horaNumero > 23 ||
    minuto < 0 ||
    minuto > 59
  ) {
    throw new Error('Data ou horário civil inválidos.');
  }

  return { ano, mes, dia, hora: horaNumero, minuto };
}

function partesNoFuso({
  dataHora,
  fusoHorario,
}: {
  dataHora: Date;
  fusoHorario: string;
}): PartesDataHora {
  const formatador = new Intl.DateTimeFormat('en-CA', {
    timeZone: fusoHorario,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const partes = formatador.formatToParts(dataHora);

  return {
    ano: numeroDaParte({ partes, tipo: 'year' }),
    mes: numeroDaParte({ partes, tipo: 'month' }),
    dia: numeroDaParte({ partes, tipo: 'day' }),
    hora: numeroDaParte({ partes, tipo: 'hour' }),
    minuto: numeroDaParte({ partes, tipo: 'minute' }),
  };
}

function numeroDaParte({
  partes,
  tipo,
}: {
  partes: Intl.DateTimeFormatPart[];
  tipo: Intl.DateTimeFormatPartTypes;
}): number {
  const parte = partes.find((item) => item.type === tipo);

  if (!parte) {
    throw new Error('Não foi possível interpretar o fuso do salão.');
  }

  return Number(parte.value);
}

function partesIguais(
  primeira: PartesDataHora,
  segunda: PartesDataHora,
): boolean {
  return (
    primeira.ano === segunda.ano &&
    primeira.mes === segunda.mes &&
    primeira.dia === segunda.dia &&
    primeira.hora === segunda.hora &&
    primeira.minuto === segunda.minuto
  );
}
