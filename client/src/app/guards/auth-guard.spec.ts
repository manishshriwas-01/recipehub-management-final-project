import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, Router } from '@angular/router';

import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth.service/auth.service';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authService: { isLoggedIn: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authService = {
      isLoggedIn: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([])
      ]
    });

    router = TestBed.inject(Router);
  });

  it('should allow navigation when user is logged in', () => {
    authService.isLoggedIn.mockReturnValue(true);

    const result = executeGuard({} as any, {} as any);

    expect(result).toBe(true);
    expect(authService.isLoggedIn).toHaveBeenCalled();
  });

  it('should redirect to login when user is not logged in', () => {
    authService.isLoggedIn.mockReturnValue(false);

    const result = executeGuard({} as any, {} as any);

    expect(result).toEqual(router.createUrlTree(['/login']));
    expect(authService.isLoggedIn).toHaveBeenCalled();
  });
});