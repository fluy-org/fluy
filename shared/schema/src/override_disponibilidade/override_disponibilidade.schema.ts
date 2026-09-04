import { z } from 'zod';
import {
  janelaOverrideInputSchema,
  janelaOverrideResponseSchema,
} from '../janela_override/janela_override.schema.js';

export const dataDisponibilidadeSchema = z.iso.date(
  'Informe uma data válida no formato YYYY-MM-DD.',
);

export const atualizarOverrideDisponibilidadeSchema = z
  .object({
    fechado: z.boolean(),
    janelas: z.array(janelaOverrideInputSchema).optional(),
  })
  .strict()
  .superRefine((override, contexto) => {
    if (override.fechado) {
      if (override.janelas) {
        contexto.addIssue({
          code: 'custom',
          path: ['janelas'],
          message: 'Override fechado não pode ter janelas.',
        });
      }

      return;
    }

    if (!override.janelas || override.janelas.length === 0) {
      contexto.addIssue({
        code: 'custom',
        path: ['janelas'],
        message: 'Informe ao menos uma janela para um override aberto.',
      });
      return;
    }

    validarSobreposicao({
      contexto,
      janelas: override.janelas,
      mensagem: 'Janelas do override não podem se sobrepor.',
    });
  })
  .meta({ id: 'AtualizarOverrideDisponibilidade' });

export const listarOverridesDisponibilidadeQuerySchema = z
  .object({
    data_inicio: dataDisponibilidadeSchema,
    data_fim: dataDisponibilidadeSchema,
  })
  .superRefine(({ data_inicio, data_fim }, contexto) => {
    const inicio = new Date(`${data_inicio}T00:00:00.000Z`);
    const fim = new Date(`${data_fim}T00:00:00.000Z`);
    const duracaoEmDias = (fim.getTime() - inicio.getTime()) / 86_400_000 + 1;

    if (fim < inicio) {
      contexto.addIssue({
        code: 'custom',
        path: ['data_fim'],
        message: 'A data final deve ser igual ou posterior à data inicial.',
      });
      return;
    }

    if (duracaoEmDias > 31) {
      contexto.addIssue({
        code: 'custom',
        path: ['data_fim'],
        message: 'Informe um intervalo de no máximo 31 dias.',
      });
    }
  })
  .meta({ id: 'ListarOverridesDisponibilidadeQuery' });

export const overrideDisponibilidadeResponseSchema = z
  .object({
    data: dataDisponibilidadeSchema,
    fechado: z.boolean(),
    janelas: z.array(janelaOverrideResponseSchema),
  })
  .superRefine((override, contexto) => {
    if (override.fechado && override.janelas.length > 0) {
      contexto.addIssue({
        code: 'custom',
        path: ['janelas'],
        message: 'Override fechado não pode ter janelas.',
      });
    }

    if (!override.fechado && override.janelas.length === 0) {
      contexto.addIssue({
        code: 'custom',
        path: ['janelas'],
        message: 'Override aberto deve ter ao menos uma janela.',
      });
    }
  })
  .meta({ id: 'OverrideDisponibilidadeResponse' });

export const listaOverridesDisponibilidadeResponseSchema = z
  .object({ overrides: z.array(overrideDisponibilidadeResponseSchema) })
  .meta({ id: 'ListaOverridesDisponibilidadeResponse' });

function validarSobreposicao({
  contexto,
  janelas,
  mensagem,
}: {
  contexto: z.RefinementCtx;
  janelas: Array<{ hora_inicio: string; hora_fim: string }>;
  mensagem: string;
}) {
  const janelasOrdenadas = [...janelas].sort((primeira, segunda) =>
    primeira.hora_inicio.localeCompare(segunda.hora_inicio),
  );
  let maiorHoraFim: string | undefined;

  for (const janela of janelasOrdenadas) {
    if (maiorHoraFim && janela.hora_inicio < maiorHoraFim) {
      contexto.addIssue({
        code: 'custom',
        path: ['janelas'],
        message: mensagem,
      });
      return;
    }

    if (!maiorHoraFim || janela.hora_fim > maiorHoraFim) {
      maiorHoraFim = janela.hora_fim;
    }
  }
}
