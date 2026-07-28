import { Component, inject, OnInit, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';
import { MarketDataService } from '../../core/services/market-data.service';

@Component({
  standalone: false,
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private marketData = inject(MarketDataService);
  private el = inject(ElementRef);
  private observers: IntersectionObserver[] = [];

  marketStatus = 'Markets are Open';

  /* ── Indices ticker ── */
  indices = this.marketData.indices;

  /* ── AI Score (branded Quantora feature) ── */
  aiScore = {
    overall: 8.2,
    technicals: 8.5,
    fundamentals: 7.9,
    sentiment: 7.1,
    momentum: 9.0,
  };

  /* ── Market sentiment ── */
  sentiment = {
    label: 'Greed',
    value: 68,
    color: 'var(--accent-orange, #f59e0b)',
  };

  /* ── Today's stocks ── */
  stockTabs = ['Gainers', 'Losers', 'Most Active', '52W High', '52W Low'];
  activeStockTab = 0;
  stockData: Record<string, any[]> = {
    Gainers: this.marketData.gainers,
    Losers: this.marketData.losers,
    'Most Active': this.marketData.mostActive,
    '52W High': this.marketData.weekHigh,
    '52W Low': this.marketData.weekLow,
  };

  /* ── Mutual Funds ── */
  mfTabs = ['Equity', 'Debt', 'Hybrid', 'ELSS', 'Index Funds'];
  activeMfTab = 0;
  mfData = this.marketData.mutualFunds;

  /* ── News ── */
  newsTabs = ['All', 'Markets', 'Economy', 'Stocks', 'Business'];
  activeNewsTab = 0;
  news = this.marketData.news;
  spotlightNews = this.news[0];

  /* ── Curated Screens ── */
  curatedScreens = this.marketData.curatedScreens;

  /* ── Popular Stocks ── */
  popularStocks = this.marketData.popularStocks;

  /* ── Stats (social proof) ── */
  stats = [
    { label: 'Assets Tracked', value: '₹2.4L Cr+', icon: 'account_balance' },
    { label: 'Investors Trust Us', value: '2.5L+', icon: 'groups' },
    { label: 'AI Insights Daily', value: '50K+', icon: 'psychology' },
    { label: 'App Rating', value: '4.6 ★', icon: 'star' },
  ];

  /* ── Features ── */
  features = [
    {
      icon: 'psychology',
      title: 'AI-Powered Analysis',
      desc: 'Get intelligent stock scores, sector insights, and investment recommendations powered by machine learning.',
    },
    {
      icon: 'show_chart',
      title: 'Real-Time Data',
      desc: 'Live market data, indices, and stock prices updated every second during trading hours.',
    },
    {
      icon: 'filter_list',
      title: 'Smart Screeners',
      desc: 'Filter 5,000+ stocks and ETFs with 200+ financial parameters to find your next investment.',
    },
    {
      icon: 'account_balance_wallet',
      title: 'Portfolio Tracking',
      desc: 'Track your holdings, get alerts, and monitor performance with detailed analytics.',
    },
    {
      icon: 'notifications_active',
      title: 'Price Alerts',
      desc: 'Set custom alerts for price targets, volume spikes, and technical indicators.',
    },
    {
      icon: 'school',
      title: 'Learn & Grow',
      desc: 'Access courses, research reports, and market news to become a smarter investor.',
    },
  ];

  /* ── Methods ── */
  setActiveStockTab(i: number) {
    this.activeStockTab = i;
  }

  setActiveMfTab(i: number) {
    this.activeMfTab = i;
  }

  setActiveNewsTab(i: number) {
    this.activeNewsTab = i;
    this.spotlightNews = this.filteredNews[0] || this.news[0];
  }

  get filteredNews() {
    if (this.activeNewsTab === 0) return this.news;
    const cat = this.newsTabs[this.activeNewsTab];
    return this.news.filter((n) => n.category === cat);
  }

  ngAfterViewInit() {
    this.setupScrollReveal();
  }

  ngOnDestroy() {
    this.observers.forEach((o) => o.disconnect());
  }

  private setupScrollReveal() {
    const targets = this.el.nativeElement.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    targets.forEach((t: Element) => observer.observe(t));
    this.observers.push(observer);
  }
}
