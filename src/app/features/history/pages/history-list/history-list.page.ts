import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SlicePipe } from '@angular/common';
import {
  IonContent,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonSearchbar,
  IonIcon,
  IonButton,
  IonText,
  IonNote,
  IonButtons,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trashOutline,
  playOutline,
  copyOutline,
  linkOutline,
  peopleOutline,
  briefcaseOutline,
  timeOutline
} from 'ionicons/icons';

import { AppHeaderComponent } from '../../../../components/app-header/app-header.component';
import { HistoryRepositoryService } from '../../../../core/services/history-repository.service';
import { ClipboardService } from '../../../../services/clipboard.service';
import { ToastService } from '../../../../services/toast.service';
import { HistoryItem } from '../../../../core/models/history-item.model';
import { EmotionalSearchMode, EMOTIONAL_MODE_CONFIG } from '../../../../models/emotional-mode.model';

@Component({
  selector: 'app-history-list',
  standalone: true,
  imports: [
    SlicePipe,
    AppHeaderComponent,
    IonContent,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonSearchbar,
    IonIcon,
    IonButton,
    IonText,
    IonNote,
    IonButtons
  ],
  templateUrl: './history-list.page.html',
  styleUrl: './history-list.page.scss'
})
export class HistoryListPage implements OnInit {
  private readonly repository = inject(HistoryRepositoryService);
  private readonly clipboard = inject(ClipboardService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);

  protected historyItems: HistoryItem[] = [];
  protected filteredItems: HistoryItem[] = [];
  protected searchQuery = '';

  constructor() {
    addIcons({
      trashOutline,
      playOutline,
      copyOutline,
      linkOutline,
      peopleOutline,
      briefcaseOutline,
      timeOutline
    });
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  ionViewWillEnter(): void {
    this.loadHistory();
  }

  protected onSearchChange(event: CustomEvent): void {
    this.searchQuery = event.detail.value || '';
    this.filterItems();
  }

  protected async onApply(item: HistoryItem): Promise<void> {
    // Navigate to builder with the history item's payload
    await this.router.navigate(['/search-builder'], {
      state: {
        historyPayload: item.payload,
        historyPlatformId: item.platformId,
        historyMode: item.mode,
        historyEmotionalMode: item.emotionalMode
      }
    });
  }

  protected async onCopyQuery(item: HistoryItem): Promise<void> {
    const success = await this.clipboard.copyToClipboard(item.booleanQuery);
    if (success) {
      await this.toast.showSuccess('Query copied!');
    } else {
      await this.toast.showError('Failed to copy query');
    }
  }

  protected async onCopyUrl(item: HistoryItem): Promise<void> {
    const success = await this.clipboard.copyToClipboard(item.url);
    if (success) {
      await this.toast.showSuccess('URL copied!');
    } else {
      await this.toast.showError('Failed to copy URL');
    }
  }

  protected async onDelete(item: HistoryItem): Promise<void> {
    this.repository.delete(item.id);
    await this.toast.showSuccess('History item deleted');
    this.loadHistory();
  }

  protected async onClearAll(): Promise<void> {
    if (this.historyItems.length === 0) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Clear History',
      message: 'Are you sure you want to clear all search history?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear All',
          role: 'destructive',
          handler: () => {
            this.repository.clearAll();
            this.toast.showSuccess('History cleared');
            this.loadHistory();
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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  protected getItemSummary(item: HistoryItem): string {
    const parts: string[] = [];

    if (item.payload.titles?.length) {
      parts.push(item.payload.titles.slice(0, 2).join(', '));
      if (item.payload.titles.length > 2) {
        parts[0] += ` +${item.payload.titles.length - 2}`;
      }
    }

    if (item.payload.skills?.length) {
      const skillSummary = item.payload.skills.slice(0, 2).join(', ');
      parts.push(skillSummary);
    }

    return parts.join(' • ') || item.booleanQuery.substring(0, 50) || 'Search';
  }

  protected getSearchTypeIcon(item: HistoryItem): string {
    return item.searchType === 'jobs' ? 'briefcase-outline' : 'people-outline';
  }

  protected getEmotionalModeIcon(mode: EmotionalSearchMode): string {
    return EMOTIONAL_MODE_CONFIG[mode]?.icon || '';
  }

  private loadHistory(): void {
    this.historyItems = this.repository.list();
    this.filterItems();
  }

  private filterItems(): void {
    if (!this.searchQuery.trim()) {
      this.filteredItems = this.historyItems;
      return;
    }

    this.filteredItems = this.repository.search(this.searchQuery);
  }
}
