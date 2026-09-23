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

      let errorMsg = err.error?.message;
      if (!errorMsg) {
        if (err.status === 0) {
          errorMsg = 'Unable to connect to the server. Please check your connection and try again.';
        } else if (err.status === 401) {
          errorMsg = 'Invalid email or password.';
        } else if (err.status === 403) {
          errorMsg = 'Access forbidden. Your account may be restricted.';
        } else if (err.status === 404) {
          errorMsg = 'Requested resource not found.';
        } else if (err.status >= 500) {
          errorMsg = 'Unable to connect to the server. Please try again.';
        } else {
          errorMsg = err.statusText && err.statusText !== 'Unknown Error'
            ? err.statusText
            : 'An unexpected error occurred. Please try again.';
        }
      }
      return throwError(() => new Error(errorMsg));
    })
  );
};
