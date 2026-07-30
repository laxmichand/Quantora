import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginHistoryEntry {
  id: string;
  success: boolean;
  provider: string;
  loginMethod?: string;
  failureReason?: string;
  mfaMethod?: string;
  mfaSuccess?: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  city?: string;
  country?: string;
  vpnDetected: boolean;
  proxyDetected: boolean;
  torDetected: boolean;
  isNewDevice: boolean;
  isNewCountry: boolean;
  riskScore: number;
  riskLevel: string;
  riskFactors?: string[];
  createdAt: string;
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  description?: string;
  metadata?: any;
  riskScore: number;
  deviceId?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  emailSent: boolean;
  acknowledged: boolean;
  createdAt: string;
}

export interface MfaSetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

@Injectable({ providedIn: 'root' })
export class SecurityService {
  private readonly API = '/api/auth';

  constructor(private http: HttpClient) {}

  getLoginHistory(limit = 20): Observable<LoginHistoryEntry[]> {
    return this.http.get<LoginHistoryEntry[]>(`${this.API}/login-history?limit=${limit}`, {
      withCredentials: true,
    });
  }

  getSecurityEvents(): Observable<SecurityEvent[]> {
    return this.http.get<SecurityEvent[]>(`${this.API}/security-events`, { withCredentials: true });
  }

  setupMfa(): Observable<MfaSetupResult> {
    return this.http.post<MfaSetupResult>(`${this.API}/mfa/setup`, {}, { withCredentials: true });
  }

  verifyMfa(code: string): Observable<any> {
    return this.http.post(`${this.API}/mfa/verify`, { code }, { withCredentials: true });
  }

  disableMfa(password: string, code: string): Observable<any> {
    return this.http.post(`${this.API}/mfa/disable`, { password, code }, { withCredentials: true });
  }
}
