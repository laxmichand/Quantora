import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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
      name: 'SUBSCRIPTION.PLAN_FREE',
      price: '₹0',
      period: 'SUBSCRIPTION.FOREVER',
      tagline: 'SUBSCRIPTION.PLAN_FREE_TAGLINE',
      features: [
        'SUBSCRIPTION.PLAN_FREE_FEATURE_1',
        'SUBSCRIPTION.PLAN_FREE_FEATURE_2',
        'SUBSCRIPTION.PLAN_FREE_FEATURE_3',
        'SUBSCRIPTION.PLAN_FREE_FEATURE_4',
        'SUBSCRIPTION.PLAN_FREE_FEATURE_5',
      ],
    },
    {
      name: 'SUBSCRIPTION.PLAN_PRO',
      price: '₹499',
      period: 'SUBSCRIPTION.PER_MONTH',
      tagline: 'SUBSCRIPTION.PLAN_PRO_TAGLINE',
      highlight: true,
      features: [
        'SUBSCRIPTION.PLAN_PRO_FEATURE_1',
        'SUBSCRIPTION.PLAN_PRO_FEATURE_2',
        'SUBSCRIPTION.PLAN_PRO_FEATURE_3',
        'SUBSCRIPTION.PLAN_PRO_FEATURE_4',
        'SUBSCRIPTION.PLAN_PRO_FEATURE_5',
      ],
    },
  ];

  constructor(
    public authService: AuthService,
    public marketData: MarketDataService,
    private translate: TranslateService,
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
    return this.isPro
      ? this.translate.instant('SUBSCRIPTION.QUANTORA_PRO')
      : this.translate.instant('SUBSCRIPTION.PLAN_FREE');
  }
}
