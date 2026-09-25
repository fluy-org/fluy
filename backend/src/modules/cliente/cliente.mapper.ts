import type { ClienteResponseDto } from '@fluy/schema';
import type { ClientePersistido } from '@/modules/cliente/contracts';
import type { SessaoClientePublicaResponseDto } from '@fluy/schema';

export function toClienteResponse(cliente: ClientePersistido,): ClienteResponseDto {
    return {
        id: cliente.id,
        nome: cliente.nome,
        whatsapp: cliente.whatsapp,
        observacoes: cliente.observacoes,
        ativo: cliente.removido_em === null,
        criada_em: cliente.criada_em.toISOString(),
    };
}

export function toSessaoClientePublicaResponse(
    cliente: ClientePersistido | undefined,
): SessaoClientePublicaResponseDto {
    return {
        cliente: cliente
            ? { nome: cliente.nome, whatsapp: cliente.whatsapp }
            : null,
    };
}
