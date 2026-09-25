import { formatarWhatsappInternacional } from '@fluy/schema';

export function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarWhatsapp(whatsapp: string): string {
  return formatarWhatsappInternacional(whatsapp);
}
