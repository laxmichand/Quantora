import { TestBed } from '@angular/core/testing';
import { AuthService, AuthUser } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated).toBeFalse();
    expect(service.currentUser).toBeNull();
  });

  it('should login and store tokens', () => {
    const mockResponse = {
      accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.test',
      refreshToken: 'refresh-123',
      user: { id: '123', email: 'test@test.com', name: 'Test', role: 'user' },
    };

    service.login('test@test.com', 'password').subscribe((res) => {
      expect(res.user.email).toBe('test@test.com');
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(localStorage.getItem('quantora_access_token')).toBe(mockResponse.accessToken);
    expect(localStorage.getItem('quantora_refresh_token')).toBe(mockResponse.refreshToken);
  });

  it('should register and store tokens', () => {
    const mockResponse = {
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { id: '1', email: 'new@test.com', name: 'New', role: 'user' },
    };

    service.register('new@test.com', 'Test1234', 'New').subscribe((res) => {
      expect(res.user.email).toBe('new@test.com');
    });

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should logout and clear storage', () => {
    localStorage.setItem('quantora_access_token', 'token');
    localStorage.setItem('quantora_refresh_token', 'refresh');

    service.logout();

    const req = httpMock.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok' });

    expect(localStorage.getItem('quantora_access_token')).toBeNull();
    expect(localStorage.getItem('quantora_refresh_token')).toBeNull();
    expect(service.currentUser).toBeNull();
  });

  it('should return false for isAuthenticated when no token', () => {
    expect(service.isAuthenticated).toBeFalse();
  });
});
