import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  criarSalaoSchema,
  subdominioIndisponivelSchema,
} from '@fluy/schema/salao/salao.schema';
import type { CriarSalaoDto } from '@fluy/schema/salao/salao.dto';
import {
  FUSOS_HORARIOS_BRASIL,
  type FusoHorarioBrasil,
} from '@fluy/schema/salao/salao.enums';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { FieldErrorComponent } from '../../../../../shared/components/field-error/field-error.component';
import { ApiError } from '../../../../../core/errors/api-error';
import { AuthService } from '@app/core/services/auth/auth.service';
import { ContaService } from '@app/features/auth/services/conta.service';
import { ROTULOS_FUSO_HORARIO } from '../../onboarding.data';
import { zodValidator } from '../../../../../shared/utils/zod-validator';
import { OnboardingService } from '../../services/onboarding.service';
import {
  formatarWhatsapp,
  normalizarWhatsapp,
} from '../../utils/onboarding-utils';

@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    FieldErrorComponent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    IonTextarea,
    IonTitle,
    IonToolbar,
    ReactiveFormsModule,
  ],
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage {
  private onboardingService = inject(OnboardingService);
  private authService = inject(AuthService);
  private contaService = inject(ContaService);
  private router = inject(Router);

  readonly fusosHorarios = FUSOS_HORARIOS_BRASIL;
  readonly rotulosFusoHorario = ROTULOS_FUSO_HORARIO;
  readonly formatarWhatsapp = formatarWhatsapp;
  readonly enviando = signal(false);
  readonly saindo = signal(false);
  readonly erroGeral = signal<string | null>(null);
  readonly sugestoesSubdominio = signal<string[]>([]);

  readonly formulario = new FormGroup(
    {
      nome: new FormControl('', {
        nonNullable: true,
        validators: zodValidator(criarSalaoSchema.shape.nome),
      }),
      contato_whatsapp: new FormControl('', {
        nonNullable: true,
        validators: zodValidator(criarSalaoSchema.shape.contato_whatsapp),
      }),
      endereco: new FormControl('', {
        nonNullable: true,
        validators: zodValidator(criarSalaoSchema.shape.endereco),
      }),
      fuso_horario: new FormControl<FusoHorarioBrasil>('America/Sao_Paulo', {
        nonNullable: true,
        validators: zodValidator(criarSalaoSchema.shape.fuso_horario),
      }),
      subdominio: new FormControl('', {
        nonNullable: true,
        validators: zodValidator(criarSalaoSchema.shape.subdominio),
      }),
    },
    {
      validators: zodValidator(criarSalaoSchema),
      updateOn: 'blur',
    },
  );

  async criar(): Promise<void> {
    if (this.enviando()) {
      return;
    }

    this.formulario.markAllAsTouched();
    this.formulario.updateValueAndValidity();

    if (this.formulario.invalid) {
      return;
    }

    const resultado = criarSalaoSchema.safeParse(this.formulario.getRawValue());

    if (!resultado.success) {
      return;
    }

    this.enviando.set(true);
    this.erroGeral.set(null);
    this.sugestoesSubdominio.set([]);

    try {
      await this.onboardingService.criar(resultado.data);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      const conflitoSubdominio = this.extrairConflitoSubdominio(error);

      if (conflitoSubdominio) {
        this.sugestoesSubdominio.set(conflitoSubdominio.sugestoes);
        return;
      }

      this.erroGeral.set(error.message);
      return;
    } finally {
      this.enviando.set(false);
    }

    this.contaService.limparCache();
    await this.router.navigate(['/painel/primeiros-passos'], {
      queryParams: { sucesso: 'true' },
      replaceUrl: true,
    });
  }

  async sair(): Promise<void> {
    if (this.saindo()) {
      return;
    }

    this.saindo.set(true);
    try {
      await this.authService.logout();
    } finally {
      this.saindo.set(false);
    }
  }

  atualizarWhatsapp(event: CustomEvent<{ value?: string | null }>): void {
    const valor = event.detail.value ?? '';
    const whatsapp = normalizarWhatsapp(valor);

    this.formulario.controls.contato_whatsapp.setValue(whatsapp);
  }

  marcarWhatsappComoTocado(): void {
    const controle = this.formulario.controls.contato_whatsapp;
    controle.markAsTouched();
    controle.updateValueAndValidity();
  }

  usarSugestao(sugestao: string): void {
    const controle = this.formulario.controls.subdominio;
    controle.setValue(sugestao);
    controle.markAsTouched();
    controle.updateValueAndValidity();
    this.sugestoesSubdominio.set([]);
  }

  limparSugestoesSubdominio(): void {
    this.sugestoesSubdominio.set([]);
  }

  private extrairConflitoSubdominio(error: ApiError) {
    if (error.status !== 409) {
      return null;
    }

    const resultado = subdominioIndisponivelSchema.safeParse(error.body);

    return resultado.success ? resultado.data : null;
  }
}
