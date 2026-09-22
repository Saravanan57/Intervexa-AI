import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 Unauthorized check
      if (err.status === 401 && !req.url.includes('/login') && !req.url.includes('/refresh-token')) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            const token = authService.getAccessToken();
            const clone = req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            });
            return next(clone);
          }),
          catchError((refreshErr) => {
            authService.logoutLocal();
            return throwError(() => refreshErr);
          })
        );
      }

      const errorMsg = err.error?.message || err.statusText || 'An unknown network error occurred';
      return throwError(() => new Error(errorMsg));
    })
  );
};
