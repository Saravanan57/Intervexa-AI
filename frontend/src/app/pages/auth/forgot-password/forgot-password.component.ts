import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#111827] font-sans break-words">Forgot Password?</h2>
          <p class="text-xs text-muted">No worries! Enter your registered email address to receive password reset instructions.</p>
        </div>

        @if (errorMessage()) {
          <div class="bg-error/10 border border-error/20 text-error text-xs rounded-xl p-3.5 mb-4 flex items-start space-x-2">
            <svg class="w-4 h-4 text-error shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        @if (successMessage()) {
          <div class="bg-success/10 border border-success/20 text-success text-xs rounded-xl p-5 mb-4 space-y-3">
            <div class="flex items-center space-x-2 font-bold text-sm">
              <svg class="w-5 h-5 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Reset Instructions Sent</span>
            </div>
            <p class="text-slate-600 leading-relaxed">
              {{ successMessage() }}
            </p>
            <p class="text-[11px] text-slate-500">
              Didn't receive the email? Check your spam folder or wait a moment before requesting another link.
            </p>
            <div class="pt-2 flex flex-col sm:flex-row gap-2">
              <button 
                type="button" 
                (click)="resetFormState()"
                class="px-3.5 py-2 border border-[#D9E2F1] rounded-lg text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-all text-center"
              >
                Send Another Link
              </button>
              <a 
                routerLink="/auth/login" 
                class="px-3.5 py-2 bg-gradient-primary text-white rounded-lg text-xs font-bold text-center hover:opacity-95 transition-all"
              >
                Return to Login
              </a>
            </div>
          </div>
        } @else {
          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Email field -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-[#4B5563]">Email Address</label>
              <input 
                type="email" 
                formControlName="email"
                placeholder="example@gmail.com" 
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
              class="w-full py-3.5 rounded-xl bg-gradient-primary text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center space-x-2 text-white cursor-pointer"
            >
              @if (isLoading()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Sending Reset Link...</span>
              } @else {
                <span>Send Reset Link</span>
              }
            </button>
          </form>
        }

        <div class="text-center text-xs text-muted pt-4 mt-4 border-t border-[#D9E2F1]/50">
          <span>Remembered your password? </span>
          <a routerLink="/auth/login" class="font-extrabold text-primary hover:underline">Back to Login</a>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  forgotForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      if (email && typeof email === 'string') {
        this.forgotForm.patchValue({ email: email.trim() });
      }
    });
  }

  resetFormState() {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const email = String(this.forgotForm.value.email || '').trim().toLowerCase();
    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(res.message || 'If an account exists with this email address, password reset instructions have been sent.');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || err.message || 'Unable to process password reset at this time. Please try again.');
      }
    });
  }
}
