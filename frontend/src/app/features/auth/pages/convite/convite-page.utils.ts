import { TAMANHO_MINIMO_SENHA } from '@app/features/auth/auth.data';

export type EstadoErroConvite =
  'expirado' | 'invalido' | 'revogado' | 'utilizado' | 'indisponivel';

interface ErroClerkLike {
  errors?: Array<{
    code?: unknown;
    meta?: { paramName?: unknown; param_name?: unknown };
  }>;
}

type EstadoErroTerminalConvite = Exclude<EstadoErroConvite, 'indisponivel'>;

export function identificarEstadoErroConvite(
  error: unknown,
): EstadoErroConvite {
  return identificarEstadoTerminalConvite(error) ?? 'indisponivel';
}

export function identificarEstadoTerminalConvite(
  error: unknown,
): EstadoErroTerminalConvite | null {
  const codigos = obterCodigosErro(error);

  if (codigos.includes('ticket_expired_code')) {
    return 'expirado';
  }

  if (
    codigos.includes('revoked_invitation') ||
    codigos.includes('invitation_already_revoked')
  ) {
    return 'revogado';
  }

  if (
    codigos.includes('invitation_already_accepted') ||
    codigos.includes('form_identifier_exists') ||
    codigos.includes('identifier_already_signed_in')
  ) {
    return 'utilizado';
  }

  if (codigos.includes('ticket_invalid_code')) {
    return 'invalido';
  }

  return null;
}

export function identificarMensagemErroCadastroConvite(error: unknown): string {
  const codigos = obterCodigosErro(error);
  const parametros = obterParametrosErro(error);
  const possuiErroSenha =
    parametros.includes('password') ||
    codigos.some((codigo) => codigo.includes('password'));

  if (
    codigos.includes('form_password_pwned') ||
    codigos.includes('form_password_compromised')
  ) {
    return 'Essa senha já apareceu em vazamentos. Escolha uma senha diferente.';
  }

  if (codigos.includes('form_password_length_too_short')) {
    return `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
  }

  if (possuiErroSenha) {
    return 'A senha não atende aos requisitos de segurança. Revise-a e tente novamente.';
  }

  return 'Não foi possível criar a conta. Confira os dados e tente novamente.';
}

function obterCodigosErro(error: unknown): string[] {
  if (!error || typeof error !== 'object') {
    return [];
  }

  const errors = (error as ErroClerkLike).errors;

  if (!Array.isArray(errors)) {
    return [];
  }

  return errors
    .map((item) => item.code)
    .filter((code): code is string => typeof code === 'string');
}

function obterParametrosErro(error: unknown): string[] {
  if (!error || typeof error !== 'object') {
    return [];
  }

  const errors = (error as ErroClerkLike).errors;

  if (!Array.isArray(errors)) {
    return [];
  }

  return errors
    .map((item) => item.meta?.paramName ?? item.meta?.param_name)
    .filter((parametro): parametro is string => typeof parametro === 'string');
}
