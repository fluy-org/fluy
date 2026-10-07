import { and, desc, eq, isNull } from 'drizzle-orm';
import { aviso, usuarioSalao } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type {
  AvisoPersistido,
  BuscarAvisoClienteInput,
  BuscarAvisoUsuarioSalaoInput,
  CriarAvisoClienteInput,
  CriarAvisoSalaoInput,
  CriarAvisoUsuarioSalaoInput,
  EscopoAvisoUsuarioSalao,
  ListarAvisosClientePersistenciaInput,
  ListarAvisosUsuarioSalaoPersistenciaInput,
} from '@/modules/aviso/contracts';

@Injectable()
export class AvisoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  listarCliente(
    input: ListarAvisosClientePersistenciaInput,
  ): Promise<AvisoPersistido[]> {
    return this.database
      .select()
      .from(aviso)
      .where(
        and(
          eq(aviso.salao_id, input.salaoId),
          eq(aviso.cliente_id, input.clienteId),
          isNull(aviso.reconhecido_em),
        ),
      )
      .orderBy(desc(aviso.criado_em), desc(aviso.id))
      .limit(input.limite)
      .offset(input.offset);
  }

  listarUsuarioSalao(
    input: ListarAvisosUsuarioSalaoPersistenciaInput,
  ): Promise<AvisoPersistido[]> {
    return this.database
      .select()
      .from(aviso)
      .where(
        and(
          eq(aviso.salao_id, input.salaoId),
          eq(aviso.usuario_salao_id, input.usuarioSalaoId),
          isNull(aviso.reconhecido_em),
        ),
      )
      .orderBy(desc(aviso.criado_em), desc(aviso.id))
      .limit(input.limite)
      .offset(input.offset);
  }

  buscarCliente(
    input: BuscarAvisoClienteInput,
  ): Promise<AvisoPersistido | undefined> {
    return this.buscarPorEscopo(
      and(
        eq(aviso.id, input.id),
        eq(aviso.salao_id, input.salaoId),
        eq(aviso.cliente_id, input.clienteId),
      ),
    );
  }

  buscarUsuarioSalao(
    input: BuscarAvisoUsuarioSalaoInput,
  ): Promise<AvisoPersistido | undefined> {
    return this.buscarPorEscopo(
      and(
        eq(aviso.id, input.id),
        eq(aviso.salao_id, input.salaoId),
        eq(aviso.usuario_salao_id, input.usuarioSalaoId),
      ),
    );
  }

  reconhecerCliente({
    id,
    salaoId,
    clienteId,
  }: BuscarAvisoClienteInput): Promise<AvisoPersistido | undefined> {
    return this.reconhecer(
      and(
        eq(aviso.id, id),
        eq(aviso.salao_id, salaoId),
        eq(aviso.cliente_id, clienteId),
        isNull(aviso.reconhecido_em),
      ),
    );
  }

  reconhecerUsuarioSalao({
    id,
    salaoId,
    usuarioSalaoId,
  }: BuscarAvisoUsuarioSalaoInput): Promise<AvisoPersistido | undefined> {
    return this.reconhecer(
      and(
        eq(aviso.id, id),
        eq(aviso.salao_id, salaoId),
        eq(aviso.usuario_salao_id, usuarioSalaoId),
        isNull(aviso.reconhecido_em),
      ),
    );
  }

  async criarParaCliente(
    input: CriarAvisoClienteInput,
  ): Promise<AvisoPersistido> {
    const avisos = await this.database
      .insert(aviso)
      .values({
        salao_id: input.salaoId,
        cliente_id: input.clienteId,
        agendamento_id: input.agendamentoId,
        lembrete_id: input.lembreteId,
        tipo: input.tipo,
        titulo: input.titulo,
        mensagem: input.mensagem,
      })
      .returning();

    return avisos[0];
  }

  async criarParaUsuarioSalao(
    input: CriarAvisoUsuarioSalaoInput,
  ): Promise<AvisoPersistido> {
    const avisos = await this.database
      .insert(aviso)
      .values({
        salao_id: input.salaoId,
        usuario_salao_id: input.usuarioSalaoId,
        agendamento_id: input.agendamentoId,
        lembrete_id: input.lembreteId,
        tipo: input.tipo,
        titulo: input.titulo,
        mensagem: input.mensagem,
      })
      .returning();

    return avisos[0];
  }

  async criarParaSalao(
    input: CriarAvisoSalaoInput,
  ): Promise<AvisoPersistido[]> {
    const usuarios = await this.database
      .select({ id: usuarioSalao.id })
      .from(usuarioSalao)
      .where(eq(usuarioSalao.salao_id, input.salaoId));

    if (usuarios.length === 0) {
      return [];
    }

    return this.database
      .insert(aviso)
      .values(
        usuarios.map(({ id }) => ({
          salao_id: input.salaoId,
          usuario_salao_id: id,
          agendamento_id: input.agendamentoId,
          lembrete_id: input.lembreteId,
          tipo: input.tipo,
          titulo: input.titulo,
          mensagem: input.mensagem,
        })),
      )
      .onConflictDoNothing()
      .returning();
  }

  async possuiUsuarioSalao({
    salaoId,
    usuarioSalaoId,
  }: EscopoAvisoUsuarioSalao): Promise<boolean> {
    const resultados = await this.database
      .select({ id: usuarioSalao.id })
      .from(usuarioSalao)
      .where(
        and(
          eq(usuarioSalao.id, usuarioSalaoId),
          eq(usuarioSalao.salao_id, salaoId),
        ),
      )
      .limit(1);

    return resultados.length > 0;
  }

  private async buscarPorEscopo(
    filtro: ReturnType<typeof and>,
  ): Promise<AvisoPersistido | undefined> {
    const resultados = await this.database
      .select()
      .from(aviso)
      .where(filtro)
      .limit(1);

    return resultados[0];
  }

  private async reconhecer(
    filtro: ReturnType<typeof and>,
  ): Promise<AvisoPersistido | undefined> {
    const resultados = await this.database
      .update(aviso)
      .set({ reconhecido_em: new Date() })
      .where(filtro)
      .returning();

    return resultados[0];
  }
}
