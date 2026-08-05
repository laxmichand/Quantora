import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  tap,
  catchError,
  of,
  map,
  switchMap,
  firstValueFrom,
} from 'rxjs';
import { Router } from '@angular/router';
import { DeviceFingerprintService } from './device-fingerprint.service';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: AuthUser;
  requiresMfa?: boolean;
  mfaSessionToken?: string;
  riskScore?: number;
  riskLevel?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = '/api/auth';
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  private mfaLoginState: { mfaSessionToken: string; email: string; password: string } | null = null;

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private fingerprint: DeviceFingerprintService,
  ) {}

  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get pendingMfaLogin(): boolean {
    return !!this.mfaLoginState;
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const fp = await this.fingerprint.collect();
    const res = await firstValueFrom(
      this.http
        .post<AuthResponse>(
          `${this.API_URL}/register`,
          { email, password, name, deviceId: fp.deviceId, fingerprint: fp },
          { withCredentials: true },
        )
        .pipe(tap((r) => this.currentUserSubject.next(r.user))),
    );
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const fp = await this.fingerprint.collect();
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(
        `${this.API_URL}/login`,
        {
          email,
          password,
          deviceId: fp.deviceId,
          fingerprint: fp,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        { withCredentials: true },
      ),
    );

    if (res.requiresMfa) {
      this.mfaLoginState = { mfaSessionToken: res.mfaSessionToken!, email, password };
      return res;
    }

    this.currentUserSubject.next(res.user);
    this.mfaLoginState = null;
    return res;
  }

  async verifyMfa(code: string): Promise<AuthResponse> {
    if (!this.mfaLoginState) throw new Error('No pending MFA login');

    const res = await firstValueFrom(
      this.http.post<AuthResponse>(
        `${this.API_URL}/login/mfa`,
        {
          code,
          mfaSessionToken: this.mfaLoginState.mfaSessionToken,
        },
        { withCredentials: true },
      ),
    );

    this.currentUserSubject.next(res.user);
    this.mfaLoginState = null;
    return res;
  }

  cancelMfaLogin(): void {
    this.mfaLoginState = null;
  }

  logout(): void {
    const fp = this.fingerprint.getCurrentDeviceId();
    this.http
      .post(`${this.API_URL}/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  refreshTokens(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/refresh`, {}, { withCredentials: true })
      .pipe(tap((res) => this.currentUserSubject.next(res.user)));
  }

  tryRestoreSession(): Promise<void> {
    return firstValueFrom(
      this.refreshTokens().pipe(
        tap(() => {}),
        catchError(() => {
          this.currentUserSubject.next(null);
          return of(null as any);
        }),
      ),
    ).then(() => undefined);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/me`, { withCredentials: true });
  }

  googleLogin(): void {
    window.location.href = `${this.API_URL}/google`;
  }

  handleOAuthCallback(): Observable<AuthUser> | null {
    if (!window.location.pathname.includes('/auth/callback')) return null;
    return this.getProfile().pipe(
      tap((user: AuthUser) => {
        this.currentUserSubject.next(user);
        this.router.navigate(['/dashboard']);
      }),
    );
  }

  async setupMfa(): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    return firstValueFrom(
      this.http.post<any>(`${this.API_URL}/mfa/setup`, {}, { withCredentials: true }),
    );
  }

  async verifyMfaSetup(code: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.API_URL}/mfa/verify`, { code }, { withCredentials: true }),
    );
  }

  async disableMfa(password: string, code: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.API_URL}/mfa/disable`, { password, code }, { withCredentials: true }),
    );
  }
}
