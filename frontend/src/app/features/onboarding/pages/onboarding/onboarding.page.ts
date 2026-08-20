import { Component } from '@angular/core';
import { IonContent, IonHeader, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  imports: [IonContent, IonHeader, IonText, IonTitle, IonToolbar],
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage {}
