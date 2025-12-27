import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { folderOutline, moonOutline, sunnyOutline, timeOutline } from 'ionicons/icons';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonBackButton
  ],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss'
})
export class AppHeaderComponent {
  /** Show back button instead of brand logo */
  @Input() showBackButton = false;

  /** Default href for back button */
  @Input() defaultHref = '/search-builder';

  /** Page title (overrides "SearchCraft" when set) */
  @Input() pageTitle?: string;

  /** Hide presets button (useful on presets pages) */
  @Input() hidePresetsButton = false;

  /** Hide history button (useful on history pages) */
  @Input() hideHistoryButton = false;

  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  constructor() {
    addIcons({ folderOutline, moonOutline, sunnyOutline, timeOutline });
  }

  navigateToPresets(): void {
    this.router.navigate(['/presets']);
  }

  navigateToHistory(): void {
    this.router.navigate(['/history']);
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  get themeIcon(): string {
    return this.theme.isDark ? 'sunny-outline' : 'moon-outline';
  }

  get themeLabel(): string {
    return this.theme.isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }
}
