import { z } from 'zod';

const HORA_SCHEMA = z
  .string()
  .regex(
    /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    'Informe um horário válido no formato HH:mm.',
  );

const janelaSemanalSchema = z
  .object({
    dia_semana: z
      .number()
      .int('Informe um dia da semana válido.')
      .min(0, 'Informe um dia da semana válido.')
      .max(6, 'Informe um dia da semana válido.'),
    hora_inicio: HORA_SCHEMA,
    hora_fim: HORA_SCHEMA,
  })
  .refine((janela) => janela.hora_inicio < janela.hora_fim, {
    path: ['hora_fim'],
    message: 'A hora de início deve ser anterior à hora de fim.',
  });

const janelasSemanaisSchema = z.array(janelaSemanalSchema);

export const atualizarDisponibilidadeSemanalSchema = z
  .object({ janelas: janelasSemanaisSchema })
  .superRefine(({ janelas }, contexto) => {
    for (let diaSemana = 0; diaSemana <= 6; diaSemana += 1) {
      const janelasDoDia = janelas.filter(
        (janela) => janela.dia_semana === diaSemana,
      );
      validarSobreposicao({
        contexto,
        janelas: janelasDoDia,
        mensagem: 'Janelas do mesmo dia não podem se sobrepor.',
      });
    }
  })
  .meta({ id: 'AtualizarDisponibilidadeSemanal' });

export const disponibilidadeSemanalResponseSchema = z
  .object({ janelas: janelasSemanaisSchema })
  .meta({ id: 'DisponibilidadeSemanalResponse' });

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
