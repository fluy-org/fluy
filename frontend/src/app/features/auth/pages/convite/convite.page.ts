import { AfterViewInit, Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '@app/core/services/auth/auth.service';
import { TAMANHO_MINIMO_SENHA } from '@app/features/auth/auth.data';
import {
  EstadoErroConvite,
  identificarEstadoErroConvite,
  identificarEstadoTerminalConvite,
  identificarMensagemErroCadastroConvite,
} from './convite-page.utils';

type EstadoConvite =
  | 'cadastro'
  | 'carregando'
  | 'sem_convite'
  | 'sessao_ativa'
  | EstadoErroConvite;

interface MensagemConvite {
  titulo: string;
  descricao: string;
}

const MENSAGENS_CONVITE: Record<
  Exclude<EstadoConvite, 'cadastro' | 'carregando'>,
  MensagemConvite
> = {
  sem_convite: {
    titulo: 'Cadastro somente por convite',
    descricao:
      'Use o link exclusivo enviado pelo Fluy. Se você já possui uma conta, entre normalmente.',
  },
  sessao_ativa: {
    titulo: 'Você já está conectado',
    descricao:
      'Abra este convite depois de sair da conta atual. Isso evita vincular o convite ao e-mail errado.',
  },
  expirado: {
    titulo: 'Este convite expirou',
    descricao: 'Solicite um novo link ao responsável pelo convite.',
  },
  revogado: {
    titulo: 'Este convite foi cancelado',
    descricao: 'Solicite um novo link ao responsável pelo convite.',
  },
  utilizado: {
    titulo: 'Este convite já foi utilizado',
    descricao:
      'Se a conta já foi criada, entre com o mesmo e-mail que recebeu o convite.',
  },
  invalido: {
    titulo: 'Link de convite inválido',
    descricao:
      'Confira se o link foi copiado por completo ou solicite um novo.',
  },
  indisponivel: {
    titulo: 'Não foi possível validar o convite',
    descricao: 'Verifique sua conexão e tente abrir o link novamente.',
  },
};

@Component({
  selector: 'app-convite-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonList,
    IonNote,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './convite.page.html',
  styleUrls: ['./convite.page.scss'],
})
export class ConvitePage implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly estado = signal<EstadoConvite>('carregando');
  readonly emailConvite = signal('');
  readonly enviando = signal(false);
  readonly erroCadastro = signal<string | null>(null);
  readonly tamanhoMinimoSenha = TAMANHO_MINIMO_SENHA;
  readonly formulario = new FormGroup({
    nome: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    sobrenome: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    senha: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(TAMANHO_MINIMO_SENHA),
      ],
    }),
  });

  async ngAfterViewInit(): Promise<void> {
    await Promise.resolve();
    await this.carregarConvite();
  }

  async concluirCadastro(): Promise<void> {
    this.formulario.markAllAsTouched();
    this.erroCadastro.set(null);

    if (this.formulario.invalid || this.enviando()) {
      return;
    }

    this.enviando.set(true);

    try {
      const { nome, sobrenome, senha } = this.formulario.getRawValue();

      await this.authService.concluirCadastroPorConvite({
        nome,
        sobrenome,
        senha,
      });
      await this.router.navigate(['/concluir-cadastro'], { replaceUrl: true });
    } catch (error) {
      const estadoTerminal = identificarEstadoTerminalConvite(error);

      if (estadoTerminal) {
        this.estado.set(estadoTerminal);
        return;
      }

      this.erroCadastro.set(identificarMensagemErroCadastroConvite(error));
    } finally {
      this.enviando.set(false);
    }
  }

  mensagemAtual(): MensagemConvite | null {
    const estado = this.estado();

    return estado === 'cadastro' || estado === 'carregando'
      ? null
      : MENSAGENS_CONVITE[estado];
  }

  irParaLogin(): Promise<boolean> {
    return this.router.navigate(['/login']);
  }

  private async carregarConvite(): Promise<void> {
    if (this.authService.isAuthenticated()) {
      this.estado.set('sessao_ativa');
      return;
    }

    const ticket = this.route.snapshot.queryParamMap.get('__clerk_ticket');

    if (!ticket?.trim()) {
      this.estado.set('sem_convite');
      return;
    }

    try {
      const convite = await this.authService.prepararCadastroPorConvite(ticket);
      this.emailConvite.set(convite.email);
      this.estado.set('cadastro');
    } catch (error) {
      this.estado.set(identificarEstadoErroConvite(error));
    }
  }
}
