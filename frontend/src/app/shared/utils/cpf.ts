export function limparCpf(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '');
}

export function formatarCpf(valor: string | null | undefined): string {
  const digitos = limparCpf(valor).slice(0, 11);
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9)
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

export function validarCpf(valor: string | null | undefined): boolean {
  const digitos = limparCpf(valor);
  if (digitos.length !== 11) return false;

  // Rejeita sequências com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(digitos.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(digitos.charAt(9))) return false;

  // Segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(digitos.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(digitos.charAt(10))) return false;

  return true;
}
