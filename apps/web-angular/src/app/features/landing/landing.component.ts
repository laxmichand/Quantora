import {
  Component,
  inject,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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
  private translate = inject(TranslateService);
  private observers: IntersectionObserver[] = [];

  marketStatus = 'LANDING.MARKETS_OPEN';

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
  stockTabs = [
    'LANDING.GAINERS',
    'LANDING.LOSERS',
    'LANDING.MOST_ACTIVE',
    'LANDING.W52_HIGH',
    'LANDING.W52_LOW',
  ];
  activeStockTab = 0;
  stockData: Record<string, any[]> = {
    'LANDING.GAINERS': this.marketData.gainers,
    'LANDING.LOSERS': this.marketData.losers,
    'LANDING.MOST_ACTIVE': this.marketData.mostActive,
    'LANDING.W52_HIGH': this.marketData.weekHigh,
    'LANDING.W52_LOW': this.marketData.weekLow,
  };

  /* ── Mutual Funds ── */
  mfTabs = [
    'LANDING.EQUITY',
    'LANDING.DEBT',
    'LANDING.HYBRID',
    'LANDING.ELSS',
    'LANDING.INDEX_FUNDS',
  ];
  activeMfTab = 0;
  mfData: Record<string, any[]> = {
    'LANDING.EQUITY': this.marketData.mutualFunds['Equity'] ?? [],
    'LANDING.DEBT': this.marketData.mutualFunds['Debt'] ?? [],
    'LANDING.HYBRID': this.marketData.mutualFunds['Hybrid'] ?? [],
    'LANDING.ELSS': this.marketData.mutualFunds['ELSS'] ?? [],
    'LANDING.INDEX_FUNDS': this.marketData.mutualFunds['Index Funds'] ?? [],
  };

  /* ── News ── */
  newsTabs = [
    'LANDING.ALL',
    'LANDING.MARKET_NEWS',
    'LANDING.ECONOMY',
    'LANDING.GAINERS',
    'LANDING.BUSINESS',
  ];
  activeNewsTab = 0;
  news = this.marketData.news;
  spotlightNews = this.news[0];

  /* ── Curated Screens ── */
  curatedScreens = this.marketData.curatedScreens;

  /* ── Popular Stocks ── */
  popularStocks = this.marketData.popularStocks;

  /* ── Stats (social proof) ── */
  stats = [
    { label: 'LANDING.STAT_ASSETS', value: '₹2.4L Cr+', icon: 'account_balance' },
    { label: 'LANDING.STAT_INVESTORS', value: '2.5L+', icon: 'groups' },
    { label: 'LANDING.STAT_INSIGHTS', value: '50K+', icon: 'psychology' },
    { label: 'LANDING.STAT_RATING', value: '4.6 ★', icon: 'star' },
  ];

  /* ── Features ── */
  features = [
    {
      icon: 'psychology',
      title: 'LANDING.FEATURE_AI_TITLE',
      desc: 'LANDING.FEATURE_AI_DESC',
    },
    {
      icon: 'show_chart',
      title: 'LANDING.FEATURE_REALTIME_TITLE',
      desc: 'LANDING.FEATURE_REALTIME_DESC',
    },
    {
      icon: 'filter_list',
      title: 'LANDING.FEATURE_SCREENER_TITLE',
      desc: 'LANDING.FEATURE_SCREENER_DESC',
    },
    {
      icon: 'account_balance_wallet',
      title: 'LANDING.FEATURE_PORTFOLIO_TITLE',
      desc: 'LANDING.FEATURE_PORTFOLIO_DESC',
    },
    {
      icon: 'notifications_active',
      title: 'LANDING.FEATURE_ALERTS_TITLE',
      desc: 'LANDING.FEATURE_ALERTS_DESC',
    },
    {
      icon: 'school',
      title: 'LANDING.FEATURE_LEARN_TITLE',
      desc: 'LANDING.FEATURE_LEARN_DESC',
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
    // Map the translation-key tab back to the market-data category it represents
    const categoryMap: Record<string, string> = {
      'LANDING.MARKET_NEWS': 'Markets',
      'LANDING.ECONOMY': 'Economy',
      'LANDING.GAINERS': 'Stocks',
      'LANDING.BUSINESS': 'Business',
    };
    const category = categoryMap[cat] ?? cat;
    return this.news.filter((n) => n.category === category);
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
      {
        key: 'symbol',
        label: this.translate.instant('DASHBOARD.COL_SYMBOL'),
        cellTemplate: this.stockSymCell,
        sortable: true,
      },
      {
        key: 'price',
        label: this.translate.instant('DASHBOARD.COL_LTP'),
        align: 'right',
        pipe: 'number',
        class: 'text-price',
        sortable: true,
      },
      {
        key: 'change',
        label: this.translate.instant('DASHBOARD.COL_CHANGE'),
        align: 'right',
        cellTemplate: this.stockChgCell,
        sortable: true,
      },
      {
        key: 'pct',
        label: this.translate.instant('DASHBOARD.COL_PCT_CHANGE'),
        align: 'right',
        cellTemplate: this.stockPctCell,
        sortable: true,
      },
      {
        key: 'volume',
        label: this.translate.instant('DASHBOARD.COL_VOLUME'),
        align: 'right',
        class: 'text-muted',
        sortable: true,
      },
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
      {
        key: 'name',
        label: this.translate.instant('PORTFOLIO.COL_STOCK'),
        cellTemplate: this.fundNameTpl,
        sortable: true,
      },
      { key: 'category', label: 'Category', cellTemplate: this.fundCatTpl, sortable: true },
      { key: 'returns1y', label: '1Y Return', align: 'right', class: 'text-green', sortable: true },
      { key: 'returns3y', label: '3Y Return', align: 'right', class: 'text-green', sortable: true },
      { key: 'returns5y', label: '5Y Return', align: 'right', class: 'text-green', sortable: true },
      {
        key: 'risk',
        label: this.translate.instant('DASHBOARD.RISK_LEVEL'),
        cellTemplate: this.fundRiskTpl,
        sortable: false,
      },
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
