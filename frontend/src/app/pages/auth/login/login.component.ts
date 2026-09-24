import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[85vh] flex items-center justify-center py-8 sm:py-12 px-3.5 sm:px-6">
      <div class="max-w-md w-full bg-white border border-[#D9E2F1] rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 relative animate-fade-in text-left">
        
        <div class="space-y-1.5 mb-6 text-center">
          <div class="inline-flex items-center space-x-2 bg-primary/5 px-3 py-1 rounded-full text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <span class="w-2 h-2 rounded-full bg-primary"></span>
            <span>Intervexa AI</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#111827] font-sans break-words">Welcome Back</h2>
          <p class="text-xs text-muted">Log in to your account to continue preparing.</p>
        </div>

        @if (errorMessage()) {
          <div class="bg-error/10 border border-error/20 text-error text-xs rounded-xl p-3.5 mb-4 flex items-center">
            <svg class="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Email field -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-[#4B5563]">Email Address</label>
            <input 
              type="email" 
              formControlName="email"
              placeholder="example@gmail.com" 
              class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
            />
            @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
              <span class="text-[10px] text-error font-semibold">Please enter a valid email address.</span>
            }
          </div>

          <!-- Password field -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <label class="text-xs font-bold text-[#4B5563]">Password</label>
              <a routerLink="/auth/forgot-password" class="text-xs font-bold text-primary hover:underline cursor-pointer">Forgot Password?</a>
            </div>
            <input 
              type="password" 
              formControlName="password" 
              placeholder="••••••••" 
              class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
            />
            @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
              <span class="text-[10px] text-error font-semibold">Password must be at least 6 characters long.</span>
            }
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full py-3.5 rounded-xl bg-gradient-primary text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center space-x-2 text-white"
          >
            @if (isLoading()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Authenticating...</span>
            } @else {
              <span>Sign In</span>
            }
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-5">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-[#D9E2F1]"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-white px-3 text-[#6B7280] font-bold tracking-wider">Or</span>
          </div>
        </div>

        <!-- Social Buttons -->
        <div class="space-y-3">
          <button 
            type="button" 
            (click)="loginWithGoogle()"
            [disabled]="isSocialLoading() !== null || isLoading()"
            class="w-full py-3 px-4 border border-[#D9E2F1] rounded-xl text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] active:bg-[#F3F4F6] transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            @if (isSocialLoading() === 'google') {
              <span class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              <span>Connecting to Google...</span>
            } @else {
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            }
          </button>

          <button 
            type="button" 
            (click)="loginWithFacebook()"
            [disabled]="isSocialLoading() !== null || isLoading()"
            class="w-full py-3 px-4 border border-[#D9E2F1] rounded-xl text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] active:bg-[#F3F4F6] transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            @if (isSocialLoading() === 'facebook') {
              <span class="w-4 h-4 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin"></span>
              <span>Connecting to Facebook...</span>
            } @else {
              <svg class="w-5 h-5 text-[#1877F2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Continue with Facebook</span>
            }
          </button>
        </div>

        <div class="text-center text-xs text-muted pt-4 mt-4 border-t border-[#D9E2F1]/50">
          <span>Don't have an account? </span>
          <a routerLink="/auth/register" class="font-extrabold text-primary hover:underline">Create Account</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = signal(false);
  isSocialLoading = signal<'google' | 'facebook' | null>(null);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.errorMessage.set(params['error']);
      }
    });
  }

  loginWithGoogle() {
    this.isSocialLoading.set('google');
    this.errorMessage.set(null);
    try {
      this.authService.loginWithGoogleRedirect();
    } catch (err: any) {
      this.isSocialLoading.set(null);
      this.errorMessage.set('Unable to initiate Google sign-in. Please try again.');
    }
  }

  loginWithFacebook() {
    this.isSocialLoading.set('facebook');
    this.errorMessage.set(null);
    try {
      this.authService.loginWithFacebookRedirect();
    } catch (err: any) {
      this.isSocialLoading.set(null);
      this.errorMessage.set('Unable to initiate Facebook sign-in. Please try again.');
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        if (sessionStorage.getItem('pending_resume_data')) {
          this.router.navigate(['/resume-analyzer']);
        } else if (sessionStorage.getItem('pending_mock_interview')) {
          this.router.navigate(['/mock-interview']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Login failed. Please check credentials.');
      }
    });
  }
}
