import { Component, input } from '@angular/core';
import { addIcons } from 'ionicons';
import { personCircleOutline } from 'ionicons/icons';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuButton,
  IonRow,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonCol,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuButton,
    IonRow,
    IonToolbar,
  ],
})
export class HeaderComponent {
  readonly titulo = input.required<string>();

  constructor() {
    addIcons({ personCircleOutline });
  }
}
