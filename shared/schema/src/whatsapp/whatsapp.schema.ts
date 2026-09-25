import { z } from "zod";

const FORMATO_WHATSAPP_INTERNACIONAL = /^\+[1-9]\d{7,14}$/;

/**
 * Converte entradas brasileiras legadas e números E.164 para um único formato.
 * Entradas sem DDI continuam assumindo o Brasil para não quebrar os formulários atuais.
 */
export function normalizarWhatsappInternacional(valor: string): string {
  const texto = valor.trim();
  const digitos = texto.replace(/\D/g, "");

  if (!digitos) {
    return "";
  }

  if (texto.startsWith("+")) {
    return `+${digitos}`;
  }

  if (digitos.length === 10 || digitos.length === 11) {
    return `+55${digitos}`;
  }

  return `+${digitos}`;
}

export const whatsappInternacionalSchema = z
  .string()
  // `overwrite` preserva o tipo string no JSON Schema usado pelo Swagger.
  // Diferente de `transform`, ele normaliza sem tornar o contrato impossível
  // de representar durante a inicialização do backend.
  .overwrite(normalizarWhatsappInternacional)
  .regex(
    FORMATO_WHATSAPP_INTERNACIONAL,
    "Informe um WhatsApp com DDI e número válidos.",
  );

export function formatarWhatsappInternacional(valor: string): string {
  const normalizado = normalizarWhatsappInternacional(valor);
  const brasileiro = normalizado.match(/^\+55(\d{2})(\d{8,9})$/);

  if (!brasileiro) {
    return normalizado;
  }

  const [, ddd, numero] = brasileiro;
  const tamanhoPrefixo = numero.length === 9 ? 5 : 4;

  return `+55 (${ddd}) ${numero.slice(0, tamanhoPrefixo)}-${numero.slice(tamanhoPrefixo)}`;
}
