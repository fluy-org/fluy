import { and, eq } from 'drizzle-orm';
import {
  configuracaoSalao,
  janelaSemanal,
  procedimento,
  profissional,
  salao,
} from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type {
  SalaoConsultado,
  SalaoSetupConsultado,
} from '@/modules/salao/contracts';

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
        criado_em: salao.criado_em,
      })
      .from(salao)
      .where(eq(salao.id, salaoId))
      .limit(1);

    return saloes[0];
  }

  async buscarSetup(
    salaoId: string,
  ): Promise<SalaoSetupConsultado | undefined> {
    const saloes = await this.database
      .select({ subdominio: salao.subdominio })
      .from(salao)
      .where(eq(salao.id, salaoId))
      .limit(1);

    const salaoAtual = saloes[0];
    if (!salaoAtual) {
      return undefined;
    }

    const [procedimentosAtivos, janelas, configuracoes] = await Promise.all([
      this.database
        .select({ id: procedimento.id })
        .from(procedimento)
        .where(
          and(
            eq(procedimento.salao_id, salaoId),
            eq(procedimento.ativo, true),
          ),
        )
        .limit(1),
      this.database
        .select({ id: janelaSemanal.id })
        .from(janelaSemanal)
        .innerJoin(
          profissional,
          eq(janelaSemanal.profissional_id, profissional.id),
        )
        .where(
          and(
            eq(profissional.salao_id, salaoId),
            eq(profissional.ativo, true),
          ),
        )
        .limit(1),
      this.database
        .select({
          pix_chave: configuracaoSalao.pix_chave,
          pix_tipo_chave: configuracaoSalao.pix_tipo_chave,
          pix_nome_recebedor: configuracaoSalao.pix_nome_recebedor,
          pix_atualizado_em: configuracaoSalao.pix_atualizado_em,
        })
        .from(configuracaoSalao)
        .where(eq(configuracaoSalao.salao_id, salaoId))
        .limit(1),
    ]);

    const configuracao = configuracoes[0];
    const temPix = Boolean(
      configuracao?.pix_chave &&
        configuracao.pix_tipo_chave &&
        configuracao.pix_nome_recebedor &&
        configuracao.pix_atualizado_em,
    );

    return {
      temProcedimentoAtivo: procedimentosAtivos.length > 0,
      temDisponibilidade: janelas.length > 0,
      temPix,
      subdominio: salaoAtual.subdominio,
    };
  }
}
