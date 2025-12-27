import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  rocketOutline,
  peopleOutline,
  briefcaseOutline,
  layersOutline,
  timeOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  checkmarkCircleOutline,
  arrowForwardOutline
} from 'ionicons/icons';

import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    AppHeaderComponent,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  private readonly router = inject(Router);

  constructor() {
    addIcons({
      rocketOutline,
      peopleOutline,
      briefcaseOutline,
      layersOutline,
      timeOutline,
      shieldCheckmarkOutline,
      lockClosedOutline,
      checkmarkCircleOutline,
      arrowForwardOutline
    });
  }

  protected navigateToBuilder(): void {
    this.router.navigate(['/search-builder']);
  }

  protected navigateToPresets(): void {
    this.router.navigate(['/presets']);
  }
}
