import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ThemeService } from './theme.service';
import { shareReplay, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private theme = inject(ThemeService);
  private zone = inject(NgZone);

  private readonly API_URL = '/api/user/preferences';

  private load$ = this.http.get<any>(this.API_URL).pipe(
    tap((prefs) => {
      if (prefs?.theme) {
        this.theme.applyTheme(prefs.theme);
      }
      // Apply the saved language preference (server is the source of truth
      // when the user is signed in and has no newer local selection).
      if (prefs?.language) {
        const current = localStorage.getItem('quantora_lang');
        if (!current) {
          localStorage.setItem('quantora_lang', prefs.language);
        }
      }
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  constructor() {
    this.theme.setOnSave((resolved) => this.saveTheme(resolved));
    // Do NOT auto-load on user changes here — the app initializer already
    // awaits preferences.load() once at startup, and firing again on the
    // currentUser$ tap races the initial restore (double refresh-token
    // rotation can trip reuse detection and revoke the session).
  }

  load(): Promise<void> {
    if (!this.auth.isAuthenticated) return Promise.resolve();
    return new Promise((resolve) => {
      this.load$.subscribe({ next: () => resolve(), error: () => resolve() });
    });
  }

  saveLanguage(lang: string): void {
    if (!this.auth.isAuthenticated) return;
    this.http.patch(this.API_URL, { language: lang }).subscribe({ error: () => {} });
  }

  private saveTheme(resolved: string): void {
    if (!this.auth.isAuthenticated) return;
    this.http.patch(this.API_URL, { theme: resolved }).subscribe({ error: () => {} });
  }
}
