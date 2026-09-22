import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[85vh] flex items-center justify-center py-12 px-6">
      <div class="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white border border-[#D9E2F1] rounded-3xl overflow-hidden shadow-xl p-4 md:p-8 relative animate-fade-in">
        
        <!-- Left Side: Brand Panel -->
        <div class="hidden md:flex md:col-span-5 flex-col justify-between h-full min-h-[480px] bg-gradient-to-br from-[#0145F2] to-[#1E5BFA] text-white p-8 rounded-2xl relative overflow-hidden shadow-inner isolate z-0">
          <div class="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
          <div class="absolute w-72 h-72 bg-white/10 rounded-full blur-3xl -top-10 -left-10 animate-pulse"></div>

          <div class="space-y-6 z-10 text-left">
            <span class="text-xs font-bold bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider">Security First</span>
            <h3 class="text-3xl font-extrabold tracking-tight leading-tight">Create New Password</h3>
            <p class="text-xs text-white/80 leading-relaxed font-normal">
              Set a strong, unique password to secure your Intervexa AI candidate account and prep history.
            </p>
          </div>
          
          <div class="bg-white/5 border border-white/10 p-4.5 rounded-xl space-y-2.5 z-10 text-left backdrop-blur-md">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-success"></span>
              <span class="text-[9px] font-bold uppercase tracking-wider">Encrypted Storage</span>
            </div>
            <p class="text-[10px] text-white/95 leading-relaxed font-light">
              "Passwords are salted and bcrypt hashed with strict security standards."
            </p>
          </div>
        </div>

        <!-- Right Side: Reset Form -->
        <div class="md:col-span-7 p-4 md:p-8 space-y-6 text-left">
          <div class="space-y-1.5">
            <h2 class="text-3xl font-extrabold text-[#111827] font-sans">Reset Password</h2>
            <p class="text-xs text-muted">Enter your new password below to update your credentials.</p>
          </div>

          @if (!token()) {
            <div class="bg-error/10 border border-error/20 text-error text-xs rounded-xl p-4 space-y-2">
              <div class="font-bold flex items-center">
                <svg class="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Invalid or Missing Token
              </div>
              <p>No valid password reset token was found in the link. Please request a new password reset email.</p>
              <div class="pt-2">
                <a routerLink="/auth/forgot-password" class="font-bold text-primary hover:underline">Request New Reset Link</a>
              </div>
            </div>
          } @else if (errorMessage()) {
            <div class="bg-error/10 border border-error/20 text-error text-xs rounded-xl p-3.5 flex items-center">
              <svg class="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          @if (successMessage()) {
            <div class="bg-success/10 border border-success/20 text-success text-xs rounded-xl p-4 space-y-3">
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="font-bold text-sm">{{ successMessage() }}</span>
              </div>
              <p class="text-slate-600">Redirecting to login page in 3 seconds...</p>
              <a routerLink="/auth/login" class="inline-block px-4 py-2 bg-gradient-primary text-white font-bold rounded-lg text-xs hover:opacity-95">Go to Login Now</a>
            </div>
          } @else if (token()) {
            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <!-- New Password field -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-[#4B5563]">New Password</label>
                <input 
                  type="password" 
                  formControlName="password"
                  placeholder="••••••••" 
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                />
                @if (resetForm.get('password')?.touched && resetForm.get('password')?.invalid) {
                  <span class="text-[10px] text-error font-semibold">Password must be at least 6 characters long.</span>
                }
              </div>

              <!-- Confirm Password field -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-[#4B5563]">Confirm New Password</label>
                <input 
                  type="password" 
                  formControlName="confirmPassword"
                  placeholder="••••••••" 
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                />
                @if (resetForm.touched && resetForm.hasError('passwordMismatch')) {
                  <span class="text-[10px] text-error font-semibold">Passwords do not match. Please check again.</span>
                }
              </div>

              <!-- Submit Button -->
              <button 
                type="submit" 
                [disabled]="resetForm.invalid || isLoading()"
                class="w-full py-3.5 rounded-xl bg-gradient-primary text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center space-x-2 text-white"
              >
                @if (isLoading()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Updating Password...</span>
                } @else {
                  <span>Reset Password</span>
                }
              </button>
            </form>
          }

          <div class="text-center text-xs text-muted pt-2 border-t border-[#D9E2F1]/50">
            <span>Need help? </span>
            <a routerLink="/auth/login" class="font-extrabold text-primary hover:underline">Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = signal<string | null>(null);
  resetForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor() {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token.set(params['token'] || null);
    });
  }

  onSubmit() {
    if (this.resetForm.invalid || !this.token()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const passwordData = {
      token: this.token(),
      password: this.resetForm.value.password
    };

    this.authService.resetPassword(passwordData).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(res.message || 'Password reset successfully! You can now log in.');
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || err.message || 'Invalid or expired password reset token.');
      }
    });
  }
}
