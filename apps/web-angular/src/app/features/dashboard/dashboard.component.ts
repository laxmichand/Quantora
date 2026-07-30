import { Component, OnInit } from '@angular/core';
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
  activeTab: 'gainers' | 'losers' | 'active' = 'gainers';

  stats = [
    {
      label: 'Portfolio Value',
      value: '₹12,45,000',
      change: '+2.3%',
      positive: true,
      icon: 'account_balance_wallet',
      color: '#3b82f6',
    },
    {
      label: "Today's P&L",
      value: '+₹3,420',
      change: '+0.28%',
      positive: true,
      icon: 'trending_up',
      color: '#10b981',
    },
    {
      label: 'AI Score (Avg)',
      value: '72',
      change: '+3 pts',
      positive: true,
      icon: 'psychology',
      color: '#8b5cf6',
    },
    {
      label: 'Risk Level',
      value: 'Moderate',
      change: 'Beta 1.1',
      positive: true,
      icon: 'shield',
      color: '#f59e0b',
    },
  ];

  indices: IndexData[] = [];
  sectors: SectorData[] = [];
  gainers: StockQuote[] = [];
  losers: StockQuote[] = [];
  mostActive: StockQuote[] = [];
  news: NewsItem[] = [];

  portfolioAllocation = [
    { label: 'Equity', pct: 55, color: '#3b82f6' },
    { label: 'Mutual Funds', pct: 25, color: '#8b5cf6' },
    { label: 'Gold', pct: 10, color: '#f59e0b' },
    { label: 'Debt', pct: 10, color: '#10b981' },
  ];

  quickActions = [
    { icon: 'candlestick_chart', label: 'Stocks', route: '/stocks', color: '#3b82f6' },
    { icon: 'smart_toy', label: 'AI Chat', route: '/ai-chat', color: '#8b5cf6' },
    { icon: 'filter_list', label: 'Screener', route: '/screener', color: '#10b981' },
    { icon: 'pie_chart', label: 'Mutual Funds', route: '/mutual-funds', color: '#f59e0b' },
    { icon: 'leaderboard', label: 'Indices', route: '/indices', color: '#ef4444' },
    { icon: 'monetization_on', label: 'Gold', route: '/gold', color: '#eab308' },
  ];

  columns: TableColumn[] = [
    { key: 'name', label: 'Stock', sortable: true, width: '40%' },
    { key: 'price', label: 'Price', align: 'right', sortable: true },
    { key: 'pct', label: 'Change', align: 'right', sortable: true, pipe: 'percent' },
    { key: 'volume', label: 'Volume', align: 'right', sortable: true },
  ];

  constructor(
    private auth: AuthService,
    private marketData: MarketDataService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user?.name) {
      this.userName = user.name.split(' ')[0];
    }
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

  trackBySymbol(_index: number, item: StockQuote): string {
    return item.symbol;
  }
}
