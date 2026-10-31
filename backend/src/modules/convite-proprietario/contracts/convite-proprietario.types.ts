export type EmitirConviteProprietarioInput = {
  email: string;
  diasValidade?: number;
};

export type EmitirConviteProprietarioResultado =
  | {
      status: 'emitido';
      clerkConviteId: string;
      email: string;
      expiraEm: Date;
      url: string;
    }
  | {
      status: 'duplicado';
      clerkConviteId: string;
      email: string;
      expiraEm: Date;
    }
  | { status: 'configuracao_ausente' }
  | { status: 'falha_integracao' };

export type RevogarConviteProprietarioResultado =
  { status: 'revogado' } | { status: 'falha_integracao' };
