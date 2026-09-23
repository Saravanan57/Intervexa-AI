import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div class="max-w-md w-full bg-white border border-[#D9E2F1] rounded-3xl shadow-xl p-6 sm:p-8 relative animate-fade-in text-left">
        
        <div class="space-y-1.5 mb-6 text-center">
          <div class="inline-flex items-center space-x-2 bg-primary/5 px-3 py-1 rounded-full text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <span class="w-2 h-2 rounded-full bg-primary"></span>
            <span>Intervexa AI</span>
          </div>
          <h2 class="text-3xl font-extrabold text-[#111827] font-sans">Welcome Back</h2>
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
              placeholder="name@company.com" 
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

        <div class="text-center text-xs text-muted pt-4 mt-4 border-t border-[#D9E2F1]/50">
          <span>Don't have an account? </span>
          <a routerLink="/auth/register" class="font-extrabold text-primary hover:underline">Create Account</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
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
