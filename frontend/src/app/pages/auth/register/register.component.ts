import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[90vh] flex items-center justify-center py-12 px-6">
      <div class="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white border border-[#D9E2F1] rounded-3xl overflow-hidden shadow-xl p-4 md:p-8 relative animate-fade-in">
        
        <!-- Left Side: Brand Panel (Stripe-like) -->
        <div class="hidden md:flex md:col-span-5 flex-col justify-between h-full min-h-[560px] bg-gradient-to-br from-[#0145F2] to-[#1E5BFA] text-white p-8 rounded-2xl relative overflow-hidden shadow-inner isolate z-0">
          <div class="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
          <div class="absolute w-72 h-72 bg-white/10 rounded-full blur-3xl -top-10 -left-10 animate-pulse"></div>

          <div class="space-y-6 z-10 text-left">
            <span class="text-xs font-bold bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider">Intervexa AI Platform</span>
            <h3 class="text-3xl font-extrabold tracking-tight leading-tight">Elevate Your Preparation</h3>
            <p class="text-xs text-white/80 leading-relaxed font-normal">
              Access real-time voice assessments, track your ATS match index, and receive actionable grading scorecard feedback instantly.
            </p>
          </div>
          
          <div class="bg-white/5 border border-white/10 p-4.5 rounded-xl space-y-2.5 z-10 text-left backdrop-blur-md">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-success"></span>
              <span class="text-[9px] font-bold uppercase tracking-wider">AI Speech proctor ready</span>
            </div>
            <p class="text-[10px] text-white/95 leading-relaxed font-light">
              "The browser vocal transcribing is direct, and the custom keyword checks boosted my match rate from 40% to 85%."
            </p>
            <p class="text-[9px] font-semibold text-white/70">— Candidate Review</p>
          </div>
        </div>

        <!-- Right Side: Registration Form -->
        <div class="md:col-span-7 p-4 md:p-8 space-y-6 text-left">
          <div class="space-y-1.5">
            <h2 class="text-3xl font-extrabold text-[#111827] font-sans">Create Account</h2>
            <p class="text-xs text-muted">Join Intervexa AI today and jumpstart your preparation.</p>
          </div>

          @if (successMessage()) {
            <div class="bg-success/10 border border-success/20 text-success text-xs rounded-xl p-4 flex flex-col space-y-2">
              <span class="font-extrabold">🎉 Registration Successful!</span>
              <span>{{ successMessage() }}</span>
              <a routerLink="/auth/login" class="text-primary font-bold hover:underline">Proceed to Login</a>
            </div>
          }

          @if (errorMessage()) {
            <div class="bg-error/10 border border-error/20 text-error text-xs rounded-xl p-3.5 flex items-center">
              <svg class="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          @if (!successMessage()) {
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              <!-- Name & Email (Two Columns) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-[#4B5563]">Full Name</label>
                  <input 
                    type="text" 
                    formControlName="name"
                    placeholder="John Doe" 
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                  @if (registerForm.get('name')?.touched && registerForm.get('name')?.invalid) {
                    <span class="text-[10px] text-error font-semibold">Name is required.</span>
                  }
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-[#4B5563]">Email Address</label>
                  <input 
                    type="email" 
                    formControlName="email"
                    placeholder="name@company.com" 
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                  @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
                    <span class="text-[10px] text-error font-semibold">Please enter a valid email.</span>
                  }
                </div>
              </div>

              <!-- Password & Phone (Two Columns) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-[#4B5563]">Password</label>
                  <input 
                    type="password" 
                    formControlName="password"
                    placeholder="••••••••" 
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                  @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
                    <span class="text-[10px] text-error font-semibold">Password must be at least 6 characters.</span>
                  }
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-[#4B5563]">Phone Number (Optional)</label>
                  <input 
                    type="text" 
                    formControlName="phone"
                    placeholder="+1 (555) 000-0000" 
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>
              </div>

              <!-- College & Experience -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-[#4B5563]">College / Institution</label>
                  <input 
                    type="text" 
                    formControlName="college"
                    placeholder="Stanford University" 
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-[#4B5563]">Years of Experience</label>
                  <input 
                    type="number" 
                    formControlName="experience"
                    min="0"
                    class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>
              </div>

              <!-- Skills -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-[#4B5563]">Core Skills (Comma separated)</label>
                <input 
                  type="text" 
                  formControlName="rawSkills"
                  placeholder="Angular, Node.js, TypeScript, Docker" 
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                />
              </div>

              <!-- Submit Button -->
              <button 
                type="submit" 
                [disabled]="registerForm.invalid || isLoading()"
                class="w-full py-3.5 rounded-xl bg-gradient-primary text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center space-x-2 text-white"
              >
                @if (isLoading()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Creating Account...</span>
                } @else {
                  <span>Sign Up</span>
                }
              </button>
            </form>
          }

          <div class="text-center text-xs text-muted pt-2 border-t border-[#D9E2F1]/50">
            <span>Already have an account? </span>
            <a routerLink="/auth/login" class="font-extrabold text-primary hover:underline">Sign In</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      college: [''],
      experience: [0, [Validators.required, Validators.min(0)]],
      rawSkills: ['']
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Convert rawSkills string to array of clean strings
    const rawSkillsVal = this.registerForm.value.rawSkills || '';
    const skills = rawSkillsVal
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const payload = {
      ...this.registerForm.value,
      skills
    };
    delete payload.rawSkills;

    this.authService.register(payload).subscribe({
      next: (res) => {
        // Auto-login after registration
        this.authService.login({
          email: this.registerForm.value.email,
          password: this.registerForm.value.password
        }).subscribe({
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
          error: () => {
            this.isLoading.set(false);
            this.router.navigate(['/auth/login']);
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Registration failed. Please try again.');
      }
    });
  }
}
