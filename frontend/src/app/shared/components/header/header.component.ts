import { Component, input, output } from '@angular/core';
import {
  IonButtons,
  IonBackButton,
  IonButton,
  IonTitle,
  IonMenuButton,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    IonButtons,
    IonBackButton,
    IonButton,
    IonTitle,
    IonMenuButton,
    IonToolbar,
  ],
})
export class HeaderComponent {
  readonly titulo = input.required<string>();
  readonly voltarPara = input<string>();
  readonly fechavel = input(false);
  readonly fechar = output<void>();
}
