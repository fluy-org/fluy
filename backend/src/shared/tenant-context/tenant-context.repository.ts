import { and, eq } from 'drizzle-orm';
import { identidadeAutenticacao, salao, usuarioSalao } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type { AuthenticatedIdentity } from '@/modules/auth/contracts';
import type { TenantContext } from '@/shared/tenant-context/contracts';

@Injectable()
export class TenantContextRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async buscarPorDono(
    identity: AuthenticatedIdentity,
  ): Promise<TenantContext | undefined> {
    const resultados = await this.database
      .select({ salaoId: salao.id })
      .from(identidadeAutenticacao)
      .innerJoin(
        usuarioSalao,
        eq(identidadeAutenticacao.usuario_id, usuarioSalao.usuario_id),
      )
      .innerJoin(salao, eq(usuarioSalao.salao_id, salao.id))
      .where(
        and(
          eq(identidadeAutenticacao.provedor, identity.provider),
          eq(identidadeAutenticacao.identificador_externo, identity.subject),
          eq(usuarioSalao.papel, 'dono'),
        ),
      )
      .limit(1);

    return resultados[0];
  }

  async buscarPorSubdominio(
    subdominio: string,
  ): Promise<TenantContext | undefined> {
    const resultados = await this.database
      .select({ salaoId: salao.id })
      .from(salao)
      .where(eq(salao.subdominio, subdominio))
      .limit(1);

    return resultados[0];
  }
}
