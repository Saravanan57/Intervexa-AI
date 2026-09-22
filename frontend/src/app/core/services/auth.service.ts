import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { AuthResponse, User } from '../interfaces/user.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Signals for Reactive User State
  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor() {
    this.loadCachedUser();
  }

  private loadCachedUser() {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        this.currentUser.set(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.accessToken) {
          localStorage.setItem('accessToken', res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }
      })
    );
  }

  refreshToken(): Observable<any> {
    const token = this.getRefreshToken();
    if (!token) {
      this.logoutLocal();
      return throwError(() => new Error('No refresh token'));
    }

    return this.http.post<any>(`${this.apiUrl}/refresh-token`, { token }).pipe(
      tap((res) => {
        if (res.accessToken) {
          localStorage.setItem('accessToken', res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
        }
      }),
      catchError((err) => {
        this.logoutLocal();
        return throwError(() => err);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.logoutLocal()),
      catchError((err) => {
        this.logoutLocal();
        return of(null);
      })
    );
  }

  logoutLocal() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    
    // Only redirect to homepage if currently viewing a protected page
    const currentUrl = this.router.url;
    if (
      currentUrl.includes('/dashboard') || 
      currentUrl.includes('/profile') || 
      currentUrl.includes('/settings') || 
      currentUrl.includes('/admin') ||
      currentUrl.includes('/mock-interview/active') ||
      currentUrl.includes('/mock-interview/feedback')
    ) {
      this.router.navigate(['/']);
    }
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(passwordData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, passwordData);
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, passwordData);
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, profileData).pipe(
      tap((res) => {
        if (res.success && res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }
      })
    );
  }
}
