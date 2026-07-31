import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api (GET) — returns app status when authenticated', async () => {
    const email = `app-${Date.now()}@test.com`;
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/register')
      .send({ email, password: 'TestPass123', name: 'App E2E' })
      .timeout(30000)
      .expect(201);

    return agent
      .get('/api')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('name', 'Quantora Backend');
        expect(res.body).toHaveProperty('status', 'running');
      });
  });

  it('/api (GET) — rejects unauthenticated request', async () => {
    return request(app.getHttpServer()).get('/api').expect(401);
  });
});
