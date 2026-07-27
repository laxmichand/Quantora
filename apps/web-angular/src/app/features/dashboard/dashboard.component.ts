import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  stats = [
    {
      labelKey: 'DASHBOARD.PORTFOLIO_VALUE',
      value: '₹12,45,000',
      change: '+2.3%',
      positive: true,
      icon: 'account_balance_wallet',
    },
    {
      labelKey: 'DASHBOARD.TODAY_PNL',
      value: '+₹3,420',
      change: '+0.28%',
      positive: true,
      icon: 'trending_up',
    },
    {
      labelKey: 'DASHBOARD.AI_SCORE_AVG',
      value: '72',
      change: '+3 pts',
      positive: true,
      icon: 'psychology',
    },
    {
      labelKey: 'DASHBOARD.RISK_LEVEL',
      value: 'Moderate',
      change: 'Beta 1.1',
      positive: true,
      icon: 'shield',
    },
  ];

  topStocks = [
    { symbol: 'ITC', price: 462.5, change: 2.3, aiScore: 78 },
    { symbol: 'TCS', price: 3890.0, change: 1.1, aiScore: 72 },
    { symbol: 'HDFCBANK', price: 1645.0, change: -0.5, aiScore: 75 },
    { symbol: 'RELIANCE', price: 2890.0, change: -1.2, aiScore: 68 },
    { symbol: 'INFY', price: 1520.0, change: 0.8, aiScore: 71 },
  ];
}
