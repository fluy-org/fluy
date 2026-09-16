import type { ClienteResponseDto } from '@fluy/schema';
import type { ClientePersistido } from '@/modules/cliente/contracts';

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
