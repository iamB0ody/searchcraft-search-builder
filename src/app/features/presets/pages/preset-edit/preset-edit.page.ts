import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonItem,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  trashOutline,
  playOutline,
  shareOutline
} from 'ionicons/icons';

import { AppHeaderComponent } from '../../../../components/app-header/app-header.component';
import { PresetRepositoryService } from '../../../../core/services/preset-repository.service';
import { ShareService } from '../../../../core/services/share.service';
import { ToastService } from '../../../../services/toast.service';
import { Preset } from '../../../../core/models/preset.model';

@Component({
  selector: 'app-preset-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AppHeaderComponent,
    IonContent,
    IonItem,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonText
  ],
  templateUrl: './preset-edit.page.html',
  styleUrl: './preset-edit.page.scss'
})
export class PresetEditPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly repository = inject(PresetRepositoryService);
  private readonly shareService = inject(ShareService);
  private readonly toast = inject(ToastService);
  private readonly alertController = inject(AlertController);

  protected preset: Preset | null = null;
  protected form!: FormGroup;

  constructor() {
    addIcons({ saveOutline, trashOutline, playOutline, shareOutline });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadPreset();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      tags: ['']
    });
  }

  private loadPreset(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/presets']);
      return;
    }

    this.preset = this.repository.getById(id) || null;

    if (!this.preset) {
      this.toast.showError('Preset not found');
      this.router.navigate(['/presets']);
      return;
    }

    this.form.patchValue({
      name: this.preset.name,
      description: this.preset.description || '',
      tags: this.preset.tags?.join(', ') || ''
    });
  }

  protected async onSave(): Promise<void> {
    if (!this.preset || this.form.invalid) {
      return;
    }

    const { name, description, tags } = this.form.value;

    const tagList = tags
      ? tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
      : undefined;

    const updated = this.repository.update(this.preset.id, {
      name: name.trim(),
      description: description?.trim() || undefined,
      tags: tagList?.length ? tagList : undefined
    });

    if (updated) {
      await this.toast.showSuccess('Preset saved');
      this.router.navigate(['/presets']);
    } else {
      await this.toast.showError('Failed to save preset');
    }
  }

  protected async onDelete(): Promise<void> {
    if (!this.preset) return;

    const alert = await this.alertController.create({
      header: 'Delete Preset',
      message: `Are you sure you want to delete "${this.preset.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            if (this.preset) {
              this.repository.delete(this.preset.id);
              this.toast.showSuccess('Preset deleted');
              this.router.navigate(['/presets']);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  protected async onApply(): Promise<void> {
    if (!this.preset) return;

    await this.router.navigate(['/search-builder'], {
      state: { presetId: this.preset.id }
    });
  }

  protected async onShare(): Promise<void> {
    if (!this.preset) return;
    await this.shareService.share(this.preset);
  }

  protected getPayloadSummary(): string[] {
    if (!this.preset) return [];

    const items: string[] = [];

    if (this.preset.payload.titles?.length) {
      items.push(`Titles: ${this.preset.payload.titles.join(', ')}`);
    }

    if (this.preset.payload.skills?.length) {
      items.push(`Skills: ${this.preset.payload.skills.join(', ')}`);
    }

    if (this.preset.payload.exclude?.length) {
      items.push(`Excluded: ${this.preset.payload.exclude.join(', ')}`);
    }

    if (this.preset.payload.location) {
      items.push(`Location: ${this.preset.payload.location}`);
    }

    items.push(`Type: ${this.preset.payload.searchType}`);

    return items;
  }

  protected formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
