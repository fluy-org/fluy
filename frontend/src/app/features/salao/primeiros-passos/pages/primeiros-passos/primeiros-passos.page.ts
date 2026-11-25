import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonProgressBar,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  checkmarkCircle,
  checkmarkDoneOutline,
  ellipseOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { LinkPublicoComponent } from '@app/shared/components/link-publico/link-publico.component';
import { NavegacaoPainelComponent } from '@app/shared/components/navegacao-painel/navegacao-painel.component';
import { PrimeirosPassosService } from '@app/features/salao/primeiros-passos/services/primeiros-passos.service';

@Component({
  selector: 'app-primeiros-passos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    NavegacaoPainelComponent,
    LinkPublicoComponent,
    RouterLink,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonProgressBar,
    IonSpinner,
    IonText,
  ],
  templateUrl: './primeiros-passos.page.html',
  styleUrls: ['./primeiros-passos.page.scss'],
})
export class PrimeirosPassosPage implements OnInit {
  private readonly primeirosPassosService = inject(PrimeirosPassosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly setup = this.primeirosPassosService.setup;
  readonly carregando = this.primeirosPassosService.carregando;
  readonly erro = this.primeirosPassosService.erro;
  readonly salaoCriadoRecentemente = signal(false);

  readonly totalConcluidos = computed(() => {
    const s = this.setup();
    if (!s) return 0;
    let count = 0;
    if (s.tem_procedimento_ativo) count++;
    if (s.tem_disponibilidade) count++;
    if (s.tem_pix) count++;
    if (s.tem_procedimento_ativo && s.tem_disponibilidade && s.subdominio) count++;
    return count;
  });

  readonly progressoPercentual = computed(() => {
    return this.totalConcluidos() / 4;
  });

  constructor() {
    addIcons({
      checkmarkCircle,
      ellipseOutline,
      arrowForwardOutline,
      sparklesOutline,
    });
  }

  ngOnInit(): void {
    const sucesso = this.route.snapshot.queryParamMap.get('sucesso');
    if (sucesso === 'true') {
      this.salaoCriadoRecentemente.set(true);
    }
    void this.primeirosPassosService.carregar().catch(() => {});
  }

  ionViewDidEnter(): void {
    void this.primeirosPassosService.carregar().catch(() => {});
  }

  recarregar(): void {
    void this.primeirosPassosService.carregar().catch(() => {});
  }

  irParaProcedimentos(): void {
    void this.router.navigate(['/painel/procedimentos'], {
      queryParams: { novo: 'true' },
    });
  }

  irParaDisponibilidade(): void {
    void this.router.navigate(['/painel/disponibilidade']);
  }

  irParaConfiguracao(): void {
    void this.router.navigate(['/painel/configuracao']);
  }
}
