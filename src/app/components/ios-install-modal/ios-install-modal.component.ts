import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shareOutline, addOutline, checkmarkOutline, closeOutline, ellipsisHorizontalOutline } from 'ionicons/icons';
import { PwaInstallService, IosBrowser } from '../../core/services/pwa-install.service';

@Component({
  selector: 'app-ios-install-modal',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel
  ],
  templateUrl: './ios-install-modal.component.html',
  styleUrl: './ios-install-modal.component.scss'
})
export class IosInstallModalComponent {
  private readonly modalController = inject(ModalController);
  private readonly pwaInstall = inject(PwaInstallService);

  constructor() {
    addIcons({ shareOutline, addOutline, checkmarkOutline, closeOutline, ellipsisHorizontalOutline });
  }

  get browser(): IosBrowser {
    return this.pwaInstall.iosBrowser();
  }

  onDismiss(): void {
    this.modalController.dismiss();
  }
}
