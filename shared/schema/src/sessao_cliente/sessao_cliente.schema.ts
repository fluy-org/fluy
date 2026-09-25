import { z } from 'zod';
import { whatsappInternacionalSchema } from '../whatsapp/whatsapp.schema.js';

const clientePublicaSchema = z.object({
  nome: z.string(),
  whatsapp: whatsappInternacionalSchema,
});

export const consultarSessaoClienteSchema = z.object({
  credencial: z.uuid(),
});

export const identificarClientePublicaSchema = z.object({
  nome: z.string().trim().min(1, 'Informe seu nome.').max(200),
  whatsapp: whatsappInternacionalSchema,
  credencial: z.uuid(),
  consentimento_privacidade: z.literal(true, {
    error: 'Aceite o aviso de privacidade para continuar.',
  }),
});

export const sessaoClientePublicaResponseSchema = z.object({
  cliente: clientePublicaSchema.nullable(),
});
