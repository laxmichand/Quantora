import { inject, provideAppInitializer } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { MarketDataService } from './services/market-data.service';
import { AuthService } from './services/auth.service';
import { PreferencesService } from './services/preferences.service';

export function appInitializer(): Promise<void> {
  const theme = inject(ThemeService);
  const market = inject(MarketDataService);
  const auth = inject(AuthService);
  const preferences = inject(PreferencesService);

  theme.applyTheme(theme.getCurrentTheme());

  return auth.tryRestoreSession().then(() => preferences.load());
}

export const APP_INIT_PROVIDER = provideAppInitializer(appInitializer);
