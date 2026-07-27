import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  stats = [
    { label: 'Portfolio Value', value: '₹12,45,000', change: '+2.3%', positive: true, icon: 'account_balance_wallet' },
    { label: "Today's P&L", value: '+₹3,420', change: '+0.28%', positive: true, icon: 'trending_up' },
    { label: 'AI Score (Avg)', value: '72', change: '+3 pts', positive: true, icon: 'psychology' },
    { label: 'Risk Level', value: 'Moderate', change: 'Beta 1.1', positive: true, icon: 'shield' },
  ];

  topStocks = [
    { symbol: 'ITC', price: 462.50, change: 2.3, aiScore: 78 },
    { symbol: 'TCS', price: 3890.00, change: 1.1, aiScore: 72 },
    { symbol: 'HDFCBANK', price: 1645.00, change: -0.5, aiScore: 75 },
    { symbol: 'RELIANCE', price: 2890.00, change: -1.2, aiScore: 68 },
    { symbol: 'INFY', price: 1520.00, change: 0.8, aiScore: 71 },
  ];
}
