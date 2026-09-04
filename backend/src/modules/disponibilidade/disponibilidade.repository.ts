import { and, asc, eq, gte, lte } from 'drizzle-orm';
import {
  janelaOverride,
  janelaSemanal,
  overrideDisponibilidade,
  profissional,
} from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type {
  AtualizarDisponibilidadeSemanalInput,
  AtualizarOverrideDisponibilidadeInput,
  BuscarProfissionalInput,
  JanelaOverridePersistida,
  JanelaSemanalPersistida,
  ListarOverridesDisponibilidadeInput,
  OverrideDisponibilidadePersistido,
  ProfissionalPersistido,
  ProfissionalResumoPersistido,
  RemoverOverrideDisponibilidadeInput,
} from '@/modules/disponibilidade/contracts';

@Injectable()
export class DisponibilidadeRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async listarProfissionais(
    salaoId: string,
  ): Promise<ProfissionalResumoPersistido[]> {
    return this.database
      .select({
        id: profissional.id,
        nome: profissional.nome,
        ativo: profissional.ativo,
      })
      .from(profissional)
      .where(eq(profissional.salao_id, salaoId))
      .orderBy(asc(profissional.criado_em));
  }

  async buscarProfissional(
    input: BuscarProfissionalInput,
  ): Promise<ProfissionalPersistido | undefined> {
    const profissionais = await this.database
      .select()
      .from(profissional)
      .where(
        and(
          eq(profissional.id, input.profissionalId),
          eq(profissional.salao_id, input.salaoId),
        ),
      )
      .limit(1);

    return profissionais[0];
  }

  listarJanelasSemanais(
    profissionalId: string,
  ): Promise<JanelaSemanalPersistida[]> {
    return this.database
      .select()
      .from(janelaSemanal)
      .where(eq(janelaSemanal.profissional_id, profissionalId))
      .orderBy(asc(janelaSemanal.dia_semana), asc(janelaSemanal.hora_inicio));
  }

  async substituirJanelasSemanais(
    input: AtualizarDisponibilidadeSemanalInput,
  ): Promise<JanelaSemanalPersistida[]> {
    return this.database.transaction(async (tx) => {
      await tx
        .delete(janelaSemanal)
        .where(eq(janelaSemanal.profissional_id, input.profissionalId));

      if (input.dados.janelas.length === 0) {
        return [];
      }

      return tx
        .insert(janelaSemanal)
        .values(
          input.dados.janelas.map((janela) => ({
            profissional_id: input.profissionalId,
            ...janela,
          })),
        )
        .returning();
    });
  }

  async listarOverrides(
    input: ListarOverridesDisponibilidadeInput,
  ): Promise<OverrideDisponibilidadePersistido[]> {
    const resultados = await this.database
      .select({
        override: overrideDisponibilidade,
        janela: janelaOverride,
      })
      .from(overrideDisponibilidade)
      .leftJoin(
        janelaOverride,
        eq(janelaOverride.override_id, overrideDisponibilidade.id),
      )
      .where(
        and(
          eq(overrideDisponibilidade.profissional_id, input.profissionalId),
          gte(overrideDisponibilidade.data, input.dataInicio),
          lte(overrideDisponibilidade.data, input.dataFim),
        ),
      )
      .orderBy(
        asc(overrideDisponibilidade.data),
        asc(janelaOverride.hora_inicio),
      );

    return agruparOverrides(resultados);
  }

  async substituirOverride(
    input: AtualizarOverrideDisponibilidadeInput,
  ): Promise<OverrideDisponibilidadePersistido> {
    return this.database.transaction(async (tx) => {
      const overrides = await tx
        .insert(overrideDisponibilidade)
        .values({
          profissional_id: input.profissionalId,
          data: input.data,
          fechado: input.dados.fechado,
        })
        .onConflictDoUpdate({
          target: [
            overrideDisponibilidade.profissional_id,
            overrideDisponibilidade.data,
          ],
          set: { fechado: input.dados.fechado },
        })
        .returning();
      const override = overrides[0];

      await tx
        .delete(janelaOverride)
        .where(eq(janelaOverride.override_id, override.id));

      let janelas: JanelaOverridePersistida[] = [];

      if (!input.dados.fechado && input.dados.janelas) {
        janelas = await tx
          .insert(janelaOverride)
          .values(
            input.dados.janelas.map((janela) => ({
              override_id: override.id,
              ...janela,
            })),
          )
          .returning();
      }

      return { ...override, janelas };
    });
  }

  async removerOverride(
    input: RemoverOverrideDisponibilidadeInput,
  ): Promise<void> {
    await this.database
      .delete(overrideDisponibilidade)
      .where(
        and(
          eq(overrideDisponibilidade.profissional_id, input.profissionalId),
          eq(overrideDisponibilidade.data, input.data),
        ),
      );
  }
}

function agruparOverrides(
  resultados: Array<{
    override: typeof overrideDisponibilidade.$inferSelect;
    janela: JanelaOverridePersistida | null;
  }>,
): OverrideDisponibilidadePersistido[] {
  const overridesPorId = new Map<string, OverrideDisponibilidadePersistido>();

  for (const { override, janela } of resultados) {
    const existente = overridesPorId.get(override.id);

    if (existente) {
      if (janela) {
        existente.janelas.push(janela);
      }

      continue;
    }

    overridesPorId.set(override.id, {
      ...override,
      janelas: janela ? [janela] : [],
    });
  }

  return Array.from(overridesPorId.values());
}
