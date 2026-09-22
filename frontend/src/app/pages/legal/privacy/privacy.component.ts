import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-12 px-6 md:px-12 transition-colors duration-200">
      <div class="max-w-4xl mx-auto space-y-8 bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-md">
        
        <div class="border-b border-slate-200 dark:border-slate-700 pb-6 space-y-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Legal Disclosures</span>
          <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Privacy Policy</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Effective Date: January 1, 2026 | Last Updated: July 30, 2026</p>
        </div>

        <div class="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">1. Information We Collect</h2>
            <p>
              Intervexa AI collects information you provide directly when creating an account, uploading resume files (.pdf, .docx), or participating in AI mock interview sessions. This includes your name, email address, job role preferences, uploaded resume content, and real-time audio transcripts generated during voice practice sessions.
            </p>
          </section>

          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">2. How We Use Your Data</h2>
            <p>
              We process candidate data strictly for providing ATS resume analysis scores, keyword match suggestions, and voice mock interview evaluation metrics. We use industry-standard encryption protocols and never sell or lease candidate data to third-party data brokers.
            </p>
          </section>

          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">3. Data Retention & Security</h2>
            <p>
              Uploaded resumes and voice transcripts are encrypted in transit via TLS 1.3 and stored at rest using AES-256 encryption. Candidates retain full ownership of their documents and may delete their uploaded resume files or terminate their account at any time via the User Settings dashboard.
            </p>
          </section>

          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">4. GDPR & CCPA Compliance</h2>
            <p>
              Under global privacy frameworks including GDPR and CCPA, candidates possess the right to access, export, rectify, or erase their personal data. Requests can be submitted directly through our Support Desk.
            </p>
          </section>

          <section class="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-6">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Contact Privacy Office</h2>
            <p>
              For questions regarding our privacy practices, contact us at <a href="mailto:mamthasaravanan7@gmail.com" class="text-purple-600 underline">mamthasaravanan7@gmail.com</a>.
            </p>
          </section>
        </div>

      </div>
    </div>
  `
})
export class PrivacyComponent {}
