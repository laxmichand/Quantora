import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  showPassword = false;
  error = '';
  loading = false;

  marketChips = [
    { symbol: 'NIFTY 50', value: '24,867', change: 0.82 },
    { symbol: 'SENSEX', value: '81,432', change: 0.74 },
    { symbol: 'BANK NIFTY', value: '53,210', change: -0.27 },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    if (oauthError) {
      this.error = 'Google login failed. Please try again.';
      return;
    }

    const oauth$ = this.authService.handleOAuthCallback();
    if (oauth$) {
      this.loading = true;
      oauth$.subscribe({
        error: () => {
          this.loading = false;
          this.error = 'Google login failed. Please try again.';
        },
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const result = await this.authService.login(this.email, this.password);
      if (result.requiresMfa) {
        this.router.navigate(['/auth/login'], {
          queryParams: { mfa: result.mfaSessionToken },
        });
        return;
      }
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.loading = false;
      this.error = err.error?.message || 'Invalid credentials';
    }
  }

  googleLogin(): void {
    this.authService.googleLogin();
  }
}
