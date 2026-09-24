import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-data-deletion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-12 px-6 md:px-12 transition-colors duration-200">
      <div class="max-w-4xl mx-auto space-y-8 bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-md">
        
        <!-- Header -->
        <div class="border-b border-slate-200 dark:border-slate-700 pb-6 space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              User Privacy & Compliance
            </span>
            <span class="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium px-2 py-0.5 rounded-full">
              Meta Platform Compliant
            </span>
          </div>
          <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Data Deletion Instructions
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Effective Date: January 1, 2026 | Last Updated: September 2026 | In accordance with Meta Platform Policy & GDPR/CCPA Guidelines
          </p>
        </div>

        <!-- Deletion Request Tracking Card (If query parameter 'code' is present) -->
        <div *ngIf="confirmationCode()" class="bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 rounded-2xl p-6 space-y-3">
          <div class="flex items-center gap-3">
            <span class="w-3 h-3 rounded-full bg-purple-600 animate-pulse"></span>
            <h3 class="font-bold text-purple-900 dark:text-purple-200 text-base">
              Deletion Request Received
            </h3>
          </div>
          <p class="text-xs text-purple-700 dark:text-purple-300">
            A user data deletion request has been registered with confirmation tracking code:
          </p>
          <div class="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 font-mono text-sm font-bold text-purple-900 dark:text-purple-100 break-all select-all">
            {{ confirmationCode() }}
          </div>
          <p class="text-xs text-purple-600 dark:text-purple-400">
            Status: <span class="font-semibold text-emerald-600 dark:text-emerald-400">Request Confirmed & Queued for Processing</span>. Keep this confirmation code for your records.
          </p>
        </div>

        <!-- Main Content Sections -->
        <div class="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          
          <!-- 1. Introduction -->
          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              1. Your Right to Data Deletion
            </h2>
            <p>
              At Intervexa AI, we respect your fundamental right to control your personal data and privacy. In compliance with global data privacy frameworks (including GDPR, CCPA) and Meta Platform Terms, candidates can request the complete and permanent erasure of their Intervexa AI account and all associated personal information at any time.
            </p>
          </section>

          <!-- 2. Facebook / Meta Login Data -->
          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              2. Facebook & Meta Login Data
            </h2>
            <p>
              When you authenticate with Intervexa AI using Facebook OAuth, our system receives only basic profile details authorized by you: your public display name, verified email address, profile picture URL, and unique Facebook User ID (<code class="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">facebookId</code>).
            </p>
            <p>
              You have the right to request deletion of all data associated with your Facebook login. Deleting your Facebook connection removes the account link and initiates complete purging of your candidate profile.
            </p>
          </section>

          <!-- 3. How to Submit a Deletion Request -->
          <section class="space-y-4">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              3. How to Submit a Data Deletion Request
            </h2>
            <p>
              You can initiate data deletion through any of the following methods:
            </p>

            <!-- Method A: Via Facebook Settings -->
            <div class="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">A</span>
                Automated Removal via Facebook / Meta Settings
              </h3>
              <ol class="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pl-2">
                <li>Log in to your Facebook account on web or mobile.</li>
                <li>Go to <strong>Settings &amp; Privacy</strong> &gt; <strong>Settings</strong>.</li>
                <li>In the left menu, select <strong>Apps and Websites</strong>.</li>
                <li>Find <strong>Intervexa AI</strong> in your list of connected applications.</li>
                <li>Click <strong>Remove</strong>.</li>
                <li>Check the box requesting that Intervexa AI delete your user data, then confirm.</li>
                <li>Meta will automatically trigger our secure server callback endpoint (<code class="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/api/auth/facebook/data-deletion</code>), which verifies the cryptographic signature and issues your confirmation code.</li>
              </ol>
            </div>

            <!-- Method B: Via Email -->
            <div class="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">B</span>
                Direct Email Request to Privacy Office
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-400">
                You can email our Data Protection Office directly at 
                <a href="mailto:mamthasaravanan7@gmail.com" class="text-purple-600 dark:text-purple-400 font-semibold underline">mamthasaravanan7@gmail.com</a> 
                with:
              </p>
              <ul class="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-400 pl-2">
                <li>Subject line: <span class="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Data Deletion Request - Intervexa AI</span></li>
                <li>Your full name and the email address associated with your Intervexa AI account.</li>
                <li>Your Facebook User ID (if requesting deletion of Facebook authentication data).</li>
              </ul>
            </div>

            <!-- Method C: Via Support Desk -->
            <div class="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">C</span>
                Via Intervexa AI Support Desk
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-400">
                Submit an inquiry through our dedicated 
                <a routerLink="/legal/support" class="text-purple-600 dark:text-purple-400 font-semibold underline">Support Desk</a>. 
                Select the category <strong>"Account &amp; Auth"</strong> and indicate that you are requesting complete account and data erasure.
              </p>
            </div>
          </section>

          <!-- 4. What Happens After Your Request -->
          <section class="space-y-3">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              4. What Happens After Your Request
            </h2>
            <p>
              Once a deletion request is received:
            </p>
            <ul class="list-disc list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400 pl-2">
              <li>
                <strong>Immediate Acknowledgment:</strong> Our system immediately registers your request and issues a unique alphanumeric confirmation code for audit and tracking.
              </li>
              <li>
                <strong>Access Revocation:</strong> Your active session tokens, OAuth links (Facebook, Google), and password logins are revoked.
              </li>
              <li>
                <strong>Data Purging:</strong> All associated resume files (.pdf, .docx), ATS score cards, voice interview recordings, audio chunks, and transcripts are permanently deleted from our active production database.
              </li>
              <li>
                <strong>Timeline:</strong> Complete data erasure across active systems is processed within <strong>30 days</strong> of request submission.
              </li>
              <li>
                <strong>Backups:</strong> Routine database backups are automatically overwritten and purged in accordance with our standard 30-day backup cycle.
              </li>
            </ul>
          </section>

          <!-- 5. What Data is Retained -->
          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              5. Legal & Regulatory Retention
            </h2>
            <p class="text-xs text-slate-600 dark:text-slate-400">
              In rare circumstances, anonymized security access logs (without personally identifiable information) or records required by law for fraud prevention and financial compliance may be retained for the minimum period required by statute.
            </p>
          </section>

          <!-- 6. Contact Information -->
          <section class="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-6">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              6. Contact Data Privacy Officer
            </h2>
            <p class="text-xs text-slate-600 dark:text-slate-400">
              For any questions, status inquiries, or follow-ups regarding your data deletion request:
            </p>
            <div class="mt-2 text-xs space-y-1">
              <div>
                <span class="font-semibold text-slate-800 dark:text-slate-200">Email:</span> 
                <a href="mailto:mamthasaravanan7@gmail.com" class="text-purple-600 dark:text-purple-400 underline ml-1">mamthasaravanan7@gmail.com</a>
              </div>
              <div>
                <span class="font-semibold text-slate-800 dark:text-slate-200">Support Desk:</span> 
                <a routerLink="/legal/support" class="text-purple-600 dark:text-purple-400 underline ml-1">Intervexa AI Support Portal</a>
              </div>
              <div>
                <span class="font-semibold text-slate-800 dark:text-slate-200">Privacy Policy:</span> 
                <a routerLink="/legal/privacy" class="text-purple-600 dark:text-purple-400 underline ml-1">Privacy Disclosures</a>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  `
})
export class DataDeletionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  confirmationCode = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const code = params.get('code');
      if (code) {
        this.confirmationCode.set(code.trim());
      }
    });
  }
}
