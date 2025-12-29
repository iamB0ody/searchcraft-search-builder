import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonToggle,
  IonText,
  IonProgressBar,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  briefcaseOutline,
  arrowForwardOutline,
  arrowBackOutline,
  closeOutline,
  rocketOutline
} from 'ionicons/icons';

import { OnboardingService, UserPersona } from '../../core/services/onboarding.service';
import { SearchType, DatePosted } from '../../models/search-form.model';
import { DEFAULT_SELECTED_SIGNALS } from '../../core/people-signals/hiring-signals.model';

export interface OnboardingResult {
  persona: UserPersona;
  searchType: SearchType;
  titles: string[];
  location?: string;
  platformId: string;
  datePosted?: DatePosted;
  hiringSignalsEnabled?: boolean;
}

type OnboardingStep = 'persona' | 'details';

interface PlatformOption {
  id: string;
  label: string;
  searchTypes: SearchType[];
}

@Component({
  selector: 'app-onboarding-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    IonText,
    IonProgressBar
  ],
  templateUrl: './onboarding-modal.component.html',
  styleUrl: './onboarding-modal.component.scss'
})
export class OnboardingModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly modalController = inject(ModalController);
  private readonly onboardingService = inject(OnboardingService);

  protected currentStep: OnboardingStep = 'persona';
  protected selectedPersona: UserPersona | null = null;

  // Job Seeker form
  protected jobSeekerForm: FormGroup;

  // Recruiter form
  protected recruiterForm: FormGroup;

  // Platform options
  protected readonly jobPlatforms: PlatformOption[] = [
    { id: 'linkedin', label: 'LinkedIn Jobs', searchTypes: ['jobs'] },
    { id: 'google-jobs', label: 'Google Jobs', searchTypes: ['jobs'] },
    { id: 'indeed', label: 'Indeed', searchTypes: ['jobs'] }
  ];

  protected readonly peoplePlatforms: PlatformOption[] = [
    { id: 'linkedin', label: 'LinkedIn', searchTypes: ['people'] },
    { id: 'salesnav', label: 'Sales Navigator', searchTypes: ['people'] }
  ];

  protected readonly datePostedOptions = [
    { value: 'any', label: 'Any time' },
    { value: 'day', label: 'Past 24 hours' },
    { value: 'week', label: 'Past week' },
    { value: 'month', label: 'Past month' }
  ];

  constructor() {
    addIcons({
      personOutline,
      briefcaseOutline,
      arrowForwardOutline,
      arrowBackOutline,
      closeOutline,
      rocketOutline
    });

    // Initialize Job Seeker form
    this.jobSeekerForm = this.fb.group({
      jobTitle: ['', [Validators.required, Validators.minLength(2)]],
      platform: ['linkedin', Validators.required],
      location: [''],
      datePosted: ['any']
    });

    // Initialize Recruiter form
    this.recruiterForm = this.fb.group({
      searchType: ['people' as SearchType],
      roleTitle: ['', [Validators.required, Validators.minLength(2)]],
      location: [''],
      hiringSignals: [true]
    });
  }

  get progress(): number {
    return this.currentStep === 'persona' ? 0.5 : 1;
  }

  get stepTitle(): string {
    if (this.currentStep === 'persona') {
      return 'Who are you?';
    }
    return this.selectedPersona === 'jobSeeker'
      ? 'What job are you looking for?'
      : 'Who are you searching for?';
  }

  get canProceed(): boolean {
    if (this.currentStep === 'persona') {
      return this.selectedPersona !== null;
    }
    if (this.selectedPersona === 'jobSeeker') {
      return this.jobSeekerForm.valid;
    }
    return this.recruiterForm.valid;
  }

  get showHiringSignalsToggle(): boolean {
    return this.selectedPersona === 'recruiter' &&
      this.recruiterForm.get('searchType')?.value === 'people';
  }

  get currentPlatformOptions(): PlatformOption[] {
    if (this.selectedPersona === 'jobSeeker') {
      return this.jobPlatforms;
    }
    const searchType = this.recruiterForm.get('searchType')?.value;
    return searchType === 'people' ? this.peoplePlatforms : this.jobPlatforms;
  }

  protected selectPersona(persona: UserPersona): void {
    this.selectedPersona = persona;
  }

  protected onContinue(): void {
    if (this.currentStep === 'persona' && this.selectedPersona) {
      this.currentStep = 'details';
      // Reset platform selection when switching to recruiter People search
      if (this.selectedPersona === 'recruiter') {
        this.recruiterForm.patchValue({ platform: 'linkedin' });
      }
    } else if (this.currentStep === 'details') {
      this.completeOnboarding();
    }
  }

  protected onBack(): void {
    if (this.currentStep === 'details') {
      this.currentStep = 'persona';
    }
  }

  protected async onSkip(): Promise<void> {
    this.onboardingService.skipOnboarding();
    await this.modalController.dismiss(null, 'skip');
  }

  private async completeOnboarding(): Promise<void> {
    if (!this.selectedPersona) return;

    let result: OnboardingResult;

    if (this.selectedPersona === 'jobSeeker') {
      const form = this.jobSeekerForm.value;
      result = {
        persona: 'jobSeeker',
        searchType: 'jobs',
        titles: [form.jobTitle.trim()],
        location: form.location?.trim() || undefined,
        platformId: form.platform,
        datePosted: form.datePosted !== 'any' ? form.datePosted : undefined
      };
    } else {
      const form = this.recruiterForm.value;
      result = {
        persona: 'recruiter',
        searchType: form.searchType,
        titles: [form.roleTitle.trim()],
        location: form.location?.trim() || undefined,
        platformId: form.searchType === 'people' ? 'linkedin' : 'linkedin',
        hiringSignalsEnabled: form.searchType === 'people' ? form.hiringSignals : undefined
      };
    }

    this.onboardingService.completeOnboarding(this.selectedPersona);
    await this.modalController.dismiss(result, 'complete');
  }

  protected onSearchTypeChange(): void {
    // Reset hiring signals when switching to jobs
    const searchType = this.recruiterForm.get('searchType')?.value;
    if (searchType === 'jobs') {
      this.recruiterForm.patchValue({ hiringSignals: false });
    } else {
      this.recruiterForm.patchValue({ hiringSignals: true });
    }
  }
}
