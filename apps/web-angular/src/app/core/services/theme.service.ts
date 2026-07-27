import { Injectable } from '@angular/core';

export interface Theme {
  name: string;
  label: string;
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly themes: Theme[] = [
    { name: 'default', label: 'Auto', icon: 'brightness_auto' },
    { name: 'light', label: 'Light', icon: 'light_mode' },
    { name: 'dark', label: 'Dark', icon: 'dark_mode' },
  ];

  private currentTheme = 'default';
  private storageKey = 'quantora-theme';
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved && this.themes.some((t) => t.name === saved)) {
      this.currentTheme = saved;
    }
    this.applyTheme(this.currentTheme);

    // Re-apply when system preference changes (only matters for "default")
    this.mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'default') {
        this.applyTheme('default');
      }
    });
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }

  isSystemDark(): boolean {
    return this.mediaQuery.matches;
  }

  setTheme(name: string): void {
    if (this.currentTheme === name) return;
    this.currentTheme = name;
    localStorage.setItem(this.storageKey, name);
    this.applyTheme(name);
  }

  private applyTheme(name: string): void {
    if (name === 'default') {
      // Follow system: dark mode → slate, light mode → light
      const isDark = this.mediaQuery.matches;
      document.body.setAttribute('data-theme', isDark ? 'slate' : 'light');
    } else {
      document.body.setAttribute('data-theme', name);
    }
  }
}
