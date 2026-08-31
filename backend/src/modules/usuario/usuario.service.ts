import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import type { AuthenticatedIdentity } from '@/modules/auth/contracts';
import type {
  ResultadoBuscarUsuarioAtual,
  ResultadoCriarOuObterUsuarioAtual,
  UsuarioPersistido,
} from '@/modules/usuario/contracts';
import { UsuarioRepository } from '@/modules/usuario/usuario.repository';

@Injectable()
export class UsuarioService {
  constructor(
    private readonly authService: AuthService,
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async criarOuObterUsuarioAtual(
    identity: AuthenticatedIdentity,
  ): Promise<ResultadoCriarOuObterUsuarioAtual> {
    const profile = await this.authService.getProfile(identity);

    if (
      !profile.emailVerified ||
      !profile.email ||
      !profile.nome ||
      !profile.sobrenome
    ) {
      throw new UnprocessableEntityException(
        'O perfil Clerk precisa ter nome, sobrenome e e-mail primário verificado.',
      );
    }

    const resultado = await this.usuarioRepository.criarOuObter({
      identity,
      nome: profile.nome,
      sobrenome: profile.sobrenome,
      email: profile.email,
    });

    if (resultado.status === 'email_em_uso') {
      throw new ConflictException(
        'Este e-mail já está associado a outra conta Fluy.',
      );
    }

    return {
      usuario: resultado.usuario,
      criado: resultado.status === 'criado',
    };
  }

  async buscarUsuarioAtual(
    identity: AuthenticatedIdentity,
  ): Promise<UsuarioPersistido> {
    const usuario = await this.usuarioRepository.buscarPorIdentidade({
      provedor: identity.provider,
      identificadorExterno: identity.subject,
    });

    if (!usuario) {
      throw new NotFoundException('Conta Fluy ainda não foi criada.');
    }

    return usuario;
  }

  async buscarEstadoAtual(
    identity: AuthenticatedIdentity,
  ): Promise<ResultadoBuscarUsuarioAtual> {
    const usuario = await this.buscarUsuarioAtual(identity);
    const possuiVinculoSalao = await this.usuarioRepository.possuiVinculoSalao(
      usuario.id,
    );

    return {
      usuario,
      estado: possuiVinculoSalao ? 'com-salao' : 'sem-salao',
    };
  }
}
