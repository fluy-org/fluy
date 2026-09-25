import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  identificarClientePublicaSchema,
  type SessaoClientePublicaResponseDto,
} from '@fluy/schema';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonSpinner,
} from '@ionic/angular/standalone';
import type { EstadoPaginaCliente } from '../../contracts';
import { formatarWhatsappInternacional } from '@fluy/schema';
import { CabecalhoPublicoComponent } from '../../components/cabecalho-publico/cabecalho-publico.component';
import { PaginaClienteService } from '../../services/pagina-cliente.service';

@Component({
  selector: 'app-pagina-cliente-page',
  standalone: true,
  imports: [
    CabecalhoPublicoComponent,
    IonButton,
    IonCheckbox,
    IonContent,
    IonIcon,
    IonInput,
    IonSpinner,
    ReactiveFormsModule,
  ],
  templateUrl: './pagina-cliente.page.html',
  styleUrls: ['./pagina-cliente.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaClientePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paginaClienteService = inject(PaginaClienteService);

  readonly salao = this.paginaClienteService.salao;
  readonly estado = signal<EstadoPaginaCliente>('carregando');
  readonly formatarWhatsapp = formatarWhatsappInternacional;
  readonly cliente = signal<SessaoClientePublicaResponseDto['cliente']>(null);
  readonly identificando = signal(false);
  readonly erroIdentificacao = signal<string | null>(null);
  readonly exibirFormulario = signal(false);
  readonly exibirPrivacidade = signal(false);

  readonly formulario = new FormGroup({
    nome: new FormControl('', { nonNullable: true }),
    whatsapp: new FormControl('', { nonNullable: true }),
    consentimento_privacidade: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    void this.carregarSalao();
  }

  recarregar(): void {
    void this.carregarSalao();
  }

  async identificar(): Promise<void> {
    const subdominio = this.obterSubdominio();
    const credencial = this.paginaClienteService.criarCredencial(subdominio);
    const resultado = identificarClientePublicaSchema.safeParse({
      ...this.formulario.getRawValue(),
      credencial,
    });

    if (!resultado.success) {
      this.erroIdentificacao.set(
        resultado.error.issues[0]?.message ?? 'Revise os dados informados.',
      );
      return;
    }

    this.identificando.set(true);
    this.erroIdentificacao.set(null);

    try {
      const resposta = await this.paginaClienteService.identificar(
        subdominio,
        resultado.data,
      );
      this.cliente.set(resposta.cliente);
      this.exibirFormulario.set(false);
    } catch {
      this.paginaClienteService.removerCredencial(subdominio);
      this.erroIdentificacao.set('Não foi possível continuar. Tente novamente.');
    } finally {
      this.identificando.set(false);
    }
  }

  agendarComoOutraPessoa(): void {
    this.cliente.set(null);
    this.formulario.reset();
    this.exibirFormulario.set(true);
  }

  formatarCampoWhatsapp(valor: string | null | undefined): void {
    const digitos = (valor ?? '').replace(/\D/g, '').slice(0, 11);

    if (digitos.length === 0) {
      this.formulario.controls.whatsapp.setValue('', { emitEvent: false });
      return;
    }

    if (digitos.length <= 2) {
      this.formulario.controls.whatsapp.setValue(`(${digitos}`, {
        emitEvent: false,
      });
      return;
    }

    const ddd = digitos.slice(0, 2);
    const numero = digitos.slice(2);
    const tamanhoPrefixo = numero.length > 8 ? 5 : 4;
    const prefixo = numero.slice(0, tamanhoPrefixo);
    const sufixo = numero.slice(tamanhoPrefixo);
    const formatado = `(${ddd}) ${prefixo}${sufixo ? `-${sufixo}` : ''}`;

    this.formulario.controls.whatsapp.setValue(formatado, {
      emitEvent: false,
    });
  }

  private async carregarSalao(): Promise<void> {
    const subdominio = this.route.snapshot.paramMap.get('subdominio');

    if (!subdominio) {
      this.estado.set('erro');
      return;
    }

    this.estado.set('carregando');

    try {
      await this.paginaClienteService.getEntidade(subdominio);
      const credencial = this.paginaClienteService.obterCredencial(subdominio);

      if (credencial) {
        const sessao = await this.paginaClienteService.consultarSessao(
          subdominio,
          credencial,
        );
        this.cliente.set(sessao.cliente);
      }

      this.exibirFormulario.set(!this.cliente());
      this.estado.set('pronto');
    } catch {
      this.estado.set('erro');
    }
  }

  private obterSubdominio(): string {
    return this.route.snapshot.paramMap.get('subdominio') ?? '';
  }
}
