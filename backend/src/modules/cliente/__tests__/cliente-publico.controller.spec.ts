jest.mock('@/modules/cliente/contracts', () => ({
  ConsultarSessaoClienteQueryDto: class ConsultarSessaoClienteQueryDto {},
  IdentificarClientePublicaRequestDto:
    class IdentificarClientePublicaRequestDto {},
  SessaoClientePublicaResponseDto: {
    Output: class SessaoClientePublicaResponseDto {},
  },
}));
jest.mock('@/modules/cliente/cliente.mapper', () => ({
  toSessaoClientePublicaResponse: jest.fn((cliente) => ({ cliente })),
}));

import type { TenantContext } from '@/shared/tenant-context/contracts';
import { ClientePublicoController } from '@/modules/cliente/cliente-publico.controller';
import type { ClienteService } from '@/modules/cliente/cliente.service';

describe('ClientePublicoController', () => {
  const resolverSessaoPublica = jest.fn();
  const identificarPublicamente = jest.fn();
  const revogarSessaoPublica = jest.fn();
  const service = {
    resolverSessaoPublica,
    identificarPublicamente,
    revogarSessaoPublica,
  } as unknown as ClienteService;
  const controller = new ClientePublicoController(service);
  const tenant = {
    salaoId: 'salao-correto',
    usuarioSalaoId: null,
  } as TenantContext;

  beforeEach(() => jest.resetAllMocks());

  it('consulta a credencial somente no salão resolvido pela rota', async () => {
    resolverSessaoPublica.mockResolvedValue(undefined);

    await controller.consultarSessao(tenant, {
      credencial: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(resolverSessaoPublica).toHaveBeenCalledWith({
      credencial: '550e8400-e29b-41d4-a716-446655440000',
      salaoId: 'salao-correto',
    });
  });

  it('identifica a cliente somente no salão resolvido pela rota', async () => {
    const dados = {
      nome: 'Ana',
      whatsapp: '+5511999999999',
      credencial: '550e8400-e29b-41d4-a716-446655440000',
      consentimento_privacidade: true as const,
    };
    identificarPublicamente.mockResolvedValue({ nome: 'Ana' });

    await controller.identificar(tenant, dados);

    expect(identificarPublicamente).toHaveBeenCalledWith({
      dados,
      salaoId: 'salao-correto',
    });
  });

  it('revoga a sessão pública no salão correto via header', async () => {
    await controller.revogarSessao(
      tenant,
      undefined,
      '550e8400-e29b-41d4-a716-446655440000',
    );

    expect(revogarSessaoPublica).toHaveBeenCalledWith({
      credencial: '550e8400-e29b-41d4-a716-446655440000',
      salaoId: 'salao-correto',
    });
  });
});
