import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import {
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
  warningOutline
} from 'ionicons/icons';

import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { ChipInputComponent } from '../../components/chip-input/chip-input.component';
import { PreviewComponent } from '../../components/preview/preview.component';
import { SuggestionsComponent } from '../../components/suggestions/suggestions.component';
import { ImportSearchModalComponent } from '../../components/import-search-modal/import-search-modal.component';
import { SavePresetModalComponent } from '../../features/presets/components/save-preset-modal/save-preset-modal.component';
import { IntelligenceEngineService } from '../../services/intelligence/intelligence-engine.service';
import { ToastService } from '../../services/toast.service';
import { PresetRepositoryService } from '../../core/services/preset-repository.service';
import { HistoryRepositoryService } from '../../core/services/history-repository.service';
import { ShareService } from '../../core/services/share.service';
import { PlatformRegistryService } from '../../services/platforms/platform-registry.service';
import { GoogleJobsPlatformAdapter } from '../../services/platforms/google-jobs-platform.adapter';
import { IndeedPlatformAdapter, getIndeedRegionOptions } from '../../services/platforms/indeed-platform.adapter';
import { QueryPayload, BuilderShareState, PlatformAdapter, IndeedRegion, PlatformId } from '../../models/platform.model';
import { IntelligenceSuggestion } from '../../models/intelligence.model';
import { QualityScoreResult } from '../../models/quality-score.model';
import { QualityScoreService } from '../../services/quality-score.service';
import { FeatureFlagService } from '../../core/feature-flags/feature-flag.service';
import { EmotionalSearchMode, EMOTIONAL_MODE_CONFIG } from '../../models/emotional-mode.model';
import { applyEmotionalMode } from '../../services/emotional-mode.util';
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
    AppHeaderComponent,
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
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly modalController = inject(ModalController);
  private readonly intelligence = inject(IntelligenceEngineService);
  private readonly qualityScoreService = inject(QualityScoreService);
  private readonly toast = inject(ToastService);
  private readonly presetRepository = inject(PresetRepositoryService);
  private readonly historyRepository = inject(HistoryRepositoryService);
  private readonly shareService = inject(ShareService);

  // Platform services
  protected readonly platformRegistry = inject(PlatformRegistryService);
  protected readonly googleJobsAdapter = inject(GoogleJobsPlatformAdapter);
  protected readonly indeedAdapter = inject(IndeedPlatformAdapter);
  private readonly featureFlags = inject(FeatureFlagService);

  protected form!: FormGroup;
  protected booleanQuery = '';
  protected searchUrl = '';
  protected warnings: string[] = [];
  protected operatorCount = 0;
  protected badgeStatus: BadgeStatus = 'safe';
  protected suggestions: IntelligenceSuggestion[] = [];
  protected qualityScoreResult?: QualityScoreResult;
  protected emotionalAdjustments: string[] = [];
  protected useOrForSkills = false;

  // Emotional mode config for template access
  protected readonly emotionalModeConfig = EMOTIONAL_MODE_CONFIG;

  // Get current emotional mode description for template
  protected get currentEmotionalModeDescription(): string {
    const mode = this.form?.get('emotionalMode')?.value || 'normal';
    return EMOTIONAL_MODE_CONFIG[mode as EmotionalSearchMode]?.description || '';
  }

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

  // Indeed regions for dropdown
  protected readonly indeedRegions = getIndeedRegionOptions();

  // Get platforms available for current search type
  protected get availablePlatforms(): PlatformAdapter[] {
    const searchType = this.form?.get('searchType')?.value || 'people';
    return this.platformRegistry.getPlatformsForSearchType(searchType);
  }

  // Current platform ID
  protected get currentPlatformId(): string {
    return this.platformRegistry.currentPlatform().id;
  }

  // Check if current platform is Google Jobs (for toggle UI)
  protected get isGoogleJobsPlatform(): boolean {
    return this.currentPlatformId === 'google-jobs';
  }

  // Check if current platform is Indeed (for region selector UI)
  protected get isIndeedPlatform(): boolean {
    return this.currentPlatformId === 'indeed';
  }

  // Check if platform supports LinkedIn-specific filters
  protected get showLinkedInFilters(): boolean {
    return this.currentPlatformId === 'linkedin' || this.currentPlatformId === 'salesnav';
  }

  // Check if current platform has limited Boolean support
  protected get hasLimitedBoolean(): boolean {
    const capabilities = this.platformRegistry.currentPlatform().getCapabilities();
    return capabilities.booleanLevel !== 'good';
  }

  // Get current platform's Boolean level for display
  protected get currentBooleanLevel(): string {
    return this.platformRegistry.currentPlatform().getCapabilities().booleanLevel;
  }

  constructor() {
    addIcons({
      trashOutline,
      peopleOutline,
      briefcaseOutline,
      chevronDownOutline,
      saveOutline,
      warningOutline
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

  async ngOnInit(): Promise<void> {
    this.initForm();
    this.setupFormSubscription();
    await this.checkForSharedState();
    this.checkForPresetToApply();
  }

  ionViewWillEnter(): void {
    this.checkForPresetToApply();
  }

  private async checkForSharedState(): Promise<void> {
    const stateParam = this.route.snapshot.queryParamMap.get('state');
    if (!stateParam) return;

    const decoded = this.shareService.decodeBuilderState(stateParam);
    if (!decoded) {
      await this.toast.showError('Invalid shared search link');
      this.clearStateParam();
      return;
    }

    // Show confirmation modal
    const modal = await this.modalController.create({
      component: ImportSearchModalComponent,
      componentProps: { state: decoded }
    });

    await modal.present();
    const { data, role } = await modal.onDidDismiss();

    if (role === 'apply' && data === true) {
      this.applyPreset(decoded.payload, decoded.platformId, decoded.mode);
      await this.toast.showSuccess('Shared search applied');
    }

    // Always clear the param after handling
    this.clearStateParam();
  }

  private clearStateParam(): void {
    // Remove ?state= from URL without navigation
    const url = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: {}
    }).toString();
    this.location.replaceState(url);
  }

  private checkForPresetToApply(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.presetId) {
      const preset = this.presetRepository.getById(state.presetId);
      if (preset) {
        this.presetRepository.touchLastUsedAt(state.presetId);
        this.applyPreset(preset.payload, preset.platformId, preset.mode, preset.emotionalMode);
        this.toast.showSuccess(`Preset "${preset.name}" applied`);
      }
    } else if (state?.historyPayload) {
      // Apply from history
      this.applyPreset(state.historyPayload, state.historyPlatformId, state.historyMode, state.historyEmotionalMode);
      this.toast.showSuccess('Search loaded from history');
    }
  }

  private applyPreset(payload: QueryPayload, platformId?: string, mode?: SearchMode, emotionalMode?: EmotionalSearchMode): void {
    // Validate and set platform with feature flag check
    if (platformId) {
      if (!this.featureFlags.isPlatformEnabled(platformId as PlatformId)) {
        const fallback = this.platformRegistry.getFirstEnabledPlatform();
        if (fallback) {
          this.toast.showWarning(`Platform "${platformId}" is disabled. Using ${fallback.label}.`);
          this.platformRegistry.setCurrentPlatform(fallback.id);
        }
      } else {
        this.platformRegistry.setCurrentPlatform(platformId);
      }
    }

    this.form.patchValue({
      searchType: payload.searchType,
      titles: payload.titles || [],
      skills: payload.skills || [],
      exclude: payload.exclude || [],
      location: payload.location || '',
      mode: mode || 'linkedin',
      emotionalMode: emotionalMode || 'normal'
    });
  }

  protected async openSavePresetModal(): Promise<void> {
    const formValue = this.form.value as SearchFormModel & { emotionalMode?: EmotionalSearchMode };
    const platform = this.platformRegistry.currentPlatform();

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
        platformId: platform.id,
        mode: formValue.mode,
        emotionalMode: formValue.emotionalMode || 'normal'
      }
    });

    await modal.present();
  }

  private initForm(): void {
    this.form = this.fb.group({
      searchType: ['people' as SearchType],
      titles: [[] as string[]],
      skills: [[] as string[]],
      exclude: [[] as string[]],
      location: [''],
      mode: ['linkedin' as SearchMode],
      emotionalMode: ['normal' as EmotionalSearchMode],
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
    // Build payload from form
    const payload: QueryPayload = {
      searchType: form.searchType,
      titles: form.titles || [],
      skills: form.skills || [],
      exclude: form.exclude || [],
      location: form.location || undefined,
      emotionalMode: (form as SearchFormModel & { emotionalMode?: EmotionalSearchMode }).emotionalMode || 'normal',
      filters: form as unknown as Record<string, unknown> // Pass full form for LinkedIn-specific URL filters
    };

    // Apply emotional mode transformation BEFORE platform adapter
    const emotionalMode = (form as SearchFormModel & { emotionalMode?: EmotionalSearchMode }).emotionalMode || 'normal';
    const { payload: adjustedPayload, adjustments, useOrForSkills } = applyEmotionalMode(payload, emotionalMode);
    this.emotionalAdjustments = adjustments;
    this.useOrForSkills = useOrForSkills;

    // Use current platform adapter with adjusted payload
    const platform = this.platformRegistry.currentPlatform();
    const result = platform.buildQuery(adjustedPayload);

    this.booleanQuery = result.query;
    this.searchUrl = result.query ? platform.buildUrl(adjustedPayload, result.query) : '';
    this.warnings = result.warnings;
    this.operatorCount = result.operatorCount;
    this.badgeStatus = result.badgeStatus;

    // Calculate quality score (pass platformId and emotionalMode for platform-specific scoring)
    this.qualityScoreResult = this.qualityScoreService.calculateScore({
      titles: adjustedPayload.titles || [],
      skills: adjustedPayload.skills || [],
      exclude: adjustedPayload.exclude || [],
      booleanQuery: result.query,
      operatorCount: result.operatorCount,
      warnings: result.warnings
    }, platform.id, emotionalMode);

    // Generate suggestions using adjusted payload
    this.suggestions = this.intelligence.generateSuggestions(adjustedPayload, result.operatorCount);
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
    const newSearchType = event.detail.value as SearchType;

    // If switching to 'people' while on Google Jobs, switch platform to LinkedIn
    if (newSearchType === 'people' && this.currentPlatformId === 'google-jobs') {
      this.platformRegistry.setCurrentPlatform('linkedin');
      this.toast.showInfo('Switched to LinkedIn for people search.');
    }

    this.form.patchValue({ searchType: newSearchType });

    // Check if current platform supports the new search type
    const currentPlatform = this.platformRegistry.currentPlatform();
    if (!currentPlatform.supportedSearchTypes.includes(newSearchType)) {
      // Switch to first platform that supports the new search type
      const supportedPlatforms = this.platformRegistry.getPlatformsForSearchType(newSearchType);
      if (supportedPlatforms.length > 0) {
        this.platformRegistry.setCurrentPlatform(supportedPlatforms[0].id);
      }
    }
  }

  protected onPlatformChange(platformId: string): void {
    this.platformRegistry.setCurrentPlatform(platformId);

    // Jobs-only platforms: Google Jobs, Indeed, and all MENA platforms
    const jobsOnlyPlatforms = [
      'google-jobs', 'indeed',
      'bayt', 'gulftalent', 'naukrigulf', 'recruitnet', 'bebee', 'gulfjobs', 'arabjobs'
    ];

    if (jobsOnlyPlatforms.includes(platformId) && this.form.get('searchType')?.value === 'people') {
      this.form.patchValue({ searchType: 'jobs' });
      this.toast.showInfo('This platform supports job searches only.');
    }

    // Trigger preview update
    this.updatePreview(this.form.value);
  }

  protected onGoogleJobsLocationToggleChange(includeLocation: boolean): void {
    this.googleJobsAdapter.includeLocationKeyword.set(includeLocation);
    this.updatePreview(this.form.value);
  }

  protected onGoogleJobsSkillsJoinerChange(joiner: 'OR' | 'AND'): void {
    this.googleJobsAdapter.skillsJoiner.set(joiner);
    this.updatePreview(this.form.value);
  }

  protected onIndeedRegionChange(region: IndeedRegion): void {
    this.indeedAdapter.currentRegion.set(region);
    this.updatePreview(this.form.value);
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
      emotionalMode: 'normal',
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

  protected onExecuteSearch(): void {
    if (!this.searchUrl) return;

    const formValue = this.form.value as SearchFormModel & { emotionalMode?: EmotionalSearchMode };
    const platform = this.platformRegistry.currentPlatform();
    const emotionalMode = formValue.emotionalMode || 'normal';

    // Add to history
    this.historyRepository.add({
      platformId: platform.id,
      searchType: formValue.searchType,
      mode: formValue.mode,
      payload: {
        searchType: formValue.searchType,
        titles: formValue.titles || [],
        skills: formValue.skills || [],
        exclude: formValue.exclude || [],
        location: formValue.location || undefined
      },
      booleanQuery: this.booleanQuery,
      url: this.searchUrl,
      operatorCount: this.operatorCount,
      emotionalMode
    });

    // Open in new tab
    window.open(this.searchUrl, '_blank', 'noopener,noreferrer');
  }

  protected async onShareSearch(): Promise<void> {
    const formValue = this.form.value as SearchFormModel;
    const platform = this.platformRegistry.currentPlatform();

    const state: BuilderShareState = {
      schemaVersion: 1,
      payload: {
        searchType: formValue.searchType,
        titles: formValue.titles || [],
        skills: formValue.skills || [],
        exclude: formValue.exclude || [],
        location: formValue.location || undefined
      },
      platformId: platform.id,
      mode: formValue.mode
    };

    await this.shareService.shareBuilderState(state);
  }
}
