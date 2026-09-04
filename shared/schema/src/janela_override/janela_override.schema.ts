import { z } from 'zod';

const HORA_SCHEMA = z
  .string()
  .regex(
    /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    'Informe um horário válido no formato HH:mm.',
  );

const camposJanelaOverride = {
  hora_inicio: HORA_SCHEMA,
  hora_fim: HORA_SCHEMA,
};

export const janelaOverrideInputSchema = z
  .object(camposJanelaOverride)
  .refine((janela) => janela.hora_inicio < janela.hora_fim, {
    path: ['hora_fim'],
    message: 'A hora de início deve ser anterior à hora de fim.',
  });

export const janelaOverrideResponseSchema = z.object(camposJanelaOverride);
