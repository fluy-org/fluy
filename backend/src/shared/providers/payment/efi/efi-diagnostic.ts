const SAFE_CODES = new Set([
  'ENOENT',
  'EACCES',
  'EPERM',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'ERR_SSL_TLSV1_ALERT_UNKNOWN_CA',
  'ERR_SSL_SSLV3_ALERT_BAD_CERTIFICATE',
  'ERR_SSL_TLSV13_ALERT_CERTIFICATE_REQUIRED',
  'ERR_OSSL_UNSUPPORTED',
  'ERR_OSSL_ASN1_WRONG_TAG',
]);

export function diagnosticoEfi(error: unknown) {
  const detail = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
  } | null;
  const code =
    typeof detail?.code === 'string' && SAFE_CODES.has(detail.code)
      ? detail.code
      : undefined;
  const message = typeof detail?.message === 'string' ? detail.message : '';
  const tipo = message.includes('mac verify failure')
    ? 'p12_senha_ou_integridade'
    : message.includes('wrong tag') || message.includes('not enough data')
      ? 'p12_formato_invalido'
      : message === 'timeout'
        ? 'timeout'
        : message === 'invalid_json'
          ? 'resposta_json_invalida'
          : message === 'response_limit'
            ? 'resposta_excede_limite'
            : code
              ? 'erro_sistema_tls'
              : typeof detail?.status === 'number'
                ? 'http_externo'
                : 'erro_nao_classificado';
  const status =
    typeof detail?.status === 'number' &&
    Number.isInteger(detail.status) &&
    detail.status >= 100 &&
    detail.status <= 599
      ? detail.status
      : undefined;
  return { tipo, codigo: code ?? null, statusHttpExterno: status ?? null };
}
