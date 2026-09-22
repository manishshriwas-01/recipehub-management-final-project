import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service/auth.service';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.user();

  if (user) {
    return user.role === 'admin'
      ? true
      : router.createUrlTree(['/recipes']);
  }

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  return authService.getMe().pipe(
    map(response => {
      authService.setUser(response.user);

      return response.user.role === 'admin'
        ? true
        : router.createUrlTree(['/recipes']);
    }),
    catchError(() => {
      authService.clearUser();
      return of(router.createUrlTree(['/login']));
    })
  );
};