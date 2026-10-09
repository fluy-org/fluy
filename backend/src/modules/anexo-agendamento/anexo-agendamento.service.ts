import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AnexoAgendamentoRepository } from '@/modules/anexo-agendamento/anexo-agendamento.repository';
import {
  LIMITE_ANEXOS_INTERNOS_POR_AGENDAMENTO,
  LIMITE_REFERENCIAS_POR_AGENDAMENTO,
  TAMANHO_PAGINA_ANEXOS_CLIENTE,
} from '@/modules/anexo-agendamento/anexo-agendamento-data';
import type {
  BuscarAnexoDaClientePeloSalaoInput,
  BuscarAnexoInternoInput,
  BuscarReferenciaDaClienteInput,
  BuscarReferenciaDoSalaoInput,
  CriarAnexoInternoInput,
  CriarReferenciaInput,
  EscopoAgendamentoDaCliente,
  EscopoAgendamentoDoSalao,
  ListaAnexosClienteResultado,
  ListarAnexosClienteInput,
} from '@/modules/anexo-agendamento/contracts';
import { ArquivoService } from '@/modules/arquivo/arquivo.service';
import { ClienteService } from '@/modules/cliente/cliente.service';
import {
  decodificarCursorPagina,
  montarPagina,
} from '@/shared/paginacao/paginacao.utils';

@Injectable()
export class AnexoAgendamentoService {
  constructor(
    private readonly anexoRepository: AnexoAgendamentoRepository,
    private readonly arquivoService: ArquivoService,
    private readonly clienteService: ClienteService,
  ) {}

  async listarInternos(input: EscopoAgendamentoDoSalao) {
    await this.garantirAgendamentoDoSalao(input);
    return this.anexoRepository.listarInternos(input);
  }

  async listarReferenciasDoSalao(input: EscopoAgendamentoDoSalao) {
    await this.garantirAgendamentoDoSalao(input);
    return this.anexoRepository.listarReferenciasDoSalao(input);
  }

  async listarReferenciasDaCliente(
    input: EscopoAgendamentoDaCliente,
  ) {
    return this.anexoRepository.listarReferenciasDaCliente(input);
  }

  async listarDaCliente({
    cursor,
    ...escopo
  }: ListarAnexosClienteInput): Promise<ListaAnexosClienteResultado> {
    await this.clienteService.buscarFicha({
      id: escopo.clienteId,
      salaoId: escopo.salaoId,
    });
    const offset = this.resolverOffset(cursor);
    const linhas = await this.anexoRepository.listarDaCliente({
      ...escopo,
      offset,
      limite: TAMANHO_PAGINA_ANEXOS_CLIENTE + 1,
    });

    return montarPagina({
      linhas,
      offset,
      tamanho: TAMANHO_PAGINA_ANEXOS_CLIENTE,
    });
  }

  async resolverEscopoDaCliente({
    agendamentoId,
    credencial,
    salaoId,
  }: {
    agendamentoId: string;
    credencial: string;
    salaoId: string;
  }): Promise<EscopoAgendamentoDaCliente> {
    const cliente = await this.clienteService.resolverSessaoPublica({
      credencial,
      salaoId,
    });

    if (!cliente) {
      throw new NotFoundException('Sessão da cliente não encontrada.');
    }

    const escopo = { agendamentoId, clienteId: cliente.id, salaoId };
    if (!(await this.anexoRepository.possuiAgendamentoDaCliente(escopo))) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    return escopo;
  }

  async criarInterno({
    arquivo,
    agendamentoId,
    salaoId,
  }: CriarAnexoInternoInput) {
    await this.garantirAgendamentoDoSalao({ agendamentoId, salaoId });

    const arquivoPersistido = await this.arquivoService.enviarAnexo({
      arquivo,
      salaoId,
    });
    const resultado = await this.anexoRepository.criarInterno({
      agendamentoId,
      salaoId,
      arquivo: arquivoPersistido,
    });

    if (resultado.status === 'limite_atingido') {
      throw new BadRequestException(
        `Cada agendamento aceita no máximo ${LIMITE_ANEXOS_INTERNOS_POR_AGENDAMENTO} anexos internos.`,
      );
    }

    if (resultado.status === 'agendamento_nao_encontrado') {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (resultado.status === 'arquivo_nao_encontrado') {
      throw new BadRequestException(
        'O arquivo informado não pertence ao salão atual.',
      );
    }

    return resultado.anexo;
  }

  async criarReferencia(input: CriarReferenciaInput) {
    const arquivoPersistido = await this.arquivoService.enviarAnexo({
      arquivo: input.arquivo,
      salaoId: input.salaoId,
    });
    const resultado = await this.anexoRepository.criarReferencia({
      ...input,
      arquivo: arquivoPersistido,
    });

    if (resultado.status === 'limite_atingido') {
      throw new BadRequestException(
        `Cada agendamento aceita no máximo ${LIMITE_REFERENCIAS_POR_AGENDAMENTO} imagens de referência.`,
      );
    }

    if (resultado.status === 'agendamento_nao_encontrado') {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (resultado.status === 'arquivo_nao_encontrado') {
      throw new BadRequestException(
        'O arquivo informado não pertence ao salão atual.',
      );
    }

    return resultado.anexo;
  }

  async obterConteudo(input: BuscarAnexoInternoInput) {
    const anexo = await this.buscarInterno(input);
    const objeto = await this.arquivoService.obterObjeto(
      anexo.arquivo.url_storage,
    );

    return { anexo, objeto };
  }

  async obterConteudoReferenciaDaCliente(
    input: BuscarReferenciaDaClienteInput,
  ) {
    const anexo = await this.anexoRepository.buscarReferenciaDaCliente(input);
    return this.obterConteudoDoAnexo(anexo);
  }

  async obterConteudoReferenciaDoSalao(input: BuscarReferenciaDoSalaoInput) {
    const anexo = await this.anexoRepository.buscarReferenciaDoSalao(input);
    return this.obterConteudoDoAnexo(anexo);
  }

  async obterConteudoDaClientePeloSalao(
    input: BuscarAnexoDaClientePeloSalaoInput,
  ) {
    const anexo = await this.anexoRepository.buscarDaClientePeloSalao(input);
    return this.obterConteudoDoAnexo(anexo);
  }

  async removerInterno(input: BuscarAnexoInternoInput): Promise<void> {
    await this.buscarInterno(input);
    await this.anexoRepository.removerInterno(input);
  }

  private async buscarInterno(input: BuscarAnexoInternoInput) {
    const anexo = await this.anexoRepository.buscarInterno(input);

    if (!anexo) {
      throw new NotFoundException('Anexo não encontrado.');
    }

    return anexo;
  }

  private async obterConteudoDoAnexo(
    anexo: Awaited<ReturnType<AnexoAgendamentoRepository['buscarInterno']>>,
  ) {
    if (!anexo) {
      throw new NotFoundException('Anexo não encontrado.');
    }

    const objeto = await this.arquivoService.obterObjeto(
      anexo.arquivo.url_storage,
    );

    return { anexo, objeto };
  }

  private async garantirAgendamentoDoSalao(
    input: EscopoAgendamentoDoSalao,
  ): Promise<void> {
    const existe = await this.anexoRepository.possuiAgendamentoDoSalao(input);

    if (!existe) {
      throw new NotFoundException('Agendamento não encontrado.');
    }
  }

  private resolverOffset(cursor: string | undefined): number {
    if (cursor === undefined) return 0;

    const offset = decodificarCursorPagina({ cursor });

    if (offset === undefined) {
      throw new BadRequestException('Cursor de paginação inválido.');
    }

    return offset;
  }
}
