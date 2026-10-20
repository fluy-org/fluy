import type { Database } from '@/database/database.provider';
import type { CriarOuObterUsuarioInput } from '@/modules/usuario/contracts';
import { UsuarioRepository } from '@/modules/usuario/usuario.repository';

describe('UsuarioRepository', () => {
  const usuario = {
    id: 'a3f828a8-ef5a-4498-aa67-8fc29283cd1a',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana@example.com',
    criado_em: new Date('2026-10-14T12:00:00.000Z'),
  };

  it('materializa usuário e autorização do Clerk na mesma transação', async () => {
    const authorizationValues = jest.fn();
    const insert = criarInserts(usuario, 3, authorizationValues);
    const tx = {
      execute: jest.fn().mockResolvedValue(undefined),
      select: jest
        .fn()
        .mockReturnValueOnce(criarSelectComJoin([]))
        .mockReturnValueOnce(criarSelectDireto([]))
        .mockReturnValueOnce(criarSelectDireto([])),
      insert,
    };
    const repository = new UsuarioRepository(criarDatabase(tx));

    await expect(repository.criarOuObter(criarInput())).resolves.toEqual({
      status: 'criado',
      usuario,
    });

    expect(tx.execute).toHaveBeenCalledTimes(2);
    expect(insert).toHaveBeenCalledTimes(3);
    expect(authorizationValues).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario_id: usuario.id,
        origem: 'convite',
        referencia_convite_clerk: '7d5c96a7-c33a-4e76-8ae8-f57558577e53',
      }),
    );
  });

  it('não concede autorização a conta nova sem convite durante a transição', async () => {
    const insert = criarInserts(usuario, 2);
    const tx = {
      execute: jest.fn().mockResolvedValue(undefined),
      select: jest
        .fn()
        .mockReturnValueOnce(criarSelectComJoin([]))
        .mockReturnValueOnce(criarSelectDireto([])),
      insert,
    };
    const repository = new UsuarioRepository(criarDatabase(tx));

    await expect(
      repository.criarOuObter(
        criarInput({ exigirConvite: false, referenciaConviteClerk: null }),
      ),
    ).resolves.toEqual({ status: 'criado', usuario });
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it('rejeita conta nova sem convite quando a proteção está ativa', async () => {
    const tx = {
      execute: jest.fn().mockResolvedValue(undefined),
      select: jest.fn().mockReturnValueOnce(criarSelectComJoin([])),
      insert: jest.fn(),
    };
    const repository = new UsuarioRepository(criarDatabase(tx));

    await expect(
      repository.criarOuObter(criarInput({ referenciaConviteClerk: null })),
    ).resolves.toEqual({ status: 'convite_necessario' });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it('trata repetição da mesma identidade como idempotente', async () => {
    const tx = {
      execute: jest.fn().mockResolvedValue(undefined),
      select: jest
        .fn()
        .mockReturnValueOnce(criarSelectComJoin([{ usuario }]))
        .mockReturnValueOnce(criarSelectDireto([{ id: 'auth_1' }])),
      insert: jest.fn(),
    };
    const repository = new UsuarioRepository(criarDatabase(tx));

    await expect(repository.criarOuObter(criarInput())).resolves.toEqual({
      status: 'existente',
      usuario,
    });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it('impede que outra identidade reutilize a mesma referência', async () => {
    const tx = {
      execute: jest.fn().mockResolvedValue(undefined),
      select: jest
        .fn()
        .mockReturnValueOnce(criarSelectComJoin([]))
        .mockReturnValueOnce(criarSelectDireto([{ id: 'auth_1' }])),
      insert: jest.fn(),
    };
    const repository = new UsuarioRepository(criarDatabase(tx));

    await expect(repository.criarOuObter(criarInput())).resolves.toEqual({
      status: 'convite_consumido',
    });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it('retoma cadastro interrompido autorizando usuário já materializado', async () => {
    const insert = criarInserts(usuario, 1);
    const tx = {
      execute: jest.fn().mockResolvedValue(undefined),
      select: jest
        .fn()
        .mockReturnValueOnce(criarSelectComJoin([{ usuario }]))
        .mockReturnValueOnce(criarSelectDireto([]))
        .mockReturnValueOnce(criarSelectDireto([])),
      insert,
    };
    const repository = new UsuarioRepository(criarDatabase(tx));

    await expect(repository.criarOuObter(criarInput())).resolves.toEqual({
      status: 'existente',
      usuario,
    });
    expect(insert).toHaveBeenCalledTimes(1);
  });
});

function criarInput(
  input: Partial<CriarOuObterUsuarioInput> = {},
): CriarOuObterUsuarioInput {
  return {
    identity: { provider: 'clerk', subject: 'user_123' },
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'Ana@Example.com ',
    exigirConvite: true,
    referenciaConviteClerk: '7d5c96a7-c33a-4e76-8ae8-f57558577e53',
    ...input,
  };
}

function criarDatabase(tx: object): Database {
  return {
    transaction: jest.fn((callback: (transaction: object) => unknown) =>
      callback(tx),
    ),
  } as unknown as Database;
}

function criarSelectComJoin(resultado: unknown[]) {
  const limit = jest.fn().mockResolvedValue(resultado);
  const where = jest.fn(() => ({ limit }));
  const innerJoin = jest.fn(() => ({ where }));
  return { from: jest.fn(() => ({ innerJoin })) };
}

function criarSelectDireto(resultado: unknown[]) {
  const limit = jest.fn().mockResolvedValue(resultado);
  const where = jest.fn(() => ({ limit }));
  return { from: jest.fn(() => ({ where })) };
}

function criarInserts(
  usuario: object,
  quantidade: number,
  ultimoValues = jest.fn(),
) {
  const insert = jest.fn();
  const values = jest.fn();

  insert.mockReturnValueOnce({
    values: jest.fn(() => ({
      returning: jest.fn().mockResolvedValue([usuario]),
    })),
  });

  for (let indice = 1; indice < quantidade; indice += 1) {
    insert.mockReturnValueOnce({
      values: indice === quantidade - 1 ? ultimoValues : values,
    });
  }

  return insert;
}
