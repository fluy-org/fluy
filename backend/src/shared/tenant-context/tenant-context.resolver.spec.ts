import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import { TenantContextRepository } from './tenant-context.repository';
import { TenantContextResolver } from './tenant-context.resolver';

describe('TenantContextResolver', () => {
  const config = {
    get: jest.fn(),
  } as unknown as ConfigService<Env, true>;
  const repository = {
    buscarPorDono: jest.fn(),
    buscarPorSubdominio: jest.fn(),
  } as unknown as TenantContextRepository;
  const resolver = new TenantContextResolver(config, repository);

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(config, 'get').mockReturnValue('localhost');
  });

  it('resolve o tenant pelo subdomínio do host', async () => {
    jest
      .spyOn(repository, 'buscarPorSubdominio')
      .mockResolvedValue({ salaoId: 'salao-ana' });

    expect(await resolver.resolverPorHost('ana.localhost:3000')).toEqual({
      salaoId: 'salao-ana',
    });
    expect(repository.buscarPorSubdominio).toHaveBeenCalledWith('ana');
  });

  it('rejeita host fora do domínio-base configurado', async () => {
    expect(await resolver.resolverPorHost('ana.fluy.app')).toBeUndefined();
    expect(repository.buscarPorSubdominio).not.toHaveBeenCalled();
  });

  it('rejeita host sem subdomínio', async () => {
    expect(await resolver.resolverPorHost('localhost:3000')).toBeUndefined();
    expect(repository.buscarPorSubdominio).not.toHaveBeenCalled();
  });
});
