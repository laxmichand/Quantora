import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

process.env.THROTTLE_MAX = '10000';
process.env.THROTTLE_WINDOW_MS = '60000';

const PASSWORD = 'TestPass123';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

let seq = 0;
const nextEmail = () => `fp-${Date.now()}-${seq++}@test.com`;

describe('Device fingerprint enrichment (e2e)', () => {
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
      await prisma.user.deleteMany({ where: { email: { startsWith: 'fp-' } } });
    } catch {
      /* no-op */
    }
    await app.close();
  });

  it('persists server-derived UA, header, sensor, and lifecycle fields into the device row', async () => {
    const email = nextEmail();
    const deviceId = `fp-device-${Date.now()}-${seq++}`;
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('User-Agent', UA)
      .set('Accept-Language', 'en-US,en;q=0.9')
      .set('Accept-Encoding', 'gzip, deflate, br')
      .set('Accept', 'text/html')
      .set('Origin', 'http://localhost')
      .send({
        email,
        password: PASSWORD,
        name: 'FP',
        deviceId,
        fingerprint: {
          browser: 'SpoofedBrowser',
          os: 'SpoofedOS',
          screenResolution: '1920x1080',
          canvasFingerprint: 'xyz',
        },
      })
      .timeout(30000)
      .expect(201);

    const device = await prisma.device.findUnique({ where: { deviceId } });
    expect(device).not.toBeNull();

    // UA-derived fields are authoritative over client claims
    expect(device!.browser).toBe('Chrome');
    expect(device!.browserVersion).toBe('126.0.0.0');
    expect(device!.engine).toBe('Blink');
    expect(device!.os).toBe('macOS');
    expect(device!.osVersion).toBe('10.15.7');
    expect(device!.manufacturer).toBe('Apple');
    expect(device!.model).toBe('Macintosh');
    expect(device!.deviceName).toBe('Apple Macintosh');

    // Sensor fingerprint + server headers persisted
    expect(device!.screenResolution).toBe('1920x1080');
    expect(device!.canvasFingerprint).toBe('xyz');
    expect(device!.acceptLanguage).toBe('en-US,en;q=0.9');
    expect(device!.acceptEncoding).toBe('gzip, deflate, br');
    expect(device!.acceptHeader).toBe('text/html');
    expect(device!.origin).toBe('http://localhost');

    // Lifecycle + login metadata
    expect(device!.loginMethod).toBe('local');
    expect(device!.publicIp).toBeDefined();
    expect(device!.firstLogin).toBeInstanceOf(Date);
    expect(device!.lastLogin).toBeInstanceOf(Date);
    expect(device!.lastActivity).toBeInstanceOf(Date);
  });

  it('updates the device row on login and never fabricates geo on loopback IPs', async () => {
    const email = nextEmail();
    const deviceId = `fp-device-${Date.now()}-${seq++}`;
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/register')
      .set('User-Agent', UA)
      .send({ email, password: PASSWORD, name: 'FP', deviceId })
      .timeout(30000)
      .expect(201);

    await agent
      .post('/api/auth/login')
      .set('User-Agent', UA)
      .send({ email, password: PASSWORD, deviceId })
      .timeout(30000)
      .expect(200);

    const device = await prisma.device.findUnique({ where: { deviceId } });
    expect(device).not.toBeNull();
    expect(device!.loginCount).toBeGreaterThanOrEqual(1);
    expect(device!.lastLogin).toBeInstanceOf(Date);
    expect(device!.lastActivity).toBeInstanceOf(Date);
    expect(device!.country).toBeNull();
    expect(device!.city).toBeNull();
    expect(device!.vpnDetected).toBe(false);
  });
});
