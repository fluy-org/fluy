jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_HOUR: '0 * * * *' },
}));
jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn() }), {
  virtual: true,
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AnexoAgendamentoService } from '@/modules/anexo-agendamento/anexo-agendamento.service';

describe('AnexoAgendamentoService', () => {
  const possuiAgendamentoDoSalao = jest.fn();
  const listarInternos = jest.fn();
  const criarInterno = jest.fn();
  const buscarInterno = jest.fn();
  const removerInterno = jest.fn();
  const possuiAgendamentoDaCliente = jest.fn();
  const listarReferenciasDaCliente = jest.fn();
  const criarReferencia = jest.fn();
  const buscarReferenciaDaCliente = jest.fn();
  const enviarAnexo = jest.fn();
  const obterObjeto = jest.fn();
  const repository = {
    possuiAgendamentoDoSalao,
    listarInternos,
    criarInterno,
    buscarInterno,
    removerInterno,
    possuiAgendamentoDaCliente,
    listarReferenciasDaCliente,
    criarReferencia,
    buscarReferenciaDaCliente,
  };
  const arquivoService = { enviarAnexo, obterObjeto };
  const resolverSessaoPublica = jest.fn();
  const clienteService = {
    resolverSessaoPublica,
    buscarFicha: jest.fn(),
  };
  const service = new AnexoAgendamentoService(
    repository as never,
    arquivoService as never,
    clienteService as never,
  );
  const escopo = {
    agendamentoId: 'e403bf07-8608-48c4-bf3e-9b3073468f0a',
    salaoId: 'dd021750-136f-45bd-8d39-46e514789522',
  };
  const arquivo = {
    buffer: Buffer.from('imagem'),
    mimeType: 'image/png',
    tamanhoBytes: 6,
  };
  const arquivoPersistido = {
    id: '817059c1-426f-49a1-b52f-20c727f21ad8',
    salao_id: escopo.salaoId,
    url_storage: 'chave',
    mime_type: 'image/png',
    tamanho_bytes: 6,
    uploaded_em: new Date('2026-10-06T12:00:00.000Z'),
  };
  const anexo = {
    id: 'bffde932-f68d-40f5-bf73-0508e06d498e',
    agendamento_id: escopo.agendamentoId,
    arquivo_id: arquivoPersistido.id,
    visibilidade: 'interna_do_salao' as const,
    criado_em: new Date('2026-10-06T12:01:00.000Z'),
    arquivo: arquivoPersistido,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    possuiAgendamentoDoSalao.mockResolvedValue(true);
    enviarAnexo.mockResolvedValue(arquivoPersistido);
    criarInterno.mockResolvedValue({ status: 'criado', anexo });
    resolverSessaoPublica.mockResolvedValue({ id: 'cliente-ana' });
    possuiAgendamentoDaCliente.mockResolvedValue(true);
  });

  it('lista somente os anexos internos do agendamento no tenant informado', async () => {
    listarInternos.mockResolvedValue([anexo]);

    await expect(service.listarInternos(escopo)).resolves.toEqual([anexo]);

    expect(possuiAgendamentoDoSalao).toHaveBeenCalledWith(escopo);
    expect(listarInternos).toHaveBeenCalledWith(escopo);
  });

  it('impede o upload quando o agendamento nao pertence ao salao', async () => {
    possuiAgendamentoDoSalao.mockResolvedValue(false);

    await expect(service.criarInterno({ ...escopo, arquivo })).rejects.toThrow(
      new NotFoundException('Agendamento não encontrado.'),
    );
    expect(enviarAnexo).not.toHaveBeenCalled();
  });

  it('cria o anexo com arquivo pertencente ao mesmo tenant', async () => {
    await expect(service.criarInterno({ ...escopo, arquivo })).resolves.toEqual(
      anexo,
    );
    expect(enviarAnexo).toHaveBeenCalledWith({
      arquivo,
      salaoId: escopo.salaoId,
    });
    expect(criarInterno).toHaveBeenCalledWith({
      ...escopo,
      arquivo: arquivoPersistido,
    });
  });

  it('bloqueia o quarto anexo interno', async () => {
    criarInterno.mockResolvedValue({ status: 'limite_atingido' });

    await expect(service.criarInterno({ ...escopo, arquivo })).rejects.toThrow(
      new BadRequestException(
        'Cada agendamento aceita no máximo 3 anexos internos.',
      ),
    );
  });

  it('nao abre conteudo de anexo fora do escopo do tenant', async () => {
    buscarInterno.mockResolvedValue(undefined);

    await expect(
      service.obterConteudo({ ...escopo, id: anexo.id }),
    ).rejects.toThrow(new NotFoundException('Anexo não encontrado.'));
    expect(obterObjeto).not.toHaveBeenCalled();
  });

  it('abre o conteudo somente depois de localizar o anexo interno no tenant', async () => {
    const objeto = {
      body: Buffer.from('imagem'),
      contentType: 'image/png',
      contentLength: 6,
    };
    buscarInterno.mockResolvedValue(anexo);
    obterObjeto.mockResolvedValue(objeto);

    await expect(
      service.obterConteudo({ ...escopo, id: anexo.id }),
    ).resolves.toEqual({ anexo, objeto });

    expect(buscarInterno).toHaveBeenCalledWith({ ...escopo, id: anexo.id });
    expect(obterObjeto).toHaveBeenCalledWith(anexo.arquivo.url_storage);
  });

  it('remove somente depois de localizar o anexo no escopo do tenant', async () => {
    buscarInterno.mockResolvedValue(anexo);

    await service.removerInterno({ ...escopo, id: anexo.id });

    expect(buscarInterno).toHaveBeenCalledWith({ ...escopo, id: anexo.id });
    expect(removerInterno).toHaveBeenCalledWith({ ...escopo, id: anexo.id });
  });

  it('recusa acesso público quando a sessão pertence a outra cliente', async () => {
    possuiAgendamentoDaCliente.mockResolvedValue(false);

    await expect(
      service.resolverEscopoDaCliente({
        ...escopo,
        credencial: 'credencial-da-cliente',
      }),
    ).rejects.toThrow(new NotFoundException('Agendamento não encontrado.'));
  });

  it('cria referência pública somente no agendamento da cliente', async () => {
    const referencia = {
      ...anexo,
      visibilidade: 'publica_para_cliente' as const,
    };
    criarReferencia.mockResolvedValue({ status: 'criado', anexo: referencia });

    await expect(
      service.criarReferencia({
        ...escopo,
        clienteId: 'cliente-ana',
        arquivo,
      }),
    ).resolves.toEqual(referencia);

    expect(criarReferencia).toHaveBeenCalledWith({
      ...escopo,
      clienteId: 'cliente-ana',
      arquivo: arquivoPersistido,
    });
  });

  it('não abre referência pública pertencente a outra cliente', async () => {
    buscarReferenciaDaCliente.mockResolvedValue(undefined);

    await expect(
      service.obterConteudoReferenciaDaCliente({
        ...escopo,
        clienteId: 'cliente-ana',
        id: anexo.id,
      }),
    ).rejects.toThrow(new NotFoundException('Anexo não encontrado.'));

    expect(obterObjeto).not.toHaveBeenCalled();
  });
});
