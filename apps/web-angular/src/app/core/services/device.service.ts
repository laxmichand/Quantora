import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DeviceInfo {
  id: string;
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  city?: string;
  country?: string;
  publicIp?: string;
  isp?: string;
  trustedDevice: boolean;
  trustedUntil?: string;
  riskScore: number;
  riskLevel: string;
  firstLogin?: string;
  lastLogin?: string;
  lastActivity?: string;
  loginCount: number;
  status: string;
  createdAt: string;
  sessions: { id: string; loginTime?: string; lastActivity: string; expiresAt?: string; ipAddress?: string; isCurrent: boolean }[];
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly API = '/api/devices';

  constructor(private http: HttpClient) {}

  register(fingerprint: any): Observable<any> {
    return this.http.post(`${this.API}/register`, fingerprint, { withCredentials: true });
  }

  getAll(): Observable<DeviceInfo[]> {
    return this.http.get<DeviceInfo[]>(this.API, { withCredentials: true });
  }

  getCurrent(): Observable<DeviceInfo> {
    return this.http.get<DeviceInfo>(`${this.API}/current`, { withCredentials: true });
  }

  getById(id: string): Observable<DeviceInfo> {
    return this.http.get<DeviceInfo>(`${this.API}/${id}`, { withCredentials: true });
  }

  trust(id: string, trusted: boolean): Observable<DeviceInfo> {
    return this.http.patch<DeviceInfo>(
      `${this.API}/${id}/trust`,
      { trusted },
      { withCredentials: true },
    );
  }

  rename(id: string, name: string): Observable<DeviceInfo> {
    return this.http.patch<DeviceInfo>(
      `${this.API}/${id}/rename`,
      { name },
      { withCredentials: true },
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`, { withCredentials: true });
  }
}
