import { Component, OnInit, inject, DestroyRef, ViewChild, ElementRef } from '@angular/core';
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
  IonCheckbox,
  IonBadge,
  IonFooter,
  IonToolbar,
  ModalController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trashOutline,
  peopleOutline,
  briefcaseOutline,
  newspaperOutline,
  chevronDownOutline,
  saveOutline,
  warningOutline,
  informationCircleOutline,
  arrowDownOutline,
  arrowForwardOutline,
  // Platform logos
  logoLinkedin, logoGoogle, logoTwitter, logoReddit,
  // Generic platform icons
  briefcase, searchOutline, business
} from 'ionicons/icons';

import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { ChipInputComponent } from '../../components/chip-input/chip-input.component';
import { PreviewComponent } from '../../components/preview/preview.component';
import { SuggestionsComponent } from '../../components/suggestions/suggestions.component';
import { ImportSearchModalComponent } from '../../components/import-search-modal/import-search-modal.component';
import { SavePresetModalComponent } from '../../features/presets/components/save-preset-modal/save-preset-modal.component';
import { OnboardingModalComponent, OnboardingResult } from '../../components/onboarding-modal/onboarding-modal.component';
import { OnboardingService } from '../../core/services/onboarding.service';
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
import { HiringSignalId, HiringSignalsState, HiringSignalDefinition, DEFAULT_SELECTED_SIGNALS } from '../../core/people-signals/hiring-signals.model';
import { HIRING_SIGNALS_CATALOG } from '../../core/people-signals/hiring-signals.catalog';
import { applyHiringSignals, HiringSignalsExplanation } from '../../core/people-signals/apply-hiring-signals';
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
import { PostsPayload, PostsDateRange, createDefaultPostsPayload, HIRING_INTENT_PHRASES, OPEN_TO_WORK_INTENT_PHRASES, REMOTE_INTENT_PHRASES } from '../../models/posts-payload.model';

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
    IonCheckbox,
    IonBadge,
    IonFooter,
    IonToolbar,
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
  private readonly alertController = inject(AlertController);

  // Platform services
  protected readonly platformRegistry = inject(PlatformRegistryService);
  protected readonly googleJobsAdapter = inject(GoogleJobsPlatformAdapter);
  protected readonly indeedAdapter = inject(IndeedPlatformAdapter);
  private readonly featureFlags = inject(FeatureFlagService);
  private readonly onboardingService = inject(OnboardingService);

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
  protected postsInjectedPhrases: string[] = [];

  // Preview scroll/highlight state
  @ViewChild('previewSection', { read: ElementRef }) previewSection!: ElementRef;
  protected showPreviewHighlight = false;
  private hasScrolledToPreview = false;
  private readonly SCROLL_NUDGE_KEY = 'searchcraft_preview_nudge_shown';

  // Emotional mode config for template access
  protected readonly emotionalModeConfig = EMOTIONAL_MODE_CONFIG;

  // Hiring signals config for template access
  protected readonly hiringSignalsCatalog = HIRING_SIGNALS_CATALOG;
  protected hiringSignalsExplanation: HiringSignalsExplanation | null = null;

  // Get current emotional mode description for template
  protected get currentEmotionalModeDescription(): string {
    const mode = this.form?.get('emotionalMode')?.value || 'normal';
    return EMOTIONAL_MODE_CONFIG[mode as EmotionalSearchMode]?.description || '';
  }

  // Check if hiring signals section should be shown (People + LinkedIn/SalesNav only)
  protected get showHiringSignals(): boolean {
    return this.isPeopleSearch && this.showLinkedInFilters;
  }

  // Check if people location section should be shown (People search only)
  protected get showPeopleLocation(): boolean {
    return this.isPeopleSearch;
  }

  // Check if posts builder section should be shown
  protected get showPostsBuilder(): boolean {
    return this.isPostsSearch;
  }

  // Check if main builder section (titles/skills/exclude) should be shown (not posts)
  protected get showMainBuilder(): boolean {
    return !this.isPostsSearch;
  }

  protected readonly searchTypes: { value: SearchType; label: string; icon: string }[] = [
    { value: 'people', label: 'People', icon: 'people-outline' },
    { value: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
    { value: 'posts', label: 'Posts', icon: 'newspaper-outline' }
  ];

  protected readonly searchModes: { value: SearchMode; label: string }[] = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'salesnav', label: 'Sales Navigator' },
    { value: 'recruiter', label: 'Recruiter' }
  ];

  protected readonly datePostedOptions: { value: DatePosted; label: string }[] = [
    { value: 'any', label: 'Any time' },
    { value: 'hour', label: 'Past hour' },
    { value: 'hours2', label: 'Past 2 hours' },
    { value: 'hours6', label: 'Past 6 hours' },
    { value: 'hours12', label: 'Past 12 hours' },
    { value: 'day', label: 'Past 24 hours' },
    { value: 'days3', label: 'Past 3 days' },
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

  // Posts date range options
  protected readonly postsDateRangeOptions: { value: PostsDateRange; label: string }[] = [
    { value: 'any', label: 'Any time' },
    { value: '24h', label: 'Past 24 hours' },
    { value: '7d', label: 'Past 7 days' }
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
      newspaperOutline,
      chevronDownOutline,
      saveOutline,
      warningOutline,
      informationCircleOutline,
      arrowDownOutline,
      arrowForwardOutline,
      // Platform logos
      logoLinkedin, logoGoogle, logoTwitter, logoReddit,
      // Generic platform icons
      briefcase, searchOutline, business
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
    await this.checkForOnboarding();
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
        this.applyPreset(preset.payload, preset.platformId, preset.mode, preset.emotionalMode, preset.hiringSignals);
        this.toast.showSuccess(`Preset "${preset.name}" applied`);
      }
    } else if (state?.historyPayload) {
      // Apply from history
      this.applyPreset(state.historyPayload, state.historyPlatformId, state.historyMode, state.historyEmotionalMode, state.historyHiringSignals);
      this.toast.showSuccess('Search loaded from history');
    } else if (state?.onboardingPayload) {
      // Apply from onboarding
      this.applyPreset(
        state.onboardingPayload,
        state.onboardingPlatformId,
        undefined,
        undefined,
        state.onboardingHiringSignals
      );
      this.toast.showSuccess('Search ready! Customize and go.');
    }
  }

  private async checkForOnboarding(): Promise<void> {
    if (this.featureFlags.isOnboardingEnabled() && !this.onboardingService.hasCompletedOnboarding()) {
      await this.showOnboardingModal();
    }
  }

  private async showOnboardingModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: OnboardingModalComponent,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      handle: false,
      backdropDismiss: false
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss<OnboardingResult>();

    if (role === 'complete' && data) {
      this.applyOnboardingResult(data);
    }
  }

  private applyOnboardingResult(result: OnboardingResult): void {
    // Set platform
    this.platformRegistry.setCurrentPlatform(result.platformId);

    // Build payload
    const payload: QueryPayload = {
      searchType: result.searchType,
      titles: result.titles,
      skills: [],
      exclude: [],
      location: result.location
    };

    // Build hiring signals state if enabled
    const hiringSignals: HiringSignalsState | undefined = result.hiringSignalsEnabled
      ? { enabled: true, selected: DEFAULT_SELECTED_SIGNALS }
      : undefined;

    // Apply to form
    this.applyPreset(payload, result.platformId, undefined, undefined, hiringSignals);

    // Handle date posted for job searches
    if (result.datePosted) {
      this.form.patchValue({ datePosted: result.datePosted });
    }

    this.toast.showSuccess('Search ready! Customize and go.');
  }

  private applyPreset(
    payload: QueryPayload,
    platformId?: string,
    mode?: SearchMode,
    emotionalMode?: EmotionalSearchMode,
    hiringSignals?: HiringSignalsState
  ): void {
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
      peopleLocation: payload.peopleLocation?.value || '',
      mode: mode || 'linkedin',
      emotionalMode: emotionalMode || 'normal',
      hiringSignalsEnabled: hiringSignals?.enabled || false,
      hiringSignalsSelected: hiringSignals?.selected || []
    });
  }

  protected async openSavePresetModal(): Promise<void> {
    const formValue = this.form.value as SearchFormModel & {
      emotionalMode?: EmotionalSearchMode;
      hiringSignalsEnabled?: boolean;
      hiringSignalsSelected?: HiringSignalId[];
      peopleLocation?: string;
    };
    const platform = this.platformRegistry.currentPlatform();

    const payload: QueryPayload = {
      searchType: formValue.searchType,
      titles: formValue.titles || [],
      skills: formValue.skills || [],
      exclude: formValue.exclude || [],
      location: formValue.location || undefined,
      peopleLocation: formValue.peopleLocation?.trim()
        ? { value: formValue.peopleLocation.trim() }
        : undefined
    };

    // Build hiring signals state
    const hiringSignals: HiringSignalsState = {
      enabled: formValue.hiringSignalsEnabled || false,
      selected: formValue.hiringSignalsSelected || []
    };

    const modal = await this.modalController.create({
      component: SavePresetModalComponent,
      componentProps: {
        payload,
        platformId: platform.id,
        mode: formValue.mode,
        emotionalMode: formValue.emotionalMode || 'normal',
        hiringSignals
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
      inYourNetwork: [false],
      fairChanceEmployer: [false],
      // People filters
      connectionLevels: [[] as ConnectionLevel[]],
      profileLanguages: [[] as ProfileLanguage[]],
      firstName: [''],
      lastName: [''],
      keywordTitle: [''],
      keywordCompany: [''],
      keywordSchool: [''],
      peopleLocation: [''],
      // Hiring signals (People search only)
      hiringSignalsEnabled: [false],
      hiringSignalsSelected: [[] as HiringSignalId[]],
      // Posts filters
      postsKeywords: [[] as string[]],
      postsAnyOfPhrases: [[] as string[]],
      postsMustIncludePhrases: [[] as string[]],
      postsExcludePhrases: [[] as string[]],
      postsHashtags: [[] as string[]],
      postsLocationText: [''],
      postsDateRange: ['any' as PostsDateRange],
      includeHiringIntent: [false],
      includeOpenToWorkIntent: [false],
      includeRemoteIntent: [false]
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
    // Extract extended fields from form
    const formWithExtras = form as SearchFormModel & {
      emotionalMode?: EmotionalSearchMode;
      hiringSignalsEnabled?: boolean;
      hiringSignalsSelected?: HiringSignalId[];
      peopleLocation?: string;
      // Posts fields
      postsKeywords?: string[];
      postsAnyOfPhrases?: string[];
      postsMustIncludePhrases?: string[];
      postsExcludePhrases?: string[];
      postsHashtags?: string[];
      postsLocationText?: string;
      postsDateRange?: PostsDateRange;
      includeHiringIntent?: boolean;
      includeOpenToWorkIntent?: boolean;
      includeRemoteIntent?: boolean;
    };

    // Build hiring signals state
    const hiringSignals: HiringSignalsState = {
      enabled: formWithExtras.hiringSignalsEnabled || false,
      selected: formWithExtras.hiringSignalsSelected || []
    };

    // Build posts payload if in posts mode
    let postsPayload: PostsPayload | undefined;
    if (form.searchType === 'posts') {
      postsPayload = {
        keywords: formWithExtras.postsKeywords || [],
        anyOfPhrases: formWithExtras.postsAnyOfPhrases || [],
        mustIncludePhrases: formWithExtras.postsMustIncludePhrases || [],
        excludePhrases: formWithExtras.postsExcludePhrases || [],
        hashtags: formWithExtras.postsHashtags || [],
        locationText: formWithExtras.postsLocationText || '',
        dateRange: formWithExtras.postsDateRange || 'any',
        includeHiringIntent: formWithExtras.includeHiringIntent || false,
        includeOpenToWorkIntent: formWithExtras.includeOpenToWorkIntent || false,
        includeRemoteIntent: formWithExtras.includeRemoteIntent || false
      };

      // Compute injected phrases for transparency
      const injected: string[] = [];
      if (postsPayload.includeHiringIntent) {
        injected.push(...HIRING_INTENT_PHRASES);
      }
      if (postsPayload.includeOpenToWorkIntent) {
        injected.push(...OPEN_TO_WORK_INTENT_PHRASES);
      }
      if (postsPayload.includeRemoteIntent) {
        injected.push(...REMOTE_INTENT_PHRASES);
      }
      this.postsInjectedPhrases = injected;
    } else {
      this.postsInjectedPhrases = [];
    }

    // Build payload from form
    const payload: QueryPayload = {
      searchType: form.searchType,
      titles: form.titles || [],
      skills: form.skills || [],
      exclude: form.exclude || [],
      location: form.location || undefined,
      emotionalMode: formWithExtras.emotionalMode || 'normal',
      hiringSignals,
      peopleLocation: formWithExtras.peopleLocation?.trim()
        ? { value: formWithExtras.peopleLocation.trim() }
        : undefined,
      postsPayload,
      filters: form as unknown as Record<string, unknown> // Pass full form for LinkedIn-specific URL filters
    };

    // Apply emotional mode transformation BEFORE platform adapter (skip for posts)
    const emotionalMode = formWithExtras.emotionalMode || 'normal';
    let finalPayload = payload;
    if (form.searchType !== 'posts') {
      const { payload: emotionalPayload, adjustments, useOrForSkills } = applyEmotionalMode(payload, emotionalMode);
      this.emotionalAdjustments = adjustments;
      this.useOrForSkills = useOrForSkills;
      finalPayload = emotionalPayload;
    } else {
      this.emotionalAdjustments = [];
      this.useOrForSkills = false;
    }

    // Apply hiring signals transformation AFTER emotional mode (skip for posts)
    const platform = this.platformRegistry.currentPlatform();
    if (form.searchType !== 'posts') {
      const { payload: signalPayload, explanation } = applyHiringSignals(
        finalPayload,
        platform.getCapabilities()
      );
      this.hiringSignalsExplanation = explanation;
      finalPayload = signalPayload;
    } else {
      this.hiringSignalsExplanation = null;
    }

    // Use current platform adapter with fully adjusted payload
    const result = platform.buildQuery(finalPayload);

    this.booleanQuery = result.query;
    this.searchUrl = result.query ? platform.buildUrl(finalPayload, result.query) : '';
    this.warnings = result.warnings;
    this.operatorCount = result.operatorCount;
    this.badgeStatus = result.badgeStatus;

    // Calculate quality score (pass platformId, emotionalMode, and hiringSignals for scoring)
    this.qualityScoreResult = this.qualityScoreService.calculateScore({
      titles: finalPayload.titles || [],
      skills: finalPayload.skills || [],
      exclude: finalPayload.exclude || [],
      booleanQuery: result.query,
      operatorCount: result.operatorCount,
      warnings: result.warnings
    }, platform.id, emotionalMode, this.hiringSignalsExplanation);

    // Generate suggestions using adjusted payload (skip for posts)
    if (form.searchType !== 'posts') {
      this.suggestions = this.intelligence.generateSuggestions(finalPayload, result.operatorCount);
    } else {
      this.suggestions = [];
    }

    // Auto-scroll to preview on first valid result (mobile only)
    this.autoScrollToPreviewIfNeeded();
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

    // If switching to 'people' while on jobs-only platform, switch to LinkedIn
    if (newSearchType === 'people' && this.currentPlatformId === 'google-jobs') {
      this.platformRegistry.setCurrentPlatform('linkedin');
      this.toast.showInfo('Switched to LinkedIn for people search.');
    }

    // If switching to 'posts', switch to first posts platform
    if (newSearchType === 'posts') {
      const postsPlatforms = this.platformRegistry.getPlatformsForSearchType('posts');
      if (postsPlatforms.length > 0) {
        this.platformRegistry.setCurrentPlatform(postsPlatforms[0].id);
      }

      // Apply persona-based intent defaults
      const persona = this.onboardingService.getPersona();
      if (persona === 'jobSeeker') {
        this.form.patchValue({ includeHiringIntent: true, includeOpenToWorkIntent: false });
      } else if (persona === 'recruiter') {
        this.form.patchValue({ includeHiringIntent: false, includeOpenToWorkIntent: true });
      }
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

    // Posts-only platforms
    const postsOnlyPlatforms = [
      'linkedin-posts', 'x-search', 'reddit-search',
      'google-posts-linkedin', 'google-posts-x', 'google-posts-reddit'
    ];

    const currentSearchType = this.form.get('searchType')?.value;

    if (jobsOnlyPlatforms.includes(platformId) && currentSearchType !== 'jobs') {
      this.form.patchValue({ searchType: 'jobs' });
      this.toast.showInfo('This platform supports job searches only.');
    }

    if (postsOnlyPlatforms.includes(platformId) && currentSearchType !== 'posts') {
      this.form.patchValue({ searchType: 'posts' });
      this.toast.showInfo('This platform supports posts searches only.');
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

  protected get isPostsSearch(): boolean {
    return this.form.get('searchType')?.value === 'posts';
  }

  protected get isPeopleSearch(): boolean {
    return this.form.get('searchType')?.value === 'people';
  }

  protected getLinkedInJobsFilters(): { datePosted?: string; inYourNetwork?: boolean; fairChanceEmployer?: boolean } | undefined {
    if (!this.isJobsSearch || !this.showLinkedInFilters) return undefined;
    const form = this.form.value;
    return {
      datePosted: form.datePosted,
      inYourNetwork: form.inYourNetwork,
      fairChanceEmployer: form.fairChanceEmployer
    };
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
      inYourNetwork: false,
      fairChanceEmployer: false,
      connectionLevels: [],
      profileLanguages: [],
      firstName: '',
      lastName: '',
      keywordTitle: '',
      keywordCompany: '',
      keywordSchool: '',
      peopleLocation: '',
      hiringSignalsEnabled: false,
      hiringSignalsSelected: [],
      // Posts fields
      postsKeywords: [],
      postsAnyOfPhrases: [],
      postsMustIncludePhrases: [],
      postsExcludePhrases: [],
      postsHashtags: [],
      postsLocationText: '',
      postsDateRange: 'any',
      includeHiringIntent: false,
      includeOpenToWorkIntent: false,
      includeRemoteIntent: false
    });
  }

  // Hiring signals handlers
  protected onHiringSignalsToggle(enabled: boolean): void {
    if (enabled) {
      // Preselect defaults when first enabled
      const current = this.form.get('hiringSignalsSelected')?.value || [];
      if (current.length === 0) {
        this.form.patchValue({ hiringSignalsSelected: DEFAULT_SELECTED_SIGNALS });
      }
    }
  }

  protected onSignalToggle(signalId: HiringSignalId, checked: boolean): void {
    const current: HiringSignalId[] = this.form.get('hiringSignalsSelected')?.value || [];
    let updated: HiringSignalId[];

    if (checked) {
      updated = [...current, signalId];
    } else {
      updated = current.filter(id => id !== signalId);
    }

    this.form.patchValue({ hiringSignalsSelected: updated });
  }

  protected async showSignalInfo(signal: HiringSignalDefinition, event: Event): Promise<void> {
    event.stopPropagation();

    const phrases = [
      ...signal.includePhrases.map(p => `+ ${p}`),
      ...signal.excludePhrases.map(p => `- ${p}`)
    ].join('\n');

    const alert = await this.alertController.create({
      header: signal.title,
      message: `This signal adds the following phrases:\n\n${phrases}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  protected onExecuteSearch(): void {
    if (!this.searchUrl) return;

    const formValue = this.form.value as SearchFormModel & {
      emotionalMode?: EmotionalSearchMode;
      hiringSignalsEnabled?: boolean;
      hiringSignalsSelected?: HiringSignalId[];
      peopleLocation?: string;
    };
    const platform = this.platformRegistry.currentPlatform();
    const emotionalMode = formValue.emotionalMode || 'normal';

    // Build hiring signals state
    const hiringSignals: HiringSignalsState = {
      enabled: formValue.hiringSignalsEnabled || false,
      selected: formValue.hiringSignalsSelected || []
    };

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
        location: formValue.location || undefined,
        peopleLocation: formValue.peopleLocation?.trim()
          ? { value: formValue.peopleLocation.trim() }
          : undefined
      },
      booleanQuery: this.booleanQuery,
      url: this.searchUrl,
      operatorCount: this.operatorCount,
      emotionalMode,
      hiringSignals
    });

    // Open in new tab
    window.open(this.searchUrl, '_blank', 'noopener,noreferrer');
  }

  protected async onShareSearch(): Promise<void> {
    const formValue = this.form.value as SearchFormModel & { peopleLocation?: string };
    const platform = this.platformRegistry.currentPlatform();

    const state: BuilderShareState = {
      schemaVersion: 1,
      payload: {
        searchType: formValue.searchType,
        titles: formValue.titles || [],
        skills: formValue.skills || [],
        exclude: formValue.exclude || [],
        location: formValue.location || undefined,
        peopleLocation: formValue.peopleLocation?.trim()
          ? { value: formValue.peopleLocation.trim() }
          : undefined
      },
      platformId: platform.id,
      mode: formValue.mode
    };

    await this.shareService.shareBuilderState(state);
  }

  /**
   * Scrolls to the preview section and triggers highlight animation.
   * Called by mobile sticky CTA button.
   */
  protected scrollToPreview(): void {
    if (!this.previewSection?.nativeElement) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.previewSection.nativeElement.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });

    // Trigger highlight animation
    this.triggerHighlight();
  }

  /**
   * Triggers the highlight animation on the preview section.
   * Respects reduced motion preferences.
   */
  private triggerHighlight(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    this.showPreviewHighlight = true;
    setTimeout(() => {
      this.showPreviewHighlight = false;
    }, 1500);
  }

  /**
   * Checks if auto-scroll nudge should be shown (first time only).
   * Uses sessionStorage to track per-session nudge state.
   */
  private shouldShowScrollNudge(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    return !sessionStorage.getItem(this.SCROLL_NUDGE_KEY);
  }

  /**
   * Marks the scroll nudge as shown for this session.
   */
  private markScrollNudgeShown(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.SCROLL_NUDGE_KEY, 'true');
    }
  }

  /**
   * Auto-scrolls to preview on first valid result (mobile only).
   * Only triggers once per session.
   */
  private autoScrollToPreviewIfNeeded(): void {
    // Only on mobile (< 992px)
    if (window.innerWidth >= 992) return;

    // Only if we haven't scrolled yet and nudge hasn't been shown
    if (this.hasScrolledToPreview || !this.shouldShowScrollNudge()) return;

    // Only if there's a valid result
    if (!this.booleanQuery || !this.searchUrl) return;

    this.hasScrolledToPreview = true;
    this.markScrollNudgeShown();

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.scrollToPreview();
    }, 300);
  }
}
