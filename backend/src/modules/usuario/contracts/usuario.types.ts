import type { usuario } from '@fluy/schema';
import type { AuthenticatedIdentity } from '../../auth/contracts';

export type UsuarioPersistido = typeof usuario.$inferSelect;

export type CriarOuObterUsuarioInput = {
  identity: AuthenticatedIdentity;
  nome: string;
  sobrenome: string;
  email: string;
};

export type ResultadoCriarOuObterUsuario =
  | { status: 'criado' | 'existente'; usuario: UsuarioPersistido }
  | { status: 'email_em_uso' };
