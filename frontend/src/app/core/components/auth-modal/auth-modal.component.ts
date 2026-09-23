import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthModalService } from '../../services/auth-modal.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (authModalService.isOpen()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <!-- Backdrop -->
        <div 
          (click)="authModalService.closeModal()" 
          class="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-md transition-opacity animate-fade-in"
        ></div>

        <!-- Modal Container -->
        <div class="relative w-[92vw] sm:w-full max-w-md bg-white border border-[#D9E2F1] rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in text-left max-h-[90vh] flex flex-col box-border">
          
          <!-- Header Banner -->
          <div class="bg-gradient-to-r from-[#0145F2] to-[#1E5BFA] p-6 text-white relative overflow-hidden">
            <!-- Close Button -->
            <button 
              (click)="authModalService.closeModal()" 
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              ✕
            </button>

            <div class="space-y-2 pr-8">
              <span class="inline-block text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full text-white">
                Intervexa AI Auth
              </span>
              <p class="text-sm font-semibold leading-snug text-white/95">
                {{ authModalService.message() }}
              </p>
            </div>
          </div>

          <!-- Body & Tabs -->
          <div class="p-5 sm:p-6 space-y-5 overflow-y-auto flex-grow box-border">
            <!-- Tab Buttons -->
            <div class="flex border-b border-[#D9E2F1] text-xs font-bold space-x-6">
              <button 
                (click)="authModalService.setMode('login')"
                [class.text-[#0145F2]]="authModalService.mode() === 'login'"
                [class.border-[#0145F2]]="authModalService.mode() === 'login'"
                class="pb-2.5 border-b-2 border-transparent transition-all"
              >
                Sign In
              </button>
              <button 
                (click)="authModalService.setMode('register')"
                [class.text-[#0145F2]]="authModalService.mode() === 'register'"
                [class.border-[#0145F2]]="authModalService.mode() === 'register'"
                class="pb-2.5 border-b-2 border-transparent transition-all"
              >
                Create Account
              </button>
            </div>

            <!-- Error Notification -->
            @if (errorMessage()) {
              <div class="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3 flex items-center">
                <svg class="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <!-- LOGIN FORM -->
            @if (authModalService.mode() === 'login') {
              <form [formGroup]="loginForm" (ngSubmit)="onLoginSubmit()" class="space-y-4">
                <div class="space-y-1">
                  <label class="text-xs font-bold text-[#4B5563]">Email Address</label>
                  <input 
                    type="email" 
                    formControlName="email" 
                    placeholder="example@gmail.com" 
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#0145F2]"
                  />
                </div>

                <div class="space-y-1">
                  <div class="flex justify-between items-center">
                    <label class="text-xs font-bold text-[#4B5563]">Password</label>
                    <button 
                      type="button" 
                      (click)="goToForgotPassword()" 
                      class="text-[11px] font-bold text-[#0145F2] hover:underline cursor-pointer bg-transparent border-0 p-0"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input 
                    type="password" 
                    formControlName="password" 
                    placeholder="••••••••" 
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#0145F2]"
                  />
                </div>

                <button 
                  type="submit" 
                  [disabled]="loginForm.invalid || isLoading()"
                  class="w-full py-3 rounded-xl bg-gradient-to-r from-[#0145F2] to-[#1E5BFA] text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                >
                  @if (isLoading()) {
                    <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Authenticating...</span>
                  } @else {
                    <span>Sign In & Continue</span>
                  }
                </button>

                <!-- Divider -->
                <div class="relative my-3">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-[#D9E2F1]"></div>
                  </div>
                  <div class="relative flex justify-center text-[10px] uppercase">
                    <span class="bg-white px-2 text-[#6B7280] font-bold">Or</span>
                  </div>
                </div>

                <!-- Social Buttons -->
                <div class="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    (click)="loginWithGoogle()"
                    class="py-2.5 px-3 border border-[#D9E2F1] rounded-xl text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] active:bg-[#F3F4F6] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Google</span>
                  </button>

                  <button 
                    type="button" 
                    (click)="loginWithFacebook()"
                    class="py-2.5 px-3 border border-[#D9E2F1] rounded-xl text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] active:bg-[#F3F4F6] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <svg class="w-4 h-4 text-[#1877F2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </button>
                </div>

                <div class="text-center text-[11px] text-muted pt-2 border-t border-[#D9E2F1]/50 flex justify-between items-center">
                  <span>Don't have an account? <button type="button" (click)="authModalService.setMode('register')" class="font-extrabold text-[#0145F2] hover:underline bg-transparent border-0 p-0 cursor-pointer">Create Account</button></span>
                  <button type="button" (click)="goToLogin()" class="font-semibold text-muted hover:text-[#0145F2] hover:underline bg-transparent border-0 p-0 cursor-pointer">Full Page</button>
                </div>
              </form>
            }

            <!-- REGISTER FORM -->
            @if (authModalService.mode() === 'register') {
              <form [formGroup]="registerForm" (ngSubmit)="onRegisterSubmit()" class="space-y-4">
                <div class="space-y-1">
                  <label class="text-xs font-bold text-[#4B5563]">Full Name</label>
                  <input 
                    type="text" 
                    formControlName="name" 
                    placeholder="John Doe" 
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#0145F2]"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-xs font-bold text-[#4B5563]">Email Address</label>
                  <input 
                    type="email" 
                    formControlName="email" 
                    placeholder="example@gmail.com" 
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#0145F2]"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-xs font-bold text-[#4B5563]">Password</label>
                  <input 
                    type="password" 
                    formControlName="password" 
                    placeholder="At least 6 characters" 
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#0145F2]"
                  />
                </div>

                <button 
                  type="submit" 
                  [disabled]="registerForm.invalid || isLoading()"
                  class="w-full py-3 rounded-xl bg-gradient-to-r from-[#0145F2] to-[#1E5BFA] text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                >
                  @if (isLoading()) {
                    <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Creating Account...</span>
                  } @else {
                    <span>Create Account & Continue</span>
                  }
                </button>

                <!-- Divider -->
                <div class="relative my-3">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-[#D9E2F1]"></div>
                  </div>
                  <div class="relative flex justify-center text-[10px] uppercase">
                    <span class="bg-white px-2 text-[#6B7280] font-bold">Or</span>
                  </div>
                </div>

                <!-- Social Buttons -->
                <div class="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    (click)="loginWithGoogle()"
                    class="py-2.5 px-3 border border-[#D9E2F1] rounded-xl text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] active:bg-[#F3F4F6] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Google</span>
                  </button>

                  <button 
                    type="button" 
                    (click)="loginWithFacebook()"
                    class="py-2.5 px-3 border border-[#D9E2F1] rounded-xl text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] active:bg-[#F3F4F6] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <svg class="w-4 h-4 text-[#1877F2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </button>
                </div>

                <div class="text-center text-[11px] text-muted pt-2 border-t border-[#D9E2F1]/50 flex justify-between items-center">
                  <span>Already have an account? <button type="button" (click)="authModalService.setMode('login')" class="font-extrabold text-[#0145F2] hover:underline bg-transparent border-0 p-0 cursor-pointer">Sign In</button></span>
                  <button type="button" (click)="goToRegister()" class="font-semibold text-muted hover:text-[#0145F2] hover:underline bg-transparent border-0 p-0 cursor-pointer">Full Page</button>
                </div>
              </form>
            }

          </div>
        </div>
      </div>
    }
  `
})
export class AuthModalComponent {
  authModalService = inject(AuthModalService);
  authService = inject(AuthService);
  router = inject(Router);
  fb = inject(FormBuilder);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  goToForgotPassword() {
    this.authModalService.closeModal();
    this.router.navigate(['/auth/forgot-password']);
  }

  goToLogin() {
    this.authModalService.closeModal();
    this.router.navigate(['/auth/login']);
  }

  goToRegister() {
    this.authModalService.closeModal();
    this.router.navigate(['/auth/register']);
  }

  onLoginSubmit() {
    if (this.loginForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.authModalService.handleAuthSuccess();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Login failed. Please check credentials.');
      }
    });
  }

  onRegisterSubmit() {
    if (this.registerForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        // Auto login after register
        this.authService.login({
          email: this.registerForm.value.email,
          password: this.registerForm.value.password
        }).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.authModalService.handleAuthSuccess();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(err.error?.message || 'Auto-login failed after registration.');
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed.');
      }
    });
  }

  loginWithGoogle() {
    this.authModalService.closeModal();
    this.authService.loginWithGoogleRedirect();
  }

  loginWithFacebook() {
    this.authModalService.closeModal();
    this.authService.loginWithFacebookRedirect();
  }
}
