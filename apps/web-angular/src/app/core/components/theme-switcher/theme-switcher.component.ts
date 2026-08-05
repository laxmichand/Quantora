import { Component } from '@angular/core';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  standalone: false,
  selector: 'app-theme-switcher',
  template: `
    <div class="theme-wrapper">
      <mat-icon class="palette-icon">palette</mat-icon>
      <select class="theme-select" (change)="onThemeChange($any($event.target).value)">
        <option
          *ngFor="let theme of themeService.themes"
          [value]="theme.name"
          [selected]="themeService.getCurrentTheme() === theme.name"
        >
          {{ theme.label }}
        </option>
      </select>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        margin: 0 8px;
      }
      .theme-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid var(--card-border, #e2e8f0);
        border-radius: 8px;
        padding: 0 10px;
        height: 36px;
        background: var(--card-bg, #f8fafc);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .theme-wrapper:hover {
        border-color: var(--accent, #3b82f6);
        box-shadow: 0 0 0 2px var(--accent-light, #eff6ff);
      }
      .palette-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--accent, #6366f1);
        transition: color 0.3s ease;
      }
      .theme-select {
        border: none;
        outline: none;
        background: transparent;
        font-size: 13px;
        font-weight: 500;
        color: var(--heading-color, #475569);
        cursor: pointer;
        font-family: inherit;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        padding-right: 18px;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 0 center;
        background-size: 18px;
        transition: color 0.3s ease;
      }
      .theme-select option {
        padding: 8px 12px;
        font-size: 13px;
      }
    `,
  ],
})
export class ThemeSwitcherComponent {
  constructor(public themeService: ThemeService) {}

  onThemeChange(themeName: string): void {
    this.themeService.setTheme(themeName);
  }
}
