import { Injectable } from '@angular/core';

export interface IndexData {
  name: string;
  value: string;
  change: number;
  previousClose?: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: string;
  change: number;
  pct: number;
  volume: string;
  marketCap?: string;
  pe?: string;
  sector?: string;
}

export interface MutualFund {
  name: string;
  category: string;
  returns1y: string;
  returns3y: string;
  returns5y: string;
  risk: string;
  sip: string;
  amc?: string;
  aum?: string;
  nav?: string;
}

export interface NewsItem {
  title: string;
  time: string;
  category: string;
  icon: string;
  url?: string;
}

export interface SectorData {
  name: string;
  change: number;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class MarketDataService {
  private _indices: IndexData[] = [
    { name: 'NIFTY 50', value: '24,867.50', change: 0.82 },
    { name: 'SENSEX', value: '81,432.10', change: 0.74 },
    { name: 'BANK NIFTY', value: '53,210.85', change: -0.27 },
    { name: 'NIFTY IT', value: '38,945.20', change: 0.81 },
    { name: 'NIFTY MIDCAP 100', value: '52,678.90', change: 0.81 },
    { name: 'INDIA VIX', value: '13.42', change: -2.55 },
    { name: 'NIFTY BANK', value: '51,340.60', change: 0.35 },
    { name: 'NIFTY FIN SERVICE', value: '23,156.75', change: -0.12 },
    { name: 'NIFTY AUTO', value: '19,876.40', change: 1.24 },
    { name: 'NIFTY PHARMA', value: '17,234.55', change: 0.67 },
    { name: 'NIFTY FMCG', value: '56,890.30', change: -0.43 },
    { name: 'NIFTY METAL', value: '8,567.25', change: 2.15 },
  ];

  private _sectors: SectorData[] = [
    { name: 'IT', change: 0.81, icon: 'computer' },
    { name: 'Banking', change: -0.27, icon: 'account_balance' },
    { name: 'Auto', change: 1.24, icon: 'directions_car' },
    { name: 'Pharma', change: 0.67, icon: 'local_hospital' },
    { name: 'FMCG', change: -0.43, icon: 'shopping_cart' },
    { name: 'Metal', change: 2.15, icon: 'precision_manufacturing' },
    { name: 'Realty', change: 1.82, icon: 'apartment' },
    { name: 'Energy', change: -0.56, icon: 'bolt' },
  ];

  private _gainers: StockQuote[] = [
    {
      symbol: 'ADANIENT',
      name: 'Adani Enterprises',
      price: '3,245.80',
      change: 142.5,
      pct: 4.59,
      volume: '12.4M',
      sector: 'Conglomerate',
    },
    {
      symbol: 'TATASTEEL',
      name: 'Tata Steel',
      price: '168.35',
      change: 6.2,
      pct: 3.83,
      volume: '45.2M',
      sector: 'Metal',
    },
    {
      symbol: 'HCLTECH',
      name: 'HCL Technologies',
      price: '1,756.40',
      change: 58.3,
      pct: 3.43,
      volume: '8.7M',
      sector: 'IT',
    },
    {
      symbol: 'WIPRO',
      name: 'Wipro Ltd',
      price: '567.25',
      change: 17.85,
      pct: 3.25,
      volume: '15.3M',
      sector: 'IT',
    },
    {
      symbol: 'COALINDIA',
      name: 'Coal India',
      price: '489.60',
      change: 14.9,
      pct: 3.14,
      volume: '9.8M',
      sector: 'Mining',
    },
    {
      symbol: 'JSWSTEEL',
      name: 'JSW Steel',
      price: '1,023.75',
      change: 28.4,
      pct: 2.85,
      volume: '6.2M',
      sector: 'Metal',
    },
    {
      symbol: 'BHARTIARTL',
      name: 'Bharti Airtel',
      price: '1,678.90',
      change: 42.15,
      pct: 2.57,
      volume: '7.1M',
      sector: 'Telecom',
    },
    {
      symbol: 'INFY',
      name: 'Infosys Ltd',
      price: '1,832.50',
      change: 43.8,
      pct: 2.45,
      volume: '11.5M',
      sector: 'IT',
    },
  ];

  private _losers: StockQuote[] = [
    {
      symbol: 'SUNPHARMA',
      name: 'Sun Pharma',
      price: '1,234.60',
      change: -45.3,
      pct: -3.55,
      volume: '5.4M',
      sector: 'Pharma',
    },
    {
      symbol: 'DRREDDY',
      name: "Dr. Reddy's Labs",
      price: '5,678.90',
      change: -178.4,
      pct: -3.04,
      volume: '1.2M',
      sector: 'Pharma',
    },
    {
      symbol: 'CIPLA',
      name: 'Cipla Ltd',
      price: '1,456.30',
      change: -38.75,
      pct: -2.59,
      volume: '3.8M',
      sector: 'Pharma',
    },
    {
      symbol: 'APOLLOHOSP',
      name: 'Apollo Hospitals',
      price: '6,234.15',
      change: -152.6,
      pct: -2.39,
      volume: '0.9M',
      sector: 'Healthcare',
    },
    {
      symbol: 'TECHM',
      name: 'Tech Mahindra',
      price: '1,567.80',
      change: -32.45,
      pct: -2.03,
      volume: '4.5M',
      sector: 'IT',
    },
    {
      symbol: 'POWERGRID',
      name: 'Power Grid Corp',
      price: '289.45',
      change: -5.8,
      pct: -1.96,
      volume: '18.2M',
      sector: 'Power',
    },
    {
      symbol: 'NTPC',
      name: 'NTPC Ltd',
      price: '345.20',
      change: -6.35,
      pct: -1.81,
      volume: '22.1M',
      sector: 'Power',
    },
    {
      symbol: 'ONGC',
      name: 'Oil & Natural Gas',
      price: '278.90',
      change: -4.65,
      pct: -1.64,
      volume: '14.7M',
      sector: 'Oil & Gas',
    },
  ];

  private _mostActive: StockQuote[] = [
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries',
      price: '2,945.60',
      change: 35.8,
      pct: 1.23,
      volume: '28.5M',
      sector: 'Conglomerate',
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy',
      price: '3,812.40',
      change: -21.35,
      pct: -0.56,
      volume: '18.2M',
      sector: 'IT',
    },
    {
      symbol: 'INFY',
      name: 'Infosys Ltd',
      price: '1,832.50',
      change: 43.8,
      pct: 2.45,
      volume: '15.8M',
      sector: 'IT',
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank',
      price: '1,678.30',
      change: 12.45,
      pct: 0.75,
      volume: '14.3M',
      sector: 'Banking',
    },
    {
      symbol: 'ICICIBANK',
      name: 'ICICI Bank',
      price: '1,234.75',
      change: 8.9,
      pct: 0.73,
      volume: '12.1M',
      sector: 'Banking',
    },
    {
      symbol: 'SBIN',
      name: 'State Bank of India',
      price: '812.45',
      change: -5.2,
      pct: -0.64,
      volume: '25.4M',
      sector: 'Banking',
    },
    {
      symbol: 'TATAMOTORS',
      name: 'Tata Motors',
      price: '978.60',
      change: 22.15,
      pct: 2.32,
      volume: '19.7M',
      sector: 'Auto',
    },
    {
      symbol: 'BAJFINANCE',
      name: 'Bajaj Finance',
      price: '7,123.80',
      change: -88.45,
      pct: -1.24,
      volume: '8.9M',
      sector: 'Finance',
    },
  ];

  private _weekHigh: StockQuote[] = [
    {
      symbol: 'TRENT',
      name: 'Trent Ltd',
      price: '5,678.90',
      change: 145.2,
      pct: 2.62,
      volume: '3.4M',
      sector: 'Retail',
    },
    {
      symbol: 'ZOMATO',
      name: 'Zomato Ltd',
      price: '289.45',
      change: 8.3,
      pct: 2.95,
      volume: '32.1M',
      sector: 'Technology',
    },
    {
      symbol: 'NYKAA',
      name: 'FSN E-Comm',
      price: '234.60',
      change: 5.75,
      pct: 2.52,
      volume: '18.5M',
      sector: 'E-Commerce',
    },
    {
      symbol: 'POLYCAB',
      name: 'Polycab India',
      price: '7,234.80',
      change: 167.4,
      pct: 2.37,
      volume: '1.2M',
      sector: 'Electricals',
    },
    {
      symbol: 'DEEPAKNTR',
      name: 'Deepak Nitrite',
      price: '2,567.30',
      change: 56.8,
      pct: 2.26,
      volume: '2.8M',
      sector: 'Chemicals',
    },
    {
      symbol: 'AFFLE',
      name: 'Affle India',
      price: '1,456.75',
      change: 32.4,
      pct: 2.27,
      volume: '1.5M',
      sector: 'Technology',
    },
  ];

  private _weekLow: StockQuote[] = [
    {
      symbol: 'ZYDUSLIFE',
      name: 'Zydus Lifesciences',
      price: '923.45',
      change: -28.6,
      pct: -3.01,
      volume: '4.2M',
      sector: 'Pharma',
    },
    {
      symbol: 'LAURUSLABS',
      name: 'Laurus Labs',
      price: '456.80',
      change: -12.35,
      pct: -2.63,
      volume: '3.8M',
      sector: 'Pharma',
    },
    {
      symbol: 'ALKEM',
      name: 'Alkem Laboratories',
      price: '5,123.60',
      change: -134.2,
      pct: -2.55,
      volume: '0.8M',
      sector: 'Pharma',
    },
    {
      symbol: 'IPCALAB',
      name: 'IPCA Laboratories',
      price: '1,234.90',
      change: -28.45,
      pct: -2.25,
      volume: '1.1M',
      sector: 'Pharma',
    },
    {
      symbol: 'TORNTPHARM',
      name: 'Torrent Pharma',
      price: '2,890.45',
      change: -56.3,
      pct: -1.91,
      volume: '0.7M',
      sector: 'Pharma',
    },
    {
      symbol: 'ERIS',
      name: 'Eris Lifesciences',
      price: '1,089.20',
      change: -18.75,
      pct: -1.69,
      volume: '0.5M',
      sector: 'Pharma',
    },
  ];

  private _mutualFunds: Record<string, MutualFund[]> = {
    Equity: [
      {
        name: 'Quant Small Cap Fund',
        category: 'Small Cap',
        returns1y: '+42.5%',
        returns3y: '+28.3%',
        returns5y: '+24.1%',
        risk: 'Very High',
        sip: '₹500',
        aum: '₹24,500 Cr',
        nav: '₹234.56',
      },
      {
        name: 'SBI Contra Fund',
        category: 'Value',
        returns1y: '+38.2%',
        returns3y: '+25.7%',
        returns5y: '+21.8%',
        risk: 'Very High',
        sip: '₹500',
        aum: '₹42,800 Cr',
        nav: '₹312.78',
      },
      {
        name: 'Nippon India Growth Fund',
        category: 'Mid Cap',
        returns1y: '+35.8%',
        returns3y: '+22.4%',
        returns5y: '+19.6%',
        risk: 'Very High',
        sip: '₹500',
        aum: '₹31,200 Cr',
        nav: '₹187.45',
      },
      {
        name: 'HDFC Mid-Cap Opportunities',
        category: 'Mid Cap',
        returns1y: '+33.1%',
        returns3y: '+24.8%',
        returns5y: '+18.9%',
        risk: 'Very High',
        sip: '₹500',
        aum: '₹56,400 Cr',
        nav: '₹156.32',
      },
      {
        name: 'ICICI Pru Technology Fund',
        category: 'Sectoral',
        returns1y: '+45.6%',
        returns3y: '+18.2%',
        returns5y: '+22.3%',
        risk: 'Very High',
        sip: '₹500',
        aum: '₹18,900 Cr',
        nav: '₹278.90',
      },
    ],
    Debt: [
      {
        name: 'ICICI Pru Short Term Fund',
        category: 'Short Duration',
        returns1y: '+7.8%',
        returns3y: '+6.5%',
        returns5y: '+7.2%',
        risk: 'Low',
        sip: '₹500',
        aum: '₹35,600 Cr',
        nav: '₹42.18',
      },
      {
        name: 'HDFC Short Term Debt Fund',
        category: 'Short Duration',
        returns1y: '+7.5%',
        returns3y: '+6.2%',
        returns5y: '+7.0%',
        risk: 'Low',
        sip: '₹500',
        aum: '₹28,900 Cr',
        nav: '₹38.56',
      },
      {
        name: 'SBI Magnum Gilt Fund',
        category: 'Gilt',
        returns1y: '+8.2%',
        returns3y: '+5.8%',
        returns5y: '+6.9%',
        risk: 'Low',
        sip: '₹500',
        aum: '₹15,400 Cr',
        nav: '₹52.34',
      },
      {
        name: 'Axis Liquid Fund',
        category: 'Liquid',
        returns1y: '+6.8%',
        returns3y: '+5.5%',
        returns5y: '+6.2%',
        risk: 'Low',
        sip: '₹500',
        aum: '₹22,100 Cr',
        nav: '₹28.90',
      },
      {
        name: 'Aditya Birla SL Govt Securities',
        category: 'Gilt',
        returns1y: '+8.0%',
        returns3y: '+5.6%',
        returns5y: '+6.8%',
        risk: 'Low',
        sip: '₹500',
        aum: '₹12,300 Cr',
        nav: '₹34.78',
      },
    ],
    Hybrid: [
      {
        name: 'HDFC Balanced Advantage Fund',
        category: 'BAF',
        returns1y: '+22.4%',
        returns3y: '+16.8%',
        returns5y: '+14.5%',
        risk: 'Moderate',
        sip: '₹500',
        aum: '₹48,200 Cr',
        nav: '₹124.56',
      },
      {
        name: 'ICICI Pru Balanced Advantage',
        category: 'BAF',
        returns1y: '+20.8%',
        returns3y: '+15.2%',
        returns5y: '+13.8%',
        risk: 'Moderate',
        sip: '₹500',
        aum: '₹42,100 Cr',
        nav: '₹98.34',
      },
      {
        name: 'SBI Balanced Advantage Fund',
        category: 'BAF',
        returns1y: '+19.5%',
        returns3y: '+14.6%',
        returns5y: '—',
        risk: 'Moderate',
        sip: '₹500',
        aum: '₹18,700 Cr',
        nav: '₹67.89',
      },
      {
        name: 'Quant Absolute Fund',
        category: 'Aggressive',
        returns1y: '+28.3%',
        returns3y: '+20.1%',
        returns5y: '+18.2%',
        risk: 'High',
        sip: '₹500',
        aum: '₹8,900 Cr',
        nav: '₹245.67',
      },
      {
        name: 'Tata Balanced Advantage Fund',
        category: 'BAF',
        returns1y: '+18.7%',
        returns3y: '+13.8%',
        returns5y: '—',
        risk: 'Moderate',
        sip: '₹500',
        aum: '₹12,400 Cr',
        nav: '₹45.23',
      },
    ],
    ELSS: [
      {
        name: 'Quant Tax Plan',
        category: 'ELSS',
        returns1y: '+38.5%',
        returns3y: '+24.6%',
        returns5y: '+21.3%',
        risk: 'Very High',
        sip: '₹500',
        aum: '₹14,200 Cr',
        nav: '₹189.45',
      },
      {
        name: 'SBI Long Term Equity Fund',
        category: 'ELSS',
        returns1y: '+32.1%',
        returns3y: '+20.8%',
        returns5y: '+17.5%',
        risk: 'Very High',
        sip: '₹500',
        aum: '₹22,800 Cr',
        nav: '₹134.78',
      },
      {
        name: 'HDFC Tax Saver',
        category: 'ELSS',
        returns1y: '+28.7%',
        returns3y: '+18.4%',
        returns5y: '+16.2%',
        risk: 'Very High',
        sip: '₹500',
        aum: '₹31,500 Cr',
        nav: '₹112.34',
      },
      {
        name: 'ICICI Pru Long Term Equity',
        category: 'ELSS',
        returns1y: '+30.2%',
        returns3y: '+19.6%',
        returns5y: '+16.8%',
        risk: 'Very High',
        sip: '₹500',
        aum: '₹18,600 Cr',
        nav: '₹98.56',
      },
      {
        name: 'Mirae Asset Tax Saver Fund',
        category: 'ELSS',
        returns1y: '+34.8%',
        returns3y: '+21.3%',
        returns5y: '+18.1%',
        risk: 'Very High',
        sip: '₹500',
        aum: '₹26,400 Cr',
        nav: '₹156.23',
      },
    ],
    'Index Funds': [
      {
        name: 'UTI Nifty 50 Index Fund',
        category: 'Large Cap',
        returns1y: '+18.2%',
        returns3y: '+14.5%',
        returns5y: '+12.8%',
        risk: 'Moderate',
        sip: '₹500',
        aum: '₹18,900 Cr',
        nav: '₹245.67',
      },
      {
        name: 'HDFC Index Fund - S&P BSE',
        category: 'Large Cap',
        returns1y: '+17.8%',
        returns3y: '+14.2%',
        returns5y: '+12.5%',
        risk: 'Moderate',
        sip: '₹500',
        aum: '₹12,400 Cr',
        nav: '₹178.90',
      },
      {
        name: 'Motilal Oswal Nifty Next 50',
        category: 'Large & Mid',
        returns1y: '+22.4%',
        returns3y: '+16.8%',
        returns5y: '—',
        risk: 'Moderate',
        sip: '₹500',
        aum: '₹8,200 Cr',
        nav: '₹134.56',
      },
      {
        name: 'Axis Nifty 100 Index Fund',
        category: 'Large Cap',
        returns1y: '+17.5%',
        returns3y: '—',
        returns5y: '—',
        risk: 'Moderate',
        sip: '₹500',
        aum: '₹5,600 Cr',
        nav: '₹112.34',
      },
      {
        name: 'Navi Nifty 50 Index Fund',
        category: 'Large Cap',
        returns1y: '+18.0%',
        returns3y: '—',
        returns5y: '—',
        risk: 'Moderate',
        sip: '₹500',
        aum: '₹3,200 Cr',
        nav: '₹89.45',
      },
    ],
  };

  private _news: NewsItem[] = [
    {
      title: 'Nifty crosses 24,800 mark for the first time amid global rally',
      time: '2 hours ago',
      category: 'Markets',
      icon: 'trending_up',
    },
    {
      title: 'RBI holds repo rate steady at 6.5% for sixth consecutive meeting',
      time: '4 hours ago',
      category: 'Economy',
      icon: 'account_balance',
    },
    {
      title: 'Reliance Industries announces ₹75,000 Cr investment in green energy',
      time: '5 hours ago',
      category: 'Business',
      icon: 'eco',
    },
    {
      title: 'IT stocks surge as Q3 results beat street estimates',
      time: '6 hours ago',
      category: 'Stocks',
      icon: 'computer',
    },
    {
      title: 'SEBI introduces new mutual fund expense ratio caps effective April',
      time: '8 hours ago',
      category: 'Regulation',
      icon: 'gavel',
    },
    {
      title: 'Gold hits all-time high of ₹72,450 per 10 grams',
      time: '10 hours ago',
      category: 'Commodities',
      icon: 'monetization_on',
    },
  ];

  private _curatedScreens = [
    { name: 'Top Gainers Today', count: 24, icon: 'trending_up' },
    { name: 'High Volume Stocks', count: 50, icon: 'bar_chart' },
    { name: 'RSI Oversold', count: 18, icon: 'speed' },
    { name: '52 Week High', count: 45, icon: 'arrow_upward' },
    { name: 'Small Cap Multibagger', count: 32, icon: 'rocket_launch' },
    { name: 'Dividend Yield > 3%', count: 28, icon: 'payments' },
    { name: 'Debt Free Companies', count: 65, icon: 'verified' },
    { name: 'Zero Promoter Pledge', count: 89, icon: 'lock' },
    { name: 'FII Increasing Stake', count: 35, icon: 'trending_up' },
    { name: 'Low PE Ratio', count: 42, icon: 'calculate' },
    { name: 'Quarterly Profit Growth', count: 55, icon: 'show_chart' },
    { name: 'Mutual Fund Holding', count: 38, icon: 'account_balance_wallet' },
  ];

  private _popularStocks: StockQuote[] = [
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries',
      price: '2,945.60',
      change: 1.23,
      pct: 1.23,
      volume: '28.5M',
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy',
      price: '3,812.40',
      change: -0.56,
      pct: -0.56,
      volume: '18.2M',
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank',
      price: '1,678.30',
      change: 0.75,
      pct: 0.75,
      volume: '14.3M',
    },
    {
      symbol: 'INFY',
      name: 'Infosys Ltd',
      price: '1,832.50',
      change: 2.45,
      pct: 2.45,
      volume: '15.8M',
    },
    {
      symbol: 'ICICIBANK',
      name: 'ICICI Bank',
      price: '1,234.75',
      change: 0.73,
      pct: 0.73,
      volume: '12.1M',
    },
    {
      symbol: 'SBIN',
      name: 'State Bank of India',
      price: '812.45',
      change: -0.64,
      pct: -0.64,
      volume: '25.4M',
    },
    {
      symbol: 'BHARTIARTL',
      name: 'Bharti Airtel',
      price: '1,678.90',
      change: 2.57,
      pct: 2.57,
      volume: '7.1M',
    },
    {
      symbol: 'ITC',
      name: 'ITC Limited',
      price: '478.30',
      change: 0.42,
      pct: 0.42,
      volume: '22.8M',
    },
  ];

  get indices(): IndexData[] {
    return this._indices;
  }
  get sectors(): SectorData[] {
    return this._sectors;
  }
  get gainers(): StockQuote[] {
    return this._gainers;
  }
  get losers(): StockQuote[] {
    return this._losers;
  }
  get mostActive(): StockQuote[] {
    return this._mostActive;
  }
  get weekHigh(): StockQuote[] {
    return this._weekHigh;
  }
  get weekLow(): StockQuote[] {
    return this._weekLow;
  }
  get mutualFunds(): Record<string, MutualFund[]> {
    return this._mutualFunds;
  }
  get news(): NewsItem[] {
    return this._news;
  }
  get curatedScreens() {
    return this._curatedScreens;
  }
  get popularStocks(): StockQuote[] {
    return this._popularStocks;
  }

  getStockTabData(tab: string): StockQuote[] {
    switch (tab) {
      case 'Gainers':
        return this._gainers;
      case 'Losers':
        return this._losers;
      case 'Most Active':
        return this._mostActive;
      case '52 Week High':
        return this._weekHigh;
      case '52 Week Low':
        return this._weekLow;
      default:
        return [];
    }
  }
}
