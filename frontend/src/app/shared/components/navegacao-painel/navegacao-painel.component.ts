import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  cutOutline,
  peopleOutline,
  statsChartOutline,
  notificationsOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-navegacao-painel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IonButton, IonIcon, IonText],
  templateUrl: './navegacao-painel.component.html',
  styleUrls: ['./navegacao-painel.component.scss'],
})
export class NavegacaoPainelComponent {
  readonly destinos = [
    { rota: '/painel/agenda', nome: 'Agenda', icone: 'calendar-outline' },
    {
      rota: '/painel/procedimentos',
      nome: 'Procedimentos',
      icone: 'cut-outline',
    },
    { rota: '/painel/clientes', nome: 'Clientes', icone: 'people-outline' },
    {
      rota: '/painel/lembretes',
      nome: 'Lembretes',
      icone: 'notifications-outline',
    },
    {
      rota: '/painel/faturamento',
      nome: 'Faturamento',
      icone: 'stats-chart-outline',
    },
  ];

  constructor() {
    addIcons({
      calendarOutline,
      cutOutline,
      peopleOutline,
      statsChartOutline,
      notificationsOutline,
    });
  }
}
