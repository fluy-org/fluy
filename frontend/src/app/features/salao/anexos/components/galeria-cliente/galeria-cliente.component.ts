import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import type { VisibilidadeAnexo } from '@fluy/schema';
import { IonButton, IonImg, IonSpinner, IonText } from '@ionic/angular/standalone';
import type { AnexoAgendamentoVisual } from '@app/features/salao/anexos/contracts';
import { AnexosAgendamentoService } from '@app/features/salao/anexos/services/anexos-agendamento.service';

@Component({
  selector: 'app-galeria-cliente',
  templateUrl: './galeria-cliente.component.html',
  styleUrls: ['./galeria-cliente.component.scss'],
  standalone: true,
  imports: [IonButton, IonImg, IonSpinner, IonText],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaleriaClienteComponent implements OnInit, OnDestroy {
  private readonly anexosService = inject(AnexosAgendamentoService);
  private destruido = false;

  readonly clienteId = input.required<string>();
  readonly titulo = input.required<string>();
  readonly mensagemVazia = input.required<string>();
  readonly visibilidade = input.required<VisibilidadeAnexo>();
  readonly itens = signal<AnexoAgendamentoVisual[]>([]);
  readonly proximoCursor = signal<string | null>(null);
  readonly carregando = signal(true);
  readonly carregandoMais = signal(false);
  readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    void this.carregar();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.revogarUrls();
  }

  recarregar(): void {
    void this.carregar();
  }

  carregarMais(): void {
    const cursor = this.proximoCursor();
    if (cursor) void this.carregar(cursor);
  }

  private async carregar(cursor?: string): Promise<void> {
    cursor ? this.carregandoMais.set(true) : this.carregando.set(true);
    this.erro.set(null);

    try {
      const pagina = await this.anexosService.getGaleriaCliente({
        clienteId: this.clienteId(),
        cursor,
        visibilidade: this.visibilidade(),
      });
      const novos = await Promise.all(
        pagina.itens.map(async (anexo) => {
          const conteudo = await this.anexosService.getConteudoGaleriaCliente({
            clienteId: this.clienteId(),
            id: anexo.id,
          });

          return { ...anexo, url: URL.createObjectURL(conteudo) };
        }),
      );

      if (this.destruido) {
        novos.forEach(({ url }) => URL.revokeObjectURL(url));
        return;
      }

      if (!cursor) this.revogarUrls();
      this.itens.update((atuais) => (cursor ? [...atuais, ...novos] : novos));
      this.proximoCursor.set(pagina.proximo_cursor);
    } catch {
      this.erro.set('Não foi possível carregar esta galeria.');
    } finally {
      this.carregando.set(false);
      this.carregandoMais.set(false);
    }
  }

  private revogarUrls(): void {
    this.itens().forEach(({ url }) => URL.revokeObjectURL(url));
    this.itens.set([]);
  }
}
