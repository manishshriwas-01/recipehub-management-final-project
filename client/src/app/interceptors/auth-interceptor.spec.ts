import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse, HttpHandlerFn } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let toastr: { error: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    toastr = {
      error: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ToastrService, useValue: toastr }
      ]
    });

    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should add Authorization header when token exists', () => {
    localStorage.setItem('token', 'test-token');

    const request = new HttpRequest('GET', '/api/recipes');

    const next: HttpHandlerFn = (req) => {
      expect(req.headers.get('Authorization')).toBe('Bearer test-token');

      return of(new HttpResponse({
        status: 200,
        body: { success: true }
      }));
    };

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next).subscribe();
    });
  });

  it('should not add Authorization header when token does not exist', () => {
    const request = new HttpRequest('GET', '/api/recipes');

    const next: HttpHandlerFn = (req) => {
      expect(req.headers.has('Authorization')).toBe(false);

      return of(new HttpResponse({
        status: 200,
        body: { success: true }
      }));
    };

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next).subscribe();
    });
  });

  it('should remove token and redirect to login on 401', () => {
    localStorage.setItem('token', 'test-token');

    const navigateSpy = vi.spyOn(router, 'navigate');

    const request = new HttpRequest('GET', '/api/recipes');

    const next: HttpHandlerFn = () =>
      throwError(() => ({
        status: 401,
        error: { message: 'Unauthorized' }
      }));

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next).subscribe({
        error: () => {}
      });
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(toastr.error).toHaveBeenCalledWith('Unauthorized');
  });
});