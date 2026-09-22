import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hr-prep',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-12 px-6 md:px-12 transition-colors duration-200">
      <div class="max-w-5xl mx-auto space-y-10">
        
        <!-- Header -->
        <div class="space-y-4">
          <span class="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Behavioral & Culture Fit
          </span>
          <h1 class="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            HR Prep & STAR Frameworks
          </h1>
          <p class="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-3xl leading-relaxed">
            Ace behavioral interviews with structured storytelling techniques, conflict resolution strategies, and executive communication templates.
          </p>
        </div>

        <!-- STAR Framework Breakdown -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700/80 shadow-md space-y-6">
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">The STAR Method Blueprint</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40 space-y-2">
              <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">S</span>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white">Situation</h4>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Set the context. Briefly describe the project background, timeline, and challenge.
              </p>
            </div>

            <div class="bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40 space-y-2">
              <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">T</span>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white">Task</h4>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Explain your specific responsibility and what metric or goal you needed to achieve.
              </p>
            </div>

            <div class="bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40 space-y-2">
              <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">A</span>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white">Action</h4>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Detail the concrete steps you personally took. Emphasize decision making and leadership.
              </p>
            </div>

            <div class="bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40 space-y-2">
              <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">R</span>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white">Result</h4>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Share quantifiable outcomes (e.g. 40% latency reduction, $50k cost savings, on-time launch).
              </p>
            </div>

          </div>
        </div>

        <!-- Common Behavioral Prompts -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Top Behavioral Questions to Practice</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <h3 class="font-semibold text-sm text-purple-600 dark:text-purple-400">Conflict Management</h3>
              <p class="text-sm font-medium text-slate-900 dark:text-white">"Tell me about a time you disagreed with a senior engineer or product manager on architectural direction."</p>
            </div>

            <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <h3 class="font-semibold text-sm text-purple-600 dark:text-purple-400">Handling Failure</h3>
              <p class="text-sm font-medium text-slate-900 dark:text-white">"Describe a critical production outage or missed milestone you were responsible for, and how you remediated it."</p>
            </div>

          </div>
        </div>

        <!-- CTA Box -->
        <div class="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white text-center space-y-4 shadow-xl">
          <h2 class="text-2xl font-bold">Practice HR Voice Interviews with AI</h2>
          <p class="text-emerald-100 text-sm max-w-xl mx-auto">
            Get instant feedback on your voice tone, response structure, and confidence score.
          </p>
          <div class="pt-2">
            <a 
              routerLink="/mock-interview"
              class="inline-block bg-white text-emerald-700 font-semibold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors shadow-md text-sm">
              Practice HR Behavioral Interview →
            </a>
          </div>
        </div>

      </div>
    </div>
  `
})
export class HrPrepComponent {}
