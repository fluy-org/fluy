import { eq } from 'drizzle-orm';
import { configuracaoSalao } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type {
  AtualizarSalaoConfiguracaoInput,
  SalaoConfiguracaoPersistida,
} from '@/modules/salao-configuracao/contracts';

@Injectable()
export class SalaoConfiguracaoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async buscarPorSalaoId(
    salaoId: string,
  ): Promise<SalaoConfiguracaoPersistida | undefined> {
    const configuracoes = await this.database
      .select()
      .from(configuracaoSalao)
      .where(eq(configuracaoSalao.salao_id, salaoId))
      .limit(1);

    return configuracoes[0];
  }

  async atualizar(
    input: AtualizarSalaoConfiguracaoInput,
  ): Promise<SalaoConfiguracaoPersistida | undefined> {
    const configuracoes = await this.database
      .update(configuracaoSalao)
      .set(input.dados)
      .where(eq(configuracaoSalao.salao_id, input.salaoId))
      .returning();

    return configuracoes[0];
  }
}
