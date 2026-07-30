import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-language-switcher',
  template: `
    <div class="lang-wrapper">
      <mat-icon class="lang-icon">translate</mat-icon>
      <select class="lang-select" (change)="onLangChange($any($event.target).value)">
        <option value="en" [selected]="currentLang === 'en'">English</option>
        <option value="hi" [selected]="currentLang === 'hi'">हिन्दी</option>
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
      .lang-wrapper {
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
      .lang-wrapper:hover {
        border-color: var(--accent, #3b82f6);
        box-shadow: 0 0 0 2px var(--accent-light, #eff6ff);
      }
      .lang-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--accent, #6366f1);
        transition: color 0.3s ease;
      }
      .lang-select {
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
      .lang-select option {
        padding: 8px 12px;
        font-size: 13px;
      }
    `,
  ],
})
export class LanguageSwitcherComponent {
  currentLang = 'en';

  constructor(private translate: TranslateService) {
    const saved = localStorage.getItem('quantora_lang') || 'en';
    this.currentLang = saved;
    this.translate.setDefaultLang('en');
    this.translate.use(saved);
  }

  onLangChange(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
    localStorage.setItem('quantora_lang', lang);
  }
}
