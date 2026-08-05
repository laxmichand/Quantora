# Sprint 3 — Coding Standards

> **Document ID:** QCS-003
> **Version:** 1.0
> **Date:** July 27-28, 2026
> **Status:** Complete

---

## 1. Guard Class Pattern

All Passport guards must be **named classes**, never inline `AuthGuard()`.

```typescript
// CORRECT
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

// WRONG — causes route registration failures
@UseGuards(AuthGuard('google'))
```

---

## 2. Environment Variables

- **Single source of truth:** Root `.env` file
- **Never commit .env** — gitignore enforced
- **No secrets in render.yaml** — use Render Dashboard
- **Naming:** UPPER_SNAKE_CASE
- **Comments:** Section headers with `# === SECTION ===`

---

## 3. OAuth Implementation

- Backend handles token generation
- Frontend handles token storage (localStorage)
- Callback URL pattern: `{FRONTEND_URL}/auth/callback?accessToken=...&refreshToken=...`
- Strategy always checks `this.configured` flag before processing

---

## 4. Design System

- **Tables:** 5px 10px padding, 10px/12px font
- **Cards:** 14px padding, 10px border-radius
- **Tab pills:** 4px 10px, 11px font
- **Change badges:** 2px 7px, 10.5px font
- **Allocation bars:** 6px height
- **Skeleton bars:** 10px height

---

## 5. Component Patterns

- Shared components use `InjectionToken` for configuration (e.g., `TABLE_ID`)
- Column preferences persisted via localStorage with component-specific keys
- Scroll animations use IntersectionObserver API
- Market data centralized in `MarketDataService`
