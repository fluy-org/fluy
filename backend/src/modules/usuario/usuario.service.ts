import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import { AuthService } from '@/modules/auth/auth.service';
import { validarEvidenciaConviteProprietario } from '@/modules/auth/owner-invitation-evidence';
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
    private readonly config: ConfigService<Env, true>,
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

    const referenciaConviteClerk = this.validarConviteProprietario(
      profile.conviteProprietario,
      profile.email,
    );

    const resultado = await this.usuarioRepository.criarOuObter({
      identity,
      nome: profile.nome,
      sobrenome: profile.sobrenome,
      email: profile.email,
      exigirConvite: this.convitesObrigatorios,
      referenciaConviteClerk,
    });

    switch (resultado.status) {
      case 'email_em_uso':
        throw new ConflictException(
          'Este e-mail já está associado a outra conta Fluy.',
        );
      case 'convite_necessario':
      case 'convite_invalido':
        throw new ForbiddenException(
          'O cadastro de proprietários está disponível somente por convite.',
        );
      case 'convite_consumido':
        throw new ForbiddenException(
          'O convite de proprietário é inválido ou não está mais disponível.',
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

  async verificarAutorizacaoParaCriarSalao(usuarioId: string): Promise<void> {
    const autorizado =
      await this.usuarioRepository.possuiAutorizacaoProprietario(usuarioId);

    if (!autorizado) {
      throw new ForbiddenException(
        'Esta conta não possui autorização para criar um salão.',
      );
    }
  }

  private get convitesObrigatorios(): boolean {
    return this.config.get('OWNER_INVITE_ENFORCEMENT_ENABLED', {
      infer: true,
    });
  }

  private validarConviteProprietario(
    metadata: Awaited<
      ReturnType<AuthService['getProfile']>
    >['conviteProprietario'],
    email: string,
  ): string | null {
    if (metadata.status === 'ausente') {
      return null;
    }

    const segredo = this.config.get('OWNER_INVITE_METADATA_SECRET', {
      infer: true,
    });

    if (
      metadata.status === 'invalida' ||
      !segredo ||
      !validarEvidenciaConviteProprietario({
        evidencia: metadata.evidencia,
        email,
        segredo,
      })
    ) {
      throw new ForbiddenException(
        'A evidência do convite de proprietário é inválida.',
      );
    }

    return metadata.evidencia.referencia;
  }
}
