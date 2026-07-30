# Quantora — Database Design

> **PostgreSQL + MongoDB + Redis — Right tool for the right data.**

---

## PostgreSQL Schemas

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user', -- user, pro, admin
  language VARCHAR(10) DEFAULT 'en', -- en, hi, hi-en
  telegram_chat_id VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Portfolios Table

```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT 'My Portfolio',
  benchmark VARCHAR(20) DEFAULT 'NIFTY_50',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Holdings Table

```sql
CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  stock_symbol VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  avg_buy_price DECIMAL(10,2) NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Goals Table

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  deadline DATE NOT NULL,
  type VARCHAR(30) NOT NULL, -- retirement, education, house, emergency, etc.
  sip_amount DECIMAL(10,2),
  risk_tolerance VARCHAR(20) DEFAULT 'moderate', -- conservative, moderate, aggressive
  status VARCHAR(20) DEFAULT 'active', -- active, completed, paused
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free', -- free, pro, enterprise
  status VARCHAR(20) DEFAULT 'active',
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  payment_method VARCHAR(30),
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Alerts Table

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, -- price_target, volume, news, portfolio, goal
  stock_symbol VARCHAR(20),
  condition VARCHAR(20) NOT NULL, -- above, below, percent_change
  threshold DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Watchlists Table

```sql
CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT 'My Watchlist',
  stock_symbols TEXT[], -- array of stock symbols
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

---

## MongoDB Collections

### Stocks Collection

```javascript
{
  _id: ObjectId,
  symbol: "ITC",                    // unique, indexed
  name: "ITC Limited",
  exchange: "NSE",
  sector: "FMCG",
  industry: "Cigarettes & Tobacco",
  marketCap: 575000000000,          // in INR
  currentPrice: 462.50,
  pe: 25.3,
  pb: 7.8,
  roe: 28.5,
  dividendYield: 3.2,
  beta: 0.32,
  fiftyTwoWeekHigh: 500.00,
  fiftyTwoWeekLow: 390.00,
  fundamentals: {
    revenue: { q1: 19000, q2: 18500, q3: 19200, q4: 19800 },  // crores
    profit: { q1: 5200, q2: 4900, q3: 5100, q4: 5400 },
    debtToEquity: 0.05,
    promoterHolding: 0.0,
    promoterPledge: 0.0,
    eps: 18.25,
    bookValue: 59.30
  },
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Scores Collection

```javascript
{
  _id: ObjectId,
  symbol: "ITC",
  date: ISODate("2026-07-26"),
  aiScore: 78,
  scores: {
    value: 82,
    quality: 75,
    growth: 55,
    risk: 65,        // higher = less risky
    technical: 72,
    dividend: 85,
    momentum: 68,
    esg: 70
  },
  valuation: {
    intrinsicValue: 510,
    fairValue: 480,
    currentPrice: 462.50,
    upside: 10.3
  },
  explanation: "ITC scores 78/100. Strong dividend yield...",
  previousScore: 75,
  scoreChange: +3,
  createdAt: ISODate
}
```

### News Collection

```javascript
{
  _id: ObjectId,
  title: "ITC Q4 results beat expectations",
  summary: "ITC reported 8% revenue growth...",
  content: "Full article text...",
  source: "Economic Times",
  url: "https://economictimes.indiatimes.com/...",
  publishedAt: ISODate,
  sentiment: {
    label: "positive",
    confidence: 0.87,
    score: 0.72
  },
  impact: {
    score: 7,
    affectedStocks: ["ITC"],
    affectedSectors: ["FMCG"]
  },
  credibility: {
    score: 0.92,
    flags: []
  },
  tags: ["earnings", "quarterly-results", "fmcg"],
  createdAt: ISODate
}
```

### Chat History Collection

```javascript
{
  _id: ObjectId,
  userId: "uuid-string",
  conversationId: "conv-uuid",
  messages: [
    {
      role: "user",
      content: "Should I buy ITC?",
      timestamp: ISODate
    },
    {
      role: "assistant",
      content: "Based on my analysis...",
      timestamp: ISODate,
      sources: ["stock_score", "news", "portfolio"],
      metadata: {
        stocks_analyzed: ["ITC"],
        confidence: 0.85,
        language: "en"
      }
    }
  ],
  language: "en",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Forecasts Collection

```javascript
{
  _id: ObjectId,
  symbol: "ITC",
  date: ISODate("2026-07-26"),
  currentPrice: 462.50,
  forecast30D: {
    low: 440,
    mid: 470,
    high: 500,
    confidence: 0.72,
    methodology: "ensemble_ml"
  },
  forecast90D: {
    low: 430,
    mid: 485,
    high: 540,
    confidence: 0.65
  },
  supportLevels: [445, 430, 410],
  resistanceLevels: [475, 490, 510],
  earningsForecast: {
    nextQuarter: {
      beatProbability: 0.65,
      missProbability: 0.20,
      inline: 0.15,
      expectedEPS: 19.50
    }
  },
  createdAt: ISODate
}
```

### Sector Data Collection

```javascript
{
  _id: ObjectId,
  sector: "IT",
  date: ISODate("2026-07-26"),
  performance: {
    "1W": 2.3,
    "1M": 5.8,
    "3M": 12.4,
    "6M": 18.2,
    "1Y": 25.6
  },
  stocks: ["TCS", "INFY", "WIPRO", "HCLTECH"],
  heatmapColor: "#2e7d32",   // green = positive
  rotationSignal: "IN",      // IN, OUT, NEUTRAL
  momentum: 12.4,
  topStock: "TCS",
  worstStock: "WIPRO",
  macroImpact: {
    interestRate: "negative",
    currency: "positive",
    commodity: "neutral"
  },
  createdAt: ISODate
}
```

### Smart Money Collection

```javascript
{
  _id: ObjectId,
  date: ISODate("2026-07-26"),
  type: "FII",                // FII, DII, PROMOTER, MF
  entity: "Foreign Institutional Investors",
  data: {
    totalBuying: 2500,        // crores
    totalSelling: 1800,
    netBuy: 700,
    topBuys: [
      { symbol: "HDFCBANK", amount: 350 },
      { symbol: "ICICIBANK", amount: 280 }
    ],
    topSells: [
      { symbol: "ITC", amount: 150 },
      { symbol: "TCS", amount: 120 }
    ]
  },
  signal: "BULLISH",         // BULLISH, BEARISH, NEUTRAL
  explanation: "FII net buying of ₹700Cr...",
  createdAt: ISODate
}
```

---

## Redis Key Patterns

```
# Live Prices (TTL: 5 min)
stock:price:ITC          → { price: 462.50, change: 2.3, volume: 1234567 }
stock:price:TCS          → { price: 3890.00, change: 1.1, volume: 987654 }

# Historical Data (TTL: 1 hour)
stock:history:ITC:1y     → [{ date, open, high, low, close, volume }, ...]

# AI Scores (TTL: 1 hour)
stock:scores:ITC         → { aiScore: 78, value: 82, quality: 75, ... }
stock:scores:all         → [{ symbol, aiScore }, ...]  // sorted set

# Sessions (TTL: 7 days)
session:{userId}         → { token, user, expiresAt }

# Rate Limiting (TTL: 1 min)
rate:{ip}:{endpoint}     → { count: 45 }

# Leaderboards (TTL: 1 day)
leaderboard:portfolio    → [{ userId, score }, ...]  // sorted set

# Alerts Queue (no TTL)
alerts:queue             → [alertId, alertId, ...]   // list

# Feature Flags (no TTL)
features:flags           → { darkMode: true, aiChat: true }
```

---

## Index Strategy

### PostgreSQL Indexes

```sql
-- Users
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Holdings
CREATE INDEX idx_holdings_portfolio ON holdings(portfolio_id);
CREATE INDEX idx_holdings_symbol ON holdings(stock_symbol);

-- Goals
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);

-- Audit Logs
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

### MongoDB Indexes

```javascript
// Stocks
db.stocks.createIndex({ symbol: 1 }, { unique: true });
db.stocks.createIndex({ sector: 1 });
db.stocks.createIndex({ marketCap: -1 });

// Scores
db.scores.createIndex({ symbol: 1, date: -1 });
db.scores.createIndex({ aiScore: -1 });

// News
db.news.createIndex({ publishedAt: -1 });
db.news.createIndex({ 'sentiment.label': 1 });
db.news.createIndex({ tags: 1 });

// Chat History
db.chat_history.createIndex({ userId: 1, updatedAt: -1 });
db.chat_history.createIndex({ conversationId: 1 });

// Forecasts
db.forecasts.createIndex({ symbol: 1, date: -1 });

// Smart Money
db.smart_money.createIndex({ date: -1, type: 1 });
```

---

_Each database serves its strength: PostgreSQL for relationships, MongoDB for flexibility, Redis for speed._
