import { Component, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { AppInfoService } from './core/services/app-info.service';
import { MarketDataService } from './core/services/market-data.service';
import { PreferencesService } from './core/services/preferences.service';
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
  mobileMenuOpen = false;
  searchOpen = false;
  isMobileView = false;

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated;
  }

  get tickerItems(): { symbol: string; price: string; change: number }[] {
    return this.marketData.indices.map((i) => ({
      symbol: i.name,
      price: i.value,
      change: i.change,
    }));
  }

  private hiddenRoutes = ['', 'auth', 'auth/login', 'auth/register', 'home'];

  constructor(
    public themeService: ThemeService,
    public translate: TranslateService,
    public authService: AuthService,
    public appInfo: AppInfoService,
    public marketData: MarketDataService,
    private preferences: PreferencesService,
    private router: Router,
  ) {
    const saved = localStorage.getItem('quantora_lang') || 'en';
    translate.setDefaultLang('en');
    translate.use(saved);
    this.setDocumentLang(saved);
    this.appInfo.start();
    this.checkViewport();

    this.translate.onLangChange.subscribe((e) => this.setDocumentLang(e.lang));

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.updateHeaderVisibility();
      this.mobileMenuOpen = false;
      this.searchOpen = false;
    });
    this.updateHeaderVisibility();
  }

  private setDocumentLang(lang: string): void {
    document.documentElement.lang = lang;
  }

  private updateHeaderVisibility(): void {
    const url = this.router.url.split('?')[0].split('#')[0].replace(/^\//, '');
    this.showGlobalHeader = !this.hiddenRoutes.includes(url);
  }

  @HostListener('window:resize')
  checkViewport(): void {
    this.isMobileView = window.innerWidth < 768;
  }

  toggleProducts(): void {
    this.productsOpen = !this.productsOpen;
    this.profileOpen = false;
  }

  toggleProfile(): void {
    this.profileOpen = !this.profileOpen;
    this.productsOpen = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.more-dropdown')) this.productsOpen = false;
    if (!target.closest('.profile-dropdown')) this.profileOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
