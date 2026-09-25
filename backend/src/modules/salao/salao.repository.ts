import { eq } from 'drizzle-orm';
import { salao } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type { SalaoConsultado } from '@/modules/salao/contracts';

@Injectable()
export class SalaoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async buscarPorId(salaoId: string): Promise<SalaoConsultado | undefined> {
    const saloes = await this.database
      .select({
        id: salao.id,
        nome: salao.nome,
        subdominio: salao.subdominio,
        contato_whatsapp: salao.contato_whatsapp,
        endereco: salao.endereco,
        fuso_horario: salao.fuso_horario,
      })
      .from(salao)
      .where(eq(salao.id, salaoId))
      .limit(1);

    return saloes[0];
  }
}
