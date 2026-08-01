import { Component, OnInit, TemplateRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { TableColumn } from '../../../shared/components/data-table/data-table.component';

interface Holding {
  symbol: string;
  name: string;
  qty: number;
  avgPrice: number;
  ltp: number;
  change: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
  sector: string;
  weight: number;
}

@Component({
  selector: 'app-portfolio-overview',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portfolio-overview.component.html',
  styleUrls: ['./portfolio-overview.component.scss'],
})
export class PortfolioOverviewComponent implements OnInit {
  @ViewChild('symbolCellTpl') symbolCellTpl!: TemplateRef<any>;
  @ViewChild('changeCellTpl') changeCellTpl!: TemplateRef<any>;
  @ViewChild('pnlCellTpl') pnlCellTpl!: TemplateRef<any>;

  summary = {
    invested: 1085000,
    currentValue: 1245000,
    pnl: 160000,
    pnlPct: 14.75,
    todayPnl: 3420,
    todayPnlPct: 0.28,
    xirr: 18.6,
    peakValue: 1280000,
  };

  holdings: Holding[] = [
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries',
      qty: 15,
      avgPrice: 2650,
      ltp: 2890,
      change: 1.23,
      invested: 397500,
      currentValue: 433500,
      pnl: 36000,
      pnlPct: 9.06,
      sector: 'Energy',
      weight: 34.8,
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy',
      qty: 10,
      avgPrice: 3650,
      ltp: 3812,
      change: -0.56,
      invested: 365000,
      currentValue: 381200,
      pnl: 16200,
      pnlPct: 4.44,
      sector: 'IT',
      weight: 30.6,
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank',
      qty: 20,
      avgPrice: 1580,
      ltp: 1678,
      change: 0.75,
      invested: 316000,
      currentValue: 335600,
      pnl: 19600,
      pnlPct: 6.2,
      sector: 'Banking',
      weight: 27.0,
    },
    {
      symbol: 'INFY',
      name: 'Infosys',
      qty: 25,
      avgPrice: 1420,
      ltp: 1520,
      change: 2.45,
      invested: 355000,
      currentValue: 380000,
      pnl: 25000,
      pnlPct: 7.04,
      sector: 'IT',
      weight: 3.1,
    },
    {
      symbol: 'ITC',
      name: 'ITC Limited',
      qty: 50,
      avgPrice: 435,
      ltp: 462.5,
      change: 0.42,
      invested: 21750,
      currentValue: 23125,
      pnl: 1375,
      pnlPct: 6.32,
      sector: 'FMCG',
      weight: 1.9,
    },
    {
      symbol: 'SBIN',
      name: 'State Bank of India',
      qty: 30,
      avgPrice: 750,
      ltp: 812.45,
      change: -0.64,
      invested: 22500,
      currentValue: 24374,
      pnl: 1874,
      pnlPct: 8.33,
      sector: 'Banking',
      weight: 2.0,
    },
    {
      symbol: 'TATAMOTORS',
      name: 'Tata Motors',
      qty: 40,
      avgPrice: 890,
      ltp: 978.6,
      change: 2.32,
      invested: 35600,
      currentValue: 39144,
      pnl: 3544,
      pnlPct: 9.95,
      sector: 'Auto',
      weight: 3.1,
    },
    {
      symbol: 'BAJFINANCE',
      name: 'Bajaj Finance',
      qty: 5,
      avgPrice: 6800,
      ltp: 7123.8,
      change: -1.24,
      invested: 34000,
      currentValue: 35619,
      pnl: 1619,
      pnlPct: 4.76,
      sector: 'Finance',
      weight: 2.9,
    },
  ];

  columns: TableColumn[] = [
    {
      key: 'symbol',
      label: this.translate.instant('PORTFOLIO.COL_STOCK'),
      sortable: true,
      sticky: true,
      width: '180px',
    },
    {
      key: 'qty',
      label: this.translate.instant('PORTFOLIO.COL_QTY'),
      align: 'right',
      sortable: true,
    },
    {
      key: 'avgPrice',
      label: this.translate.instant('PORTFOLIO.COL_AVG_PRICE'),
      align: 'right',
      sortable: true,
      pipe: 'currency',
    },
    {
      key: 'ltp',
      label: this.translate.instant('PORTFOLIO.COL_LTP'),
      align: 'right',
      sortable: true,
      pipe: 'currency',
    },
    {
      key: 'change',
      label: this.translate.instant('PORTFOLIO.COL_CHG'),
      align: 'right',
      sortable: true,
      pipe: 'percent',
    },
    {
      key: 'invested',
      label: this.translate.instant('PORTFOLIO.COL_INVESTED'),
      align: 'right',
      sortable: true,
      pipe: 'currency',
    },
    {
      key: 'currentValue',
      label: this.translate.instant('PORTFOLIO.COL_CURRENT'),
      align: 'right',
      sortable: true,
      pipe: 'currency',
    },
    {
      key: 'pnl',
      label: this.translate.instant('PORTFOLIO.COL_PNL'),
      align: 'right',
      sortable: true,
      pipe: 'currency',
    },
    {
      key: 'pnlPct',
      label: this.translate.instant('PORTFOLIO.COL_RETURNS'),
      align: 'right',
      sortable: true,
      pipe: 'percent',
    },
    { key: 'sector', label: this.translate.instant('PORTFOLIO.COL_SECTOR'), sortable: true },
    {
      key: 'weight',
      label: this.translate.instant('PORTFOLIO.COL_WEIGHT'),
      align: 'right',
      sortable: true,
      pipe: 'percent',
    },
  ];

  sectorAllocation = [
    { label: 'Energy', pct: 34.8, color: '#3b82f6' },
    { label: 'IT', pct: 33.7, color: '#8b5cf6' },
    { label: 'Banking', pct: 29.0, color: '#10b981' },
    { label: 'Auto', pct: 3.1, color: '#f59e0b' },
    { label: 'Finance', pct: 2.9, color: '#ef4444' },
    { label: 'FMCG', pct: 1.9, color: '#ec4899' },
  ];

  constructor(
    private location: Location,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {}

  goBack(): void {
    this.location.back();
  }

  formatCurrency(val: number): string {
    return '₹' + val.toLocaleString('en-IN');
  }
}
