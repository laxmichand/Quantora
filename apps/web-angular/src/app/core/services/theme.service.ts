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
    { name: 'slate', label: 'Slate', icon: 'looks_one' },
    { name: 'indigo', label: 'Indigo', icon: 'looks_two' },
    { name: 'emerald', label: 'Emerald', icon: 'looks_3' },
    { name: 'rose', label: 'Rose', icon: 'looks_4' },
  ];

  private currentTheme = 'slate';
  private storageKey = 'quantora-theme';

  constructor() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved && this.themes.some((t) => t.name === saved)) {
      this.currentTheme = saved;
    }
    this.applyTheme(this.currentTheme);
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }

  setTheme(name: string): void {
    if (this.currentTheme === name) return;
    this.currentTheme = name;
    localStorage.setItem(this.storageKey, name);
    this.applyTheme(name);
  }

  private applyTheme(name: string): void {
    document.body.setAttribute('data-theme', name);
  }
}
