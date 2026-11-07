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
