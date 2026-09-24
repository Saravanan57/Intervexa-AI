import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div class="max-w-md w-full bg-white border border-[#D9E2F1] rounded-3xl shadow-xl p-8 text-center animate-fade-in">
        <div class="inline-flex items-center space-x-2 bg-primary/5 px-3 py-1 rounded-full text-primary text-xs font-bold uppercase tracking-wider mb-4">
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>Intervexa AI Security</span>
        </div>
        
        <div class="my-6 flex justify-center">
          <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>

        <h3 class="text-xl font-bold text-[#111827]">Completing Secure Sign-in</h3>
        <p class="text-xs text-muted mt-2">Please wait while we verify your session and prepare your dashboard...</p>
      </div>
    </div>
  `
})
export class CallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const error = params['error'];
      const code = params['code'];
      const token = params['token'];
      const refreshToken = params['refreshToken'];

      if (error) {
        this.router.navigate(['/auth/login'], { queryParams: { error } });
        return;
      }

      if (code) {
        this.authService.exchangeAuthCode(code).subscribe({
          next: () => {
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Authentication session verification failed. Please try signing in again.';
            this.router.navigate(['/auth/login'], {
              queryParams: { error: errorMsg }
            });
          }
        });
        return;
      }

      if (token && refreshToken) {
        // Fallback for legacy direct token redirects
        this.authService.handleSocialTokens(token, refreshToken).subscribe({
          next: () => {
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.router.navigate(['/auth/login'], {
              queryParams: { error: 'Session verification failed. Please try signing in again.' }
            });
          }
        });
      } else {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
