import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

const PASSWORD = 'TestE2E123';

function cookieValue(res: request.Response, name: string): string | undefined {
  const raw = (res.headers['set-cookie'] || []) as string[];
  const hit = raw.find((c) => c.startsWith(`${name}=`));
  if (!hit) return undefined;
  return hit.slice(name.length + 1).split(';')[0];
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const testEmail = `e2e-${Date.now()}@test.com`;
  const testName = 'E2E User';
  let agent: request.Agent;
  let refreshToken: string | undefined;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    agent = request.agent(app.getHttpServer());
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Health check', () => {
    it('GET /api/health — should return ok', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', () => {
      return agent
        .post('/api/auth/register')
        .send({ email: testEmail, password: PASSWORD, name: testName })
        .expect(201)
        .expect((res) => {
          expect(res.body.user.email).toBe(testEmail);
          expect(res.body.user.name).toBe(testName);
          expect(res.body.user.role).toBe('user');
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: testEmail, password: PASSWORD, name: testName })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already registered');
        });
    });

    it('should reject short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'short@test.com', password: '123', name: 'Short' })
        .expect(400);
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: PASSWORD, name: 'Bad Email' })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', () => {
      return agent
        .post('/api/auth/login')
        .send({ email: testEmail, password: PASSWORD })
        .expect(200)
        .expect((res) => {
          expect(res.body.user.email).toBe(testEmail);
          refreshToken = cookieValue(res, '_qtr');
          expect(refreshToken).toBeDefined();
        });
    });

    it('should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPass123' })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: PASSWORD })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', () => {
      return agent
        .get('/api/auth/me')
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testEmail);
          expect(res.body.name).toBe(testName);
          expect(res.body.preferences).toBeDefined();
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens and rotate the refresh token', () => {
      return agent
        .post('/api/auth/refresh')
        .expect(200)
        .expect((res) => {
          expect(cookieValue(res, '_qta')).toBeDefined();
          expect(cookieValue(res, '_qtr')).toBeDefined();
        });
    });

    it('should reject a missing refresh token', () => {
      return request(app.getHttpServer()).post('/api/auth/refresh').expect(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return success (prevents enumeration)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('reset');
        });
    });

    it('should return same message for non-existent email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@test.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('reset');
        });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', () => {
      return agent
        .post('/api/auth/logout')
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('Logged out');
        });
    });

    it('should reject the revoked refresh token after logout', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `_qtr=${refreshToken}`)
        .expect(401);
    });
  });

  describe('Refresh token reuse', () => {
    let reuseAgent: request.Agent;
    let originalRefreshToken: string | undefined;

    beforeAll(async () => {
      const email = `reuse-${Date.now()}@test.com`;
      reuseAgent = request.agent(app.getHttpServer());
      await reuseAgent
        .post('/api/auth/register')
        .send({ email, password: PASSWORD, name: 'Reuse' })
        .timeout(30000)
        .expect(201);
      const loginRes = await reuseAgent
        .post('/api/auth/login')
        .send({ email, password: PASSWORD })
        .timeout(30000)
        .expect(200);
      originalRefreshToken = cookieValue(loginRes, '_qtr');
    });

    it('should accept the first rotation of a refresh token', () => {
      return reuseAgent.post('/api/auth/refresh').expect(200);
    });

    it('should reject reuse of the rotated (stale) refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `_qtr=${originalRefreshToken}`)
        .expect(401);
    });

    it('should invalidate the session after refresh token reuse', () => {
      return reuseAgent.get('/api/auth/me').expect(401);
    });
  });
});
