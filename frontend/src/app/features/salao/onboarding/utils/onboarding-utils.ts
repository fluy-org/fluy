import {
  formatarWhatsappInternacional,
  normalizarWhatsappInternacional,
} from '@fluy/schema';

export function normalizarWhatsapp(valor: string): string {
  return normalizarWhatsappInternacional(valor);
}

export function formatarWhatsapp(whatsapp: string): string {
  return formatarWhatsappInternacional(whatsapp);
}
