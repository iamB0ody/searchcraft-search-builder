import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  closeOutline,
  alertCircleOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

import { PresetRepositoryService } from '../../../../core/services/preset-repository.service';
import { ShareService } from '../../../../core/services/share.service';
import { ToastService } from '../../../../services/toast.service';
import { Preset } from '../../../../core/models/preset.model';

interface ImportData {
  schemaVersion?: number;
  preset?: Preset;
}

@Component({
  selector: 'app-preset-import',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonText,
    IonSpinner
  ],
  templateUrl: './preset-import.page.html',
  styleUrl: './preset-import.page.scss'
})
export class PresetImportPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repository = inject(PresetRepositoryService);
  private readonly shareService = inject(ShareService);
  private readonly toast = inject(ToastService);

  protected loading = true;
  protected error: string | null = null;
  protected presetData: Preset | null = null;

  constructor() {
    addIcons({ saveOutline, closeOutline, alertCircleOutline, checkmarkCircleOutline });
  }

  ngOnInit(): void {
    this.parseImportData();
  }

  private parseImportData(): void {
    const encodedData = this.route.snapshot.queryParamMap.get('p');

    if (!encodedData) {
      this.error = 'No preset data found in the URL.';
      this.loading = false;
      return;
    }

    const decoded = this.shareService.decodeShareParam(encodedData);

    if (!decoded) {
      this.error = 'Failed to decode preset data. The link may be corrupted.';
      this.loading = false;
      return;
    }

    if (!decoded.preset) {
      this.error = 'Invalid preset format: missing preset data.';
      this.loading = false;
      return;
    }

    // Basic validation
    if (!decoded.preset.name?.trim() || !decoded.preset.payload || !decoded.preset.platformId) {
      this.error = 'Invalid preset: missing required fields (name, payload, or platformId).';
      this.loading = false;
      return;
    }

    this.presetData = decoded.preset;
    this.loading = false;
  }

  protected getPayloadSummary(): string[] {
    if (!this.presetData) return [];

    const items: string[] = [];
    const payload = this.presetData.payload;

    if (payload.titles?.length) {
      items.push(`Titles: ${payload.titles.join(', ')}`);
    }

    if (payload.skills?.length) {
      items.push(`Skills: ${payload.skills.join(', ')}`);
    }

    if (payload.exclude?.length) {
      items.push(`Excluded: ${payload.exclude.join(', ')}`);
    }

    if (payload.location) {
      items.push(`Location: ${payload.location}`);
    }

    items.push(`Type: ${payload.searchType}`);

    return items;
  }

  protected async onImport(): Promise<void> {
    if (!this.presetData) return;

    try {
      // Create new preset from imported data (excluding id, timestamps, version)
      const { id, createdAt, updatedAt, version, ...presetWithoutMeta } = this.presetData;

      const imported = this.repository.create(presetWithoutMeta);

      if (imported) {
        await this.toast.showSuccess(`Preset "${imported.name}" imported successfully`);
        this.router.navigate(['/presets']);
      } else {
        await this.toast.showError('Failed to import preset');
      }
    } catch (e) {
      console.error('Import failed:', e);
      await this.toast.showError('An error occurred while importing');
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/presets']);
  }

  protected onGoToBuilder(): void {
    this.router.navigate(['/search-builder']);
  }
}
