# Sprint 2 — Coding Standards

> **Document ID:** QCS-002
> **Version:** 1.0
> **Date:** July 26-27, 2026
> **Status:** Complete ✅

---

This document extends the project-wide coding standards from Sprint 1 with Sprint 2 specific conventions.

## 1. DTO Validation Patterns

All DTOs must use `class-validator` decorators:

```typescript
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase, one lowercase, and one number',
  })
  password: string;
}
```

## 2. Guard Pattern

```typescript
// Public routes — add @Public() decorator
@Public()
@Post('register')

// Protected routes — global JwtAuthGuard handles it
@Get('me')

// Role-restricted — add @Roles()
@Roles('admin')
@Delete('user/:id')
```

## 3. Service Error Handling

Throw NestJS HTTP exceptions — never return error objects:

```typescript
throw new ConflictException('Email already registered');
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Account is deactivated');
```

## 4. Environment Variables

| Variable           | Required | Default               | Description                 |
| ------------------ | -------- | --------------------- | --------------------------- |
| JWT_SECRET         | Yes      | 'quantora-dev-secret' | JWT signing key             |
| BCRYPT_PEPPER      | Yes      | ''                    | Pepper appended before hash |
| THROTTLE_WINDOW_MS | No       | 60000                 | Rate limit window           |
| THROTTLE_MAX       | No       | 60                    | Max requests per window     |
| DATABASE_URL       | Yes      | —                     | PostgreSQL connection       |

## 5. NestJS Module Pattern

Modules follow this structure:

```
module/
├── module-name.module.ts          # @Module({ imports, controllers, providers, exports })
├── module-name.controller.ts      # @Controller(), endpoints
├── module-name.service.ts         # Business logic
├── module-name.service.spec.ts    # Tests
├── dto/                           # Data Transfer Objects
│   ├── create.dto.ts
│   └── response.dto.ts
├── guards/                        # Route-specific guards
└── strategies/                    # Passport strategies
```
