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
  if (texto.includes('ECONNRESET')) return 'ECONNRESET';
  if (texto.includes('ETIMEDOUT')) return 'ETIMEDOUT';
  if (texto.includes('ENOTFOUND')) return 'ENOTFOUND';
  if (texto.includes('EAI_AGAIN')) return 'EAI_AGAIN';
  if (texto.includes('ECONNREFUSED')) return 'ECONNREFUSED';
  if (texto.includes('EPROTO')) return 'EPROTO';
  if (texto.includes('EHOSTUNREACH')) return 'EHOSTUNREACH';
  if (texto.includes('ENETUNREACH')) return 'ENETUNREACH';
  if (texto.includes('EACCES')) return 'EACCES';
  if (texto.includes('ENOENT')) return 'ENOENT';
  if (texto.includes('CERT_HAS_EXPIRED')) return 'CERT_HAS_EXPIRED';
  if (texto.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE'))
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
  const textosParaClassificacao: string[] = [];

  for (const item of cadeia) {
    const detail = item as {
      code?: unknown;
      errno?: unknown;
      message?: unknown;
      reason?: unknown;
      status?: unknown;
      opensslErrorStack?: unknown;
    };

    if (!codigoSeguro) {
      if (ehCodigoSeguro(detail.code)) {
        codigoSeguro = detail.code;
      } else if (ehCodigoSeguro(detail.errno)) {
        codigoSeguro = detail.errno;
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
  codigoSeguro ??= inferirCodigoDeRede(textoConsolidado);

  const ehDesconexaoPreTls =
    textoConsolidado.includes(
      'disconnected before secure TLS connection was established',
    ) || textoConsolidado.includes('socket hang up');

  if (ehDesconexaoPreTls && !codigoSeguro) {
    codigoSeguro = 'ECONNRESET';
  }

  let tipo: string;

  if (
    textoConsolidado.includes('mac verify failure') ||
    textoConsolidado.includes('ERR_OSSL_PKCS12_MAC_VERIFY_FAILURE')
  ) {
    tipo = 'p12_senha_ou_integridade';
  } else if (
    textoConsolidado.includes('wrong tag') ||
    textoConsolidado.includes('not enough data') ||
    textoConsolidado.includes('nested asn1 error') ||
    textoConsolidado.includes('asn1 encoding routines') ||
    codigoSeguro === 'ERR_OSSL_ASN1_WRONG_TAG'
  ) {
    tipo = 'p12_formato_invalido';
  } else if (
    textosParaClassificacao.some((m) => m === 'timeout') ||
    codigoSeguro === 'ETIMEDOUT' ||
    textoConsolidado.includes('ETIMEDOUT')
  ) {
    tipo = 'timeout';
  } else if (textosParaClassificacao.some((m) => m === 'invalid_json')) {
    tipo = 'resposta_json_invalida';
  } else if (textosParaClassificacao.some((m) => m === 'response_limit')) {
    tipo = 'resposta_excede_limite';
  } else if (ehDesconexaoPreTls) {
    tipo = 'socket_desconectado_antes_tls';
  } else if (
    textoConsolidado.includes('handshake failure') ||
    codigoSeguro === 'ERR_SSL_TLSV1_ALERT_HANDSHAKE_FAILURE' ||
    codigoSeguro === 'ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE'
  ) {
    tipo = 'alerta_tls_handshake_failure';
  } else if (
    textoConsolidado.includes('certificate required') ||
    codigoSeguro === 'ERR_SSL_TLSV13_ALERT_CERTIFICATE_REQUIRED'
  ) {
    tipo = 'alerta_tls_certificado_obrigatorio';
  } else if (
    textoConsolidado.includes('bad certificate') ||
    codigoSeguro === 'ERR_SSL_SSLV3_ALERT_BAD_CERTIFICATE'
  ) {
    tipo = 'alerta_tls_certificado_invalido';
  } else if (
    textoConsolidado.includes('unknown ca') ||
    codigoSeguro === 'ERR_SSL_TLSV1_ALERT_UNKNOWN_CA'
  ) {
    tipo = 'alerta_tls_ca_desconhecida';
  } else if (
    textoConsolidado.includes('access denied') ||
    codigoSeguro === 'ERR_SSL_TLSV1_ALERT_ACCESS_DENIED'
  ) {
    tipo = 'alerta_tls_acesso_negado';
  } else if (
    codigoSeguro === 'ECONNRESET' ||
    textoConsolidado.includes('ECONNRESET')
  ) {
    tipo = 'conexao_reiniciada';
  } else if (
    codigoSeguro === 'ENOTFOUND' ||
    codigoSeguro === 'EAI_AGAIN' ||
    textoConsolidado.includes('ENOTFOUND')
  ) {
    tipo = 'dns_nao_encontrado';
  } else if (
    codigoSeguro === 'ECONNREFUSED' ||
    textoConsolidado.includes('ECONNREFUSED')
  ) {
    tipo = 'conexao_recusada';
  } else if (
    codigoSeguro === 'EPROTO' ||
    textoConsolidado.includes('EPROTO')
  ) {
    tipo = 'erro_protocolo_tls';
  } else if (
    codigoSeguro?.startsWith('CERT_') ||
    codigoSeguro?.startsWith('UNABLE_TO_') ||
    codigoSeguro?.includes('CERT') ||
    textoConsolidado.includes('certificate has expired') ||
    textoConsolidado.includes('self signed certificate')
  ) {
    tipo = 'erro_validacao_certificado';
  } else if (codigoSeguro) {
    tipo = 'erro_sistema_tls';
  } else if (statusHttp !== undefined) {
    tipo = 'http_externo';
  } else {
    tipo = 'erro_nao_classificado';
  }

  return {
    tipo,
    codigo: codigoSeguro ?? null,
    statusHttpExterno: statusHttp ?? null,
  };
}
