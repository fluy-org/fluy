import type { UsuarioAtualResponseDto, UsuarioResponseDto } from '@fluy/schema';
import type {
  ResultadoBuscarUsuarioAtual,
  UsuarioPersistido,
} from './contracts';

export function toUsuarioResponse(usuario: UsuarioPersistido): UsuarioResponseDto {
  return {
    id: usuario.id,
    nome: usuario.nome,
    sobrenome: usuario.sobrenome,
    email: usuario.email,
    criado_em: usuario.criado_em.toISOString(),
  };
}

export function toUsuarioAtualResponse(
  resultado: ResultadoBuscarUsuarioAtual,
): UsuarioAtualResponseDto {
  return {
    ...toUsuarioResponse(resultado.usuario),
    estado: resultado.estado,
  };
}
