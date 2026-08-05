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
    { icon: 'candlestick_chart', label: 'HOME.STOCKS', route: '/stocks', desc: 'HOME.STOCKS_DESC' },
    {
      icon: 'pie_chart',
      label: 'HOME.PORTFOLIO',
      route: '/portfolio',
      desc: 'HOME.PORTFOLIO_DESC',
    },
    { icon: 'smart_toy', label: 'HOME.ASK_AI', route: '/ai-chat', desc: 'HOME.ASK_AI_DESC' },
    { icon: 'filter_list', label: 'HOME.SCREENER', route: '/screener', desc: 'HOME.SCREENER_DESC' },
    { icon: 'leaderboard', label: 'HOME.INDICES', route: '/indices', desc: 'HOME.INDICES_DESC' },
    { icon: 'monetization_on', label: 'HOME.GOLD', route: '/gold', desc: 'HOME.GOLD_DESC' },
  ];

  constructor(private auth: AuthService) {
    const user = this.auth.currentUser;
    if (user?.name) {
      this.userName = user.name;
    }
  }
}
