import { Injectable, inject, signal, computed } from '@angular/core';
import { PlatformAdapter } from '../../models/platform.model';
import { SearchType } from '../../models/search-form.model';
import { LinkedInPlatformAdapter } from './linkedin-platform.adapter';
import { SalesNavPlatformAdapter } from './salesnav-platform.adapter';
import { GoogleJobsPlatformAdapter } from './google-jobs-platform.adapter';
import { IndeedPlatformAdapter } from './indeed-platform.adapter';

@Injectable({ providedIn: 'root' })
export class PlatformRegistryService {
  private readonly linkedinAdapter = inject(LinkedInPlatformAdapter);
  private readonly salesnavAdapter = inject(SalesNavPlatformAdapter);
  private readonly googleJobsAdapter = inject(GoogleJobsPlatformAdapter);
  private readonly indeedAdapter = inject(IndeedPlatformAdapter);

  private platforms = new Map<string, PlatformAdapter>();
  private currentPlatformId = signal<string>('linkedin');

  readonly currentPlatform = computed(() => {
    return this.platforms.get(this.currentPlatformId())!;
  });

  readonly availablePlatforms = computed(() => {
    return Array.from(this.platforms.values());
  });

  constructor() {
    this.register(this.linkedinAdapter);
    this.register(this.salesnavAdapter);
    this.register(this.googleJobsAdapter);
    this.register(this.indeedAdapter);
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
