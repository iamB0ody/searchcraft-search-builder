import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonBackButton,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { folderOutline, moonOutline, sunnyOutline, timeOutline, downloadOutline } from 'ionicons/icons';
import { ThemeService } from '../../core/services/theme.service';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { IosInstallModalComponent } from '../ios-install-modal/ios-install-modal.component';

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
  private readonly modalController = inject(ModalController);
  protected readonly theme = inject(ThemeService);
  protected readonly pwaInstall = inject(PwaInstallService);

  constructor() {
    addIcons({ folderOutline, moonOutline, sunnyOutline, timeOutline, downloadOutline });
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

  async handleInstallClick(): Promise<void> {
    if (this.pwaInstall.isIos()) {
      const modal = await this.modalController.create({
        component: IosInstallModalComponent,
        breakpoints: [0, 0.5, 0.75, 1],
        initialBreakpoint: 0.75
      });
      await modal.present();
    } else if (this.pwaInstall.canInstall()) {
      await this.pwaInstall.promptInstall();
    }
  }
}
