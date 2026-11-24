import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AvisoRepository } from '@/modules/aviso/aviso.repository';
import { TAMANHO_PAGINA_AVISOS } from '@/modules/aviso/aviso-data';
import type {
  AvisoPersistido,
  BuscarAvisoClienteInput,
  BuscarAvisoUsuarioSalaoInput,
  CriarAvisoClienteInput,
  CriarAvisoSalaoInput,
  CriarAvisoUsuarioSalaoInput,
  ListaAvisosResultado,
  ListarAvisosClienteInput,
  ListarAvisosUsuarioSalaoInput,
} from '@/modules/aviso/contracts';
import { ClienteService } from '@/modules/cliente/cliente.service';
import {
  decodificarCursorPagina,
  montarPagina,
} from '@/shared/paginacao/paginacao.utils';

@Injectable()
export class AvisoService {
  constructor(
    private readonly avisoRepository: AvisoRepository,
    private readonly clienteService: ClienteService,
  ) {}

  async listarCliente({
    cursor,
    ...escopo
  }: ListarAvisosClienteInput): Promise<ListaAvisosResultado> {
    const offset = this.resolverOffset(cursor);
    const linhas = await this.avisoRepository.listarCliente({
      ...escopo,
      offset,
      limite: TAMANHO_PAGINA_AVISOS + 1,
    });

    return montarPagina({
      linhas,
      offset,
      tamanho: TAMANHO_PAGINA_AVISOS,
    });
  }

  async listarPublicamente({
    salaoId,
    credencial,
    cursor,
  }: {
    salaoId: string;
    credencial: string;
    cursor?: string;
  }): Promise<ListaAvisosResultado> {
    const sessao = await this.resolverSessao({ salaoId, credencial });

    if (sessao.verificada === false) {
      return {
        itens: [],
        proximoCursor: null,
      };
    }

    const clienteId = sessao.cliente?.id ?? (sessao as any).id;

    return this.listarCliente({
      salaoId,
      clienteId,
      cursor,
    });
  }

  async listarUsuarioSalao({
    cursor,
    ...escopo
  }: ListarAvisosUsuarioSalaoInput): Promise<ListaAvisosResultado> {
    const offset = this.resolverOffset(cursor);
    const linhas = await this.avisoRepository.listarUsuarioSalao({
      ...escopo,
      offset,
      limite: TAMANHO_PAGINA_AVISOS + 1,
    });

    return montarPagina({
      linhas,
      offset,
      tamanho: TAMANHO_PAGINA_AVISOS,
    });
  }

  async reconhecerCliente(
    input: BuscarAvisoClienteInput,
  ): Promise<AvisoPersistido> {
    const aviso = await this.avisoRepository.buscarCliente(input);

    if (!aviso) {
      throw new NotFoundException('Aviso não encontrado.');
    }

    if (aviso.reconhecido_em) {
      return aviso;
    }

    return (
      (await this.avisoRepository.reconhecerCliente(input)) ??
      (await this.avisoRepository.buscarCliente(input)) ??
      aviso
    );
  }

  async reconhecerPublicamente({
    id,
    salaoId,
    credencial,
  }: {
    id: string;
    salaoId: string;
    credencial: string;
  }): Promise<AvisoPersistido> {
    const sessao = await this.resolverSessao({ salaoId, credencial });

    if (sessao.verificada === false) {
      throw new NotFoundException('Aviso não encontrado.');
    }

    const clienteId = sessao.cliente?.id ?? (sessao as any).id;

    return this.reconhecerCliente({
      id,
      salaoId,
      clienteId,
    });
  }

  async reconhecerUsuarioSalao(
    input: BuscarAvisoUsuarioSalaoInput,
  ): Promise<AvisoPersistido> {
    const aviso = await this.avisoRepository.buscarUsuarioSalao(input);

    if (!aviso) {
      throw new NotFoundException('Aviso não encontrado.');
    }

    if (aviso.reconhecido_em) {
      return aviso;
    }

    return (
      (await this.avisoRepository.reconhecerUsuarioSalao(input)) ??
      (await this.avisoRepository.buscarUsuarioSalao(input)) ??
      aviso
    );
  }

  async criarParaCliente(
    input: CriarAvisoClienteInput,
  ): Promise<AvisoPersistido> {
    await this.clienteService.buscarPorId({
      id: input.clienteId,
      salaoId: input.salaoId,
    });

    return this.avisoRepository.criarParaCliente(input);
  }

  async criarParaUsuarioSalao(
    input: CriarAvisoUsuarioSalaoInput,
  ): Promise<AvisoPersistido> {
    const pertenceAoSalao = await this.avisoRepository.possuiUsuarioSalao({
      salaoId: input.salaoId,
      usuarioSalaoId: input.usuarioSalaoId,
    });

    if (!pertenceAoSalao) {
      throw new NotFoundException('Usuário do salão não encontrado.');
    }

    return this.avisoRepository.criarParaUsuarioSalao(input);
  }

  criarParaSalao(input: CriarAvisoSalaoInput): Promise<AvisoPersistido[]> {
    return this.avisoRepository.criarParaSalao(input);
  }

  private resolverOffset(cursor: string | undefined): number {
    if (cursor === undefined) {
      return 0;
    }

    const offset = decodificarCursorPagina({ cursor });

    if (offset === undefined) {
      throw new BadRequestException('Cursor de paginação inválido.');
    }

    return offset;
  }

  private async resolverSessao({
    salaoId,
    credencial,
  }: {
    salaoId: string;
    credencial: string;
  }) {
    const sessao = await this.clienteService.resolverSessaoPublica({
      salaoId,
      credencial,
    });

    if (!sessao) {
      throw new NotFoundException('Sessão da cliente não encontrada.');
    }

    return sessao;
  }

  private async resolverCliente({
    salaoId,
    credencial,
  }: {
    salaoId: string;
    credencial: string;
  }) {
    const sessao = await this.resolverSessao({ salaoId, credencial });
    return sessao.cliente;
  }
}
