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
  IonNote,
  IonToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, peopleOutline, briefcaseOutline } from 'ionicons/icons';

import { ChipInputComponent } from '../../components/chip-input/chip-input.component';
import { PreviewComponent } from '../../components/preview/preview.component';
import { BooleanBuilderService } from '../../services/boolean-builder.service';
import { LinkedinUrlBuilderService } from '../../services/linkedin-url-builder.service';
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
  ProfileLanguage
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
    IonIcon,
    IonNote,
    IonToggle,
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
