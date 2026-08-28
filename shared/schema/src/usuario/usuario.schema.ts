import { z } from 'zod';

export const usuarioResponseSchema = z.object({
	id: z.uuid(),
	nome: z.string(),
	sobrenome: z.string(),
	email: z.email(),
	criado_em: z.iso.datetime(),
}).meta({ id: 'UsuarioResponse' });

export const usuarioAtualResponseSchema = usuarioResponseSchema.extend({
	estado: z.enum(['sem-salao', 'com-salao']),
}).meta({ id: 'UsuarioAtualResponse' });
