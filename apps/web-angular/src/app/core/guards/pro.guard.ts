import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    const role = this.authService.currentUser?.role;
    if (role === 'pro' || role === 'admin') {
      return true;
    }
    return this.router.createUrlTree(['/settings/subscription']);
  }
}
