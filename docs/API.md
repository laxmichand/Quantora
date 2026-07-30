# Quantora REST API Documentation

> **Version**: 0.0.1 | **Base URL**: `http://localhost:3000/api` | **Swagger**: `http://localhost:3000/api/docs`

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Common Response Format](#common-response-format)
- [Status Codes](#status-codes)
- [Health Endpoints](#health-endpoints)
- [Auth Endpoints](#auth-endpoints)
- [User Endpoints](#user-endpoints)
- [Portfolio Endpoints](#portfolio-endpoints)
- [Stock Endpoints](#stock-endpoints)
- [AI Scoring Endpoints](#ai-scoring-endpoints)
- [AI Chat Endpoints](#ai-chat-endpoints)
- [Payment Endpoints](#payment-endpoints)
- [Data Models](#data-models)

---

## Overview

Quantora is an intelligent investing platform. All endpoints are prefixed with `/api` via NestJS global prefix configuration (`app.setGlobalPrefix('api')`).

### CORS

The API allows requests from:

| Origin | Purpose |
|--------|---------|
| `http://localhost:4200` | Local Angular dev |
| `http://localhost:80` | Local Docker |
| `https://quantora.vercel.app` | Production frontend |
| `https://quantora-web.vercel.app` | Staging frontend |
| `https://quantora-ih3a.onrender.com` | Render deployment |

### Rate Limiting

> Planned for Sprint 2. No rate limiting currently enforced.

---

## Authentication

### Bearer Token (JWT)

Protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <jwt_access_token>
```

The token is obtained from `POST /api/auth/login` or `POST /api/auth/register`. Tokens are validated via a JWT strategy configured with `@nestjs/jwt`.

### Refresh Token Flow

```
1. User logs in       → receives accessToken + refreshToken
2. Access token expires → use refreshToken to get new accessToken
3. Refresh expires     → user must log in again
```

---

## Common Response Format

### Success

```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

### Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK — Request succeeded |
| `201` | Created — Resource created |
| `204` | No Content — Delete succeeded |
| `400` | Bad Request — Invalid input |
| `401` | Unauthorized — Missing/invalid token |
| `403` | Forbidden — Insufficient permissions |
| `404` | Not Found — Resource does not exist |
| `409` | Conflict — Duplicate resource |
| `422` | Unprocessable — Validation error |
| `429` | Too Many Requests — Rate limited (Sprint 2) |
| `500` | Internal Server Error |

---

## Health Endpoints

### GET /api

**Sprint Status**: Implemented (Sprint 1)
**Auth**: Public

Returns basic service status.

**Response 200**:

```json
{
  "name": "Quantora Backend",
  "version": "0.0.1",
  "status": "running",
  "timestamp": "2026-07-27T10:00:00.000Z"
}
```

---

### GET /api/health

**Sprint Status**: Implemented (Sprint 1)
**Auth**: Public

Health check endpoint. Verifies database connectivity via Prisma (`SELECT 1`). Uses `@nestjs/terminus` `HealthCheckService`.

**Response 200**:

```json
{
  "status": "ok",
  "timestamp": "2026-07-27T10:00:00.000Z",
  "uptime": 3600.123
}
```

**Detailed health (terminus)**:

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

**Response 503** (database down):

```json
{
  "status": "error",
  "info": {
    "database": {
      "status": "down",
      "message": "Connection refused"
    }
  },
  "error": {
    "database": {
      "status": "down",
      "message": "Connection refused"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "Connection refused"
    }
  }
}
```

---

## Auth Endpoints

> **Sprint 2 — Planned.** Controllers and DTOs are scaffolded. Endpoints are not yet implemented.

### POST /api/auth/register

**Sprint Status**: Planned (Sprint 2)
**Auth**: Public

Register a new user account.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecureP@ss1",
  "name": "John Doe",
  "phone": "+91-9876543210"
}
```

**Request Fields**:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Min 8 chars, must contain uppercase, lowercase, and number |
| `name` | string | Yes | Min 2 characters |
| `phone` | string | No | — |

**Response 201**:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+91-9876543210",
    "role": "user",
    "language": "en",
    "createdAt": "2026-07-27T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 409** (email exists):

```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "error": "Conflict"
}
```

**Response 422** (validation error):

```json
{
  "statusCode": 422,
  "message": [
    "password must be longer than or equal to 8 characters",
    "password must contain at least one uppercase, one lowercase, and one number"
  ],
  "error": "Unprocessable Entity"
}
```

---

### POST /api/auth/login

**Sprint Status**: Planned (Sprint 2)
**Auth**: Public

Authenticate with email and password.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecureP@ss1"
}
```

**Response 200**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 401** (invalid credentials):

```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

---

### POST /api/auth/refresh

**Sprint Status**: Planned (Sprint 2)
**Auth**: Public

Exchange a refresh token for a new access token.

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 401** (expired/invalid refresh token):

```json
{
  "statusCode": 401,
  "message": "Invalid or expired refresh token",
  "error": "Unauthorized"
}
```

---

### GET /api/auth/me

**Sprint Status**: Planned (Sprint 2)
**Auth**: Protected (Bearer Token)

Return the currently authenticated user's profile.

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response 200**:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+91-9876543210",
  "role": "user",
  "language": "en",
  "isActive": true,
  "createdAt": "2026-07-27T10:00:00.000Z",
  "updatedAt": "2026-07-27T10:00:00.000Z"
}
```

**Response 401** (no token):

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

### POST /api/auth/logout

**Sprint Status**: Planned (Sprint 2)
**Auth**: Protected (Bearer Token)

Invalidate the current refresh token.

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response 200**:

```json
{
  "success": true
}
```

---

### POST /api/auth/forgot-password

**Sprint Status**: Planned (Sprint 2)
**Auth**: Public

Send a password reset email.

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Response 200**:

```json
{
  "success": true
}
```

---

### POST /api/auth/reset-password

**Sprint Status**: Planned (Sprint 2)
**Auth**: Public

Reset password using the token from email.

**Request Body**:

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecureP@ss2"
}
```

**Response 200**:

```json
{
  "success": true
}
```

**Response 400** (expired/invalid token):

```json
{
  "statusCode": 400,
  "message": "Invalid or expired reset token",
  "error": "Bad Request"
}
```

---

## User Endpoints

> **Sprint 1 — Scaffolded only.** Controller is empty. Endpoints to be implemented in future sprints.

| Method | URL | Sprint Status | Auth | Description |
|--------|-----|---------------|------|-------------|
| `GET` | `/api/users` | Scaffolded (Sprint 1) | Protected | List all users (admin) |
| `GET` | `/api/users/:id` | Scaffolded (Sprint 1) | Protected | Get user by ID |
| `PATCH` | `/api/users/:id` | Scaffolded (Sprint 1) | Protected | Update user profile |
| `DELETE` | `/api/users/:id` | Scaffolded (Sprint 1) | Protected | Soft delete user (admin) |

---

## Portfolio Endpoints

> **Sprint 1 — Scaffolded only.** Controller is empty. Endpoints to be implemented in future sprints.

| Method | URL | Sprint Status | Auth | Description |
|--------|-----|---------------|------|-------------|
| `GET` | `/api/portfolios` | Scaffolded (Sprint 1) | Protected | List user's portfolios |
| `POST` | `/api/portfolios` | Scaffolded (Sprint 1) | Protected | Create a new portfolio |
| `GET` | `/api/portfolios/:id` | Scaffolded (Sprint 1) | Protected | Get portfolio details |
| `PATCH` | `/api/portfolios/:id` | Scaffolded (Sprint 1) | Protected | Update portfolio |
| `DELETE` | `/api/portfolios/:id` | Scaffolded (Sprint 1) | Protected | Soft delete portfolio |
| `GET` | `/api/portfolios/:id/holdings` | Scaffolded (Sprint 1) | Protected | List holdings in portfolio |
| `POST` | `/api/portfolios/:id/holdings` | Scaffolded (Sprint 1) | Protected | Add a holding to portfolio |
| `PATCH` | `/api/portfolios/:id/holdings/:holdingId` | Scaffolded (Sprint 1) | Protected | Update a holding |
| `DELETE` | `/api/portfolios/:id/holdings/:holdingId` | Scaffolded (Sprint 1) | Protected | Remove a holding |

### Create Portfolio — Request Body (Planned)

```json
{
  "name": "My Growth Portfolio",
  "benchmark": "NIFTY_50"
}
```

### Add Holding — Request Body (Planned)

```json
{
  "stockSymbol": "RELIANCE",
  "quantity": 10,
  "avgBuyPrice": 2450.50
}
```

---

## Stock Endpoints

> **Sprint 1 — Scaffolded only.** Controller is empty. Endpoints to be implemented in future sprints.

| Method | URL | Sprint Status | Auth | Description |
|--------|-----|---------------|------|-------------|
| `GET` | `/api/stocks` | Scaffolded (Sprint 1) | Public | List all stocks |
| `POST` | `/api/stocks` | Scaffolded (Sprint 1) | Protected | Add a stock (admin) |
| `GET` | `/api/stocks/:symbol` | Scaffolded (Sprint 1) | Public | Get stock by symbol |
| `PATCH` | `/api/stocks/:symbol` | Scaffolded (Sprint 1) | Protected | Update stock data (admin) |
| `DELETE` | `/api/stocks/:symbol` | Scaffolded (Sprint 1) | Protected | Remove a stock (admin) |

---

## AI Scoring Endpoints

> **Sprint 1 — Scaffolded only.** Controller is empty. Endpoints to be implemented in future sprints.

| Method | URL | Sprint Status | Auth | Description |
|--------|-----|---------------|------|-------------|
| `POST` | `/api/scores/stock` | Scaffolded (Sprint 1) | Protected | Get AI score for a stock |
| `POST` | `/api/scores/portfolio` | Scaffolded (Sprint 1) | Protected | Get AI score for a portfolio |

### Score Stock — Request Body (Planned)

```json
{
  "symbol": "RELIANCE",
  "timeframe": "6m"
}
```

### Score Stock — Response 200 (Planned)

```json
{
  "symbol": "RELIANCE",
  "score": 78,
  "rating": "Buy",
  "factors": {
    "technical": 82,
    "fundamental": 75,
    "sentiment": 70
  },
  "summary": "Strong fundamentals with positive technical momentum."
}
```

---

## AI Chat Endpoints

> **Sprint 1 — Scaffolded only.** Controller is empty. Endpoints to be implemented in future sprints.

| Method | URL | Sprint Status | Auth | Description |
|--------|-----|---------------|------|-------------|
| `POST` | `/api/chat` | Scaffolded (Sprint 1) | Protected | Send a message to AI advisor |
| `GET` | `/api/chat/history` | Scaffolded (Sprint 1) | Protected | Get chat history |

### Chat Request — Request Body (Planned)

```json
{
  "message": "Should I invest in IT stocks right now?",
  "context": "portfolio"
}
```

### Chat Response — Response 200 (Planned)

```json
{
  "reply": "Based on current market analysis, the IT sector shows...",
  "sources": ["market_data", "portfolio_analysis"],
  "timestamp": "2026-07-27T10:00:00.000Z"
}
```

---

## Payment Endpoints

> **Sprint 1 — Scaffolded only.** Controller is empty. Endpoints to be implemented in future sprints.

| Method | URL | Sprint Status | Auth | Description |
|--------|-----|---------------|------|-------------|
| `POST` | `/api/payments/create-order` | Scaffolded (Sprint 1) | Protected | Create a payment order |
| `POST` | `/api/payments/verify` | Scaffolded (Sprint 1) | Protected | Verify payment callback |
| `GET` | `/api/payments/history` | Scaffolded (Sprint 1) | Protected | Get payment history |

### Subscription Plans (Planned)

| Plan | Price | Features |
|------|-------|----------|
| `free` | ₹0/mo | 1 portfolio, basic scores |
| `pro` | ₹499/mo | Unlimited portfolios, AI chat, advanced scores |
| `enterprise` | Custom | API access, white-label, priority support |

---

## Data Models

### User

```json
{
  "id": "uuid",
  "email": "string (unique)",
  "name": "string",
  "phone": "string | null",
  "role": "user | pro | admin",
  "language": "en | hi | hi-en",
  "isActive": true,
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "version": 1
}
```

### Portfolio

```json
{
  "id": "uuid",
  "userId": "uuid (FK → User)",
  "name": "string (default: 'My Portfolio')",
  "benchmark": "string (default: 'NIFTY_50')",
  "holdings": ["Holding[]"],
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "version": 1
}
```

### Holding

```json
{
  "id": "uuid",
  "portfolioId": "uuid (FK → Portfolio)",
  "stockSymbol": "string (e.g. 'RELIANCE')",
  "quantity": 10,
  "avgBuyPrice": 2450.50,
  "addedAt": "datetime",
  "updatedAt": "datetime",
  "version": 1
}
```

### Goal

```json
{
  "id": "uuid",
  "userId": "uuid (FK → User)",
  "name": "string",
  "targetAmount": 1000000.00,
  "currentAmount": 250000.00,
  "deadline": "date",
  "type": "retirement | education | house | emergency",
  "sipAmount": 10000.00,
  "riskTolerance": "conservative | moderate | aggressive",
  "status": "active | completed | paused",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "version": 1
}
```

### Subscription

```json
{
  "id": "uuid",
  "userId": "uuid (FK → User, unique)",
  "plan": "free | pro | enterprise",
  "status": "active | inactive | cancelled",
  "startDate": "datetime",
  "endDate": "datetime | null",
  "paymentMethod": "string | null",
  "amount": 499.00,
  "currency": "INR",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "version": 1
}
```

### Alert

```json
{
  "id": "uuid",
  "userId": "uuid (FK → User)",
  "type": "price_target | volume | news | portfolio | goal",
  "stockSymbol": "string | null",
  "condition": "above | below | percent_change",
  "threshold": 2500.00,
  "isActive": true,
  "lastTriggeredAt": "datetime | null",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "version": 1
}
```

### Watchlist

```json
{
  "id": "uuid",
  "userId": "uuid (FK → User)",
  "name": "string (default: 'My Watchlist')",
  "stockSymbols": ["RELIANCE", "TCS", "INFY"],
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "version": 1
}
```

### AuditLog

```json
{
  "id": "uuid",
  "userId": "uuid | null",
  "action": "string",
  "entity": "string",
  "entityId": "string | null",
  "details": {},
  "ipAddress": "string | null",
  "userAgent": "string | null",
  "createdAt": "datetime"
}
```

---

## Sprint Status Legend

| Status | Meaning |
|--------|---------|
| **Implemented (Sprint 1)** | Endpoints are live and functional |
| **Scaffolded (Sprint 1)** | Controller exists but has no route handlers |
| **Planned (Sprint 2)** | Defined in DTOs and Sprint 2 plan, not yet coded |

---

## Endpoint Summary

| Method | URL | Sprint | Auth | Status |
|--------|-----|--------|------|--------|
| `GET` | `/api` | 1 | Public | Implemented |
| `GET` | `/api/health` | 1 | Public | Implemented |
| `POST` | `/api/auth/register` | 2 | Public | Planned |
| `POST` | `/api/auth/login` | 2 | Public | Planned |
| `POST` | `/api/auth/refresh` | 2 | Public | Planned |
| `GET` | `/api/auth/me` | 2 | Protected | Planned |
| `POST` | `/api/auth/logout` | 2 | Protected | Planned |
| `POST` | `/api/auth/forgot-password` | 2 | Public | Planned |
| `POST` | `/api/auth/reset-password` | 2 | Public | Planned |
| `GET` | `/api/users` | — | Protected | Scaffolded |
| `GET` | `/api/users/:id` | — | Protected | Scaffolded |
| `PATCH` | `/api/users/:id` | — | Protected | Scaffolded |
| `DELETE` | `/api/users/:id` | — | Protected | Scaffolded |
| `GET` | `/api/portfolios` | — | Protected | Scaffolded |
| `POST` | `/api/portfolios` | — | Protected | Scaffolded |
| `GET` | `/api/portfolios/:id` | — | Protected | Scaffolded |
| `PATCH` | `/api/portfolios/:id` | — | Protected | Scaffolded |
| `DELETE` | `/api/portfolios/:id` | — | Protected | Scaffolded |
| `GET` | `/api/portfolios/:id/holdings` | — | Protected | Scaffolded |
| `POST` | `/api/portfolios/:id/holdings` | — | Protected | Scaffolded |
| `PATCH` | `/api/portfolios/:id/holdings/:holdingId` | — | Protected | Scaffolded |
| `DELETE` | `/api/portfolios/:id/holdings/:holdingId` | — | Protected | Scaffolded |
| `GET` | `/api/stocks` | — | Public | Scaffolded |
| `POST` | `/api/stocks` | — | Protected | Scaffolded |
| `GET` | `/api/stocks/:symbol` | — | Public | Scaffolded |
| `PATCH` | `/api/stocks/:symbol` | — | Protected | Scaffolded |
| `DELETE` | `/api/stocks/:symbol` | — | Protected | Scaffolded |
| `POST` | `/api/scores/stock` | — | Protected | Scaffolded |
| `POST` | `/api/scores/portfolio` | — | Protected | Scaffolded |
| `POST` | `/api/chat` | — | Protected | Scaffolded |
| `GET` | `/api/chat/history` | — | Protected | Scaffolded |
| `POST` | `/api/payments/create-order` | — | Protected | Scaffolded |
| `POST` | `/api/payments/verify` | — | Protected | Scaffolded |
| `GET` | `/api/payments/history` | — | Protected | Scaffolded |
