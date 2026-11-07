import { getSystemErrorName } from 'node:util';

const SAFE_CODE_SET = new Set([
  'ENOENT',
  'EACCES',
  'EPERM',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
  'EPROTO',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'CERT_INVALID',
  'CERT_REJECTED',
  'CERT_UNTRUSTED',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
]);

const SAFE_SYSCALL_SET = new Set([
  'connect',
  'read',
  'write',
  'getaddrinfo',
  'lookup',
  'close',
  'open',
  'stat',
  'tls_handshake',
  'ssl3_read_bytes',
]);

function ehCodigoSeguro(code: unknown): code is string {
  if (typeof code !== 'string') return false;
  if (SAFE_CODE_SET.has(code)) return true;
  return (
    code.startsWith('ERR_SSL_') ||
    code.startsWith('ERR_TLS_') ||
    code.startsWith('ERR_OSSL_') ||
    code.startsWith('UND_ERR_')
  );
}

function inferirCodigoDeRede(texto: string): string | undefined {
  const upper = texto.toUpperCase();
  if (upper.includes('ECONNRESET')) return 'ECONNRESET';
  if (upper.includes('ETIMEDOUT')) return 'ETIMEDOUT';
  if (upper.includes('ENOTFOUND')) return 'ENOTFOUND';
  if (upper.includes('EAI_AGAIN')) return 'EAI_AGAIN';
  if (upper.includes('ECONNREFUSED')) return 'ECONNREFUSED';
  if (upper.includes('EPROTO')) return 'EPROTO';
  if (upper.includes('EHOSTUNREACH')) return 'EHOSTUNREACH';
  if (upper.includes('ENETUNREACH')) return 'ENETUNREACH';
  if (upper.includes('EACCES')) return 'EACCES';
  if (upper.includes('ENOENT')) return 'ENOENT';
  if (upper.includes('CERT_HAS_EXPIRED')) return 'CERT_HAS_EXPIRED';
  if (upper.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE'))
    return 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';
  return undefined;
}

function extrairCadeiaDeErros(error: unknown): unknown[] {
  const visitados = new Set<unknown>();
  const fila: unknown[] = [error];
  const resultado: unknown[] = [];

  while (fila.length > 0) {
    const item = fila.shift();
    if (!item || typeof item !== 'object' || visitados.has(item)) {
      continue;
    }
    visitados.add(item);
    resultado.push(item);

    const comDetalhes = item as {
      cause?: unknown;
      errors?: unknown;
      error?: unknown;
    };
    if (comDetalhes.cause) {
      fila.push(comDetalhes.cause);
    }
    if (Array.isArray(comDetalhes.errors)) {
      fila.push(...comDetalhes.errors);
    }
    if (comDetalhes.error) {
      fila.push(comDetalhes.error);
    }
  }

  return resultado;
}

export function diagnosticoEfi(error: unknown) {
  const cadeia = extrairCadeiaDeErros(error);

  let codigoSeguro: string | undefined;
  let statusHttp: number | undefined;
  let syscallSegura: string | undefined;
  const textosParaClassificacao: string[] = [];

  for (const item of cadeia) {
    const detail = item as {
      code?: unknown;
      errno?: unknown;
      message?: unknown;
      reason?: unknown;
      status?: unknown;
      syscall?: unknown;
      opensslErrorStack?: unknown;
    };

    if (!codigoSeguro) {
      if (ehCodigoSeguro(detail.code)) {
        codigoSeguro = detail.code;
      } else if (ehCodigoSeguro(detail.errno)) {
        codigoSeguro = detail.errno;
      } else if (typeof detail.errno === 'number') {
        try {
          const nome = getSystemErrorName(detail.errno);
          if (ehCodigoSeguro(nome)) {
            codigoSeguro = nome;
          }
        } catch {
          // Ignora caso errno numérico não seja mapeável na plataforma atual
        }
      }
    }

    if (!syscallSegura && typeof detail.syscall === 'string') {
      const lower = detail.syscall.toLowerCase();
      if (SAFE_SYSCALL_SET.has(lower)) {
        syscallSegura = lower;
      }
    }

    if (
      statusHttp === undefined &&
      typeof detail.status === 'number' &&
      Number.isInteger(detail.status) &&
      detail.status >= 100 &&
      detail.status <= 599
    ) {
      statusHttp = detail.status;
    }

    if (typeof detail.message === 'string') {
      textosParaClassificacao.push(detail.message);
    }
    if (typeof detail.reason === 'string') {
      textosParaClassificacao.push(detail.reason);
    }
    if (Array.isArray(detail.opensslErrorStack)) {
      for (const entry of detail.opensslErrorStack) {
        if (typeof entry === 'string') {
          textosParaClassificacao.push(entry);
        }
      }
    }
  }

  const textoConsolidado = textosParaClassificacao.join(' ');
  const textoLower = textoConsolidado.toLowerCase();
  codigoSeguro ??= inferirCodigoDeRede(textoConsolidado);

  const ehDesconexaoPreTls =
    textoLower.includes(
      'disconnected before secure tls connection was established',
    ) ||
    textoLower.includes('socket hang up') ||
    textoLower.includes('client network socket disconnected');

  if (ehDesconexaoPreTls && !codigoSeguro) {
    codigoSeguro = 'ECONNRESET';
  }

  let tipo: string;

  if (
    textoLower.includes('mac verify failure') ||
    textoConsolidado.includes('ERR_OSSL_PKCS12_MAC_VERIFY_FAILURE')
  ) {
    tipo = 'p12_senha_ou_integridade';
  } else if (
    textoLower.includes('wrong tag') ||
    textoLower.includes('not enough data') ||
    textoLower.includes('nested asn1 error') ||
    textoLower.includes('asn1 encoding routines') ||
    codigoSeguro === 'ERR_OSSL_ASN1_WRONG_TAG'
  ) {
    tipo = 'p12_formato_invalido';
  } else if (
    textosParaClassificacao.some((m) => m.toLowerCase() === 'timeout') ||
    codigoSeguro === 'ETIMEDOUT' ||
    textoLower.includes('etimedout')
  ) {
    tipo = 'timeout';
  } else if (
    textosParaClassificacao.some((m) => m.toLowerCase() === 'invalid_json')
  ) {
    tipo = 'resposta_json_invalida';
  } else if (
    textosParaClassificacao.some((m) => m.toLowerCase() === 'response_limit')
  ) {
    tipo = 'resposta_excede_limite';
  } else if (ehDesconexaoPreTls) {
    tipo = 'socket_desconectado_antes_tls';
  } else if (
    textoLower.includes('handshake failure') ||
    codigoSeguro === 'ERR_SSL_TLSV1_ALERT_HANDSHAKE_FAILURE' ||
    codigoSeguro === 'ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE'
  ) {
    tipo = 'alerta_tls_handshake_failure';
  } else if (
    textoLower.includes('certificate required') ||
    codigoSeguro === 'ERR_SSL_TLSV13_ALERT_CERTIFICATE_REQUIRED'
  ) {
    tipo = 'alerta_tls_certificado_obrigatorio';
  } else if (
    textoLower.includes('bad certificate') ||
    codigoSeguro === 'ERR_SSL_SSLV3_ALERT_BAD_CERTIFICATE'
  ) {
    tipo = 'alerta_tls_certificado_invalido';
  } else if (
    textoLower.includes('unknown ca') ||
    codigoSeguro === 'ERR_SSL_TLSV1_ALERT_UNKNOWN_CA'
  ) {
    tipo = 'alerta_tls_ca_desconhecida';
  } else if (
    textoLower.includes('access denied') ||
    codigoSeguro === 'ERR_SSL_TLSV1_ALERT_ACCESS_DENIED'
  ) {
    tipo = 'alerta_tls_acesso_negado';
  } else if (
    textoLower.includes('internal error') ||
    codigoSeguro === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR'
  ) {
    tipo = 'alerta_tls_erro_interno';
  } else if (
    textoLower.includes('illegal parameter') ||
    codigoSeguro === 'ERR_SSL_TLSV1_ALERT_ILLEGAL_PARAMETER'
  ) {
    tipo = 'alerta_tls_parametro_invalido';
  } else if (
    codigoSeguro === 'ECONNRESET' ||
    textoLower.includes('econnreset')
  ) {
    tipo = 'conexao_reiniciada';
  } else if (
    codigoSeguro === 'ENOTFOUND' ||
    codigoSeguro === 'EAI_AGAIN' ||
    textoLower.includes('enotfound')
  ) {
    tipo = 'dns_nao_encontrado';
  } else if (
    codigoSeguro === 'ECONNREFUSED' ||
    textoLower.includes('econnrefused')
  ) {
    tipo = 'conexao_recusada';
  } else if (
    codigoSeguro === 'EPROTO' ||
    textoLower.includes('eproto')
  ) {
    tipo = 'erro_protocolo_tls';
  } else if (
    codigoSeguro?.startsWith('CERT_') ||
    codigoSeguro?.startsWith('UNABLE_TO_') ||
    codigoSeguro?.includes('CERT') ||
    textoLower.includes('certificate has expired') ||
    textoLower.includes('self signed certificate')
  ) {
    tipo = 'erro_validacao_certificado';
  } else if (codigoSeguro) {
    tipo = 'erro_sistema_tls';
  } else if (statusHttp !== undefined) {
    tipo = 'http_externo';
  } else {
    tipo = 'erro_nao_classificado';
  }

  const classeErro =
    error instanceof Error
      ? error.constructor.name
      : error && typeof error === 'object'
        ? (error as { constructor?: { name?: string } }).constructor?.name ||
          'Object'
        : error === null || error === undefined
          ? null
          : typeof error;

  const comDetalhes = error as {
    cause?: unknown;
    errors?: unknown[];
  } | null;

  const possuiCausa = Boolean(
    comDetalhes &&
      (comDetalhes.cause ||
        (Array.isArray(comDetalhes.errors) && comDetalhes.errors.length > 0)),
  );

  return {
    tipo,
    codigo: codigoSeguro ?? null,
    statusHttpExterno: statusHttp ?? null,
    classeErro,
    possuiCausa,
    quantidadeCausas: cadeia.length > 1 ? cadeia.length - 1 : 0,
    syscall: syscallSegura ?? null,
  };
}
