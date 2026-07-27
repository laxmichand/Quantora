import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  userName = 'Investor';

  quickActions = [
    { icon: 'candlestick_chart', label: 'Stocks', route: '/stocks', desc: 'Browse NSE & BSE' },
    { icon: 'pie_chart', label: 'Portfolio', route: '/portfolio', desc: 'Your holdings' },
    { icon: 'smart_toy', label: 'Ask AI', route: '/ai-chat', desc: 'Get insights' },
    { icon: 'filter_list', label: 'Screener', route: '/screener', desc: 'Find stocks' },
    { icon: 'leaderboard', label: 'Indices', route: '/indices', desc: 'Market trends' },
    { icon: 'monetization_on', label: 'Gold', route: '/gold', desc: 'Track gold' },
  ];

  constructor(private auth: AuthService) {
    const user = this.auth.currentUser;
    if (user?.name) {
      this.userName = user.name;
    }
  }
}
