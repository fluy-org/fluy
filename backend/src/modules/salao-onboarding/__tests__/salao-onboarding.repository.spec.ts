jest.mock(
  '@fluy/schema',
  () => ({
    configuracaoSalao: { salao_id: 'configuracao_salao.salao_id' },
    profissional: { salao_id: 'profissional.salao_id' },
    salao: { id: 'salao.id', subdominio: 'salao.subdominio' },
    usuarioSalao: {
      salao_id: 'usuario_salao.salao_id',
      usuario_id: 'usuario_salao.usuario_id',
      papel: 'usuario_salao.papel',
    },
  }),
  { virtual: true },
);

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  eq: jest.fn(),
}));

jest.mock('@/database/database.provider', () => ({
  DATABASE: Symbol('DATABASE'),
}));

import { and, eq } from 'drizzle-orm';
import { salao, usuarioSalao } from '@fluy/schema';
import type { Database } from '@/database/database.provider';
import type {
  CriarSalaoPersistenciaInput,
  SalaoPersistido,
} from '@/modules/salao-onboarding/contracts';
import { SalaoRepository } from '@/modules/salao-onboarding/salao-onboarding.repository';

describe('SalaoRepository', () => {
  const limit = jest.fn();
  const where = jest.fn(() => ({ limit }));
  const innerJoin = jest.fn(() => ({ where }));
  const from = jest.fn(() => ({ innerJoin, where }));
  const select = jest.fn(() => ({ from }));
  const returning = jest.fn();
  const values = jest.fn(() => ({ returning }));
  const insert = jest.fn(() => ({ values }));
  const transaction = jest.fn((callback: (tx: unknown) => unknown) =>
    callback({ insert }),
  );
  const database = {
    select,
    transaction,
  } as unknown as Database;
  const repository = new SalaoRepository(database);
  const salaoPersistido = criarSalaoPersistido();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(eq).mockReturnValue('condicao' as never);
  });

  it('busca o salao vinculado ao usuario como dono', async () => {
    limit.mockResolvedValue([{ salao: salaoPersistido }]);

    expect(await repository.buscarSalaoDoDono('usuario-ana')).toBe(
      salaoPersistido,
    );
    expect(innerJoin).toHaveBeenCalledWith(salao, expect.anything());
    expect(eq).toHaveBeenCalledWith(usuarioSalao.usuario_id, 'usuario-ana');
    expect(eq).toHaveBeenCalledWith(usuarioSalao.papel, 'dono');
    expect(and).toHaveBeenCalled();
  });

  it('informa se o subdominio ja esta cadastrado', async () => {
    limit.mockResolvedValue([{ id: salaoPersistido.id }]);

    expect(await repository.buscarPorSubdominio('salao-da-ana')).toBe(true);
    expect(eq).toHaveBeenCalledWith(salao.subdominio, 'salao-da-ana');

    limit.mockResolvedValue([]);

    expect(await repository.buscarPorSubdominio('novo-salao')).toBe(false);
  });

  it('cria o salao e seus registros iniciais na mesma transacao', async () => {
    const input: CriarSalaoPersistenciaInput = {
      nome: 'Salao da Ana',
      subdominio: 'salao-da-ana',
      contato_whatsapp: '5511999999999',
      endereco: 'Rua das Flores, 1',
      fuso_horario: 'America/Sao_Paulo',
      usuarioId: 'usuario-ana',
      nomeProfissional: 'Ana Silva',
    } as CriarSalaoPersistenciaInput;
    returning.mockResolvedValue([salaoPersistido]);

    expect(await repository.criar(input)).toBe(salaoPersistido);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenNthCalledWith(1, salao);
    expect(values).toHaveBeenNthCalledWith(1, {
      nome: input.nome,
      subdominio: input.subdominio,
      contato_whatsapp: input.contato_whatsapp,
      endereco: input.endereco,
      fuso_horario: input.fuso_horario,
    });
    expect(values).toHaveBeenNthCalledWith(2, {
      usuario_id: input.usuarioId,
      salao_id: salaoPersistido.id,
      papel: 'dono',
    });
    expect(values).toHaveBeenNthCalledWith(3, {
      salao_id: salaoPersistido.id,
    });
    expect(values).toHaveBeenNthCalledWith(4, {
      salao_id: salaoPersistido.id,
      nome: input.nomeProfissional,
    });
  });
});

function criarSalaoPersistido(): SalaoPersistido {
  return {
    id: 'salao-ana',
    nome: 'Salao da Ana',
    subdominio: 'salao-da-ana',
    contato_whatsapp: '5511999999999',
    endereco: 'Rua das Flores, 1',
    fuso_horario: 'America/Sao_Paulo',
    criado_em: new Date('2026-01-01T00:00:00.000Z'),
  } as SalaoPersistido;
}
