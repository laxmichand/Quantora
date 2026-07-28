import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Quantora';
  productsOpen = false;
  profileOpen = false;
  showGlobalHeader = false;

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated;
  }

  stockTicker = [
    { symbol: 'NIFTY 50', price: '24,867.50', change: 0.82 },
    { symbol: 'SENSEX', price: '81,432.10', change: 0.74 },
    { symbol: 'RELIANCE', price: '2,945.30', change: 1.23 },
    { symbol: 'TCS', price: '3,812.45', change: -0.56 },
    { symbol: 'INFY', price: '1,678.90', change: 2.14 },
    { symbol: 'HDFCBANK', price: '1,723.60', change: 0.38 },
    { symbol: 'ICICIBANK', price: '1,287.25', change: -0.92 },
    { symbol: 'BHARTIARTL', price: '1,534.80', change: 1.67 },
    { symbol: 'SBIN', price: '842.15', change: -0.34 },
    { symbol: 'ITC', price: '467.90', change: 0.45 },
    { symbol: 'WIPRO', price: '572.30', change: -1.12 },
    { symbol: 'TATAMOTORS', price: '978.45', change: 3.21 },
    { symbol: 'GOLD', price: '72,450', change: 0.28 },
    { symbol: 'SILVER', price: '94,120', change: -0.15 },
    { symbol: 'USDINR', price: '83.62', change: -0.08 },
  ];

  private hiddenRoutes = ['', 'auth', 'auth/login', 'auth/register', 'home'];

  constructor(
    public themeService: ThemeService,
    public translate: TranslateService,
    private authService: AuthService,
    private router: Router,
  ) {
    const saved = localStorage.getItem('quantora_lang') || 'en';
    translate.setDefaultLang('en');
    translate.use(saved);

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.updateHeaderVisibility();
    });
    this.updateHeaderVisibility();
  }

  private updateHeaderVisibility(): void {
    const url = this.router.url.split('?')[0].split('#')[0].replace(/^\//, '');
    this.showGlobalHeader = !this.hiddenRoutes.includes(url);
  }
}
