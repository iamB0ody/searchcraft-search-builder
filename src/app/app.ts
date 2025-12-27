import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './core/services/theme.service';
import { PwaInstallService } from './core/services/pwa-install.service';
import { PwaUpdateService } from './core/services/pwa-update.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet />
    </ion-app>
  `
})
export class App {
  // Inject services to ensure they initialize on app startup
  private readonly theme = inject(ThemeService);
  private readonly pwaInstall = inject(PwaInstallService);
  private readonly pwaUpdate = inject(PwaUpdateService);
}
