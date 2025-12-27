import { Component, Input, inject } from '@angular/core';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonText,
  IonItem,
  IonLabel,
  IonList,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { copy, open, warning, checkmarkCircle, alertCircle } from 'ionicons/icons';
import { ClipboardService } from '../../services/clipboard.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonText,
    IonItem,
    IonLabel,
    IonList,
    IonBadge
  ],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss'
})
export class PreviewComponent {
  @Input() booleanQuery = '';
  @Input() searchUrl = '';
  @Input() warnings: string[] = [];
  @Input() operatorCount = 0;

  private clipboard = inject(ClipboardService);
  private toast = inject(ToastService);

  constructor() {
    addIcons({ copy, open, warning, checkmarkCircle, alertCircle });
  }

  async copyQuery(): Promise<void> {
    if (!this.booleanQuery) return;

    const success = await this.clipboard.copyToClipboard(this.booleanQuery);
    if (success) {
      await this.toast.showSuccess('Boolean query copied!');
    } else {
      await this.toast.showError('Failed to copy query');
    }
  }

  async copyUrl(): Promise<void> {
    if (!this.searchUrl) return;

    const success = await this.clipboard.copyToClipboard(this.searchUrl);
    if (success) {
      await this.toast.showSuccess('URL copied!');
    } else {
      await this.toast.showError('Failed to copy URL');
    }
  }

  openInLinkedIn(): void {
    if (!this.searchUrl) return;
    window.open(this.searchUrl, '_blank', 'noopener,noreferrer');
  }
}
