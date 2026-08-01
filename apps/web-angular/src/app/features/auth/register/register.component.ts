import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  error = '';
  loading = false;
  registered = false;

  marketChips = [
    { symbol: 'NIFTY 50', value: '24,867', change: 0.82 },
    { symbol: 'SENSEX', value: '81,432', change: 0.74 },
    { symbol: 'BANK NIFTY', value: '53,210', change: -0.27 },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
  ) {}

  async onSubmit(): Promise<void> {
    if (!this.name || !this.email || !this.password) {
      this.error = this.translate.instant('AUTH.ERR_FILL_FIELDS');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = this.translate.instant('AUTH.ERR_PASSWORDS_MATCH');
      return;
    }

    if (this.password.length < 8) {
      this.error = this.translate.instant('AUTH.ERR_PASSWORD_MIN');
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.authService.register(this.email, this.password, this.name);
      this.registered = true;
      this.loading = false;
    } catch (err: any) {
      this.loading = false;
      this.error = err.error?.message || this.translate.instant('AUTH.ERR_REGISTRATION');
    }
  }

  googleLogin(): void {
    this.authService.googleLogin();
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
