import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonButton,
  IonFab,
  IonFabButton,
  IonText,
  IonNote,
  IonChip,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  copyOutline,
  shareOutline,
  trashOutline,
  downloadOutline,
  playOutline,
  timeOutline,
  textOutline
} from 'ionicons/icons';

import { AppHeaderComponent } from '../../../../components/app-header/app-header.component';
import { PresetRepositoryService } from '../../../../core/services/preset-repository.service';
import { ShareService } from '../../../../core/services/share.service';
import { ToastService } from '../../../../services/toast.service';
import { Preset } from '../../../../core/models/preset.model';

type SortMode = 'recent' | 'alpha';

@Component({
  selector: 'app-presets-list',
  standalone: true,
  imports: [
    AppHeaderComponent,
    IonContent,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonIcon,
    IonButton,
    IonFab,
    IonFabButton,
    IonText,
    IonNote,
    IonChip
  ],
  templateUrl: './presets-list.page.html',
  styleUrl: './presets-list.page.scss'
})
export class PresetsListPage implements OnInit {
  private readonly repository = inject(PresetRepositoryService);
  private readonly shareService = inject(ShareService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);

  protected presets: Preset[] = [];
  protected filteredPresets: Preset[] = [];
  protected searchQuery = '';
  protected sortMode: SortMode = 'recent';

  constructor() {
    addIcons({
      addOutline,
      createOutline,
      copyOutline,
      shareOutline,
      trashOutline,
      downloadOutline,
      playOutline,
      timeOutline,
      textOutline
    });
  }

  ngOnInit(): void {
    this.loadPresets();
  }

  ionViewWillEnter(): void {
    this.loadPresets();
  }

  protected onSearchChange(event: CustomEvent): void {
    this.searchQuery = event.detail.value || '';
    this.filterPresets();
  }

  protected onSortChange(event: CustomEvent): void {
    this.sortMode = event.detail.value as SortMode;
    this.filterPresets();
  }

  protected async onApply(preset: Preset): Promise<void> {
    await this.router.navigate(['/search-builder'], {
      state: { presetId: preset.id }
    });
  }

  protected onEdit(preset: Preset): void {
    this.router.navigate(['/presets', preset.id]);
  }

  protected async onDuplicate(preset: Preset): Promise<void> {
    const duplicated = this.repository.duplicate(preset.id);
    if (duplicated) {
      await this.toast.showSuccess(`"${duplicated.name}" created`);
      this.loadPresets();
    }
  }

  protected async onShare(preset: Preset): Promise<void> {
    await this.shareService.share(preset);
  }

  protected async onExport(preset: Preset): Promise<void> {
    await this.shareService.copyPresetJson(preset);
  }

  protected async onDelete(preset: Preset): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Preset',
      message: `Are you sure you want to delete "${preset.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.repository.delete(preset.id);
            this.toast.showSuccess('Preset deleted');
            this.loadPresets();
          }
        }
      ]
    });
    await alert.present();
  }

  protected navigateToBuilder(): void {
    this.router.navigate(['/search-builder']);
  }

  protected formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  protected getPresetSummary(preset: Preset): string {
    const parts: string[] = [];

    if (preset.payload.titles?.length) {
      parts.push(`${preset.payload.titles.length} title${preset.payload.titles.length > 1 ? 's' : ''}`);
    }

    if (preset.payload.skills?.length) {
      parts.push(`${preset.payload.skills.length} skill${preset.payload.skills.length > 1 ? 's' : ''}`);
    }

    if (preset.payload.exclude?.length) {
      parts.push(`${preset.payload.exclude.length} excluded`);
    }

    return parts.join(' • ') || 'Empty preset';
  }

  private loadPresets(): void {
    this.presets = this.repository.list();
    this.filterPresets();
  }

  private filterPresets(): void {
    let result = this.presets;

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Apply sort
    if (this.sortMode === 'alpha') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    // 'recent' is already sorted from repository

    this.filteredPresets = result;
  }
}
