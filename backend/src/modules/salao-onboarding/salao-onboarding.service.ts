import { ConflictException, Injectable } from '@nestjs/common';
import type { CriarSalaoDto } from '@fluy/schema';
import type { AuthenticatedIdentity } from '../auth/contracts';
import { UsuarioService } from '../usuario/usuario.service';
import type { ResultadoCriarOuObterSalao } from './contracts';
import { QUANTIDADE_SUGESTOES_SUBDOMINIO } from './salao-onboarding-data';
import { SalaoRepository } from './salao-onboarding.repository';
import {
  ehViolacaoUnicidade,
  gerarSugestaoSubdominio,
} from './salao-onboarding-utils';

@Injectable()
export class SalaoService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly salaoRepository: SalaoRepository,
  ) {}

  async criarOuObter(input: {
    identity: AuthenticatedIdentity;
    dados: CriarSalaoDto;
  }): Promise<ResultadoCriarOuObterSalao> {
    const usuario = await this.usuarioService.buscarUsuarioAtual(
      input.identity,
    );

    const salaoExistente = await this.salaoRepository.buscarSalaoDoDono(
      usuario.id,
    );

    if (salaoExistente) {
      return { salao: salaoExistente, criado: false };
    }

    try {
      const salaoCriado = await this.salaoRepository.criar({
        ...input.dados,
        usuarioId: usuario.id,
        nomeProfissional: `${usuario.nome} ${usuario.sobrenome}`,
      });

      return { salao: salaoCriado, criado: true };
    } catch (error) {
      if (!ehViolacaoUnicidade(error)) {
        throw error;
      }

      return this.resolverConflitoDeUnicidade({
        error,
        usuarioId: usuario.id,
        subdominio: input.dados.subdominio,
      });
    }
  }

  private async resolverConflitoDeUnicidade(input: {
    error: unknown;
    usuarioId: string;
    subdominio: string;
  }): Promise<ResultadoCriarOuObterSalao> {
    const salaoDoDono = await this.salaoRepository.buscarSalaoDoDono(
      input.usuarioId,
    );

    if (salaoDoDono) {
      return { salao: salaoDoDono, criado: false };
    }

    const subdominioExiste = await this.salaoRepository.buscarPorSubdominio(
      input.subdominio,
    );

    if (subdominioExiste) {
      throw new ConflictException({
        codigo: 'subdominio_indisponivel',
        sugestoes: await this.sugerirSubdominios(input.subdominio),
      });
    }

    throw input.error;
  }

  private async sugerirSubdominios(subdominio: string): Promise<string[]> {
    const sugestoes: string[] = [];

    for (
      let numero = 2;
      sugestoes.length < QUANTIDADE_SUGESTOES_SUBDOMINIO;
      numero += 1
    ) {
      const sugestao = gerarSugestaoSubdominio(subdominio, numero);

      if (!(await this.salaoRepository.buscarPorSubdominio(sugestao))) {
        sugestoes.push(sugestao);
      }
    }

    return sugestoes;
  }
}
