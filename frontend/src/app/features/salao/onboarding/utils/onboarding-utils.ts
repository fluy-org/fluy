export function normalizarWhatsapp(valor: string): string {
  let numero = valor.replace(/\D/g, '');

  if (numero.length > 11 && numero.startsWith('55')) {
    numero = numero.slice(2);
  }

  return numero ? `+55${numero.slice(0, 11)}` : '';
}

export function formatarWhatsapp(whatsapp: string): string {
  const numero = whatsapp.replace('+55', '');

  if (numero.length <= 2) {
    return numero ? `(${numero}` : '';
  }

  const ddd = numero.slice(0, 2);
  const restante = numero.slice(2);

  if (numero.length <= 6) {
    return `(${ddd}) ${restante}`;
  }

  const tamanhoPrimeiroBloco = numero.length > 10 ? 5 : 4;
  const primeiroBloco = restante.slice(0, tamanhoPrimeiroBloco);
  const segundoBloco = restante.slice(tamanhoPrimeiroBloco);

  return `(${ddd}) ${primeiroBloco}-${segundoBloco}`;
}
