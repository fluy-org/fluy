import { z } from 'zod';

export const profissionalResponseSchema = z
  .object({
    id: z.uuid(),
    nome: z.string(),
    ativo: z.boolean(),
  })
  .meta({ id: 'ProfissionalResponse' });
