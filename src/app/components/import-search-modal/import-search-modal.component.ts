import { Component, Input, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonChip,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shareSocialOutline, checkmarkOutline } from 'ionicons/icons';
import { BuilderShareState } from '../../models/platform.model';

@Component({
  selector: 'app-import-search-modal',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonText,
    IonChip
  ],
  templateUrl: './import-search-modal.component.html',
  styleUrl: './import-search-modal.component.scss'
})
export class ImportSearchModalComponent {
  @Input() state!: BuilderShareState;

  private readonly modalController = inject(ModalController);

  constructor() {
    addIcons({ shareSocialOutline, checkmarkOutline });
  }

  get summary(): string {
    const parts: string[] = [];
    if (this.state.payload.titles?.length) {
      parts.push(`${this.state.payload.titles.length} title(s)`);
    }
    if (this.state.payload.skills?.length) {
      parts.push(`${this.state.payload.skills.length} skill(s)`);
    }
    if (this.state.payload.exclude?.length) {
      parts.push(`${this.state.payload.exclude.length} exclusion(s)`);
    }
    return parts.join(', ') || 'Empty search';
  }

  onApply(): void {
    this.modalController.dismiss(true, 'apply');
  }

  onCancel(): void {
    this.modalController.dismiss(false, 'cancel');
  }
}
