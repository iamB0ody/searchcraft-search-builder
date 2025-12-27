import { Injectable, inject, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ClipboardService } from '../../services/clipboard.service';
import { ToastService } from '../../services/toast.service';
import { Preset } from '../models/preset.model';
import { BuilderShareState } from '../../models/platform.model';

/**
 * Service for sharing presets via Web Share API, WhatsApp, Telegram, etc.
 * Includes fallback to clipboard when Web Share is not available
 */
@Injectable({ providedIn: 'root' })
export class ShareService {
  private readonly clipboard = inject(ClipboardService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Share a preset using the best available method
   * Tries Web Share API first, falls back to clipboard
   */
  async share(preset: Preset): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    const shareData = this.buildShareData(preset);

    // Try Web Share API first
    if (this.canUseWebShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        // User cancelled - don't show error
        if ((e as Error).name === 'AbortError') {
          return;
        }
        // Fall through to clipboard fallback
      }
    }

    // Fallback: copy link to clipboard
    await this.copyShareLink(preset);
  }

  /**
   * Copy the share link to clipboard
   */
  async copyShareLink(preset: Preset): Promise<boolean> {
    const url = this.buildShareUrl(preset);
    const copied = await this.clipboard.copyToClipboard(url);

    if (copied) {
      await this.toast.showSuccess('Link copied to clipboard');
    } else {
      await this.toast.showError('Failed to copy link');
    }

    return copied;
  }

  /**
   * Copy preset JSON to clipboard (for export)
   */
  async copyPresetJson(preset: Preset): Promise<boolean> {
    const json = JSON.stringify({ schemaVersion: 1, preset }, null, 2);
    const copied = await this.clipboard.copyToClipboard(json);

    if (copied) {
      await this.toast.showSuccess('Preset JSON copied to clipboard');
    } else {
      await this.toast.showError('Failed to copy');
    }

    return copied;
  }

  /**
   * Get WhatsApp share URL
   */
  getWhatsAppUrl(preset: Preset): string {
    const shareUrl = this.buildShareUrl(preset);
    const text = `Check out this search preset: ${preset.name}\n${shareUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  /**
   * Get Telegram share URL
   */
  getTelegramUrl(preset: Preset): string {
    const shareUrl = this.buildShareUrl(preset);
    const text = `Check out this search preset: ${preset.name}`;
    return `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
  }

  /**
   * Get email share URL
   */
  getEmailUrl(preset: Preset): string {
    const shareUrl = this.buildShareUrl(preset);
    const subject = `SearchCraft Preset: ${preset.name}`;
    const body = `Check out this search preset:\n\n${preset.name}\n${preset.notes || ''}\n\n${shareUrl}`;
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  /**
   * Build the share URL for a preset
   * Encodes the preset data in the URL for serverless sharing
   */
  buildShareUrl(preset: Preset): string {
    const exportData = { schemaVersion: 1, preset };
    const json = JSON.stringify(exportData);
    const encoded = this.base64UrlEncode(json);
    const baseUrl = this.isBrowser ? window.location.origin : '';
    return `${baseUrl}/presets/import?p=${encoded}`;
  }

  /**
   * Decode a share URL parameter to preset data
   */
  decodeShareParam(encoded: string): { schemaVersion: number; preset: Preset } | null {
    try {
      const json = this.base64UrlDecode(encoded);
      const data = JSON.parse(json);

      if (data.schemaVersion && data.preset) {
        return data;
      }

      return null;
    } catch {
      return null;
    }
  }

  // ============================================
  // Builder State Sharing Methods
  // ============================================

  /**
   * Build a shareable URL for the current builder state
   */
  buildBuilderShareUrl(state: BuilderShareState): string {
    const json = JSON.stringify(state);
    const encoded = this.base64UrlEncode(json);
    const baseUrl = this.isBrowser ? window.location.origin : '';
    return `${baseUrl}/search-builder?state=${encoded}`;
  }

  /**
   * Decode a builder state from URL parameter
   */
  decodeBuilderState(encoded: string): BuilderShareState | null {
    try {
      const json = this.base64UrlDecode(encoded);
      const data = JSON.parse(json);

      // Validate required fields
      if (!data.schemaVersion || !data.payload || !data.platformId) {
        return null;
      }

      // Validate payload structure
      if (!data.payload.searchType || !Array.isArray(data.payload.titles)) {
        return null;
      }

      return data as BuilderShareState;
    } catch {
      return null;
    }
  }

  /**
   * Share builder state using best available method
   */
  async shareBuilderState(state: BuilderShareState): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    const url = this.buildBuilderShareUrl(state);
    const shareData: ShareData = {
      title: 'SearchCraft Search',
      text: `${state.payload.searchType} search with ${state.payload.titles.length} title(s)`,
      url
    };

    if (this.canUseWebShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback to clipboard
    await this.copyBuilderShareLink(state);
  }

  /**
   * Copy builder share link to clipboard
   */
  async copyBuilderShareLink(state: BuilderShareState): Promise<boolean> {
    const url = this.buildBuilderShareUrl(state);
    const copied = await this.clipboard.copyToClipboard(url);

    if (copied) {
      await this.toast.showSuccess('Search link copied to clipboard');
    } else {
      await this.toast.showError('Failed to copy link');
    }

    return copied;
  }

  /**
   * Base64 URL-safe encoding
   */
  private base64UrlEncode(str: string): string {
    // Convert to UTF-8 bytes then base64
    const utf8Bytes = new TextEncoder().encode(str);
    const base64 = btoa(String.fromCharCode(...utf8Bytes));
    // Make URL-safe
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Base64 URL-safe decoding
   */
  private base64UrlDecode(str: string): string {
    // Restore standard base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding
    while (base64.length % 4) {
      base64 += '=';
    }
    // Decode
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  private buildShareData(preset: Preset): ShareData {
    return {
      title: `SearchCraft Preset: ${preset.name}`,
      text: preset.notes || `Search preset for ${preset.payload.searchType}`,
      url: this.buildShareUrl(preset)
    };
  }

  private canUseWebShare(data: ShareData): boolean {
    if (!this.isBrowser) {
      return false;
    }

    if (typeof navigator.share !== 'function') {
      return false;
    }

    if (typeof navigator.canShare === 'function') {
      return navigator.canShare(data);
    }

    // Assume it can share if navigator.share exists
    return true;
  }
}
