import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  template: `<ion-router-outlet></ion-router-outlet>`,
  standalone: true,
  imports: [IonicModule, RouterModule],
})
export class PublicLayoutComponent {}