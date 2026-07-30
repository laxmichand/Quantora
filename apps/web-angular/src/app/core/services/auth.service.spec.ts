import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService, AuthUser } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DeviceFingerprintService } from './device-fingerprint.service';

const TEST_USER: AuthUser = { id: '123', email: 'test@test.com', name: 'Test', role: 'user' };
const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = 'ValidP@ss1';
const FINGERPRINT_DATA = {
  deviceId: 'test-device',
  deviceName: 'Test',
  browser: 'Chrome',
  os: 'Mac',
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const fingerprintSpy = jasmine.createSpyObj('DeviceFingerprintService', [
      'collect',
      'getCurrentDeviceId',
    ]);
    fingerprintSpy.collect.and.resolveTo(FINGERPRINT_DATA);
    fingerprintSpy.getCurrentDeviceId.and.returnValue('test-device');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: DeviceFingerprintService, useValue: fingerprintSpy }],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated).toBeFalse();
    expect(service.currentUser).toBeNull();
  });

  it('should login and store user in memory', fakeAsync(() => {
    const mockResponse = { user: TEST_USER };
    let result: any;
    service.login(TEST_EMAIL, TEST_PASSWORD).then((r) => (result = r));
    tick();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(mockResponse);

    tick();
    expect(result.user.email).toBe(TEST_EMAIL);
    expect(service.currentUser?.email).toBe(TEST_EMAIL);
  }));

  it('should register and store user in memory', fakeAsync(() => {
    const mockResponse = { user: TEST_USER };
    let result: any;
    service.register(TEST_EMAIL, TEST_PASSWORD, 'Test').then((r) => (result = r));
    tick();

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(mockResponse);

    tick();
    expect(result.user.email).toBe(TEST_EMAIL);
  }));

  it('should logout and clear user', () => {
    service['currentUserSubject'].next(TEST_USER);
    service.logout();
    const req = httpMock.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ message: 'ok' });
    expect(service.currentUser).toBeNull();
  });

  it('should return false for isAuthenticated when no user', () => {
    expect(service.isAuthenticated).toBeFalse();
  });
});
