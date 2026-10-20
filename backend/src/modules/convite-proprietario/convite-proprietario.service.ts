import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import { criarEvidenciaConviteProprietario } from '@/modules/auth/owner-invitation-evidence';
import type {
  EmitirConviteProprietarioInput,
  EmitirConviteProprietarioResultado,
  RevogarConviteProprietarioResultado,
} from '@/modules/convite-proprietario/contracts';
import {
  APPLICATION_INVITATION_PROVIDER,
  type ApplicationInvitation,
  type ApplicationInvitationProvider,
} from '@/shared/providers/clerk/contracts';

const DIA_EM_MILISSEGUNDOS = 24 * 60 * 60 * 1000;

@Injectable()
export class ConviteProprietarioService {
  constructor(
    @Inject(APPLICATION_INVITATION_PROVIDER)
    private readonly invitationProvider: ApplicationInvitationProvider,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async emitir(
    input: EmitirConviteProprietarioInput,
  ): Promise<EmitirConviteProprietarioResultado> {
    const redirectUrl = this.config.get('OWNER_INVITE_REDIRECT_URL', {
      infer: true,
    });
    const segredo = this.config.get('OWNER_INVITE_METADATA_SECRET', {
      infer: true,
    });

    if (!redirectUrl || !segredo) {
      return { status: 'configuracao_ausente' };
    }

    const email = normalizarEmail(input.email);
    const diasValidade =
      input.diasValidade ??
      this.config.get('OWNER_INVITE_DEFAULT_EXPIRATION_DAYS', {
        infer: true,
      }) ??
      7;
    const referencia = randomUUID();
    const expiraEmPrevisto = new Date(
      Date.now() + diasValidade * DIA_EM_MILISSEGUNDOS,
    );

    try {
      const invitation = await this.invitationProvider.create({
        emailAddress: email,
        expiresInDays: diasValidade,
        redirectUrl,
        ownerInvitationEvidence: criarEvidenciaConviteProprietario({
          email,
          referencia,
          segredo,
        }),
      });

      return this.toEmitido(invitation, expiraEmPrevisto);
    } catch {
      const invitationCriado = await this.buscarPendente({
        emailAddress: email,
        referenceId: referencia,
      });

      if (invitationCriado) {
        return this.toEmitido(invitationCriado, expiraEmPrevisto);
      }

      const invitationExistente = await this.buscarPendente({
        emailAddress: email,
      });

      if (invitationExistente) {
        return {
          status: 'duplicado',
          clerkConviteId: invitationExistente.id,
          email,
          expiraEm: invitationExistente.expiresAt ?? expiraEmPrevisto,
        };
      }

      return { status: 'falha_integracao' };
    }
  }

  async revogar(
    clerkConviteId: string,
  ): Promise<RevogarConviteProprietarioResultado> {
    try {
      await this.invitationProvider.revoke(clerkConviteId);
      return { status: 'revogado' };
    } catch {
      return { status: 'falha_integracao' };
    }
  }

  private toEmitido(
    invitation: ApplicationInvitation,
    expiraEmPrevisto: Date,
  ): EmitirConviteProprietarioResultado {
    if (!invitation.url) {
      return { status: 'falha_integracao' };
    }

    return {
      status: 'emitido',
      clerkConviteId: invitation.id,
      email: invitation.emailAddress,
      expiraEm: invitation.expiresAt ?? expiraEmPrevisto,
      url: invitation.url,
    };
  }

  private async buscarPendente(input: {
    emailAddress: string;
    referenceId?: string;
  }): Promise<ApplicationInvitation | undefined> {
    try {
      return await this.invitationProvider.findPending(input);
    } catch {
      return undefined;
    }
  }
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}
