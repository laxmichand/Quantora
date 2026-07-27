import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly ACCESS_TOKEN_KEY = 'quantora_access_token';
  private readonly REFRESH_TOKEN_KEY = 'quantora_refresh_token';

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadUser();
  }

  get isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get accessToken(): string | null {
    return this.getAccessToken();
  }

  register(email: string, password: string, name: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, { email, password, name })
      .pipe(tap((res) => this.storeAuth(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(tap((res) => this.storeAuth(res)));
  }

  logout(): void {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (refreshToken) {
      this.http.post(`${this.API_URL}/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  refreshTokens(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    return this.http
      .post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(tap((res) => this.storeAuth(res)));
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/me`);
  }

  private storeAuth(res: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    this.currentUserSubject.next(res.user);
  }

  private getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  private loadUser(): void {
    const token = this.getAccessToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserSubject.next({
          id: payload.sub,
          email: payload.email,
          name: payload.email.split('@')[0],
          role: payload.role,
        });
      } catch {
        this.logout();
      }
    }
  }
}
