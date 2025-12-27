import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
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
  IonButtons,
  IonIcon,
  IonToggle,
  IonText,
  IonAccordion,
  IonAccordionGroup,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trashOutline,
  peopleOutline,
  briefcaseOutline,
  chevronDownOutline,
  saveOutline,
  folderOutline
} from 'ionicons/icons';

import { ChipInputComponent } from '../../components/chip-input/chip-input.component';
import { PreviewComponent } from '../../components/preview/preview.component';
import { SuggestionsComponent } from '../../components/suggestions/suggestions.component';
import { SavePresetModalComponent } from '../../features/presets/components/save-preset-modal/save-preset-modal.component';
import { BooleanBuilderService } from '../../services/boolean-builder.service';
import { LinkedinUrlBuilderService } from '../../services/linkedin-url-builder.service';
import { IntelligenceEngineService } from '../../services/intelligence/intelligence-engine.service';
import { ToastService } from '../../services/toast.service';
import { PresetRepositoryService } from '../../core/services/preset-repository.service';
import { QueryPayload } from '../../models/platform.model';
import { IntelligenceSuggestion } from '../../models/intelligence.model';
import {
  SearchFormModel,
  SearchType,
  SearchMode,
  DatePosted,
  ExperienceLevel,
  WorkType,
  SortBy,
  JobType,
  ConnectionLevel,
  ProfileLanguage,
  BadgeStatus
} from '../../models/search-form.model';

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
    IonButtons,
    IonIcon,
    IonToggle,
    IonText,
    IonAccordion,
    IonAccordionGroup,
    ChipInputComponent,
    PreviewComponent,
    SuggestionsComponent
  ],
  templateUrl: './search-builder.page.html',
  styleUrl: './search-builder.page.scss'
})
export class SearchBuilderPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly modalController = inject(ModalController);
  private readonly booleanBuilder = inject(BooleanBuilderService);
  private readonly urlBuilder = inject(LinkedinUrlBuilderService);
  private readonly intelligence = inject(IntelligenceEngineService);
  private readonly toast = inject(ToastService);
  private readonly presetRepository = inject(PresetRepositoryService);

  protected form!: FormGroup;
  protected booleanQuery = '';
  protected searchUrl = '';
  protected warnings: string[] = [];
  protected operatorCount = 0;
  protected badgeStatus: BadgeStatus = 'safe';
  protected suggestions: IntelligenceSuggestion[] = [];

  protected readonly searchTypes: { value: SearchType; label: string; icon: string }[] = [
    { value: 'people', label: 'People', icon: 'people-outline' },
    { value: 'jobs', label: 'Jobs', icon: 'briefcase-outline' }
  ];

  protected readonly searchModes: { value: SearchMode; label: string }[] = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'salesnav', label: 'Sales Navigator' },
    { value: 'recruiter', label: 'Recruiter' }
  ];

  protected readonly datePostedOptions: { value: DatePosted; label: string }[] = [
    { value: 'any', label: 'Any time' },
    { value: 'day', label: 'Past 24 hours' },
    { value: 'week', label: 'Past week' },
    { value: 'month', label: 'Past month' }
  ];

  protected readonly experienceLevelOptions: { value: ExperienceLevel; label: string }[] = [
    { value: 'internship', label: 'Internship' },
    { value: 'entry', label: 'Entry level' },
    { value: 'associate', label: 'Associate' },
    { value: 'mid-senior', label: 'Mid-Senior level' },
    { value: 'director', label: 'Director' },
    { value: 'executive', label: 'Executive' }
  ];

  protected readonly workTypeOptions: { value: WorkType; label: string }[] = [
    { value: 'onsite', label: 'On-site' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  protected readonly sortByOptions: { value: SortBy; label: string }[] = [
    { value: 'relevant', label: 'Most relevant' },
    { value: 'recent', label: 'Most recent' }
  ];

  protected readonly jobTypeOptions: { value: JobType; label: string }[] = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship', label: 'Internship' },
    { value: 'other', label: 'Other' }
  ];

  // People filter options
  protected readonly connectionLevelOptions: { value: ConnectionLevel; label: string }[] = [
    { value: '1st', label: '1st Connections' },
    { value: '2nd', label: '2nd Connections' },
    { value: '3rd+', label: '3rd+ Connections' }
  ];

  protected readonly profileLanguageOptions: { value: ProfileLanguage; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ar', label: 'Arabic' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'it', label: 'Italian' },
    { value: 'nl', label: 'Dutch' },
    { value: 'ru', label: 'Russian' }
  ];

  constructor() {
    addIcons({
      trashOutline,
      peopleOutline,
      briefcaseOutline,
      chevronDownOutline,
      saveOutline,
      folderOutline
    });
  }

  // Check if desktop screen (for accordion default state)
  protected get isDesktop(): boolean {
    return window.innerWidth >= 992;
  }

  // Default accordion value for filters (expanded on desktop)
  protected get defaultAccordionValue(): string | undefined {
    return this.isDesktop ? 'filters' : undefined;
  }

  ngOnInit(): void {
    this.initForm();
    this.setupFormSubscription();
    this.checkForPresetToApply();
  }

  ionViewWillEnter(): void {
    this.checkForPresetToApply();
  }

  private checkForPresetToApply(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.presetId) {
      const preset = this.presetRepository.getById(state.presetId);
      if (preset) {
        this.applyPreset(preset.payload, preset.mode);
        this.toast.showSuccess(`Preset "${preset.name}" applied`);
      }
    }
  }

  private applyPreset(payload: QueryPayload, mode?: SearchMode): void {
    this.form.patchValue({
      searchType: payload.searchType,
      titles: payload.titles || [],
      skills: payload.skills || [],
      exclude: payload.exclude || [],
      location: payload.location || '',
      mode: mode || 'linkedin'
    });
  }

  protected async openSavePresetModal(): Promise<void> {
    const formValue = this.form.value as SearchFormModel;

    const payload: QueryPayload = {
      searchType: formValue.searchType,
      titles: formValue.titles || [],
      skills: formValue.skills || [],
      exclude: formValue.exclude || [],
      location: formValue.location || undefined
    };

    const modal = await this.modalController.create({
      component: SavePresetModalComponent,
      componentProps: {
        payload,
        platformId: 'linkedin',
        mode: formValue.mode
      }
    });

    await modal.present();
  }

  protected navigateToPresets(): void {
    this.router.navigate(['/presets']);
  }

  private initForm(): void {
    this.form = this.fb.group({
      searchType: ['people' as SearchType],
      titles: [[] as string[]],
      skills: [[] as string[]],
      exclude: [[] as string[]],
      location: [''],
      mode: ['linkedin' as SearchMode],
      // Job filters
      sortBy: ['relevant' as SortBy],
      datePosted: ['any' as DatePosted],
      jobTypes: [[] as JobType[]],
      experienceLevels: [[] as ExperienceLevel[]],
      workTypes: [[] as WorkType[]],
      easyApply: [false],
      hasVerifications: [false],
      underTenApplicants: [false],
      // People filters
      connectionLevels: [[] as ConnectionLevel[]],
      profileLanguages: [[] as ProfileLanguage[]],
      firstName: [''],
      lastName: [''],
      keywordTitle: [''],
      keywordCompany: [''],
      keywordSchool: ['']
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
    this.badgeStatus = result.badgeStatus;

    // Generate suggestions
    const payload: QueryPayload = {
      searchType: form.searchType,
      titles: form.titles || [],
      skills: form.skills || [],
      exclude: form.exclude || [],
      location: form.location
    };
    this.suggestions = this.intelligence.generateSuggestions(payload, result.operatorCount);
  }

  protected onApplySuggestion(suggestion: IntelligenceSuggestion): void {
    if (suggestion.suggestedAdds?.titles) {
      const current = this.form.get('titles')?.value || [];
      const merged = this.dedupeArray([...current, ...suggestion.suggestedAdds.titles]);
      this.form.patchValue({ titles: merged });
    }
    if (suggestion.suggestedAdds?.skills) {
      const current = this.form.get('skills')?.value || [];
      const merged = this.dedupeArray([...current, ...suggestion.suggestedAdds.skills]);
      this.form.patchValue({ skills: merged });
    }
    if (suggestion.suggestedAdds?.exclude) {
      const current = this.form.get('exclude')?.value || [];
      const merged = this.dedupeArray([...current, ...suggestion.suggestedAdds.exclude]);
      this.form.patchValue({ exclude: merged });
    }
    suggestion.isApplied = true;
  }

  protected onRemoveSuggestion(suggestion: IntelligenceSuggestion): void {
    if (suggestion.suggestedAdds?.titles) {
      const current = this.form.get('titles')?.value || [];
      const filtered = current.filter((t: string) =>
        !suggestion.suggestedAdds!.titles!.some(s => s.toLowerCase() === t.toLowerCase())
      );
      this.form.patchValue({ titles: filtered });
    }
    if (suggestion.suggestedAdds?.skills) {
      const current = this.form.get('skills')?.value || [];
      const filtered = current.filter((s: string) =>
        !suggestion.suggestedAdds!.skills!.some(sk => sk.toLowerCase() === s.toLowerCase())
      );
      this.form.patchValue({ skills: filtered });
    }
    if (suggestion.suggestedAdds?.exclude) {
      const current = this.form.get('exclude')?.value || [];
      const filtered = current.filter((e: string) =>
        !suggestion.suggestedAdds!.exclude!.some(ex => ex.toLowerCase() === e.toLowerCase())
      );
      this.form.patchValue({ exclude: filtered });
    }
    suggestion.isApplied = false;
  }

  private dedupeArray(arr: string[]): string[] {
    const seen = new Map<string, string>();
    for (const item of arr) {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) seen.set(lower, item);
    }
    return Array.from(seen.values());
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
      mode: 'linkedin',
      sortBy: 'relevant',
      datePosted: 'any',
      jobTypes: [],
      experienceLevels: [],
      workTypes: [],
      easyApply: false,
      hasVerifications: false,
      underTenApplicants: false,
      connectionLevels: [],
      profileLanguages: [],
      firstName: '',
      lastName: '',
      keywordTitle: '',
      keywordCompany: '',
      keywordSchool: ''
    });
  }
}
