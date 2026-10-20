import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  OWNER_INVITATION_FLOW_VERSION,
  type OwnerInvitationEvidence,
} from '@/modules/auth/contracts';

export function criarEvidenciaConviteProprietario(input: {
  email: string;
  referencia: string;
  segredo: string;
}): OwnerInvitationEvidence {
  return {
    versao: OWNER_INVITATION_FLOW_VERSION,
    referencia: input.referencia,
    assinaturaEmail: assinarEmail(input.email, input.segredo),
  };
}

export function validarEvidenciaConviteProprietario(input: {
  evidencia: OwnerInvitationEvidence;
  email: string;
  segredo: string;
}): boolean {
  const assinaturaEsperada = Buffer.from(
    assinarEmail(input.email, input.segredo),
    'hex',
  );
  const assinaturaRecebida = Buffer.from(
    input.evidencia.assinaturaEmail,
    'hex',
  );

  return (
    assinaturaEsperada.length === assinaturaRecebida.length &&
    timingSafeEqual(assinaturaEsperada, assinaturaRecebida)
  );
}

function assinarEmail(email: string, segredo: string): string {
  return createHmac('sha256', segredo)
    .update(email.trim().toLowerCase(), 'utf8')
    .digest('hex');
}
