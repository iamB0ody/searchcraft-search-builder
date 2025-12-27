import { Injectable, Inject, PLATFORM_ID, ApplicationRef, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first } from 'rxjs/operators';
import { concat, interval } from 'rxjs';

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Service for managing PWA updates via Angular Service Worker.
 * SSR-safe using isPlatformBrowser guard.
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly isBrowser: boolean;

  /** Whether an update is available */
  readonly updateAvailable = signal(false);

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private readonly swUpdate: SwUpdate,
    private readonly appRef: ApplicationRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.init();
  }

  private init(): void {
    if (!this.isBrowser || !this.swUpdate.isEnabled) {
      return;
    }

    // Listen for version updates
    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.updateAvailable.set(true);
      });

    // Check for updates periodically after app stabilizes
    const appIsStable$ = this.appRef.isStable.pipe(first(isStable => isStable));
    const everyHours$ = interval(CHECK_INTERVAL_MS);
    const checkAfterStable$ = concat(appIsStable$, everyHours$);

    checkAfterStable$.subscribe(() => {
      this.checkForUpdate();
    });
  }

  /**
   * Manually check for updates
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    try {
      return await this.swUpdate.checkForUpdate();
    } catch {
      return false;
    }
  }

  /**
   * Activate the pending update and reload the page
   */
  async activateUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    try {
      await this.swUpdate.activateUpdate();
      if (this.isBrowser) {
        window.location.reload();
      }
    } catch {
      // Failed to activate, try reload anyway
      if (this.isBrowser) {
        window.location.reload();
      }
    }
  }

  /**
   * Dismiss the update notification
   */
  dismissUpdate(): void {
    this.updateAvailable.set(false);
  }
}
