import { Injectable, NotFoundException } from '@nestjs/common';
import { RecebimentoPixRepository } from '@/modules/salao-configuracao/recebimento-pix.repository';
import type { DadosRecebimentoPix } from '@/modules/salao-configuracao/contracts';

@Injectable()
export class RecebimentoPixService {
  constructor(private readonly repository: RecebimentoPixRepository) {}

  async buscar(salaoId: string) {
    const configuracao = await this.repository.buscar(salaoId);
    if (
      !configuracao?.pix_chave ||
      !configuracao.pix_tipo_chave ||
      !configuracao.pix_nome_recebedor ||
      !configuracao.pix_atualizado_em
    ) {
      throw new NotFoundException('Recebimento Pix não cadastrado.');
    }

    return configuracao;
  }

  async atualizar(input: { salaoId: string; dados: DadosRecebimentoPix }) {
    const dados = {
      ...input.dados,
      chave:
        input.dados.tipo_chave === 'email'
          ? input.dados.chave.trim().toLowerCase()
          : input.dados.chave.trim(),
      nome_recebedor: input.dados.nome_recebedor.trim(),
    };
    const configuracao = await this.repository.atualizar({
      salaoId: input.salaoId,
      dados,
    });

    if (!configuracao) {
      throw new NotFoundException('Configuração do salão não encontrada.');
    }

    return configuracao;
  }
}
