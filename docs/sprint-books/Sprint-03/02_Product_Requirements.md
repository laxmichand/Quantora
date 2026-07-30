# Sprint 3 — Product Requirements

> **Document ID:** QPR-003
> **Version:** 1.0
> **Date:** July 27-28, 2026
> **Status:** Complete

---

## 1. User Stories

### Authentication

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-301 | As a user, I want to sign up with Google so I don't need another password | P0 | Done |
| US-302 | As a user, I want to sign in with Google on the login page | P0 | Done |
| US-303 | As a user, I want to sign up with Google on the register page | P0 | Done |
| US-304 | As a user, I want my account to lock after 5 failed attempts for 15 minutes | P1 | Done |
| US-305 | As a user, I want to see my login history (device, IP, time) | P1 | Done |
| US-306 | As a user, I want my Google account linked if I register with email first then use Google | P1 | Done |

### Landing Page

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-310 | As a visitor, I want to see live market indices (NIFTY 50, SENSEX, BANK NIFTY) | P0 | Done |
| US-311 | As a visitor, I want to see the Quantora AI Score card | P0 | Done |
| US-312 | As a visitor, I want to browse top stocks with performance data | P1 | Done |
| US-313 | As a visitor, I want to browse mutual funds with returns data | P1 | Done |
| US-314 | As a visitor, I want curated stock screens (Value, Growth, Dividend) | P1 | Done |
| US-315 | As a visitor, I want curated smart money deals (FII, DII, MF) | P1 | Done |
| US-316 | As a visitor, I want curated MF screens (ELSS, Index, Debt) | P1 | Done |
| US-317 | As a visitor, I want to see market news spotlight | P2 | Done |
| US-318 | As a visitor, I want to see platform features (6 feature cards) | P2 | Done |
| US-319 | As a visitor, I want to see popular stocks with live prices | P2 | Done |
| US-320 | As a visitor, I want a stats bar (users, stocks, data points) | P2 | Done |
| US-321 | As a visitor, I want smooth scroll reveal animations | P2 | Done |

### Frontend Pages

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-330 | As a user, I want an IN Stocks page with all NIFTY 50 stocks | P0 | Done |
| US-331 | As a user, I want a Portfolio page with holdings data | P0 | Done |
| US-332 | As a user, I want a Dashboard page with overview cards | P0 | Done |
| US-333 | As a user, I want a shared DataTable with sorting, filtering, column reordering | P1 | Done |
| US-334 | As a user, I want my column preferences saved in localStorage | P2 | Done |

### Design System

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-340 | As a user, I want a compact table design (smaller fonts, tighter spacing) | P1 | Done |
| US-341 | As a user, I want a professional favicon (Q lettermark) | P2 | Done |
| US-342 | As a user, I want a clean header navigation (3 items + More dropdown) | P1 | Done |

### Infrastructure

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-350 | As a developer, I want a single .env file for all apps | P0 | Done |
| US-351 | As a developer, I want render.yaml cleaned (no secrets, both services) | P0 | Done |
| US-352 | As a developer, I want Google OAuth credentials configured for production | P0 | Done |

---

## 2. Feature Summary

| Feature | Stories | Total |
|---------|---------|-------|
| Google OAuth | US-301 to US-306 | 6 |
| Landing Page | US-310 to US-321 | 12 |
| Frontend Pages | US-330 to US-334 | 5 |
| Design System | US-340 to US-342 | 3 |
| Infrastructure | US-350 to US-352 | 3 |
| **Total** | | **29** |
