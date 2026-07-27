import { inject, provideAppInitializer } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { MarketDataService } from './services/market-data.service';

export function appInitializer(): Promise<void> {
  const theme = inject(ThemeService);
  const market = inject(MarketDataService);

  // Apply saved theme on startup
  theme.setTheme(theme.getCurrentTheme());

  // Pre-warm market data cache (already eager via providedIn: 'root')
  // Additional async init (API calls, config fetch, etc.) can go here

  return Promise.resolve();
}

export const APP_INIT_PROVIDER = provideAppInitializer(appInitializer);
