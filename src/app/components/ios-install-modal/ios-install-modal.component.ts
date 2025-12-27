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
import { shareOutline, addOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';

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

  constructor() {
    addIcons({ shareOutline, addOutline, checkmarkOutline, closeOutline });
  }

  onDismiss(): void {
    this.modalController.dismiss();
  }
}
