import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import {
  MarketDataService,
  StockQuote,
  IndexData,
  SectorData,
  NewsItem,
} from '../../core/services/market-data.service';
import { TableColumn } from '../../shared/components/data-table/data-table.component';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  userName = 'Investor';
  greeting = 'Good morning';
  marketOpen = true;
  activeTab: 'gainers' | 'losers' | 'active' = 'gainers';

  stats: {
    label: string;
    value: string;
    change: string;
    positive: boolean;
    icon: string;
    color: string;
  }[] = [];

  indices: IndexData[] = [];
  sectors: SectorData[] = [];
  gainers: StockQuote[] = [];
  losers: StockQuote[] = [];
  mostActive: StockQuote[] = [];
  news: NewsItem[] = [];

  portfolioAllocation = [
    { label: 'DASHBOARD.EQUITY', pct: 55, color: '#3b82f6' },
    { label: 'DASHBOARD.MUTUAL_FUNDS', pct: 25, color: '#8b5cf6' },
    { label: 'DASHBOARD.GOLD', pct: 10, color: '#f59e0b' },
    { label: 'DASHBOARD.DEBT', pct: 10, color: '#10b981' },
  ];

  quickActions = [
    { icon: 'candlestick_chart', label: 'DASHBOARD.STOCKS', route: '/stocks', color: '#3b82f6' },
    { icon: 'smart_toy', label: 'DASHBOARD.AI_CHAT', route: '/ai-chat', color: '#8b5cf6' },
    { icon: 'filter_list', label: 'DASHBOARD.SCREENER', route: '/screener', color: '#10b981' },
    {
      icon: 'pie_chart',
      label: 'DASHBOARD.MUTUAL_FUNDS',
      route: '/mutual-funds',
      color: '#f59e0b',
    },
    { icon: 'leaderboard', label: 'DASHBOARD.INDICES', route: '/indices', color: '#ef4444' },
    { icon: 'monetization_on', label: 'DASHBOARD.GOLD', route: '/gold', color: '#eab308' },
  ];

  columns: TableColumn[] = [];

  constructor(
    private auth: AuthService,
    private marketData: MarketDataService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user?.name) {
      this.userName = user.name.split(' ')[0];
    }
    this.greeting = this.timeGreeting();
    this.stats = [
      {
        label: this.translate.instant('DASHBOARD.PORTFOLIO_VALUE'),
        value: '₹12,45,000',
        change: '+2.3%',
        positive: true,
        icon: 'account_balance_wallet',
        color: '#3b82f6',
      },
      {
        label: this.translate.instant('DASHBOARD.TODAY_PNL'),
        value: '+₹3,420',
        change: '+0.28%',
        positive: true,
        icon: 'trending_up',
        color: '#10b981',
      },
      {
        label: this.translate.instant('DASHBOARD.AI_SCORE_AVG'),
        value: '72',
        change: '+3 pts',
        positive: true,
        icon: 'psychology',
        color: '#8b5cf6',
      },
      {
        label: this.translate.instant('DASHBOARD.RISK_LEVEL'),
        value: this.translate.instant('DASHBOARD.MODERATE'),
        change: 'Beta 1.1',
        positive: true,
        icon: 'shield',
        color: '#f59e0b',
      },
    ];
    this.columns = [
      {
        key: 'name',
        label: this.translate.instant('DASHBOARD.COL_STOCK'),
        sortable: true,
        width: '40%',
      },
      {
        key: 'price',
        label: this.translate.instant('DASHBOARD.COL_PRICE'),
        align: 'right',
        sortable: true,
      },
      {
        key: 'pct',
        label: this.translate.instant('DASHBOARD.COL_CHANGE'),
        align: 'right',
        sortable: true,
        pipe: 'percent',
      },
      {
        key: 'volume',
        label: this.translate.instant('DASHBOARD.COL_VOLUME'),
        align: 'right',
        sortable: true,
      },
    ];
    this.indices = this.marketData.indices.slice(0, 6);
    this.sectors = this.marketData.sectors;
    this.gainers = this.marketData.gainers.slice(0, 5);
    this.losers = this.marketData.losers.slice(0, 5);
    this.mostActive = this.marketData.mostActive.slice(0, 5);
    this.news = this.marketData.news;
  }

  get tabData(): StockQuote[] {
    switch (this.activeTab) {
      case 'gainers':
        return this.gainers;
      case 'losers':
        return this.losers;
      case 'active':
        return this.mostActive;
    }
  }

  private timeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return this.translate.instant('DASHBOARD.GOOD_MORNING');
    if (hour < 17) return this.translate.instant('DASHBOARD.GOOD_AFTERNOON');
    return this.translate.instant('DASHBOARD.GOOD_EVENING');
  }

  trackBySymbol(_index: number, item: StockQuote): string {
    return item.symbol;
  }
}
