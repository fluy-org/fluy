import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { UsuarioResponseDto } from '@fluy/schema';
import { AuthService } from '../auth/auth.service';
import type { AuthenticatedIdentity } from '../auth/contracts';
import type { UsuarioPersistido } from './contracts';
import { UsuarioRepository } from './usuario.repository';

@Injectable()
export class UsuarioService {
  constructor(
    private readonly authService: AuthService,
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async criarOuObterUsuarioAtual(
    identity: AuthenticatedIdentity,
  ): Promise<{ usuario: UsuarioResponseDto; criado: boolean }> {
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
      usuario: this.toResponse(resultado.usuario),
      criado: resultado.status === 'criado',
    };
  }

  async buscarUsuarioAtual(
    identity: AuthenticatedIdentity,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarioRepository.buscarPorIdentidade({
      provedor: identity.provider,
      identificadorExterno: identity.subject,
    });

    if (!usuario) {
      throw new NotFoundException('Conta Fluy ainda não foi criada.');
    }

    return this.toResponse(usuario);
  }

  private toResponse(usuario: UsuarioPersistido): UsuarioResponseDto {
    return {
      id: usuario.id,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      email: usuario.email,
      criado_em: usuario.criado_em.toISOString(),
    };
  }
}
