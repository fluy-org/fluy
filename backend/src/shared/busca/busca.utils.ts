export function montarPadraoBuscaNome({ termo }: { termo: string }): string {
  return `%${termo.replace(/[\\%_]/g, '\\$&')}%`;
}

export function extrairDigitos({ termo }: { termo: string }): string {
  return termo.replace(/\D/g, '');
}
