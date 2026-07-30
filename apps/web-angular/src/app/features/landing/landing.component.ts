import {
  Component,
  inject,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { MarketDataService } from '../../core/services/market-data.service';
import { TableColumn } from '../../shared/components/data-table/data-table.component';

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

  @ViewChild('stockNumCell', { static: true }) stockNumCell!: TemplateRef<any>;
  @ViewChild('stockSymCell', { static: true }) stockSymCell!: TemplateRef<any>;
  @ViewChild('stockChgCell', { static: true }) stockChgCell!: TemplateRef<any>;
  @ViewChild('stockPctCell', { static: true }) stockPctCell!: TemplateRef<any>;
  @ViewChild('fundNumCell', { static: true }) fundNumCell!: TemplateRef<any>;
  @ViewChild('fundNameTpl', { static: true }) fundNameTpl!: TemplateRef<any>;
  @ViewChild('fundCatTpl', { static: true }) fundCatTpl!: TemplateRef<any>;
  @ViewChild('fundRiskTpl', { static: true }) fundRiskTpl!: TemplateRef<any>;

  stockColumns: TableColumn[] = [];
  mfColumns: TableColumn[] = [];

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
    this.stockColumns = [
      {
        key: '#',
        label: '#',
        width: '30px',
        cellTemplate: this.stockNumCell,
        sortable: false,
        hideable: false,
      },
      { key: 'symbol', label: 'Symbol', cellTemplate: this.stockSymCell, sortable: true },
      {
        key: 'price',
        label: 'LTP (₹)',
        align: 'right',
        pipe: 'number',
        class: 'text-price',
        sortable: true,
      },
      {
        key: 'change',
        label: 'Change',
        align: 'right',
        cellTemplate: this.stockChgCell,
        sortable: true,
      },
      {
        key: 'pct',
        label: '% Change',
        align: 'right',
        cellTemplate: this.stockPctCell,
        sortable: true,
      },
      { key: 'volume', label: 'Volume', align: 'right', class: 'text-muted', sortable: true },
    ];
    this.mfColumns = [
      {
        key: '#',
        label: '#',
        width: '30px',
        cellTemplate: this.fundNumCell,
        sortable: false,
        hideable: false,
      },
      { key: 'name', label: 'Fund Name', cellTemplate: this.fundNameTpl, sortable: true },
      { key: 'category', label: 'Category', cellTemplate: this.fundCatTpl, sortable: true },
      { key: 'returns1y', label: '1Y Return', align: 'right', class: 'text-green', sortable: true },
      { key: 'returns3y', label: '3Y Return', align: 'right', class: 'text-green', sortable: true },
      { key: 'returns5y', label: '5Y Return', align: 'right', class: 'text-green', sortable: true },
      { key: 'risk', label: 'Risk', cellTemplate: this.fundRiskTpl, sortable: false },
      { key: 'sip', label: 'Min SIP', align: 'right', class: 'sip-val', sortable: true },
    ];
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
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    targets.forEach((t: Element) => observer.observe(t));
    this.observers.push(observer);
  }
}
