import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SessionService, SessionInfo } from '../../../core/services/session.service';
import { DeviceService, DeviceInfo } from '../../../core/services/device.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  standalone: false,
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
})
export class DevicesComponent implements OnInit {
  sessions: SessionInfo[] = [];
  devices: DeviceInfo[] = [];
  currentDevice: DeviceInfo | null = null;
  loading = true;
  renamingDeviceId: string | null = null;
  renameValue = '';

  constructor(
    private sessionService: SessionService,
    private deviceService: DeviceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.sessionService.getAll().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_SESSIONS_LOAD_FAIL'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        );
      },
    });
    this.deviceService.getAll().subscribe({
      next: (devices) => {
        this.devices = devices;
        this.currentDevice = devices.find((d) => d.sessions?.some((s) => s.isCurrent)) || null;
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_DEVICES_LOAD_FAIL'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        ),
    });
  }

  get currentSession(): SessionInfo | undefined {
    return this.sessions.find((s) => s.isCurrent);
  }

  get otherSessions(): SessionInfo[] {
    return this.sessions.filter((s) => !s.isCurrent);
  }

  logoutSession(sessionId: string): void {
    this.sessionService.logoutSession(sessionId).subscribe({
      next: () => {
        this.sessions = this.sessions.filter((s) => s.id !== sessionId);
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_SESSION_LOGGED_OUT'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        );
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_SESSION_LOGOUT_FAIL'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        ),
    });
  }

  logoutAllOthers(): void {
    this.sessionService.logoutOthers().subscribe({
      next: () => this.loadData(),
      error: () =>
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_OTHERS_LOGOUT_FAIL'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        ),
    });
  }

  logoutAll(): void {
    this.sessionService.logoutAll().subscribe({
      next: () => this.loadData(),
      error: () =>
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_ALL_LOGOUT_FAIL'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        ),
    });
  }

  logoutCurrent(): void {
    this.sessionService.logout().subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_CURRENT_LOGGED_OUT'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        );
        window.location.href = '/auth/login';
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_LOGOUT_FAIL'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        ),
    });
  }

  trustDevice(deviceId: string, trusted: boolean): void {
    this.deviceService.trust(deviceId, trusted).subscribe({
      next: () => {
        this.loadData();
        this.snackBar.open(
          trusted
            ? this.translate.instant('DEVICES.MSG_DEVICE_TRUSTED')
            : this.translate.instant('DEVICES.MSG_DEVICE_UNTRUSTED'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        );
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_DEVICE_UPDATE_FAIL'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        ),
    });
  }

  removeDevice(deviceId: string): void {
    this.deviceService.remove(deviceId).subscribe({
      next: () => {
        this.devices = this.devices.filter((d) => d.id !== deviceId);
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_DEVICE_REMOVED'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        );
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_DEVICE_REMOVE_FAIL'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        ),
    });
  }

  startRename(deviceId: string, currentName?: string): void {
    this.renamingDeviceId = deviceId;
    this.renameValue = currentName || '';
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
        this.renameValue = '';
        this.loadData();
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_DEVICE_RENAMED'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        );
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('DEVICES.MSG_DEVICE_RENAME_FAIL'),
          this.translate.instant('DEVICES.CLOSE'),
          { duration: 3000 },
        ),
    });
  }

  getDeviceIcon(session: { deviceType?: string; browser?: string }): string {
    const type = session.deviceType?.toLowerCase() || '';
    if (type === 'mobile') return 'smartphone';
    if (type === 'tablet') return 'tablet_mac';
    const browser = (session.browser || '').toLowerCase();
    if (browser.includes('safari')) return 'travel_explore';
    if (browser.includes('firefox')) return 'language';
    if (browser.includes('edge')) return 'open_in_new';
    return 'computer';
  }

  timeAgo(date: string): string {
    const now = Date.now();
    const past = new Date(date).getTime();
    const diff = now - past;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return this.translate.instant('DEVICES.JUST_NOW');
    if (mins < 60) return this.translate.instant('DEVICES.MINUTES_AGO', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return this.translate.instant('DEVICES.HOURS_AGO', { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return this.translate.instant('DEVICES.DAYS_AGO', { count: days });
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return this.translate.instant('DEVICES.WEEKS_AGO', { count: weeks });
    return new Date(date).toLocaleDateString();
  }

  maskIp(ip?: string): string {
    if (!ip) return this.translate.instant('DEVICES.UNKNOWN');
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`;
    return ip.slice(0, Math.min(ip.length, 8)) + '...';
  }
}
