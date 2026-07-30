# TODO — Sprint 4

## Pre-requisites (CI/CD)

- [ ] Add `RENDER_DEPLOY_HOOK_API` to GitHub Secrets
- [ ] Add `VERCEL_TOKEN` to GitHub Secrets
- [ ] Verify SonarCloud scan passes (set `SONAR_TOKEN` secret)
- [ ] Verify deploy jobs trigger after successful CI gate

## Sprint 4 Tasks — Auth Flow Verification

### Backend (NestJS API)

- [ ] **Google OAuth — verify backend flow**
  - [ ] Check `google.strategy.ts` — client ID, callback URL, scopes
  - [ ] Check `google-auth.guard.ts` — guard logic
  - [ ] Check `google/callback` redirect — token passed via fragment to frontend
  - [ ] Verify `FRONTEND_URL` env var is set correctly per environment
  - [ ] Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars
  - [ ] Test full Google OAuth loop locally

- [ ] **Email/Password register — verify backend flow**
  - [ ] Check `register.dto.ts` validation rules
  - [ ] Check `auth.service.ts register()` — password hashing, user creation, prefs creation
  - [ ] Verify duplicate email returns 409
  - [ ] Verify short password / invalid email return 400

- [ ] **Login flow — verify backend**
  - [ ] Check `local.strategy.ts` — validateUser logic
  - [ ] Check `auth.service.ts login()` — token generation, refresh token creation, login history
  - [ ] Verify account lockout after 5 failed attempts
  - [ ] Verify refresh token rotation works

### Frontend (Angular)

- [ ] **Login page — verify UI flow**
  - [ ] Check `login.component.ts` — form submit, error handling, OAuth callback handler
  - [ ] Check `login.component.html` — form fields, Google button, validation display
  - [ ] Verify redirect to dashboard on success
  - [ ] Verify error display on failure
  - [ ] Verify OAuth callback route (`/auth/callback`) parses tokens from URL fragment

- [ ] **Register page — verify UI flow**
  - [ ] Check `register.component.ts` — form submit, password match validation
  - [ ] Check `register.component.html` — form fields, Google button
  - [ ] Verify redirect or success message after registration

- [ ] **Route protection — verify AuthGuard**
  - [ ] Verify unauthenticated user redirected to `/auth/login`
  - [ ] Verify authenticated user can access dashboard/portfolio/stocks

### Auth Service & Interceptors

- [ ] **AuthService — verify all methods**
  - [ ] `login()` / `register()` — store tokens and user
  - [ ] `logout()` — clear tokens, redirect to login
  - [ ] `refreshTokens()` — token refresh flow
  - [ ] `handleOAuthCallback()` — parse fragment tokens, fetch profile
  - [ ] `googleLogin()` — redirect to backend

- [ ] **AuthInterceptor — verify token attachment**
  - [ ] Check Bearer token added to all requests
  - [ ] Check 401 handling triggers token refresh (not auth routes)
  - [ ] Check failed refresh redirects to login

### Testing

- [ ] **Write/update E2E tests for auth flow**
  - [ ] Register → Login → Get profile → Refresh → Logout
  - [ ] Registration validation (duplicate email, short password, invalid email)
  - [ ] Login validation (wrong password, locked account, non-existent user)
  - [ ] Token refresh (valid, expired, revoked)
  - [ ] Protected routes without token

- [ ] **Add unit tests for missing coverage**
  - [ ] AuthController methods
  - [ ] Google OAuth callback handler
  - [ ] Login history endpoints
