import { Injectable, inject, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ThemeService } from './theme.service';
import { Subscription, shareReplay, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PreferencesService implements OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private theme = inject(ThemeService);
  private zone = inject(NgZone);

  private readonly API_URL = '/api/user/preferences';
  private sub: Subscription;

  private load$ = this.http.get<any>(this.API_URL).pipe(
    tap((prefs) => {
      if (prefs?.theme) {
        this.theme.applyTheme(prefs.theme);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  constructor() {
    this.theme.setOnSave((resolved) => this.saveTheme(resolved));
    this.sub = this.auth.currentUser$.subscribe((user) => {
      if (user) this.load();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(): Promise<void> {
    if (!this.auth.isAuthenticated) return Promise.resolve();
    return new Promise((resolve) => {
      this.load$.subscribe({ next: () => resolve(), error: () => resolve() });
    });
  }

  private saveTheme(resolved: string): void {
    if (!this.auth.isAuthenticated) return;
    this.http.patch(this.API_URL, { theme: resolved }).subscribe({ error: () => {} });
  }
}
