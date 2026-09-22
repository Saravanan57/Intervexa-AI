import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-12 px-6 md:px-12 transition-colors duration-200">
      <div class="max-w-4xl mx-auto space-y-8 bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-md">
        
        <div class="border-b border-slate-200 dark:border-slate-700 pb-6 space-y-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Terms & Service Agreement</span>
          <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Effective Date: January 1, 2026 | Last Updated: July 30, 2026</p>
        </div>

        <div class="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Intervexa AI platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
            </p>
          </section>

          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">2. User Account Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account. You agree to notify us immediately of any unauthorized access.
            </p>
          </section>

          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">3. Acceptable Use Policy</h2>
            <p>
              You agree not to attempt to reverse engineer, decompile, rate-limit bypass, or submit malicious prompt injections or automated scraping attacks against our AI interview or resume scoring systems.
            </p>
          </section>

          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">4. Intellectual Property</h2>
            <p>
              All software, AI evaluation feedback models, branding, logos, and UI designs are the exclusive property of Intervexa AI. Candidates retain full copyright over their uploaded original resume text.
            </p>
          </section>

          <section class="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-6">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Questions?</h2>
            <p>
              If you have any questions regarding our terms, please email <a href="mailto:mamthasaravanan7@gmail.com" class="text-purple-600 underline">mamthasaravanan7@gmail.com</a>.
            </p>
          </section>
        </div>

      </div>
    </div>
  `
})
export class TermsComponent {}
