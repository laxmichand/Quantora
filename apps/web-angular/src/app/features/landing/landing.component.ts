import { Component, inject } from '@angular/core';
import { MarketDataService } from '../../core/services/market-data.service';

@Component({
  standalone: false,
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent {
  private marketData = inject(MarketDataService);

  marketStatus = 'Markets are Open';

  indices = this.marketData.indices;
  stockTabs = ['Gainers', 'Losers', 'Most Active', '52 Week High', '52 Week Low'];
  activeStockTab = 0;

  stockData: Record<string, any[]> = {
    Gainers: this.marketData.gainers,
    Losers: this.marketData.losers,
    'Most Active': this.marketData.mostActive,
    '52 Week High': this.marketData.weekHigh,
    '52 Week Low': this.marketData.weekLow,
  };

  mfTabs = ['Equity', 'Debt', 'Hybrid', 'ELSS', 'Index Funds'];
  activeMfTab = 0;
  mfData = this.marketData.mutualFunds;

  news = this.marketData.news;
  curatedScreens = this.marketData.curatedScreens;
  popularStocks = this.marketData.popularStocks;

  setActiveStockTab(i: number) {
    this.activeStockTab = i;
  }
  setActiveMfTab(i: number) {
    this.activeMfTab = i;
  }
}
