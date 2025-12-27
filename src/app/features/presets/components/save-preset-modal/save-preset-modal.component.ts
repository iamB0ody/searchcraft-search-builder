import { Component, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonButtons,
  IonIcon,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline } from 'ionicons/icons';

import { PresetRepositoryService } from '../../../../core/services/preset-repository.service';
import { ToastService } from '../../../../services/toast.service';
import { QueryPayload } from '../../../../models/platform.model';
import { SearchMode } from '../../../../models/search-form.model';
import { Preset } from '../../../../core/models/preset.model';

@Component({
  selector: 'app-save-preset-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonButtons,
    IonIcon
  ],
  templateUrl: './save-preset-modal.component.html',
  styleUrl: './save-preset-modal.component.scss'
})
export class SavePresetModalComponent {
  @Input() payload!: QueryPayload;
  @Input() platformId: string = 'linkedin';
  @Input() mode?: SearchMode;

  private readonly fb = inject(FormBuilder);
  private readonly modalController = inject(ModalController);
  private readonly repository = inject(PresetRepositoryService);
  private readonly toast = inject(ToastService);

  protected form: FormGroup;

  constructor() {
    addIcons({ closeOutline, saveOutline });

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      tags: ['']
    });
  }

  protected async onSave(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const { name, description, tags } = this.form.value;

    // Parse tags from comma-separated string
    const tagList = tags
      ? tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
      : undefined;

    try {
      const preset = this.repository.create({
        name: name.trim(),
        description: description?.trim() || undefined,
        payload: this.payload,
        platformId: this.platformId,
        mode: this.mode,
        tags: tagList?.length ? tagList : undefined
      });

      await this.toast.showSuccess(`Preset "${preset.name}" saved`);
      await this.modalController.dismiss(preset, 'save');
    } catch (error) {
      await this.toast.showError('Failed to save preset');
    }
  }

  protected async onCancel(): Promise<void> {
    await this.modalController.dismiss(null, 'cancel');
  }

  protected getPayloadSummary(): string {
    const parts: string[] = [];

    if (this.payload.titles?.length) {
      parts.push(`${this.payload.titles.length} title(s)`);
    }

    if (this.payload.skills?.length) {
      parts.push(`${this.payload.skills.length} skill(s)`);
    }

    if (this.payload.exclude?.length) {
      parts.push(`${this.payload.exclude.length} excluded`);
    }

    if (this.payload.location) {
      parts.push(this.payload.location);
    }

    return parts.join(' • ') || 'Empty search';
  }
}
