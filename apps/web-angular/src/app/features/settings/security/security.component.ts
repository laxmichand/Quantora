import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { DeviceService, DeviceInfo } from '../../../core/services/device.service';
import { SessionService } from '../../../core/services/session.service';

@Component({
  standalone: false,
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
})
export class SecurityComponent implements OnInit, OnDestroy {
  currentDevice: DeviceInfo | null = null;
  otherDevices: DeviceInfo[] = [];

  loading = true;
  private subs = new Subscription();

  constructor(
    public authService: AuthService,
    private deviceService: DeviceService,
    private sessionService: SessionService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get deviceIcon(): string {
    const d = this.currentDevice;
    if (!d) return 'computer';
    if (d.deviceType === 'mobile') return 'smartphone';
    if (d.deviceType === 'tablet') return 'tablet_mac';
    return 'computer';
  }

  get currentSessionLoginTime(): string | undefined {
    return this.currentDevice?.sessions?.[0]?.loginTime;
  }

  get currentSessionId(): string | undefined {
    return this.currentDevice?.sessions?.[0]?.id;
  }

  private loadAll(): void {
    this.loading = true;
    this.subs.add(
      this.deviceService.getAll().subscribe({
        next: (devices) => {
          this.currentDevice = devices.find((d) => d.sessions?.some((s) => s.isCurrent)) || null;
          this.otherDevices = devices.filter((d) => d.id !== this.currentDevice?.id && d.sessions?.length > 0);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to load devices', 'Dismiss', { duration: 3000 });
        },
      }),
    );
  }

  // ─── Session Actions ──────────────────────────────────────

  onLogoutCurrent(): void {
    this.sessionService.logout().subscribe(() => {
      this.authService['currentUserSubject'].next(null);
      this.authService['router'].navigate(['/auth/login']);
    });
  }

  onLogoutOthers(): void {
    this.sessionService.logoutOthers().subscribe({
      next: () => {
        this.snackBar.open('Logged out from other devices', 'Done', { duration: 3000 });
        this.loadAll();
      },
      error: () =>
        this.snackBar.open('Failed to logout other devices', 'Dismiss', { duration: 3000 }),
    });
  }

  onLogoutAll(): void {
    this.sessionService.logoutAll().subscribe({
      next: () => {
        this.snackBar.open('Logged out from all devices', 'Done', { duration: 3000 });
        this.authService['currentUserSubject'].next(null);
        this.authService['router'].navigate(['/auth/login']);
      },
      error: () =>
        this.snackBar.open('Failed to logout all devices', 'Dismiss', { duration: 3000 }),
    });
  }

  onLogoutSession(sessionId: string): void {
    this.sessionService.logoutSession(sessionId).subscribe({
      next: () => {
        this.snackBar.open('Session logged out', 'Done', { duration: 2000 });
        this.loadAll();
      },
      error: () => this.snackBar.open('Failed to logout session', 'Dismiss', { duration: 3000 }),
    });
  }

  // ─── Device Actions ───────────────────────────────────────

  onTrustDevice(deviceId: string, trusted: boolean): void {
    this.deviceService.trust(deviceId, trusted).subscribe({
      next: () => {
        this.snackBar.open(trusted ? 'Device trusted' : 'Device untrusted', 'Done', {
          duration: 2000,
        });
        this.loadAll();
      },
      error: () =>
        this.snackBar.open('Failed to update device trust', 'Dismiss', { duration: 3000 }),
    });
  }

  onRenameDevice(deviceId: string): void {
    const name = prompt('Enter new device name:');
    if (name && name.trim()) {
      this.deviceService.rename(deviceId, name.trim()).subscribe({
        next: () => {
          this.snackBar.open('Device renamed', 'Done', { duration: 2000 });
          this.loadAll();
        },
        error: () => this.snackBar.open('Failed to rename device', 'Dismiss', { duration: 3000 }),
      });
    }
  }

  onRemoveDevice(deviceId: string): void {
    if (confirm('Remove this device? All sessions will be logged out.')) {
      this.deviceService.remove(deviceId).subscribe({
        next: () => {
          this.snackBar.open('Device removed', 'Done', { duration: 2000 });
          this.loadAll();
        },
        error: () => this.snackBar.open('Failed to remove device', 'Dismiss', { duration: 3000 }),
      });
    }
  }

  // ─── Helpers ──────────────────────────────────────────────

  timeAgo(date?: string): string {
    if (!date) return 'Just now';
    const now = Date.now();
    const then = new Date(date).getTime();
    const mins = Math.floor((now - then) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
