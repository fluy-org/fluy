import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkOutline,
  copyOutline,
  shareSocialOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-link-publico',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon, IonSpinner, IonText],
  templateUrl: './link-publico.component.html',
  styleUrls: ['./link-publico.component.scss'],
})
export class LinkPublicoComponent {
  readonly subdominio = input<string | null | undefined>();
  readonly urlManual = input<string | null | undefined>(undefined, {
    alias: 'url',
  });
  readonly titulo = input<string>('Página de agendamento');
  readonly subtitulo = input<string>(
    'Compartilhe este link para suas clientes agendarem diretamente com o seu salão.',
  );
  readonly compacto = input<boolean>(false);

  readonly copiando = signal(false);
  readonly copiado = signal(false);
  readonly mensagemFeedback = signal<string | null>(null);
  readonly erroFeedback = signal<string | null>(null);

  readonly urlFinal = computed(() => {
    const url = this.urlManual();
    if (url) {
      return url;
    }

    const sub = this.subdominio();
    if (!sub) {
      return '';
    }

    return new URL(
      `/s/${encodeURIComponent(sub)}`,
      window.location.origin,
    ).toString();
  });

  constructor() {
    addIcons({
      copyOutline,
      checkmarkOutline,
      shareSocialOutline,
    });
  }

  async copiar(): Promise<void> {
    const url = this.urlFinal();
    if (!url || this.copiando()) {
      return;
    }

    this.copiando.set(true);
    this.erroFeedback.set(null);

    try {
      await navigator.clipboard.writeText(url);
      this.copiado.set(true);
      this.mensagemFeedback.set('Link copiado com sucesso!');
      setTimeout(() => {
        this.copiado.set(false);
        this.mensagemFeedback.set(null);
      }, 3000);
    } catch {
      this.erroFeedback.set(
        'Não foi possível copiar automaticamente. Selecione o link e copie manualmente.',
      );
    } finally {
      this.copiando.set(false);
    }
  }

  async compartilhar(): Promise<void> {
    const url = this.urlFinal();
    if (!url) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Agendamento online',
          text: 'Agende seu horário comigo no salão:',
          url,
        });
        return;
      } catch (error: unknown) {
        if ((error as Error)?.name === 'AbortError') {
          return;
        }
      }
    }

    this.abrirWhatsapp(url);
  }

  private abrirWhatsapp(url: string): void {
    const texto = encodeURIComponent(`Agende seu horário comigo no salão: ${url}`);
    const whatsappUrl = `https://wa.me/?text=${texto}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}
