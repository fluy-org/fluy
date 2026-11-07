import { diagnosticoEfi } from '../efi/efi-diagnostic';

describe('diagnóstico seguro Efí', () => {
  it.each(['ENOENT', 'EACCES', 'ECONNRESET', 'CERT_HAS_EXPIRED'])(
    'preserva código conhecido %s',
    (code) => {
      expect(diagnosticoEfi({ code })).toMatchObject({ codigo: code });
    },
  );

  it.each([
    ['mac verify failure', 'p12_senha_ou_integridade'],
    ['not enough data', 'p12_formato_invalido'],
    ['timeout', 'timeout'],
    ['invalid_json', 'resposta_json_invalida'],
  ])('classifica %s sem mensagem bruta', (message, tipo) => {
    expect(diagnosticoEfi(new Error(message))).toMatchObject({ tipo });
  });

  it('classifica desconexão prematura de socket antes do TLS', () => {
    const erroSocket = new Error(
      'Client network socket disconnected before secure TLS connection was established',
    );
    expect(diagnosticoEfi(erroSocket)).toEqual({
      tipo: 'socket_desconectado_antes_tls',
      codigo: 'ECONNRESET',
      statusHttpExterno: null,
    });

    const erroHangup = new Error('socket hang up');
    expect(diagnosticoEfi(erroHangup)).toEqual({
      tipo: 'socket_desconectado_antes_tls',
      codigo: 'ECONNRESET',
      statusHttpExterno: null,
    });
  });

  it('inspeciona causas aninhadas (cause e errors) para extrair código e tipo originais', () => {
    const erroComCausaReset = new Error('Falha na requisição', {
      cause: Object.assign(new Error('read ECONNRESET'), {
        code: 'ECONNRESET',
      }),
    });
    expect(diagnosticoEfi(erroComCausaReset)).toEqual({
      tipo: 'conexao_reiniciada',
      codigo: 'ECONNRESET',
      statusHttpExterno: null,
    });

    const erroComCausaTls = new Error('Falha TLS', {
      cause: {
        code: 'ERR_SSL_TLSV1_ALERT_HANDSHAKE_FAILURE',
        message: 'ssl/tls alert handshake failure',
      },
    });
    expect(diagnosticoEfi(erroComCausaTls)).toEqual({
      tipo: 'alerta_tls_handshake_failure',
      codigo: 'ERR_SSL_TLSV1_ALERT_HANDSHAKE_FAILURE',
      statusHttpExterno: null,
    });

    const erroTimeoutAninhado = new Error('Falha de rede', {
      cause: Object.assign(new Error('connect ETIMEDOUT'), {
        code: 'ETIMEDOUT',
      }),
    });
    expect(diagnosticoEfi(erroTimeoutAninhado)).toEqual({
      tipo: 'timeout',
      codigo: 'ETIMEDOUT',
      statusHttpExterno: null,
    });

    const erroDnsAninhado = new Error('Falha DNS', {
      cause: Object.assign(new Error('getaddrinfo ENOTFOUND'), {
        code: 'ENOTFOUND',
      }),
    });
    expect(diagnosticoEfi(erroDnsAninhado)).toEqual({
      tipo: 'dns_nao_encontrado',
      codigo: 'ENOTFOUND',
      statusHttpExterno: null,
    });
  });

  it('classifica alertas e erros específicos de mTLS e TLS', () => {
    expect(
      diagnosticoEfi({
        code: 'ERR_SSL_TLSV13_ALERT_CERTIFICATE_REQUIRED',
        message: 'certificate required',
      }),
    ).toEqual({
      tipo: 'alerta_tls_certificado_obrigatorio',
      codigo: 'ERR_SSL_TLSV13_ALERT_CERTIFICATE_REQUIRED',
      statusHttpExterno: null,
    });

    expect(
      diagnosticoEfi({
        code: 'ERR_SSL_SSLV3_ALERT_BAD_CERTIFICATE',
        message: 'bad certificate',
      }),
    ).toEqual({
      tipo: 'alerta_tls_certificado_invalido',
      codigo: 'ERR_SSL_SSLV3_ALERT_BAD_CERTIFICATE',
      statusHttpExterno: null,
    });

    expect(
      diagnosticoEfi({
        code: 'ERR_SSL_TLSV1_ALERT_UNKNOWN_CA',
        message: 'unknown ca',
      }),
    ).toEqual({
      tipo: 'alerta_tls_ca_desconhecida',
      codigo: 'ERR_SSL_TLSV1_ALERT_UNKNOWN_CA',
      statusHttpExterno: null,
    });

    expect(
      diagnosticoEfi({
        code: 'ERR_SSL_TLSV1_ALERT_ACCESS_DENIED',
        message: 'access denied',
      }),
    ).toEqual({
      tipo: 'alerta_tls_acesso_negado',
      codigo: 'ERR_SSL_TLSV1_ALERT_ACCESS_DENIED',
      statusHttpExterno: null,
    });

    expect(
      diagnosticoEfi({
        code: 'CERT_HAS_EXPIRED',
        message: 'certificate has expired',
      }),
    ).toEqual({
      tipo: 'erro_validacao_certificado',
      codigo: 'CERT_HAS_EXPIRED',
      statusHttpExterno: null,
    });
  });

  it('infere código de rede a partir da mensagem quando code não é fornecido', () => {
    expect(diagnosticoEfi(new Error('read ECONNRESET'))).toEqual({
      tipo: 'conexao_reiniciada',
      codigo: 'ECONNRESET',
      statusHttpExterno: null,
    });

    expect(
      diagnosticoEfi(new Error('connect ECONNREFUSED 127.0.0.1:443')),
    ).toEqual({
      tipo: 'conexao_recusada',
      codigo: 'ECONNREFUSED',
      statusHttpExterno: null,
    });

    expect(
      diagnosticoEfi(
        new Error(
          'write EPROTO 0A000410:SSL routines::ssl/tls alert handshake failure',
        ),
      ),
    ).toEqual({
      tipo: 'alerta_tls_handshake_failure',
      codigo: 'EPROTO',
      statusHttpExterno: null,
    });
  });

  it('descarta dados externos, mensagens, stack, códigos desconhecidos e cabeçalhos', () => {
    expect(
      diagnosticoEfi({
        code: 'SEGREDO',
        message: 'senha CPF token certificado',
        stack: 'SEGREDO',
        body: 'dados bancarios',
        headers: { Authorization: 'Basic SEGREDO' },
        status: 403,
      }),
    ).toEqual({ tipo: 'http_externo', codigo: null, statusHttpExterno: 403 });

    expect(diagnosticoEfi(null)).toEqual({
      tipo: 'erro_nao_classificado',
      codigo: null,
      statusHttpExterno: null,
    });
  });
});
