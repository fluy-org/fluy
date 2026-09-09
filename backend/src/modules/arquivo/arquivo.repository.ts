import { anexoAgendamento, arquivo, imagemProcedimento } from '@fluy/schema';
import { and, asc, eq, lt, notExists } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type {
  ArquivoPersistido,
  ArquivoOrfaoExpirado,
  BuscarArquivoDoSalaoInput,
  CriarArquivoInput,
} from '@/modules/arquivo/contracts';

@Injectable()
export class ArquivoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async criar(input: CriarArquivoInput): Promise<ArquivoPersistido> {
    const arquivosCriados = await this.database
      .insert(arquivo)
      .values({
        mime_type: input.mimeType,
        salao_id: input.salaoId,
        tamanho_bytes: input.tamanhoBytes,
        url_storage: input.urlStorage,
      })
      .returning();

    return arquivosCriados[0];
  }

  async buscarPorIdDoSalao({
    id,
    salaoId,
  }: BuscarArquivoDoSalaoInput): Promise<ArquivoPersistido | undefined> {
    const arquivos = await this.database
      .select()
      .from(arquivo)
      .where(and(eq(arquivo.id, id), eq(arquivo.salao_id, salaoId)))
      .limit(1);

    return arquivos[0];
  }

  listarOrfaosExpirados(
    limite: Date,
    tamanhoLote: number,
  ): Promise<ArquivoOrfaoExpirado[]> {
    const imagemVinculada = this.database
      .select({ id: imagemProcedimento.procedimento_id })
      .from(imagemProcedimento)
      .where(eq(imagemProcedimento.arquivo_id, arquivo.id));
    const anexoVinculado = this.database
      .select({ id: anexoAgendamento.id })
      .from(anexoAgendamento)
      .where(eq(anexoAgendamento.arquivo_id, arquivo.id));

    return this.database
      .select({ id: arquivo.id, url_storage: arquivo.url_storage })
      .from(arquivo)
      .where(
        and(
          lt(arquivo.uploaded_em, limite),
          notExists(imagemVinculada),
          notExists(anexoVinculado),
        ),
      )
      .orderBy(asc(arquivo.uploaded_em), asc(arquivo.id))
      .limit(tamanhoLote);
  }

  async removerSeOrfao(id: string): Promise<boolean> {
    const imagemVinculada = this.database
      .select({ id: imagemProcedimento.procedimento_id })
      .from(imagemProcedimento)
      .where(eq(imagemProcedimento.arquivo_id, arquivo.id));
    const anexoVinculado = this.database
      .select({ id: anexoAgendamento.id })
      .from(anexoAgendamento)
      .where(eq(anexoAgendamento.arquivo_id, arquivo.id));
    const arquivosRemovidos = await this.database
      .delete(arquivo)
      .where(
        and(
          eq(arquivo.id, id),
          notExists(imagemVinculada),
          notExists(anexoVinculado),
        ),
      )
      .returning({ id: arquivo.id });

    return arquivosRemovidos.length > 0;
  }
}
