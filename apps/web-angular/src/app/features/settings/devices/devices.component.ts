import { Component, OnInit } from '@angular/core';
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
        this.snackBar.open('Failed to load sessions', 'Close', { duration: 3000 });
      },
    });
    this.deviceService.getAll().subscribe({
      next: (devices) => {
        this.devices = devices;
        this.currentDevice = devices.find((d) => d.sessions?.some((s) => s.isCurrent)) || null;
      },
      error: () => this.snackBar.open('Failed to load devices', 'Close', { duration: 3000 }),
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
        this.snackBar.open('Session logged out', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to logout session', 'Close', { duration: 3000 }),
    });
  }

  logoutAllOthers(): void {
    this.sessionService.logoutOthers().subscribe({
      next: () => this.loadData(),
      error: () =>
        this.snackBar.open('Failed to logout other sessions', 'Close', { duration: 3000 }),
    });
  }

  logoutAll(): void {
    this.sessionService.logoutAll().subscribe({
      next: () => this.loadData(),
      error: () => this.snackBar.open('Failed to logout all sessions', 'Close', { duration: 3000 }),
    });
  }

  logoutCurrent(): void {
    this.sessionService.logout().subscribe({
      next: () => {
        this.snackBar.open('Logged out of current device', 'Close', { duration: 3000 });
        window.location.href = '/auth/login';
      },
      error: () => this.snackBar.open('Failed to logout', 'Close', { duration: 3000 }),
    });
  }

  trustDevice(deviceId: string, trusted: boolean): void {
    this.deviceService.trust(deviceId, trusted).subscribe({
      next: () => {
        this.loadData();
        this.snackBar.open(trusted ? 'Device trusted' : 'Device untrusted', 'Close', {
          duration: 3000,
        });
      },
      error: () => this.snackBar.open('Failed to update device', 'Close', { duration: 3000 }),
    });
  }

  removeDevice(deviceId: string): void {
    this.deviceService.remove(deviceId).subscribe({
      next: () => {
        this.devices = this.devices.filter((d) => d.id !== deviceId);
        this.snackBar.open('Device removed', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to remove device', 'Close', { duration: 3000 }),
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
        this.snackBar.open('Device renamed', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to rename device', 'Close', { duration: 3000 }),
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
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    return new Date(date).toLocaleDateString();
  }

  maskIp(ip?: string): string {
    if (!ip) return 'Unknown';
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`;
    return ip.slice(0, Math.min(ip.length, 8)) + '...';
  }
}
