export function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function normalizarWhatsapp(whatsapp: string): string {
  const somenteDigitos = whatsapp.replace(/\D/g, '');

  // 55 também é DDD (RS): só é código do país quando sobra número além de DDD + 9 dígitos.
  return somenteDigitos.length > 11
    ? somenteDigitos.replace(/^55/, '')
    : somenteDigitos;
}

export function formatarWhatsapp(whatsapp: string): string {
  const digitos = normalizarWhatsapp(whatsapp);

  if (digitos.length < 10 || digitos.length > 11) {
    return whatsapp;
  }

  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const meio = numero.length === 9 ? numero.slice(0, 5) : numero.slice(0, 4);

  return `(${ddd}) ${meio}-${numero.slice(meio.length)}`;
}
