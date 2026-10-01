import { and, asc, eq, exists } from 'drizzle-orm';
import { arquivo, imagemProcedimento, procedimento } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type {
  AtualizarProcedimentoPersistenciaInput,
  BuscarProcedimentoInput,
  CriarProcedimentoInput,
  DesativarProcedimentoInput,
  ProcedimentoPersistido,
  ProcedimentoPublicoPersistido,
} from '@/modules/procedimento/contracts';

@Injectable()
export class ProcedimentoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async listar(salaoId: string): Promise<ProcedimentoPersistido[]> {
    const procedimentos = await this.database
      .select({
        procedimento,
        imagem: imagemProcedimento,
      })
      .from(procedimento)
      .leftJoin(
        imagemProcedimento,
        eq(imagemProcedimento.procedimento_id, procedimento.id),
      )
      .where(eq(procedimento.salao_id, salaoId))
      .orderBy(asc(procedimento.criado_em));

    return procedimentos.map(({ procedimento, imagem }) => ({
      ...procedimento,
      imagem,
    }));
  }

  listarAtivos(salaoId: string): Promise<ProcedimentoPublicoPersistido[]> {
    return this.database
      .select({
        id: procedimento.id,
        salao_id: procedimento.salao_id,
        nome: procedimento.nome,
        descricao: procedimento.descricao,
        info_pre_procedimento: procedimento.info_pre_procedimento,
        duracao_min: procedimento.duracao_min,
        preco: procedimento.preco,
        imagem: {
          procedimento_id: imagemProcedimento.procedimento_id,
        },
      })
      .from(procedimento)
      .leftJoin(
        imagemProcedimento,
        eq(imagemProcedimento.procedimento_id, procedimento.id),
      )
      .where(
        and(eq(procedimento.salao_id, salaoId), eq(procedimento.ativo, true)),
      )
      .orderBy(asc(procedimento.criado_em));
  }

  async buscarPorId(
    input: BuscarProcedimentoInput,
  ): Promise<ProcedimentoPersistido | undefined> {
    const resultados = await this.database
      .select({
        procedimento,
        imagem: imagemProcedimento,
      })
      .from(procedimento)
      .leftJoin(
        imagemProcedimento,
        eq(imagemProcedimento.procedimento_id, procedimento.id),
      )
      .where(
        and(
          eq(procedimento.id, input.id),
          eq(procedimento.salao_id, input.salaoId),
        ),
      )
      .limit(1);

    const resultado = resultados[0];

    return (
      resultado && {
        ...resultado.procedimento,
        imagem: resultado.imagem,
      }
    );
  }

  async criar(input: CriarProcedimentoInput): Promise<ProcedimentoPersistido> {
    return this.database.transaction(async (tx) => {
      const { imagem, ...dados } = input.dados;
      const procedimentosCriados = await tx
        .insert(procedimento)
        .values({
          salao_id: input.salaoId,
          ...dados,
          preco: dados.preco.toString(),
          valor_sinal: dados.valor_sinal.toString(),
        })
        .returning();
      const procedimentoCriado = procedimentosCriados[0];

      if (imagem) {
        await tx.insert(imagemProcedimento).values({
          procedimento_id: procedimentoCriado.id,
          arquivo_id: imagem.arquivo_id,
        });
      }

      return {
        ...procedimentoCriado,
        imagem: imagem
          ? {
              arquivo_id: imagem.arquivo_id,
              procedimento_id: procedimentoCriado.id,
            }
          : null,
      };
    });
  }

  async atualizar(
    input: AtualizarProcedimentoPersistenciaInput,
  ): Promise<ProcedimentoPersistido | undefined> {
    return this.database.transaction(async (tx) => {
      const { imagemExistente, dados: dadosAtualizacao } = input;
      const { imagem, preco, valor_sinal, ...dados } = dadosAtualizacao;
      const procedimentosAtualizados = await tx
        .update(procedimento)
        .set({
          ...dados,
          preco: preco?.toString(),
          valor_sinal: valor_sinal?.toString(),
        })
        .where(
          and(
            eq(procedimento.id, input.id),
            eq(procedimento.salao_id, input.salaoId),
          ),
        )
        .returning();
      const procedimentoAtualizado = procedimentosAtualizados[0];

      if (!procedimentoAtualizado) {
        return undefined;
      }

      const imagemAtualizada = imagem
        ? (
            await tx
              .insert(imagemProcedimento)
              .values({
                procedimento_id: procedimentoAtualizado.id,
                arquivo_id: imagem.arquivo_id,
              })
              .onConflictDoUpdate({
                target: imagemProcedimento.procedimento_id,
                set: { arquivo_id: imagem.arquivo_id },
              })
              .returning()
          )[0]
        : undefined;

      return {
        ...procedimentoAtualizado,
        imagem: imagemAtualizada ?? imagemExistente,
      };
    });
  }

  async desativar(
    input: DesativarProcedimentoInput,
  ): Promise<ProcedimentoPersistido | undefined> {
    return this.atualizar({ ...input, dados: { ativo: false } });
  }

  async buscarArquivoDaImagem(
    input: BuscarProcedimentoInput,
  ): Promise<typeof arquivo.$inferSelect | undefined> {
    const resultados = await this.database
      .select({ arquivo })
      .from(procedimento)
      .innerJoin(
        imagemProcedimento,
        eq(imagemProcedimento.procedimento_id, procedimento.id),
      )
      .innerJoin(arquivo, eq(arquivo.id, imagemProcedimento.arquivo_id))
      .where(
        and(
          eq(procedimento.id, input.id),
          eq(procedimento.salao_id, input.salaoId),
        ),
      )
      .limit(1);

    return resultados[0]?.arquivo;
  }

  async removerImagem(input: BuscarProcedimentoInput): Promise<void> {
    const procedimentoDoSalao = this.database
      .select({ id: procedimento.id })
      .from(procedimento)
      .where(
        and(
          eq(procedimento.id, imagemProcedimento.procedimento_id),
          eq(procedimento.salao_id, input.salaoId),
        ),
      );

    await this.database
      .delete(imagemProcedimento)
      .where(
        and(
          eq(imagemProcedimento.procedimento_id, input.id),
          exists(procedimentoDoSalao),
        ),
      );
  }
}
