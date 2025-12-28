import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
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
  IonBadge,
  IonChip,
  IonAccordion,
  IonAccordionGroup
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { copy, open, warning, checkmarkCircle, alertCircle, informationCircleOutline, alertCircleOutline, shareSocialOutline } from 'ionicons/icons';
import { ClipboardService } from '../../services/clipboard.service';
import { ToastService } from '../../services/toast.service';
import { BadgeStatus } from '../../models/search-form.model';
import { QualityScoreResult } from '../../models/quality-score.model';
import { BooleanLevel } from '../../models/platform.model';
import { EmotionalSearchMode, EMOTIONAL_MODE_CONFIG } from '../../models/emotional-mode.model';
import { HiringSignalsExplanation } from '../../core/people-signals/apply-hiring-signals';

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
    IonBadge,
    IonChip,
    IonAccordion,
    IonAccordionGroup
  ],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss'
})
export class PreviewComponent {
  @Input() booleanQuery = '';
  @Input() searchUrl = '';
  @Input() warnings: string[] = [];
  @Input() operatorCount = 0;
  @Input() badgeStatus: BadgeStatus = 'safe';
  @Input() qualityScore?: QualityScoreResult;
  @Input() platformLabel = 'LinkedIn';
  @Input() platformIcon = 'logo-linkedin';
  @Input() booleanLevel: BooleanLevel = 'good';
  @Input() emotionalMode: EmotionalSearchMode = 'normal';
  @Input() emotionalAdjustments: string[] = [];
  @Input() hiringSignalsExplanation: HiringSignalsExplanation | null = null;
  @Input() peopleLocation?: string;

  @Output() executeSearch = new EventEmitter<void>();
  @Output() shareSearch = new EventEmitter<void>();

  // Emotional mode config for template access
  protected readonly emotionalModeConfig = EMOTIONAL_MODE_CONFIG;

  get badgeColor(): string {
    switch (this.badgeStatus) {
      case 'danger': return 'danger';
      case 'warning': return 'warning';
      default: return 'success';
    }
  }

  get scoreColor(): string {
    if (!this.qualityScore) return 'medium';
    switch (this.qualityScore.level) {
      case 'good': return 'success';
      case 'ok': return 'warning';
      case 'risky': return 'danger';
    }
  }

  get scoreLabel(): string {
    if (!this.qualityScore) return '';
    switch (this.qualityScore.level) {
      case 'good': return 'Good';
      case 'ok': return 'OK';
      case 'risky': return 'Risky';
    }
  }

  get booleanLevelColor(): string {
    switch (this.booleanLevel) {
      case 'good': return 'success';
      case 'partial': return 'warning';
      case 'none': return 'medium';
    }
  }

  get booleanLevelLabel(): string {
    switch (this.booleanLevel) {
      case 'good': return 'Full Boolean';
      case 'partial': return 'Limited Boolean';
      case 'none': return 'Keywords Only';
    }
  }

  get emotionalModeColor(): string {
    switch (this.emotionalMode) {
      case 'urgent': return 'warning';
      case 'chill': return 'tertiary';
      default: return 'medium';
    }
  }

  get showEmotionalModeBadge(): boolean {
    return this.emotionalMode !== 'normal';
  }

  get showHiringSignalsBadge(): boolean {
    return this.hiringSignalsExplanation?.enabled === true &&
      this.hiringSignalsExplanation.appliedSignals.length > 0;
  }

  get hiringSignalsCount(): number {
    return this.hiringSignalsExplanation?.appliedSignals?.length || 0;
  }

  get showLocationBadge(): boolean {
    return !!this.peopleLocation?.trim();
  }

  getWarningColor(warning: string): string {
    if (warning.includes('Sales Navigator supports up to 15')) {
      return 'danger';
    }
    return 'warning';
  }

  private clipboard = inject(ClipboardService);
  private toast = inject(ToastService);

  constructor() {
    addIcons({ copy, open, warning, checkmarkCircle, alertCircle, informationCircleOutline, alertCircleOutline, shareSocialOutline });
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
    this.executeSearch.emit();
  }
}
