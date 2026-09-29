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
