import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
  ) {}

  onSubmit(): void {
    if (!this.name || !this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.register(this.email, this.password, this.name).subscribe({
      next: () => {
        this.registered = true;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
