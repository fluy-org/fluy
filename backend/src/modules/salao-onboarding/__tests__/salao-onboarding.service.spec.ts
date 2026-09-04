import { ConflictException } from '@nestjs/common';

jest.mock('@fluy/schema', () => ({ LIMITE_SUBDOMINIO: 63 }));
jest.mock('@/modules/usuario/usuario.service', () => ({
  UsuarioService: class UsuarioService {},
}));
jest.mock('@/modules/salao-onboarding/salao-onboarding.repository', () => ({
  SalaoRepository: class SalaoRepository {},
}));

import type { CriarSalaoDto } from '@fluy/schema';
import type { AuthenticatedIdentity } from '@/modules/auth/contracts';
import { UsuarioService } from '@/modules/usuario/usuario.service';
import type { SalaoPersistido } from '@/modules/salao-onboarding/contracts';
import { SalaoRepository } from '@/modules/salao-onboarding/salao-onboarding.repository';
import { SalaoService } from '@/modules/salao-onboarding/salao-onboarding.service';

describe('SalaoService', () => {
  const buscarUsuarioAtual = jest.fn();
  const usuarioService = {
    buscarUsuarioAtual,
  } as unknown as UsuarioService;
  const buscarSalaoDoDono = jest.fn();
  const buscarPorSubdominio = jest.fn();
  const criar = jest.fn();
  const salaoRepository = {
    buscarSalaoDoDono,
    buscarPorSubdominio,
    criar,
  } as unknown as SalaoRepository;
  const service = new SalaoService(usuarioService, salaoRepository);
  const identity: AuthenticatedIdentity = {
    provider: 'clerk',
    subject: 'user_123',
  };
  const dados = {
    nome: 'Salao da Ana',
    subdominio: 'salao-da-ana',
    contato_whatsapp: '5511999999999',
    endereco: 'Rua das Flores, 1',
    fuso_horario: 'America/Sao_Paulo',
  } as CriarSalaoDto;
  const usuario = {
    id: 'usuario-ana',
    nome: 'Ana',
    sobrenome: 'Silva',
  };
  const salao = criarSalaoPersistido();

  beforeEach(() => {
    jest.resetAllMocks();
    buscarUsuarioAtual.mockResolvedValue(usuario);
  });

  it('retorna o salao existente do dono sem tentar cria-lo novamente', async () => {
    buscarSalaoDoDono.mockResolvedValue(salao);

    expect(await service.criarOuObter({ identity, dados })).toEqual({
      salao,
      criado: false,
    });
    expect(buscarUsuarioAtual).toHaveBeenCalledWith(identity);
    expect(buscarSalaoDoDono).toHaveBeenCalledWith(usuario.id);
    expect(criar).not.toHaveBeenCalled();
  });

  it('cria o salao com o dono e o nome do profissional inicial', async () => {
    buscarSalaoDoDono.mockResolvedValue(undefined);
    criar.mockResolvedValue(salao);

    expect(await service.criarOuObter({ identity, dados })).toEqual({
      salao,
      criado: true,
    });
    expect(criar).toHaveBeenCalledWith({
      ...dados,
      usuarioId: usuario.id,
      nomeProfissional: 'Ana Silva',
    });
  });

  it('recupera o salao quando outra requisicao o cria em paralelo', async () => {
    buscarSalaoDoDono
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(salao);
    criar.mockRejectedValue({ code: '23505' });

    expect(await service.criarOuObter({ identity, dados })).toEqual({
      salao,
      criado: false,
    });
    expect(buscarSalaoDoDono).toHaveBeenCalledTimes(2);
    expect(buscarPorSubdominio).not.toHaveBeenCalled();
  });

  it('informa conflito e sugere subdominios disponiveis', async () => {
    buscarSalaoDoDono.mockResolvedValue(undefined);
    criar.mockRejectedValue({ code: '23505' });
    buscarPorSubdominio.mockImplementation(
      async (subdominio: string) => subdominio === dados.subdominio,
    );

    try {
      await service.criarOuObter({ identity, dados });
      throw new Error('A criacao deveria rejeitar o subdominio indisponivel.');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        codigo: 'subdominio_indisponivel',
        sugestoes: ['salao-da-ana-2', 'salao-da-ana-3', 'salao-da-ana-4'],
      });
    }
  });

  it('propaga erros que nao representam violacao de unicidade', async () => {
    const error = new Error('falha no banco');
    buscarSalaoDoDono.mockResolvedValue(undefined);
    criar.mockRejectedValue(error);

    await expect(service.criarOuObter({ identity, dados })).rejects.toBe(error);
    expect(buscarPorSubdominio).not.toHaveBeenCalled();
  });
});

function criarSalaoPersistido(
  input: Partial<SalaoPersistido> = {},
): SalaoPersistido {
  return {
    id: 'salao-ana',
    nome: 'Salao da Ana',
    subdominio: 'salao-da-ana',
    contato_whatsapp: '5511999999999',
    endereco: 'Rua das Flores, 1',
    fuso_horario: 'America/Sao_Paulo',
    criado_em: new Date('2026-01-01T00:00:00.000Z'),
    ...input,
  } as SalaoPersistido;
}
