import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AtualizarProcedimentoDto,
  CriarProcedimentoDto,
  ProcedimentoResponseDto,
  UploadArquivoResponseDto,
} from '@fluy/schema';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProcedimentosService {
  private http = inject(HttpClient);
  private readonly _procedimentos = signal<ProcedimentoResponseDto[]>([]);

  readonly procedimentos = this._procedimentos.asReadonly();

  async getLista(): Promise<ProcedimentoResponseDto[]> {
    const procedimentos = await firstValueFrom(
      this.http.get<ProcedimentoResponseDto[]>('/procedimentos'),
    );

    this._procedimentos.set(procedimentos);
    return procedimentos;
  }

  getEntidade(id: string): ProcedimentoResponseDto | undefined {
    // A API ainda nao possui GET /procedimentos/:id; consulta o estado carregado.
    return this._procedimentos().find((procedimento) => procedimento.id === id);
  }

  async enviarImagem(arquivo: File): Promise<UploadArquivoResponseDto> {
    const formulario = new FormData();

    // O nome arquivo precisa corresponder ao campo esperado pelo backend.
    formulario.append('arquivo', arquivo);

    return firstValueFrom(
      this.http.post<UploadArquivoResponseDto>('/arquivos', formulario),
    );
  }

  async removerImagem(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`/procedimentos/${id}/imagem`),
    );

    // O endpoint retorna 204; atualiza apenas a imagem no estado ja carregado.
    this._procedimentos.update((procedimentos) =>
      procedimentos.map((procedimento) =>
        procedimento.id === id
          ? { ...procedimento, imagem_url: null }
          : procedimento,
      ),
    );
  }

  async setEntidade(
    dados: CriarProcedimentoDto,
  ): Promise<ProcedimentoResponseDto> {
    const procedimentoCriado = await firstValueFrom(
      this.http.post<ProcedimentoResponseDto>('/procedimentos', dados),
    );

    // Usa o retorno completo do backend para atualizar a lista sem outro GET.
    this._procedimentos.update((procedimentos) => [
      ...procedimentos,
      procedimentoCriado,
    ]);

    return procedimentoCriado;
  }

  async updateEntidade(
    id: string,
    dados: AtualizarProcedimentoDto,
  ): Promise<ProcedimentoResponseDto> {
    const procedimentoAtualizado = await firstValueFrom(
      this.http.put<ProcedimentoResponseDto>(`/procedimentos/${id}`, dados),
    );

    this.atualizarNaLista(procedimentoAtualizado);
    return procedimentoAtualizado;
  }

  async deleteEntidade(id: string): Promise<ProcedimentoResponseDto> {
    const procedimentoInativado = await firstValueFrom(
      this.http.delete<ProcedimentoResponseDto>(`/procedimentos/${id}`),
    );

    // O DELETE do dominio apenas inativa; o registro permanece visivel na lista.
    this.atualizarNaLista(procedimentoInativado);
    return procedimentoInativado;
  }

  private atualizarNaLista(procedimentoAtualizado: ProcedimentoResponseDto): void {
    this._procedimentos.update((procedimentos) =>
      procedimentos.map((procedimento) =>
        procedimento.id === procedimentoAtualizado.id
          ? procedimentoAtualizado
          : procedimento,
      ),
    );
  }
}
