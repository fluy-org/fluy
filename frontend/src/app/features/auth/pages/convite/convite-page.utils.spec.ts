import {
  identificarEstadoErroConvite,
  identificarEstadoTerminalConvite,
  identificarMensagemErroCadastroConvite,
} from './convite-page.utils';

describe('identificarEstadoErroConvite', () => {
  it('identifica convite expirado', () => {
    expect(
      identificarEstadoErroConvite({
        errors: [{ code: 'ticket_expired_code' }],
      }),
    ).toBe('expirado');
  });

  it('identifica convite revogado', () => {
    expect(
      identificarEstadoErroConvite({
        errors: [{ code: 'revoked_invitation' }],
      }),
    ).toBe('revogado');
  });

  it('identifica convite ja utilizado', () => {
    expect(
      identificarEstadoErroConvite({
        errors: [{ code: 'invitation_already_accepted' }],
      }),
    ).toBe('utilizado');
  });

  it('identifica ticket invalido sem exibir detalhes do Clerk', () => {
    expect(
      identificarEstadoErroConvite({
        errors: [{ code: 'ticket_invalid_code', longMessage: 'dado sensivel' }],
      }),
    ).toBe('invalido');
  });

  it('usa estado indisponivel para falhas desconhecidas', () => {
    expect(identificarEstadoErroConvite(new Error('falha de rede'))).toBe(
      'indisponivel',
    );
  });
});

describe('identificarEstadoTerminalConvite', () => {
  it('nao transforma erro de senha em erro de convite', () => {
    expect(
      identificarEstadoTerminalConvite({
        errors: [{ code: 'form_password_size_in_bytes_exceeded' }],
      }),
    ).toBeNull();
  });
});

describe('identificarMensagemErroCadastroConvite', () => {
  it('explica o tamanho mínimo exigido para a senha', () => {
    expect(
      identificarMensagemErroCadastroConvite({
        errors: [
          {
            code: 'form_password_length_too_short',
            meta: { param_name: 'password' },
          },
        ],
      }),
    ).toContain('8 caracteres');
  });

  it('explica quando a senha foi comprometida', () => {
    expect(
      identificarMensagemErroCadastroConvite({
        errors: [{ code: 'form_password_pwned' }],
      }),
    ).toContain('vazamentos');
  });

  it('explica requisitos de senha sem expor detalhes internos do Clerk', () => {
    expect(
      identificarMensagemErroCadastroConvite({
        errors: [
          {
            code: 'form_param_format_invalid',
            longMessage: 'detalhe interno',
            meta: { paramName: 'password' },
          },
        ],
      }),
    ).toContain('requisitos de segurança');
  });
});
