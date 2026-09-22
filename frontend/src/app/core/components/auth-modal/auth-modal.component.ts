import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
                    placeholder="name@company.com" 
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#0145F2]"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-xs font-bold text-[#4B5563]">Password</label>
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
                    placeholder="name@company.com" 
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
}
