import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { IonButton, IonImg, IonSpinner, IonText } from '@ionic/angular/standalone';
import type { AnexoAgendamentoVisual } from '@app/features/salao/anexos/contracts';
import { AnexosAgendamentoService } from '@app/features/salao/anexos/services/anexos-agendamento.service';

@Component({
  selector: 'app-secao-referencias',
  templateUrl: './secao-referencias.component.html',
  styleUrls: ['./secao-referencias.component.scss'],
  standalone: true,
  imports: [IonButton, IonImg, IonSpinner, IonText],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecaoReferenciasComponent implements OnInit, OnDestroy {
  private readonly anexosService = inject(AnexosAgendamentoService);
  private destruido = false;

  readonly agendamentoId = input.required<string>();
  readonly referencias = signal<AnexoAgendamentoVisual[]>([]);
  readonly carregando = signal(true);
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

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set(null);

    try {
      const resposta = await this.anexosService.getReferencias(
        this.agendamentoId(),
      );
      const referencias = await Promise.all(
        resposta.anexos.map(async (anexo) => {
          const conteudo = await this.anexosService.getConteudoReferencia({
            agendamentoId: this.agendamentoId(),
            id: anexo.id,
          });

          return { ...anexo, url: URL.createObjectURL(conteudo) };
        }),
      );

      if (this.destruido) {
        referencias.forEach(({ url }) => URL.revokeObjectURL(url));
        return;
      }

      this.revogarUrls();
      this.referencias.set(referencias);
    } catch {
      this.erro.set('Não foi possível carregar as imagens de referência.');
    } finally {
      this.carregando.set(false);
    }
  }

  private revogarUrls(): void {
    this.referencias().forEach(({ url }) => URL.revokeObjectURL(url));
    this.referencias.set([]);
  }
}
