import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromEvent } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { buildVersion, BuildVersion } from '../../../generated/version';

export type ApiHealth = 'unknown' | 'ok' | 'down';

const POLL_INTERVAL_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class AppInfoService {
  readonly build: BuildVersion = buildVersion;
  readonly shortSha: string = buildVersion.gitSha.slice(0, 7);
  readonly buildTimeLabel: string = new Date(buildVersion.buildTime).toLocaleString();

  apiStatus: ApiHealth = 'unknown';
  updateAvailable = false;

  private started = false;
  private lastFocusCheck = 0;

  constructor(private http: HttpClient) {}

  start(): void {
    if (this.started) return;
    this.started = true;

    this.checkApiHealth();
    this.checkForUpdate();

    setInterval(() => this.checkApiHealth(), POLL_INTERVAL_MS);
    setInterval(() => this.checkForUpdate(), POLL_INTERVAL_MS);

    fromEvent(window, 'focus').subscribe(() => {
      // Refresh on focus, but not more than once a minute — avoids duplicate
      // health + version requests when the user just switches tabs.
      const now = Date.now();
      if (now - this.lastFocusCheck < POLL_INTERVAL_MS) return;
      this.lastFocusCheck = now;
      this.checkApiHealth();
      this.checkForUpdate();
    });
  }

  checkApiHealth(): void {
    this.http
      .get<{ status: string }>('/api/health', { withCredentials: true })
      .pipe(catchError(() => []))
      .subscribe((res) => {
        this.apiStatus = res && res.status === 'ok' ? 'ok' : 'down';
      });
  }

  checkForUpdate(): void {
    this.http
      .get<BuildVersion>(`/assets/version.json?ts=${Date.now()}`, { withCredentials: true })
      .pipe(catchError(() => []))
      .subscribe((remote) => {
        if (!remote || !remote.gitSha) return;
        const mine = this.build.gitSha !== 'unknown' ? this.build.gitSha : this.build.version;
        const theirs = remote.gitSha !== 'unknown' ? remote.gitSha : remote.version;
        if (theirs !== mine) {
          this.updateAvailable = true;
        }
      });
  }

  reload(): void {
    window.location.reload();
  }
}
