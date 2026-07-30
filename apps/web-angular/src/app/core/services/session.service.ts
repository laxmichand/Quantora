import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SessionInfo {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  isCurrent: boolean;
  loginTime: string;
  lastActivity: string;
  expiresAt: string;
  trustedDevice: boolean;
}

export interface CurrentSessionInfo {
  id: string;
  device: {
    id: string;
    deviceId: string;
    deviceName: string;
    deviceType: string;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    city?: string;
    country?: string;
    publicIp?: string;
    trustedDevice: boolean;
    trustedUntil?: string;
    loginCount: number;
  };
  ipAddress?: string;
  loginTime: string;
  lastActivity: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly API = '/api/sessions';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SessionInfo[]> {
    return this.http.get<SessionInfo[]>(this.API, { withCredentials: true });
  }

  getCurrent(): Observable<CurrentSessionInfo> {
    return this.http.get<CurrentSessionInfo>(`${this.API}/current`, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.API}/logout`, {}, { withCredentials: true });
  }

  logoutAll(): Observable<any> {
    return this.http.post(`${this.API}/logout-all`, {}, { withCredentials: true });
  }

  logoutOthers(): Observable<any> {
    return this.http.post(`${this.API}/logout-others`, {}, { withCredentials: true });
  }

  logoutSession(sessionId: string): Observable<any> {
    return this.http.post(`${this.API}/${sessionId}/logout`, {}, { withCredentials: true });
  }
}
