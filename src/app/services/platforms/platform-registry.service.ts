import { Injectable, inject, signal, computed } from '@angular/core';
import { PlatformAdapter } from '../../models/platform.model';
import { SearchType } from '../../models/search-form.model';
import { LinkedInPlatformAdapter } from './linkedin-platform.adapter';
import { SalesNavPlatformAdapter } from './salesnav-platform.adapter';
import { GoogleJobsPlatformAdapter } from './google-jobs-platform.adapter';
import { IndeedPlatformAdapter } from './indeed-platform.adapter';
// MENA Job Platforms
import { BaytPlatformAdapter } from './bayt-platform.adapter';
import { GulfTalentPlatformAdapter } from './gulftalent-platform.adapter';
import { NaukriGulfPlatformAdapter } from './naukrigulf-platform.adapter';
import { RecruitNetPlatformAdapter } from './recruitnet-platform.adapter';
import { BeBeePlatformAdapter } from './bebee-platform.adapter';
import { GulfJobsPlatformAdapter } from './gulfjobs-platform.adapter';
import { ArabJobsPlatformAdapter } from './arabjobs-platform.adapter';

@Injectable({ providedIn: 'root' })
export class PlatformRegistryService {
  // Global platforms
  private readonly linkedinAdapter = inject(LinkedInPlatformAdapter);
  private readonly salesnavAdapter = inject(SalesNavPlatformAdapter);
  private readonly googleJobsAdapter = inject(GoogleJobsPlatformAdapter);
  private readonly indeedAdapter = inject(IndeedPlatformAdapter);
  // MENA job platforms
  private readonly baytAdapter = inject(BaytPlatformAdapter);
  private readonly gulfTalentAdapter = inject(GulfTalentPlatformAdapter);
  private readonly naukriGulfAdapter = inject(NaukriGulfPlatformAdapter);
  private readonly recruitNetAdapter = inject(RecruitNetPlatformAdapter);
  private readonly beBeeAdapter = inject(BeBeePlatformAdapter);
  private readonly gulfJobsAdapter = inject(GulfJobsPlatformAdapter);
  private readonly arabJobsAdapter = inject(ArabJobsPlatformAdapter);

  private platforms = new Map<string, PlatformAdapter>();
  private currentPlatformId = signal<string>('linkedin');

  readonly currentPlatform = computed(() => {
    return this.platforms.get(this.currentPlatformId())!;
  });

  readonly availablePlatforms = computed(() => {
    return Array.from(this.platforms.values());
  });

  constructor() {
    // Register global platforms
    this.register(this.linkedinAdapter);
    this.register(this.salesnavAdapter);
    this.register(this.googleJobsAdapter);
    this.register(this.indeedAdapter);
    // Register MENA job platforms
    this.register(this.baytAdapter);
    this.register(this.gulfTalentAdapter);
    this.register(this.naukriGulfAdapter);
    this.register(this.recruitNetAdapter);
    this.register(this.beBeeAdapter);
    this.register(this.gulfJobsAdapter);
    this.register(this.arabJobsAdapter);
  }

  register(adapter: PlatformAdapter): void {
    this.platforms.set(adapter.id, adapter);
  }

  setCurrentPlatform(id: string): void {
    if (this.platforms.has(id)) {
      this.currentPlatformId.set(id);
    }
  }

  getPlatformById(id: string): PlatformAdapter | undefined {
    return this.platforms.get(id);
  }

  /**
   * Get platforms that support a specific search type
   * Filters out platforms that don't support the given type
   */
  getPlatformsForSearchType(searchType: SearchType): PlatformAdapter[] {
    return Array.from(this.platforms.values())
      .filter(p => p.supportedSearchTypes.includes(searchType));
  }
}
