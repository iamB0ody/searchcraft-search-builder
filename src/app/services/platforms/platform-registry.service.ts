import { Injectable, inject, signal, computed } from '@angular/core';
import { PlatformAdapter, PlatformId } from '../../models/platform.model';
import { SearchType } from '../../models/search-form.model';
import { FeatureFlagService } from '../../core/feature-flags/feature-flag.service';
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
// Posts Platforms
import { LinkedInPostsPlatformAdapter } from './linkedin-posts-platform.adapter';
import { XSearchPlatformAdapter } from './x-search-platform.adapter';
import { RedditSearchPlatformAdapter } from './reddit-search-platform.adapter';
import { GooglePostsLinkedInPlatformAdapter } from './google-posts-linkedin-platform.adapter';
import { GooglePostsXPlatformAdapter } from './google-posts-x-platform.adapter';
import { GooglePostsRedditPlatformAdapter } from './google-posts-reddit-platform.adapter';

@Injectable({ providedIn: 'root' })
export class PlatformRegistryService {
  private readonly featureFlags = inject(FeatureFlagService);

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
  // Posts platforms
  private readonly linkedinPostsAdapter = inject(LinkedInPostsPlatformAdapter);
  private readonly xSearchAdapter = inject(XSearchPlatformAdapter);
  private readonly redditSearchAdapter = inject(RedditSearchPlatformAdapter);
  private readonly googlePostsLinkedInAdapter = inject(GooglePostsLinkedInPlatformAdapter);
  private readonly googlePostsXAdapter = inject(GooglePostsXPlatformAdapter);
  private readonly googlePostsRedditAdapter = inject(GooglePostsRedditPlatformAdapter);

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
    // Register Posts platforms
    this.register(this.linkedinPostsAdapter);
    this.register(this.xSearchAdapter);
    this.register(this.redditSearchAdapter);
    this.register(this.googlePostsLinkedInAdapter);
    this.register(this.googlePostsXAdapter);
    this.register(this.googlePostsRedditAdapter);
  }

  register(adapter: PlatformAdapter): void {
    this.platforms.set(adapter.id, adapter);
  }

  /**
   * Set current platform by ID
   * Falls back to first enabled platform if requested platform is disabled
   */
  setCurrentPlatform(id: string): void {
    // Check if platform is disabled via feature flags
    if (!this.featureFlags.isPlatformEnabled(id as PlatformId)) {
      const fallback = this.getFirstEnabledPlatform();
      if (fallback) {
        this.currentPlatformId.set(fallback.id);
      }
      return;
    }

    if (this.platforms.has(id)) {
      this.currentPlatformId.set(id);
    }
  }

  getPlatformById(id: string): PlatformAdapter | undefined {
    return this.platforms.get(id);
  }

  /**
   * Get all platforms that are enabled via feature flags
   */
  getEnabledPlatforms(): PlatformAdapter[] {
    return Array.from(this.platforms.values())
      .filter(p => this.featureFlags.isPlatformEnabled(p.id as PlatformId));
  }

  /**
   * Get the first enabled platform (for fallback scenarios)
   */
  getFirstEnabledPlatform(): PlatformAdapter | undefined {
    return this.getEnabledPlatforms()[0];
  }

  /**
   * Get platforms that support a specific search type
   * Filters by both feature flags and search type support
   */
  getPlatformsForSearchType(searchType: SearchType): PlatformAdapter[] {
    return this.getEnabledPlatforms()
      .filter(p => p.supportedSearchTypes.includes(searchType));
  }
}
