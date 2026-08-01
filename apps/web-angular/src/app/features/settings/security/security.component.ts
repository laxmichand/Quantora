import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { DeviceService, DeviceInfo } from '../../../core/services/device.service';
import { SessionService } from '../../../core/services/session.service';
import {
  SecurityService,
  LoginHistoryEntry,
  SecurityEvent,
} from '../../../core/services/security.service';

interface SecuritySettings {
  mfa: boolean;
  biometric: boolean;
  adaptiveMfa: boolean;
  newDeviceAlerts: boolean;
  torBlocking: boolean;
}

interface RiskMeta {
  label: string;
  score: number;
}

@Component({
  standalone: false,
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
})
export class SecurityComponent implements OnInit {
  devices: DeviceInfo[] = [];
  loginHistory: LoginHistoryEntry[] = [];
  securityEvents: SecurityEvent[] = [];
  currentDevice: DeviceInfo | null = null;

  loading = true;
  activeTab = 'overview';
  renamingDeviceId: string | null = null;
  renameValue = '';

  settings: SecuritySettings = {
    mfa: true,
    biometric: true,
    adaptiveMfa: true,
    newDeviceAlerts: true,
    torBlocking: true,
  };

  private readonly cdr = inject(ChangeDetectorRef);

  constructor(
    public authService: AuthService,
    private deviceService: DeviceService,
    private sessionService: SessionService,
    private securityService: SecurityService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  get accountRisk(): RiskMeta {
    const maxRisk = Math.max(...this.devices.map((d) => d.riskScore || 0), 18);
    return { label: this.riskLabel(maxRisk), score: Math.min(maxRisk, 100) };
  }

  get activeSessions(): DeviceInfo[] {
    return this.devices.filter((d) => d.sessions && d.sessions.length > 0);
  }

  get activeAlerts(): number {
    return this.securityEvents.filter(
      (e) => !e.acknowledged && (e.severity === 'high' || e.severity === 'critical'),
    ).length;
  }

  get trustedDevices(): DeviceInfo[] {
    return this.devices.filter((d) => d.trustedDevice);
  }

  get recentEvents(): SecurityEvent[] {
    return this.securityEvents.filter((e) => !e.acknowledged).slice(0, 3);
  }

  get visibleSecurityEvents(): SecurityEvent[] {
    return this.securityEvents.filter((e) => !e.acknowledged);
  }

  private loadAll(): void {
    this.deviceService.getAll().subscribe({
      next: (devices) => {
        // Normalize: ensure every device has sessions array
        this.devices = devices.map((d) => ({ ...d, sessions: d.sessions || [] }));
        this.currentDevice = this.devices.find((d) => d.sessions.some((s) => s.isCurrent)) || null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });

    this.securityService.getLoginHistory(20).subscribe({
      next: (h) => {
        this.loginHistory = h;
        this.cdr.markForCheck();
      },
      error: () => {},
    });

    this.securityService.getSecurityEvents().subscribe({
      next: (e) => {
        this.securityEvents = e;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  getDeviceIcon(d: DeviceInfo): string {
    const type = d.deviceType?.toLowerCase() || '';
    if (type === 'mobile') return 'smartphone';
    if (type === 'tablet') return 'tablet_mac';
    return 'computer';
  }

  getDeviceOSText(d: DeviceInfo): string {
    return [d.os, d.osVersion].filter(Boolean).join(' ') || 'Unknown OS';
  }

  getDeviceBrowserText(d: DeviceInfo): string {
    return [d.browser, d.browserVersion].filter(Boolean).join(' ') || 'Unknown Browser';
  }

  onLogoutCurrent(): void {
    this.sessionService.logout().subscribe(() => {
      this.authService['currentUserSubject'].next(null);
      this.authService['router'].navigate(['/auth/login']);
    });
  }

  onLogoutOthers(): void {
    this.sessionService.logoutOthers().subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_LOGGED_OUT_OTHERS'),
          this.translate.instant('SECURITY.DONE'),
          { duration: 3000 },
        );
        this.loadAll();
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_LOGOUT_OTHERS_FAIL'),
          this.translate.instant('SECURITY.DISMISS'),
          { duration: 3000 },
        ),
    });
  }

  onLogoutAll(): void {
    this.sessionService.logoutAll().subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_LOGGED_OUT_ALL'),
          this.translate.instant('SECURITY.DONE'),
          { duration: 3000 },
        );
        this.authService['currentUserSubject'].next(null);
        this.authService['router'].navigate(['/auth/login']);
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_LOGOUT_ALL_FAIL'),
          this.translate.instant('SECURITY.DISMISS'),
          { duration: 3000 },
        ),
    });
  }

  onLogoutSession(sessionId: string): void {
    this.sessionService.logoutSession(sessionId).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_SESSION_LOGGED_OUT'),
          this.translate.instant('SECURITY.DONE'),
          { duration: 2000 },
        );
        this.loadAll();
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_SESSION_LOGOUT_FAIL'),
          this.translate.instant('SECURITY.DISMISS'),
          { duration: 3000 },
        ),
    });
  }

  onTrustDevice(deviceId: string, trusted: boolean): void {
    this.deviceService.trust(deviceId, trusted).subscribe({
      next: () => {
        this.snackBar.open(
          trusted
            ? this.translate.instant('SECURITY.MSG_DEVICE_TRUSTED')
            : this.translate.instant('SECURITY.MSG_DEVICE_UNTRUSTED'),
          this.translate.instant('SECURITY.DONE'),
          { duration: 2000 },
        );
        this.loadAll();
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_TRUST_UPDATE_FAIL'),
          this.translate.instant('SECURITY.DISMISS'),
          { duration: 3000 },
        ),
    });
  }

  onRenameDevice(deviceId: string): void {
    const d = this.devices.find((x) => x.id === deviceId);
    if (!d) return;
    this.renamingDeviceId = deviceId;
    this.renameValue = d.deviceName || '';
  }

  cancelRename(): void {
    this.renamingDeviceId = null;
    this.renameValue = '';
  }

  saveRename(deviceId: string): void {
    if (!this.renameValue.trim()) return;
    this.deviceService.rename(deviceId, this.renameValue.trim()).subscribe({
      next: () => {
        this.renamingDeviceId = null;
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_DEVICE_RENAMED'),
          this.translate.instant('SECURITY.DONE'),
          { duration: 2000 },
        );
        this.loadAll();
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_DEVICE_RENAME_FAIL'),
          this.translate.instant('SECURITY.DISMISS'),
          { duration: 3000 },
        ),
    });
  }

  onRemoveDevice(deviceId: string): void {
    const d = this.devices.find((x) => x.id === deviceId);
    if (!d) return;
    this.deviceService.remove(deviceId).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_DEVICE_REMOVED'),
          this.translate.instant('SECURITY.DONE'),
          { duration: 2000 },
        );
        this.loadAll();
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_DEVICE_REMOVE_FAIL'),
          this.translate.instant('SECURITY.DISMISS'),
          { duration: 3000 },
        ),
    });
  }

  toggleSetting(key: keyof SecuritySettings): void {
    this.settings[key] = !this.settings[key];
    this.snackBar.open(
      this.translate.instant(
        this.settings[key] ? 'SECURITY.MSG_SETTING_ENABLED' : 'SECURITY.MSG_SETTING_DISABLED',
        { name: this.settingLabel(key) },
      ),
      this.translate.instant('SECURITY.DONE'),
      { duration: 2000 },
    );
  }

  dismissEvent(e: SecurityEvent): void {
    this.securityService.acknowledgeEvent(e.id).subscribe({
      next: () => {
        e.acknowledged = true;
        this.cdr.markForCheck();
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_EVENT_DISMISSED'),
          this.translate.instant('SECURITY.DONE'),
          { duration: 2000 },
        );
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('SECURITY.MSG_EVENT_DISMISS_FAIL'),
          this.translate.instant('SECURITY.DISMISS'),
          { duration: 3000 },
        ),
    });
  }

  private settingLabel(key: keyof SecuritySettings): string {
    const map: Record<keyof SecuritySettings, string> = {
      mfa: this.translate.instant('SECURITY.SETTING_MFA'),
      biometric: this.translate.instant('SECURITY.SETTING_BIOMETRIC'),
      adaptiveMfa: this.translate.instant('SECURITY.SETTING_ADAPTIVE'),
      newDeviceAlerts: this.translate.instant('SECURITY.SETTING_DEVICE_ALERTS'),
      torBlocking: this.translate.instant('SECURITY.SETTING_TOR'),
    };
    return map[key];
  }

  riskScore(d: DeviceInfo): number {
    return d.riskScore ?? 0;
  }

  riskLabel(score: number): string {
    if (score <= 20) return this.translate.instant('SECURITY.RISK_LOW');
    if (score <= 50) return this.translate.instant('SECURITY.RISK_MEDIUM');
    if (score <= 80) return this.translate.instant('SECURITY.RISK_HIGH');
    return this.translate.instant('SECURITY.RISK_CRITICAL');
  }

  riskColor(score: number): string {
    if (score <= 20) return 'var(--positive)';
    if (score <= 50) return 'var(--warning)';
    if (score <= 80) return 'var(--orange)';
    return 'var(--negative)';
  }

  riskBadgeClass(score: number): string {
    if (score <= 20) return 'badge-low';
    if (score <= 50) return 'badge-medium';
    if (score <= 80) return 'badge-high';
    return 'badge-critical';
  }

  eventSeverityClass(severity: string): string {
    if (severity === 'critical' || severity === 'high') return 'tl-item warn';
    if (severity === 'medium') return 'tl-item warn';
    return 'tl-item';
  }

  loginHistoryLevel(entry: LoginHistoryEntry): string {
    if (!entry.success) return 'bad';
    if (entry.riskScore > 50) return 'bad';
    if (entry.riskScore > 20) return 'warn';
    return 'ok';
  }

  parseBrowser(ua?: string | null): string {
    if (!ua) return 'Unknown';
    if (ua.includes('Edg/') || ua.includes('Edge/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/')) return 'Safari';
    return 'Browser';
  }

  parseOS(ua?: string | null): string {
    if (!ua) return 'Unknown';
    if (ua.includes('Windows NT')) return 'Windows';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown';
  }

  parseDeviceName(ua?: string | null): string {
    if (!ua) return 'Unknown';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Macintosh') || ua.includes('MacBook')) return 'Mac';
    if (ua.includes('Windows')) return 'PC';
    if (ua.includes('Android')) {
      const m = ua.match(/; ([\w\s]+) Build/);
      return m ? m[1] : 'Android';
    }
    return 'Device';
  }

  historyDeviceLabel(h: LoginHistoryEntry): string {
    if (h.deviceName) return h.deviceName;
    if (h.browser) return h.browser;
    const browser = this.parseBrowser(h.userAgent);
    const os = this.parseOS(h.userAgent);
    return `${browser} · ${os}`;
  }

  historyLocation(h: LoginHistoryEntry): string {
    if (h.city && h.country) return `${h.city}, ${h.country}`;
    if (h.city) return h.city;
    return 'Unknown';
  }

  deviceLocation(d: DeviceInfo): string {
    if (d.city && d.country) return `${d.city}, ${d.country}`;
    if (d.city) return d.city;
    return null as any;
  }

  /** Format a timestamp as a readable dd/mm/yyyy + time string in the user's locale. */
  formatLocaleDate(date?: string): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const locale = localStorage.getItem('quantora_lang') === 'hi' ? 'hi-IN' : 'en-IN';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  }

  timeAgo(date?: string): string {
    if (!date) return this.translate.instant('SECURITY.JUST_NOW');
    const now = Date.now();
    const then = new Date(date).getTime();
    const mins = Math.floor((now - then) / 60000);
    if (mins < 1) return this.translate.instant('SECURITY.JUST_NOW');
    if (mins < 60) return this.translate.instant('SECURITY.MINUTES_AGO', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return this.translate.instant('SECURITY.HOURS_AGO', { count: hours });
    const days = Math.floor(hours / 24);
    return this.translate.instant('SECURITY.DAYS_AGO', { count: days });
  }

  maskIp(ip?: string): string {
    if (!ip) return this.translate.instant('DEVICES.UNKNOWN');
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`;
    return ip.slice(0, Math.min(ip.length, 12)) + '...';
  }
}
