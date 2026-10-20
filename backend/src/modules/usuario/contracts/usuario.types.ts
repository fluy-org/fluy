import type { UsuarioAtualResponseDto, usuario } from '@fluy/schema';
import type { AuthenticatedIdentity } from '@/modules/auth/contracts';

export type UsuarioPersistido = typeof usuario.$inferSelect;

export type CriarOuObterUsuarioInput = {
  identity: AuthenticatedIdentity;
  nome: string;
  sobrenome: string;
  email: string;
  exigirConvite: boolean;
  referenciaConviteClerk: string | null;
};

export type ResultadoCriarOuObterUsuario =
  | { status: 'criado' | 'existente'; usuario: UsuarioPersistido }
  | {
      status:
        | 'email_em_uso'
        | 'convite_necessario'
        | 'convite_invalido'
        | 'convite_consumido';
    };

export type ResultadoCriarOuObterUsuarioAtual = {
  usuario: UsuarioPersistido;
  criado: boolean;
};

export type ResultadoBuscarUsuarioAtual = {
  usuario: UsuarioPersistido;
  estado: UsuarioAtualResponseDto['estado'];
};
