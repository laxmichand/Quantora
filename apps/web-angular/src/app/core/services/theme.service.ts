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
    { name: 'indigo', label: 'Indigo', icon: 'palette' },
    { name: 'emerald', label: 'Emerald', icon: 'palette' },
    { name: 'rose', label: 'Rose', icon: 'palette' },
  ];

  private currentTheme = 'default';
  private storageKey = 'quantora-theme';
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private onSave?: (resolved: string) => void;

  constructor() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved && this.themes.some((t) => t.name === saved)) {
      this.currentTheme = saved;
    }
    this.applyTheme(this.currentTheme);

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

  setOnSave(fn: (resolved: string) => void): void {
    this.onSave = fn;
  }

  setTheme(name: string): void {
    if (this.currentTheme === name) return;
    this.currentTheme = name;
    localStorage.setItem(this.storageKey, name);
    this.applyTheme(name);
    if (this.onSave) {
      this.onSave(this.resolveTheme(name));
    }
  }

  applyTheme(name: string): void {
    document.body.setAttribute('data-theme', this.resolveTheme(name));
  }

  resolveTheme(name: string): string {
    if (name === 'default') {
      return this.mediaQuery.matches ? 'slate' : 'light';
    }
    return name;
  }
}
