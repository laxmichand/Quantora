import { TestBed } from '@angular/core/testing';
import { AuthService, AuthUser } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
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

  it('should login and store user in memory', () => {
    const mockResponse = {
      user: { id: '123', email: 'test@test.com', name: 'Test', role: 'user' },
    };

    service.login('test@test.com', 'password').subscribe((res) => {
      expect(res.user.email).toBe('test@test.com');
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(mockResponse);

    expect(service.currentUser?.email).toBe('test@test.com');
  });

  it('should register and store user in memory', () => {
    const mockResponse = {
      user: { id: '1', email: 'new@test.com', name: 'New', role: 'user' },
    };

    service.register('new@test.com', 'Test1234', 'New').subscribe((res) => {
      expect(res.user.email).toBe('new@test.com');
    });

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(mockResponse);
  });

  it('should logout and clear user', () => {
    service['currentUserSubject'].next({ id: '1', email: 't@t.com', name: 'T', role: 'user' });

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
