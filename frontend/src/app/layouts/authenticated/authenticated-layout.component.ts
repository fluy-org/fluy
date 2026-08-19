import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-authenticated-layout',
  template: `
    <ion-split-pane contentId="main-content">
      <!-- Menu Lateral -->
      <ion-menu contentId="main-content" type="overlay">
        <ion-header>
          <ion-toolbar>
            <ion-title>Fluy</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-menu-toggle auto-hide="false">
              <ion-item routerLink="/painel/agenda" routerDirection="root" lines="none">
                <ion-label>Agenda</ion-label>
              </ion-item>
              <ion-item routerLink="/painel/configuracao" routerDirection="root" lines="none">
                <ion-label>Configuração</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>
        </ion-content>
      </ion-menu>

      <!-- Conteúdo Principal -->
      <div class="ion-page" id="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-menu-button></ion-menu-button>
            </ion-buttons>
            <ion-title>Painel</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-router-outlet></ion-router-outlet>
        </ion-content>
      </div>
    </ion-split-pane>
  `,
  standalone: true,
  imports: [IonicModule, RouterModule],
})
export class AuthenticatedLayoutComponent {}