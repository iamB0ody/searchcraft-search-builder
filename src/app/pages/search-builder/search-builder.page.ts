import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, peopleOutline, briefcaseOutline } from 'ionicons/icons';

import { ChipInputComponent } from '../../components/chip-input/chip-input.component';
import { PreviewComponent } from '../../components/preview/preview.component';
import { BooleanBuilderService } from '../../services/boolean-builder.service';
import { LinkedinUrlBuilderService } from '../../services/linkedin-url-builder.service';
import { SearchFormModel, SearchType, SearchMode } from '../../models/search-form.model';

@Component({
  selector: 'app-search-builder',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
    IonNote,
    ChipInputComponent,
    PreviewComponent
  ],
  templateUrl: './search-builder.page.html',
  styleUrl: './search-builder.page.scss'
})
export class SearchBuilderPage implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private booleanBuilder = inject(BooleanBuilderService);
  private urlBuilder = inject(LinkedinUrlBuilderService);

  protected form!: FormGroup;
  protected booleanQuery = '';
  protected searchUrl = '';
  protected warnings: string[] = [];
  protected operatorCount = 0;

  protected readonly searchTypes: { value: SearchType; label: string; icon: string }[] = [
    { value: 'people', label: 'People', icon: 'people-outline' },
    { value: 'jobs', label: 'Jobs', icon: 'briefcase-outline' }
  ];

  protected readonly searchModes: { value: SearchMode; label: string }[] = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'salesnav', label: 'Sales Navigator' },
    { value: 'recruiter', label: 'Recruiter' }
  ];

  constructor() {
    addIcons({ trashOutline, peopleOutline, briefcaseOutline });
  }

  ngOnInit(): void {
    this.initForm();
    this.setupFormSubscription();
  }

  private initForm(): void {
    this.form = this.fb.group({
      searchType: ['people' as SearchType],
      titles: [[] as string[]],
      skills: [[] as string[]],
      exclude: [[] as string[]],
      location: [''],
      mode: ['linkedin' as SearchMode]
    });
  }

  private setupFormSubscription(): void {
    this.form.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((value: SearchFormModel) => {
      this.updatePreview(value);
    });
  }

  private updatePreview(form: SearchFormModel): void {
    const result = this.booleanBuilder.buildQuery(form);
    this.booleanQuery = result.query;
    this.searchUrl = result.query ? this.urlBuilder.buildUrl(form, result.query) : '';
    this.warnings = result.warnings;
    this.operatorCount = result.operatorCount;
  }

  protected onSearchTypeChange(event: CustomEvent): void {
    this.form.patchValue({ searchType: event.detail.value });
  }

  protected get isJobsSearch(): boolean {
    return this.form.get('searchType')?.value === 'jobs';
  }

  protected clearForm(): void {
    this.form.reset({
      searchType: 'people',
      titles: [],
      skills: [],
      exclude: [],
      location: '',
      mode: 'linkedin'
    });
  }
}
