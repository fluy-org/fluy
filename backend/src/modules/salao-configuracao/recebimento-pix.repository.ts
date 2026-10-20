import { eq } from 'drizzle-orm';
import { configuracaoSalao } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type { DadosRecebimentoPix } from '@/modules/salao-configuracao/contracts';

@Injectable()
export class RecebimentoPixRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async buscar(salaoId: string) {
    const linhas = await this.database
      .select()
      .from(configuracaoSalao)
      .where(eq(configuracaoSalao.salao_id, salaoId))
      .limit(1);

    return linhas[0];
  }

  async atualizar(input: { salaoId: string; dados: DadosRecebimentoPix }) {
    const linhas = await this.database
      .update(configuracaoSalao)
      .set({
        pix_tipo_chave: input.dados.tipo_chave,
        pix_chave: input.dados.chave,
        pix_nome_recebedor: input.dados.nome_recebedor,
        pix_atualizado_em: new Date(),
      })
      .where(eq(configuracaoSalao.salao_id, input.salaoId))
      .returning();

    return linhas[0];
  }
}
