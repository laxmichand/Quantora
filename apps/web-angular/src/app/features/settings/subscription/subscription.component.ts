import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { MarketDataService } from '../../../core/services/market-data.service';

interface Plan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

@Component({
  selector: 'app-subscription',
  standalone: false,
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
})
export class SubscriptionComponent {
  plans: Plan[] = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      tagline: 'Everything you need to start investing',
      features: [
        'Live market indices & ticker',
        'Unlimited watchlists',
        'Portfolio tracking',
        'Basic stock screener',
        'Email support',
      ],
    },
    {
      name: 'Pro',
      price: '₹499',
      period: '/month',
      tagline: 'Advanced tools for serious investors',
      highlight: true,
      features: [
        'AI Chat assistant',
        'Advanced screener & backtesting',
        'Real-time price alerts',
        'Advanced security (MFA, risk scoring)',
        'Priority support',
      ],
    },
  ];

  constructor(
    public authService: AuthService,
    public marketData: MarketDataService,
  ) {}

  get tickerItems(): { symbol: string; price: string; change: number }[] {
    return this.marketData.indices.map((i) => ({
      symbol: i.name,
      price: i.value,
      change: i.change,
    }));
  }

  get isPro(): boolean {
    const role = this.authService.currentUser?.role;
    return role === 'pro' || role === 'admin';
  }

  get currentPlanName(): string {
    return this.isPro ? 'Quantora Pro' : 'Free';
  }
}
