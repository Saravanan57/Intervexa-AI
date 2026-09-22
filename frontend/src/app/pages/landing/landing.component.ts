import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="relative w-full overflow-hidden bg-slate-50/50 min-h-screen">
      <!-- HERO SECTION -->
      <section class="relative min-h-[85vh] flex flex-col justify-center items-center px-6 text-center pt-16 pb-20 max-w-7xl mx-auto">
        <!-- Abstract Soft Background Glows -->
        <div class="absolute w-[600px] h-[600px] bg-gradient-to-tr from-[#0145F2]/10 to-[#06B6D4]/10 blur-[140px] rounded-full top-[2%] left-[15%] -z-10 animate-float pointer-events-none"></div>
        <div class="absolute w-[500px] h-[500px] bg-gradient-to-br from-[#7C3AED]/10 to-[#0145F2]/10 blur-[140px] rounded-full bottom-[5%] right-[15%] -z-10 animate-float-delayed pointer-events-none"></div>

        <!-- Main Title & Subtitle -->
        <div class="max-w-4xl space-y-6 z-10 animate-fade-in">
          <div class="inline-flex items-center space-x-2 bg-[#0145F2]/10 border border-[#0145F2]/20 rounded-full px-4 py-1.5 text-xs font-bold text-[#0145F2] uppercase tracking-wider shadow-sm">
            <span>✨ Powered by Next-Gen AI Models</span>
          </div>

          <h1 class="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#111827] leading-[1.1] font-sans">
            Master Every Interview <br class="hidden sm:inline" />
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-[#0145F2] via-[#2563EB] to-[#06B6D4]">
              with AI
            </span>
          </h1>

          <p class="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            AI-powered Resume Analysis and Mock Interviews to help you land your dream job.
          </p>
        </div>

        <!-- HERO CARDS (EXACTLY TWO CARDS AS REQUESTED) -->
        <div class="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 mt-14 z-10">
          
          <!-- Card 1: AI Resume Analyzer -->
          <div class="group relative bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-[#0145F2]/10 hover:border-[#0145F2]/40 transition-all duration-300 flex flex-col justify-between text-left transform hover:-translate-y-1">
            <div class="space-y-5">
              <div class="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0145F2] shadow-sm group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>

              <div class="space-y-2">
                <span class="text-[11px] font-bold text-[#0145F2] uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full">
                  ATS Resume Matcher
                </span>
                <h3 class="text-2xl font-bold text-slate-900 group-hover:text-[#0145F2] transition-colors">
                  AI Resume Analyzer
                </h3>
                <p class="text-sm text-slate-600 leading-relaxed">
                  Upload your resume and compare it with a job description using AI. Get detailed ATS scores, keyword gaps, and instant fixes.
                </p>
              </div>
            </div>

            <div class="pt-8">
              <a 
                routerLink="/resume-analyzer"
                class="inline-flex items-center justify-center w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0145F2] to-[#1E5BFA] text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:opacity-95 active:scale-[0.99] transition-all group-hover:shadow-blue-500/40"
              >
                <span>Start Resume Analysis</span>
                <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Card 2: AI Mock Interview -->
          <div class="group relative bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-[#0145F2]/10 hover:border-[#0145F2]/40 transition-all duration-300 flex flex-col justify-between text-left transform hover:-translate-y-1">
            <div class="space-y-5">
              <div class="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              </div>

              <div class="space-y-2">
                <span class="text-[11px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-full">
                  Real-Time AI Proctor
                </span>
                <h3 class="text-2xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  AI Mock Interview
                </h3>
                <p class="text-sm text-slate-600 leading-relaxed">
                  Practice AI-powered interviews with voice and real-time feedback. Tailor questions to your role, difficulty, and experience level.
                </p>
              </div>
            </div>

            <div class="pt-8">
              <a 
                routerLink="/mock-interview"
                class="inline-flex items-center justify-center w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-[#0145F2] hover:to-[#1E5BFA] text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:shadow-blue-500/30 active:scale-[0.99] transition-all"
              >
                <span>Start Mock Interview</span>
                <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </a>
            </div>
          </div>

        </div>
      </section>

      <!-- SAAS FEATURES OVERVIEW -->
      <section class="py-20 px-6 max-w-7xl mx-auto border-t border-slate-200/80">
        <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 class="text-3xl font-extrabold text-slate-900">Why Candidates Choose Intervexa AI</h2>
          <p class="text-sm text-slate-600">Built to simulate real hiring manager evaluations and job ATS algorithms.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div class="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#0145F2] flex items-center justify-center font-bold">1</div>
            <h4 class="text-base font-bold text-slate-900">Instant Resume Match</h4>
            <p class="text-xs text-slate-600 leading-relaxed">Paste any job description to instantly uncover missing skills, ATS keyword gaps, and structural recommendations.</p>
          </div>

          <div class="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">2</div>
            <h4 class="text-base font-bold text-slate-900">Interactive Voice Mocks</h4>
            <p class="text-xs text-slate-600 leading-relaxed">Answer questions out loud with speech recognition. Get immediate feedback on answer clarity, technical depth, and structure.</p>
          </div>

          <div class="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">3</div>
            <h4 class="text-base font-bold text-slate-900">Comprehensive Scorecards</h4>
            <p class="text-xs text-slate-600 leading-relaxed">Receive section-by-section analysis and export detailed PDF performance reports to track your interview readiness.</p>
          </div>
        </div>
      </section>

    </div>
  `
})
export class LandingPageComponent {}
