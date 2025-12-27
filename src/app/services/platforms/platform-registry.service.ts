import { Injectable, inject, signal, computed } from '@angular/core';
import { PlatformAdapter } from '../../models/platform.model';
import { LinkedInPlatformAdapter } from './linkedin-platform.adapter';

@Injectable({ providedIn: 'root' })
export class PlatformRegistryService {
  private readonly linkedinAdapter = inject(LinkedInPlatformAdapter);

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
}
