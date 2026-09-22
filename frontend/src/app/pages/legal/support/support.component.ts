import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-12 px-6 md:px-12 transition-colors duration-200">
      <div class="max-w-5xl mx-auto space-y-10">
        
        <!-- Header -->
        <div class="text-center space-y-4">
          <span class="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            24/7 Candidate Support
          </span>
          <h1 class="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Intervexa AI Support Desk
          </h1>
          <p class="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Need help with resume parsing, voice mock interviews, or account settings? Submit a request below or check real-time system status.
          </p>
        </div>

        <!-- System Status Indicator -->
        <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div class="flex items-center space-x-3">
            <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-bold text-emerald-800 dark:text-emerald-300">All Systems Operational</span>
            <span class="text-slate-500 dark:text-slate-400 hidden md:inline">| ATS Analyzer, Mock Interview Audio Stream, Database Services</span>
          </div>
          <span class="text-slate-500 dark:text-slate-400">Response Time: &lt; 15 mins</span>
        </div>

        <!-- Main Form & Info Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Contact Form -->
          <div class="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-md space-y-6">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">Submit a Support Ticket</h2>
            
            <div *ngIf="isSubmitted()" class="bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 p-4 rounded-xl text-purple-700 dark:text-purple-300 text-sm font-medium">
              ✓ Ticket submitted successfully! Support Ticket #{{ ticketId }} has been dispatched to our engineering team.
            </div>

            <form (ngSubmit)="submitTicket()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Your Full Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="name" 
                  name="name" 
                  required
                  placeholder="John Doe"
                  class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  [(ngModel)]="email" 
                  name="email" 
                  required
                  placeholder="candidate@example.com"
                  class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Category</label>
                <select 
                  [(ngModel)]="category" 
                  name="category" 
                  class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="Resume Analyzer">Resume Analyzer & Parsing</option>
                  <option value="Mock Interview">Voice Mock Interview Audio/Speech</option>
                  <option value="Account & Auth">Account Login & Credentials</option>
                  <option value="Feature Request">Feature Request / Feedback</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Message</label>
                <textarea 
                  rows="4" 
                  [(ngModel)]="message" 
                  name="message" 
                  required
                  placeholder="Describe your issue or question in detail..."
                  class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
              </div>

              <button 
                type="submit"
                class="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md text-sm">
                Submit Support Request
              </button>
            </form>
          </div>

          <!-- Help Info Column -->
          <div class="space-y-6">
            <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <h3 class="font-bold text-base text-slate-900 dark:text-white">Direct Contacts</h3>
              
              <div class="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <span class="block font-semibold text-slate-900 dark:text-slate-200">Email Support</span>
                  <a href="mailto:mamthasaravanan7@gmail.com" class="text-purple-600 hover:underline">mamthasaravanan7@gmail.com</a>
                </div>

                <div>
                  <span class="block font-semibold text-slate-900 dark:text-slate-200">Enterprise Enquiries</span>
                  <a href="mailto:mamthasaravanan7@gmail.com" class="text-purple-600 hover:underline">mamthasaravanan7@gmail.com</a>
                </div>

                <div>
                  <span class="block font-semibold text-slate-900 dark:text-slate-200">Hours of Operation</span>
                  <span>24 / 7 Automated AI Support + Human escalation (Mon - Fri, 9am - 6pm EST)</span>
                </div>
              </div>
            </div>

            <div class="bg-purple-900 text-white p-6 rounded-3xl space-y-3">
              <h4 class="font-bold text-sm">Quick Solutions</h4>
              <p class="text-xs text-purple-200 leading-relaxed">
                Most common questions regarding voice micro-microphone permissions and ATS keyword matching are answered in our Frequently Asked Questions.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  `
})
export class SupportComponent {
  name = '';
  email = '';
  category = 'Resume Analyzer';
  message = '';
  isSubmitted = signal(false);
  ticketId = Math.floor(100000 + Math.random() * 900000);

  submitTicket() {
    if (this.name && this.email && this.message) {
      this.isSubmitted.set(true);
    }
  }
}
