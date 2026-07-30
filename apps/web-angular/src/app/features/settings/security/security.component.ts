import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { DeviceService, DeviceInfo } from '../../../core/services/device.service';
import {
  SessionService,
  SessionInfo,
  CurrentSessionInfo,
} from '../../../core/services/session.service';
import {
  SecurityService,
  LoginHistoryEntry,
  SecurityEvent,
} from '../../../core/services/security.service';

@Component({
  standalone: false,
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
})
export class SecurityComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  currentSession: CurrentSessionInfo | null = null;
  currentDevice: DeviceInfo | null = null;
  otherDevices: DeviceInfo[] = [];
  sessions: SessionInfo[] = [];
  loginHistory: LoginHistoryEntry[] = [];
  securityEvents: SecurityEvent[] = [];

  // MFA
  mfaEnabled = false;
  mfaSetupData: { secret: string; qrCode: string; backupCodes: string[] } | null = null;
  mfaVerifyCode = '';
  mfaDisablePassword = '';
  mfaDisableCode = '';
  showMfaSetup = false;
  showMfaDisable = false;

  loading = true;
  private subs = new Subscription();

  constructor(
    public authService: AuthService,
    private deviceService: DeviceService,
    private sessionService: SessionService,
    private securityService: SecurityService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
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

  private loadAll(): void {
    this.loading = true;
    this.subs.add(
      forkJoin({
        currentSession: this.sessionService.getCurrent(),
        devices: this.deviceService.getAll(),
        sessions: this.sessionService.getAll(),
        loginHistory: this.securityService.getLoginHistory(10),
        events: this.securityService.getSecurityEvents(),
      }).subscribe({
        next: (data) => {
          this.currentSession = data.currentSession;
          this.currentDevice =
            data.devices.find((d) => d.id === data.currentSession?.device?.id) || null;
          this.otherDevices = data.devices.filter((d) => d.id !== this.currentDevice?.id);
          this.sessions = data.sessions;
          this.loginHistory = data.loginHistory;
          this.securityEvents = data.events;
          this.mfaEnabled = data.currentSession?.device?.trustedDevice || false;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to load security data', 'Dismiss', { duration: 3000 });
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

  // ─── MFA ──────────────────────────────────────────────────

  onSetupMfa(): void {
    this.authService
      .setupMfa()
      .then((data) => {
        this.mfaSetupData = data;
        this.showMfaSetup = true;
      })
      .catch(() => {
        this.snackBar.open('Failed to start MFA setup', 'Dismiss', { duration: 3000 });
      });
  }

  onVerifyMfaSetup(): void {
    this.authService
      .verifyMfaSetup(this.mfaVerifyCode)
      .then(() => {
        this.snackBar.open('MFA enabled successfully', 'Done', { duration: 3000 });
        this.showMfaSetup = false;
        this.mfaVerifyCode = '';
        this.mfaSetupData = null;
        this.mfaEnabled = true;
      })
      .catch(() => {
        this.snackBar.open('Invalid MFA code. Try again.', 'Dismiss', { duration: 3000 });
      });
  }

  onDisableMfa(): void {
    this.authService
      .disableMfa(this.mfaDisablePassword, this.mfaDisableCode)
      .then(() => {
        this.snackBar.open('MFA disabled', 'Done', { duration: 3000 });
        this.showMfaDisable = false;
        this.mfaDisablePassword = '';
        this.mfaDisableCode = '';
        this.mfaEnabled = false;
      })
      .catch((err) => {
        this.snackBar.open('Failed to disable MFA. Check your password and code.', 'Dismiss', {
          duration: 3000,
        });
      });
  }

  cancelMfaSetup(): void {
    this.showMfaSetup = false;
    this.mfaSetupData = null;
    this.mfaVerifyCode = '';
  }

  // ─── Helpers ──────────────────────────────────────────────

  formatEventType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  severityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'warn';
      case 'high':
        return 'warn';
      case 'warning':
        return 'accent';
      default:
        return 'primary';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  timeAgo(date: string): string {
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
