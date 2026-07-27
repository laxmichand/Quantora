import { Component } from '@angular/core';
import { ThemeService, Theme } from '../../core/services/theme.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  currentTheme: string;
  currentLang: string;
  themes: Theme[];
  isSystemDark = false;

  constructor(
    public themeService: ThemeService,
    private translate: TranslateService,
  ) {
    this.currentTheme = themeService.getCurrentTheme();
    this.themes = themeService.themes;
    this.currentLang = localStorage.getItem('quantora_lang') || 'en';
    this.isSystemDark = themeService.isSystemDark();
  }

  onThemeChange(themeName: string): void {
    this.themeService.setTheme(themeName);
    this.currentTheme = themeName;
    this.isSystemDark = this.themeService.isSystemDark();
  }

  onLangChange(lang: string): void {
    this.translate.use(lang);
    this.currentLang = lang;
    localStorage.setItem('quantora_lang', lang);
  }
}
