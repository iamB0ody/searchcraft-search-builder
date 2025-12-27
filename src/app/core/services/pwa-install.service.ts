import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocalStorageAdapter } from '../storage/local-storage.adapter';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = 'sc-pwa-dismiss-timestamp';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Service for managing PWA installation prompts.
 * SSR-safe using isPlatformBrowser guard.
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private readonly isBrowser: boolean;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  /** Whether the install prompt can be shown (Chrome/Edge) */
  readonly canInstall = signal(false);

  /** Whether the app is already installed as PWA */
  readonly isInstalled = signal(false);

  /** Whether running on iOS Safari (needs manual install guidance) */
  readonly isIosSafari = signal(false);

  /** Whether install prompt was recently dismissed */
  readonly isDismissed = signal(false);

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private readonly storage: LocalStorageAdapter
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.init();
  }

  private init(): void {
    if (!this.isBrowser) {
      return;
    }

    // Check if already installed
    this.checkInstallState();

    // Detect iOS Safari
    this.detectIosSafari();

    // Check if previously dismissed
    this.checkDismissState();

    // Listen for install prompt event (Chrome/Edge)
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', this.handleAppInstalled);
  }

  private checkInstallState(): void {
    // Check display-mode media query
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // Check iOS standalone property
    const isIosStandalone = (navigator as { standalone?: boolean }).standalone === true;

    this.isInstalled.set(isStandalone || isIosStandalone);
  }

  private detectIosSafari(): void {
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isWebkit = /WebKit/.test(ua);
    const isChrome = /CriOS/.test(ua);
    const isFirefox = /FxiOS/.test(ua);

    // iOS Safari = iOS + WebKit but not Chrome/Firefox
    this.isIosSafari.set(isIos && isWebkit && !isChrome && !isFirefox && !this.isInstalled());
  }

  private checkDismissState(): void {
    const dismissedAtStr = this.storage.get(DISMISS_STORAGE_KEY);
    if (dismissedAtStr) {
      const dismissedAt = parseInt(dismissedAtStr, 10);
      if (!isNaN(dismissedAt)) {
        const elapsed = Date.now() - dismissedAt;
        this.isDismissed.set(elapsed < DISMISS_DURATION_MS);

        // Clear expired dismissal
        if (elapsed >= DISMISS_DURATION_MS) {
          this.storage.remove(DISMISS_STORAGE_KEY);
        }
      }
    }
  }

  private handleBeforeInstallPrompt = (event: Event): void => {
    // Prevent Chrome's default install prompt
    event.preventDefault();

    // Store the event for later use
    this.deferredPrompt = event as BeforeInstallPromptEvent;

    // Only show install option if not dismissed
    if (!this.isDismissed() && !this.isInstalled()) {
      this.canInstall.set(true);
    }
  };

  private handleAppInstalled = (): void => {
    this.isInstalled.set(true);
    this.canInstall.set(false);
    this.deferredPrompt = null;
  };

  /**
   * Trigger the native install prompt (Chrome/Edge)
   * @returns Promise that resolves to user's choice
   */
  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) {
      return 'unavailable';
    }

    // Show the install prompt
    await this.deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await this.deferredPrompt.userChoice;

    // Clear the deferred prompt
    this.deferredPrompt = null;
    this.canInstall.set(false);

    return outcome;
  }

  /**
   * Dismiss the install prompt for 7 days
   */
  dismiss(): void {
    this.storage.set(DISMISS_STORAGE_KEY, Date.now().toString());
    this.isDismissed.set(true);
    this.canInstall.set(false);
  }

  /**
   * Check if install button should be shown
   */
  shouldShowInstallButton(): boolean {
    if (this.isInstalled() || this.isDismissed()) {
      return false;
    }
    return this.canInstall() || this.isIosSafari();
  }
}
