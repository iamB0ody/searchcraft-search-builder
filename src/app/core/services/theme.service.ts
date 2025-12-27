import { Injectable, Inject, PLATFORM_ID, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocalStorageAdapter } from '../storage/local-storage.adapter';

export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'sc-theme-preference';

/**
 * Service for managing light/dark theme with persistence.
 * SSR-safe using LocalStorageAdapter.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser: boolean;
  private mediaQuery: MediaQueryList | null = null;

  /** User's theme preference (light/dark/system) */
  readonly preference = signal<ThemePreference>('system');

  /** Computed effective theme (light/dark only) */
  readonly effectiveTheme = signal<EffectiveTheme>('light');

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

    // Load saved preference
    const saved = this.storage.get(THEME_STORAGE_KEY) as ThemePreference | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      this.preference.set(saved);
    }

    // Set up system preference listener
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.handleSystemChange);

    // React to preference changes and apply theme
    effect(() => {
      const pref = this.preference();
      this.updateEffectiveTheme(pref);
      this.storage.set(THEME_STORAGE_KEY, pref);
    });

    // Initial application
    this.updateEffectiveTheme(this.preference());
  }

  private handleSystemChange = (e: MediaQueryListEvent): void => {
    if (this.preference() === 'system') {
      this.applyTheme(e.matches ? 'dark' : 'light');
      this.effectiveTheme.set(e.matches ? 'dark' : 'light');
    }
  };

  private updateEffectiveTheme(pref: ThemePreference): void {
    let effective: EffectiveTheme;

    if (pref === 'system') {
      effective = this.mediaQuery?.matches ? 'dark' : 'light';
    } else {
      effective = pref;
    }

    this.effectiveTheme.set(effective);
    this.applyTheme(effective);
  }

  private applyTheme(theme: EffectiveTheme): void {
    if (!this.isBrowser) {
      return;
    }

    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('ion-palette-dark');
    } else {
      body.classList.remove('ion-palette-dark');
    }
  }

  /**
   * Toggle between light and dark mode
   */
  toggle(): void {
    const current = this.effectiveTheme();
    this.setTheme(current === 'light' ? 'dark' : 'light');
  }

  /**
   * Set theme preference
   */
  setTheme(theme: ThemePreference): void {
    this.preference.set(theme);
  }

  /**
   * Check if dark mode is currently active
   */
  get isDark(): boolean {
    return this.effectiveTheme() === 'dark';
  }

  /**
   * Check if light mode is currently active
   */
  get isLight(): boolean {
    return this.effectiveTheme() === 'light';
  }
}
