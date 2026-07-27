import { Component } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Quantora';
  sidebarCollapsed = false;

  navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'trending_up', label: 'Stocks', route: '/stocks' },
    { icon: 'pie_chart', label: 'Portfolio', route: '/portfolio' },
    { icon: 'smart_toy', label: 'Ask Quantora', route: '/ai-chat' },
    { icon: 'settings', label: 'Settings', route: '/settings' },
  ];

  constructor(public themeService: ThemeService) {}

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
