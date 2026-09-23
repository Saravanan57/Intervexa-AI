import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
          <h2 class="text-3xl font-extrabold text-[#111827] font-sans">Forgot Password?</h2>
          <p class="text-xs text-muted">No worries! Enter your registered email to reset your password.</p>
        </div>

        @if (errorMessage()) {
          <div class="bg-error/10 border border-error/20 text-error text-xs rounded-xl p-3.5 mb-4 flex items-center">
            <svg class="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        @if (successMessage()) {
          <div class="bg-success/10 border border-success/20 text-success text-xs rounded-xl p-4 mb-4 flex items-center space-x-2">
            <svg class="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>{{ successMessage() }}</span>
          </div>
        }

        <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Email field -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-[#4B5563]">Email Address</label>
            <input 
              type="email" 
              formControlName="email"
              placeholder="name@company.com" 
              class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
            />
            @if (forgotForm.get('email')?.touched && forgotForm.get('email')?.invalid) {
              <span class="text-[10px] text-error font-semibold">Please enter a valid registered email address.</span>
            }
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            [disabled]="forgotForm.invalid || isLoading()"
            class="w-full py-3.5 rounded-xl bg-gradient-primary text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center space-x-2 text-white"
          >
            @if (isLoading()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Sending Reset Link...</span>
            } @else {
              <span>Send Reset Link</span>
            }
          </button>
        </form>

        <div class="text-center text-xs text-muted pt-4 mt-4 border-t border-[#D9E2F1]/50">
          <span>Remembered your password? </span>
          <a routerLink="/auth/login" class="font-extrabold text-primary hover:underline">Back to Login</a>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const email = this.forgotForm.value.email;
    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(res.message || 'If a matching email exists, reset instructions have been sent.');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || err.message || 'Failed to process request. Please try again.');
      }
    });
  }
}
