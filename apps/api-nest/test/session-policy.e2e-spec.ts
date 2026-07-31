import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

process.env.THROTTLE_MAX = '10000';
process.env.THROTTLE_WINDOW_MS = '60000';

const PASSWORD = 'TestPass123';
const MAX_ACTIVE_SESSIONS = 2;
const PARALLEL_LOGIN_COUNT = 8;
const EXPECTED_EVICTED_SESSIONS = PARALLEL_LOGIN_COUNT - MAX_ACTIVE_SESSIONS;
const OS_WINDOWS = 'Windows';
const OS_ANDROID = 'Android';

let seq = 0;
const nextEmail = () => `sess-${Date.now()}-${seq++}@test.com`;

const fingerprintFor = (deviceId: string, os: string) => ({
  deviceId,
  fingerprint: {
    browser: 'Chrome',
    os,
    deviceType: os === OS_ANDROID ? 'mobile' : 'desktop',
  },
});

function cookieValue(res: request.Response, name: string): string | undefined {
  const raw = (res.headers['set-cookie'] || []) as string[];
  const hit = raw.find((c) => c.startsWith(`${name}=`));
  if (!hit) return undefined;
  return hit.slice(name.length + 1).split(';')[0];
}

describe('Session policy (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  }, 60000);

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({ where: { email: { startsWith: 'sess-' } } });
    } catch {}
    await app.close();
  });

  const register = async (email: string) => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/register')
      .send({ email, password: PASSWORD, name: 'Sess' })
      .timeout(30000)
      .expect(201);
    return agent;
  };

  const newUser = async () => {
    const email = nextEmail();
    const agent = await register(email);
    await agent.post('/api/auth/logout').timeout(30000).expect(200);
    return { email, registerAgent: agent };
  };

  const login = async (email: string, deviceId: string, os: string = OS_WINDOWS) => {
    const agent = request.agent(app.getHttpServer());
    const res = await agent
      .post('/api/auth/login')
      .send({ email, password: PASSWORD, ...fingerprintFor(deviceId, os) })
      .timeout(30000)
      .expect(200);
    return { agent, refreshToken: cookieValue(res, '_qtr') };
  };

  const dbUser = async (email: string) => prisma.user.findUnique({ where: { email } });

  const activeCount = async (email: string) => {
    const user = await dbUser(email);
    return prisma.session.count({
      where: { userId: user!.id, revoked: false, expiresAt: { gt: new Date() } },
    });
  };

  const me = async (agent: any) => agent.get('/api/auth/me').timeout(30000);

  it('web + android login coexist: both sessions stay active', async () => {
    const { email } = await newUser();
    const web = await login(email, 'web-device');
    const android = await login(email, 'android-device', OS_ANDROID);

    expect((await me(web.agent)).status).toBe(200);
    expect((await me(android.agent)).status).toBe(200);

    const list = await web.agent.get('/api/sessions').timeout(30000);
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(2);
    expect(list.body.filter((s: any) => s.isCurrent).length).toBe(1);

    expect(await activeCount(email)).toBe(2);
  });

  it('third login evicts the OLDEST session and never exceeds 2 active sessions', async () => {
    const { email } = await newUser();
    const s1 = await login(email, 'dev-1');
    const s2 = await login(email, 'dev-2');
    const s3 = await login(email, 'dev-3');

    expect(await activeCount(email)).toBe(2);
    expect((await me(s1.agent)).status).toBe(401);
    expect((await me(s2.agent)).status).toBe(200);
    expect((await me(s3.agent)).status).toBe(200);

    const user = await dbUser(email);
    const evicted = await prisma.session.findFirst({
      where: { userId: user!.id, logoutReason: 'session_limit_exceeded' },
    });
    expect(evicted).toBeDefined();
    expect(evicted!.revoked).toBe(true);

    const events = await s3.agent.get('/api/auth/security-events').timeout(30000);
    expect(events.status).toBe(200);
    expect(events.body.some((e: any) => e.eventType === 'SESSION_REVOKED')).toBe(true);
  });

  it('re-login from the same device does not log out the other platform', async () => {
    const { email } = await newUser();
    const web1 = await login(email, 'shared-web-device');
    const android = await login(email, 'android-device', OS_ANDROID);
    const web2 = await login(email, 'shared-web-device');

    expect(await activeCount(email)).toBe(2);
    expect((await me(android.agent)).status).toBe(200);
    expect((await me(web2.agent)).status).toBe(200);
    expect((await me(web1.agent)).status).toBe(401);

    const user = await dbUser(email);
    const active = await prisma.session.findMany({
      where: { userId: user!.id, revoked: false },
    });
    expect(active.length).toBe(2);
  });

  it('refreshing one session does not revoke the other', async () => {
    const { email } = await newUser();
    const web = await login(email, 'web-device');
    const android = await login(email, 'android-device', OS_ANDROID);

    const refreshed = await web.agent.post('/api/auth/refresh').timeout(30000);
    expect(refreshed.status).toBe(200);

    expect((await me(web.agent)).status).toBe(200);
    expect((await me(android.agent)).status).toBe(200);
    expect(await activeCount(email)).toBe(2);
  });

  it('stale refresh token reuse revokes ONLY that session, not the sibling', async () => {
    const { email } = await newUser();
    const web = await login(email, 'web-device');
    const android = await login(email, 'android-device', OS_ANDROID);

    const firstRefresh = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `_qtr=${web.refreshToken}`)
      .timeout(30000);
    expect(firstRefresh.status).toBe(200);

    const staleReuse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `_qtr=${web.refreshToken}`)
      .timeout(30000);
    expect(staleReuse.status).toBe(401);

    expect((await me(web.agent)).status).toBe(401);
    expect((await me(android.agent)).status).toBe(200);

    const user = await dbUser(email);
    const rows = await prisma.session.findMany({ where: { userId: user!.id } });
    const webSession = rows.find((s) => s.logoutReason === 'token_reuse');
    expect(webSession).toBeDefined();
    expect(webSession!.revoked).toBe(true);
    expect(rows.filter((s) => !s.revoked).length).toBe(1);
  });

  it('logout of the current session is scoped to that session only', async () => {
    const { email } = await newUser();
    const web = await login(email, 'web-device');
    const android = await login(email, 'android-device', OS_ANDROID);

    await web.agent.post('/api/auth/logout').timeout(30000).expect(200);

    expect((await me(web.agent)).status).toBe(401);
    expect((await me(android.agent)).status).toBe(200);
  });

  it('logout-all keeps the current session and revokes every other session', async () => {
    const { email } = await newUser();
    const web = await login(email, 'web-device');
    const android = await login(email, 'android-device', OS_ANDROID);

    await web.agent.post('/api/sessions/logout-all').timeout(30000).expect(200);

    expect((await me(web.agent)).status).toBe(200);
    expect((await me(android.agent)).status).toBe(401);
  });

  it('logout-others revokes every other session', async () => {
    const { email } = await newUser();
    const web = await login(email, 'web-device');
    const android = await login(email, 'android-device', OS_ANDROID);

    await web.agent.post('/api/sessions/logout-others').timeout(30000).expect(200);

    expect((await me(web.agent)).status).toBe(200);
    expect((await me(android.agent)).status).toBe(401);
  });

  it('logout a specific session by id revokes only that session', async () => {
    const { email } = await newUser();
    const web = await login(email, 'web-device');
    const android = await login(email, 'android-device', OS_ANDROID);

    const list = await web.agent.get('/api/sessions').timeout(30000);
    const androidSession = list.body.find((s: any) => s.os === OS_ANDROID);
    expect(androidSession).toBeDefined();

    await web.agent.post(`/api/sessions/${androidSession.id}/logout`).timeout(30000).expect(200);

    expect((await me(android.agent)).status).toBe(401);
    expect((await me(web.agent)).status).toBe(200);
  });

  it('logout-device revokes all sessions for that device', async () => {
    const { email } = await newUser();
    const web = await login(email, 'web-device');
    const android = await login(email, 'android-device', OS_ANDROID);

    const current = await android.agent.get('/api/sessions/current').timeout(30000);
    const devicePk = current.body.device.id;

    await web.agent
      .post('/api/sessions/logout-device')
      .send({ deviceId: devicePk })
      .timeout(30000)
      .expect(200);

    expect((await me(android.agent)).status).toBe(401);
    expect((await me(web.agent)).status).toBe(200);
  });

  it('parallel logins never leave more than 2 active sessions', async () => {
    const { email } = await newUser();

    const logins = await Promise.all(
      Array.from({ length: PARALLEL_LOGIN_COUNT }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email, password: PASSWORD, ...fingerprintFor(`parallel-dev-${i}`, OS_WINDOWS) })
          .timeout(30000),
      ),
    );
    logins.forEach((r) => expect(r.status).toBe(200));

    expect(await activeCount(email)).toBe(MAX_ACTIVE_SESSIONS);
    const user = await dbUser(email);
    const evicted = await prisma.session.count({
      where: { userId: user!.id, logoutReason: 'session_limit_exceeded' },
    });
    expect(evicted).toBe(EXPECTED_EVICTED_SESSIONS);
  });

  it('an evicted session has its access token rejected immediately', async () => {
    const { email } = await newUser();
    const s1 = await login(email, 'dev-1');
    await login(email, 'dev-2');
    await login(email, 'dev-3');

    const meRes = await me(s1.agent);
    expect(meRes.status).toBe(401);

    const list = await s1.agent.get('/api/sessions').timeout(30000);
    expect(list.status).toBe(401);
  });
});
