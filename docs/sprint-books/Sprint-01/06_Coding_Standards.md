# Quantora — Coding Standards

> **Document ID:** QCS-001  
> **Version:** 1.0  
> **Date:** July 26, 2026  
> **Status:** Draft for Review

---

## 1. General Principles

| Principle | Description |
|-----------|-------------|
| **Consistency** | Follow existing patterns in the codebase |
| **Readability** | Code is read more than written — optimize for humans |
| **Simplicity** | Don't over-engineer. YAGNI (You Ain't Gonna Need It) |
| **Type Safety** | Always use types. Never use `any` (TypeScript) or `Any` (Python) |
| **Single Responsibility** | One function, one purpose |
| **No Hardcoded Values** | All constants in config files or environment variables |

---

## 2. TypeScript / NestJS Standards

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `kebab-case` | `auth.service.ts`, `portfolio.controller.ts` |
| Classes | `PascalCase` | `AuthService`, `PortfolioController` |
| Methods | `camelCase` | `getUserById()`, `calculateRisk()` |
| Variables | `camelCase` | `stockPrice`, `userPortfolio` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `API_VERSION` |
| Interfaces | `PascalCase` (no `I` prefix) | `User`, `Portfolio`, `StockScore` |
| DTOs | `PascalCase` + `Dto` suffix | `CreateUserDto`, `LoginDto` |
| Guards | `PascalCase` + `Guard` suffix | `JwtAuthGuard`, `RolesGuard` |
| Decorators | `PascalCase` + `Decorator` suffix | `CurrentUserDecorator` |
| Database columns | `snake_case` | `password_hash`, `created_at` |

### Code Style

```typescript
// ✅ Good: Explicit types, clear naming
async function getUserPortfolio(userId: string): Promise<Portfolio> {
  const portfolio = await this.prisma.portfolio.findFirst({
    where: { userId },
    include: { holdings: true },
  });

  if (!portfolio) {
    throw new NotFoundException(`Portfolio not found for user ${userId}`);
  }

  return portfolio;
}

// ❌ Bad: Any types, unclear naming
async function getData(id) {
  const res = await this.prisma.portfolio.findFirst({ where: { userId: id } });
  return res;
}
```

### Import Order

```typescript
// 1. Node built-ins
import { join } from 'path';

// 2. External packages
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// 3. Internal modules (absolute paths)
import { UserService } from '../users/users.service';

// 4. DTOs and types
import { CreatePortfolioDto } from './dto';

// 5. Constants and utils
import { MAX_PORTFOLIOS } from '../../common/constants';
```

### Error Handling

```typescript
// ✅ Good: Specific exceptions with context
throw new NotFoundException(`Stock ${symbol} not found`);
throw new BadRequestException('Invalid portfolio data');
throw new UnauthorizedException('Token expired');

// ❌ Bad: Generic errors
throw new Error('Something went wrong');
```

### NestJS Module Pattern

```typescript
// Every module follows this structure:
@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [PortfoliosController],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
})
export class PortfoliosModule {}
```

---

## 3. Python / FastAPI Standards

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `snake_case` | `ai_scorer.py`, `portfolio_risk.py` |
| Classes | `PascalCase` | `AIScorer`, `PortfolioRiskCalculator` |
| Functions | `snake_case` | `calculate_var()`, `get_stock_scores()` |
| Variables | `snake_case` | `stock_price`, `user_portfolio` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `API_VERSION` |
| Type hints | Always required | `def get_user(user_id: str) -> User:` |

### Code Style

```python
# ✅ Good: Type hints, docstrings, clear naming
async def calculate_portfolio_var(
    portfolio_id: str,
    confidence: float = 0.95,
    days: int = 10
) -> VaRResult:
    """Calculate Value at Risk for a portfolio.
    
    Args:
        portfolio_id: The portfolio UUID
        confidence: Confidence level (default 95%)
        days: Time horizon in days
        
    Returns:
        VaRResult with VaR, CVaR, and explanation
    """
    holdings = await get_portfolio_holdings(portfolio_id)
    # ... implementation
    return VaRResult(var=var_value, cvar=cvar_value, explanation=text)

# ❌ Bad: No types, no docs
def calc_var(pid, conf=0.95, d=10):
    h = get_holdings(pid)
    return h
```

### FastAPI Endpoint Pattern

```python
# Every endpoint follows this structure:
@router.post("/analyze", response_model=StockAnalysisResponse)
async def analyze_stock(
    request: StockAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> StockAnalysisResponse:
    """Analyze a stock and return scores + explanation."""
    result = await analysis_service.analyze(request.symbol)
    return StockAnalysisResponse(**result)
```

### Pydantic Models

```python
# Always use Pydantic for request/response validation
class StockAnalysisRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    language: str = Field(default="en", pattern="^(en|hi|hi-en)$")

class StockAnalysisResponse(BaseModel):
    symbol: str
    ai_score: int = Field(ge=0, le=100)
    scores: ScoreBreakdown
    explanation: str
```

---

## 4. Angular Standards

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `kebab-case` | `stock-card.component.ts`, `auth.service.ts` |
| Components | `PascalCase` + `Component` | `StockCardComponent` |
| Services | `PascalCase` + `Service` | `AuthService`, `ApiService` |
| Modules | `PascalCase` + `Module` | `DashboardModule` |
| Guards | `PascalCase` + `Guard` | `AuthGuard` |
| Pipes | `PascalCase` + `Pipe` | `CurrencyPipe` |
| Selectors | `app-` prefix | `app-stock-card`, `app-sidebar` |
| Template vars | `camelCase` | `stockPrice`, `isLoaded` |

### Component Structure

```typescript
// Every component follows this structure:
@Component({
  selector: 'app-stock-card',
  templateUrl: './stock-card.component.html',
  styleUrls: ['./stock-card.component.scss'],
})
export class StockCardComponent implements OnInit, OnDestroy {
  // 1. Public properties (template-binding)
  stock!: Stock;

  // 2. Private properties
  private destroy$ = new Subject<void>();

  // 3. Constructor + DI
  constructor(
    private readonly stockService: StockService,
    private readonly router: Router,
  ) {}

  // 4. Lifecycle hooks
  ngOnInit(): void {
    this.loadStock();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 5. Public methods (template-called)
  onStockClick(): void {
    this.router.navigate(['/stocks', this.stock.symbol]);
  }

  // 6. Private methods (internal logic)
  private loadStock(): void {
    this.stockService.getStock(this.symbol)
      .pipe(takeUntil(this.destroy$))
      .subscribe(stock => this.stock = stock);
  }
}
```

### Template Rules

```html
<!-- ✅ Good: Async pipe, trackBy, OnPush -->
<div *ngFor="let stock of stocks$ | async; trackBy: trackBySymbol">
  <app-stock-card [stock]="stock" (click)="onSelect(stock)"></app-stock-card>
</div>

<!-- ❌ Bad: Manual subscription, no trackBy -->
<div *ngFor="let stock of stocks">
  <app-stock-card [stock]="stock"></app-stock-card>
</div>
```

---

## 5. Database Standards

### Prisma Schema

```prisma
// Always use:
// - UUID for primary keys
// - snake_case for column names
// - @map for column mapping
// - @@map for table mapping
// - Explicit relations

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  portfolios Portfolio[]

  @@map("users")
}
```

### MongoDB Documents

```typescript
// Always use:
// - Consistent field naming (camelCase)
// - ISODate for timestamps
// - Indexed fields explicitly marked
// - Schema validation where possible
```

---

## 6. Git Standards

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/short-description` | `feature/portfolio-upload` |
| Fix | `fix/short-description` | `fix/score-calculation` |
| Refactor | `refactor/short-description` | `refactor/auth-module` |
| docs | `docs/short-description` | `docs/api-documentation` |

### Commit Messages (Conventional Commits)

```
feat(portfolio): add CSV upload endpoint
fix(scores): correct AI score calculation for negative earnings
refactor(auth): extract JWT strategy to separate file
docs(api): add Swagger documentation for stocks endpoints
test(portfolio): add unit tests for holdings service
chore(deps): update NestJS to v10
```

### PR Template

```markdown
## Description
[What does this PR do?]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing done

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed
- [ ] No console.log/print left
- [ ] Environment variables documented
```

---

## 7. Testing Standards

### Unit Test Structure

```typescript
// Arrange → Act → Assert pattern
describe('PortfoliosService', () => {
  let service: PortfoliosService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PortfoliosService, PrismaService],
    }).compile();

    service = module.get(PortfoliosService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a portfolio for a user', async () => {
      // Arrange
      const dto = { name: 'My Portfolio' };
      const userId = 'test-user-id';

      // Act
      const result = await service.create(userId, dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('My Portfolio');
      expect(result.userId).toBe(userId);
    });
  });
});
```

### Test Naming

```typescript
// Pattern: should [expected behavior] when [condition]
it('should return portfolio when valid ID provided', async () => {});
it('should throw NotFoundException when portfolio not found', async () => {});
it('should reject unauthenticated requests', async () => {});
```

---

## 8. i18n Standards

```typescript
// ✅ Good: All user-facing text through translation keys
<h1>{{ 'portfolio.title' | translate }}</h1>
<p>{{ 'stock.aiScore' | translate: { score: stock.aiScore } }}</p>

// ❌ Bad: Hardcoded text
<h1>My Portfolio</h1>
<p>AI Score: {{ stock.aiScore }}</p>
```

---

*These standards ensure consistency across the entire codebase. All new code must follow these conventions.*
