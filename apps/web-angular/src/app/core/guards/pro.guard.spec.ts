import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ProGuard } from './pro.guard';
import { AuthService, AuthUser } from '../services/auth.service';

describe('ProGuard', () => {
  let guard: ProGuard;
  let router: jasmine.SpyObj<Router>;
  let authState: { currentUser: AuthUser | null };

  const TEST_USER: AuthUser = { id: '123', email: 'test@test.com', name: 'Test', role: 'user' };

  function setUser(user: AuthUser | null): void {
    authState.currentUser = user;
  }

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue({ urlTree: true } as any);

    authState = { currentUser: TEST_USER };
    const authService = authState as unknown as AuthService;

    TestBed.configureTestingModule({
      providers: [
        ProGuard,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
    guard = TestBed.inject(ProGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access for pro users', () => {
    setUser({ ...TEST_USER, role: 'pro' });
    expect(guard.canActivate()).toBeTrue();
  });

  it('should allow access for admin users', () => {
    setUser({ ...TEST_USER, role: 'admin' });
    expect(guard.canActivate()).toBeTrue();
  });

  it('should redirect free users to the subscription page', () => {
    setUser({ ...TEST_USER, role: 'user' });
    const result = guard.canActivate();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/settings/subscription']);
    expect(result).toEqual({ urlTree: true } as any);
  });

  it('should redirect unauthenticated users to the subscription page', () => {
    setUser(null);
    const result = guard.canActivate();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/settings/subscription']);
    expect(result).toEqual({ urlTree: true } as any);
  });
});
