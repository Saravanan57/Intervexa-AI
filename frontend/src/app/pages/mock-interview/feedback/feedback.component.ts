import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InterviewService } from '../../../core/services/interview.service';

@Component({
  selector: 'app-feedback-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-8 relative animate-fade-in text-left overflow-x-hidden">
      @if (isLoading()) {
        <div class="glass p-12 text-center space-y-4 shadow-sm">
          <span class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin inline-block"></span>
          <p class="text-xs text-muted">Analyzing responses and preparing report...</p>
        </div>
      } @else if (interview()) {
        <!-- Header banner -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-[#D9E2F1] p-5 sm:p-8 rounded-2xl sm:rounded-3xl relative shadow-sm">
          <div class="space-y-2 z-10 text-left">
            <span class="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">Session Complete</span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-[#111827] break-words">Interview Scorecard</h2>
            <p class="text-xs text-muted">Complete breakdown of performance and AI coaching reviews.</p>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 w-full md:w-auto shrink-0">
            <button 
              (click)="downloadReport()" 
              class="text-xs font-bold py-3 px-6 rounded-full border border-[#D9E2F1] bg-white hover:bg-[#0145F2]/5 text-[#111827] transition-all shadow-sm text-center w-full sm:w-auto"
            >
              📥 Download Report
            </button>
            <a 
              routerLink="/dashboard" 
              class="text-xs font-bold py-3 px-6 rounded-full bg-gradient-primary hover:opacity-95 text-white transition-all shadow-md shadow-primary/15 text-center w-full sm:w-auto"
            >
              Back to Dashboard
            </a>
          </div>
        </div>

        <!-- Scores & Strengths columns -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main overall gauge -->
          <div class="lg:col-span-1 glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center space-y-6 text-center shadow-sm">
            <span class="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Overall Score</span>
            
            <!-- Circular Gauge SVG -->
            <div class="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#EDF1F5" stroke-width="8" fill="transparent"/>
                <circle cx="50" cy="50" r="42" stroke="#0145F2" stroke-width="8" fill="transparent"
                  [attr.stroke-dasharray]="263.8"
                  [attr.stroke-dashoffset]="263.8 - (263.8 * (interview()?.score || 0)) / 100"
                  stroke-linecap="round"
                  class="transition-all duration-1000 ease-out"
                />
              </svg>
              <div class="absolute flex flex-col items-center justify-center">
                <span class="text-4xl font-black text-[#111827]">{{ interview()?.score }}%</span>
                <span class="text-[9px] font-bold text-muted uppercase tracking-wider">Rating</span>
              </div>
            </div>

            <!-- Key metrics progress bars -->
            <div class="w-full space-y-4 pt-4 text-left">
              <div class="space-y-1.5">
                <div class="flex justify-between text-[10px] font-bold uppercase text-[#4B5563]">
                  <span>Technical Skills</span>
                  <span class="text-[#111827]">{{ report()?.keyMetrics?.technicalScore }}%</span>
                </div>
                <div class="w-full h-2 bg-[#EDF1F5] rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-primary to-[#06B6D4]" [style.width.%]="report()?.keyMetrics?.technicalScore"></div>
                </div>
              </div>
              <div class="space-y-1.5">
                <div class="flex justify-between text-[10px] font-bold uppercase text-[#4B5563]">
                  <span>Communication</span>
                  <span class="text-[#111827]">{{ report()?.keyMetrics?.communicationScore }}%</span>
                </div>
                <div class="w-full h-2 bg-[#EDF1F5] rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-primary to-[#06B6D4]" [style.width.%]="report()?.keyMetrics?.communicationScore"></div>
                </div>
              </div>
              @if (interview()?.type === 'Coding') {
                <div class="space-y-1.5">
                  <div class="flex justify-between text-[10px] font-bold uppercase text-[#4B5563]">
                    <span>Problem Solving</span>
                    <span class="text-[#111827]">{{ report()?.keyMetrics?.codingScore }}%</span>
                  </div>
                  <div class="w-full h-2 bg-[#EDF1F5] rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-primary to-[#06B6D4]" [style.width.%]="report()?.keyMetrics?.codingScore"></div>
                  </div>
                </div>
              }
              <div class="space-y-1.5">
                <div class="flex justify-between text-[10px] font-bold uppercase text-[#4B5563]">
                  <span>Behavioral Logic</span>
                  <span class="text-[#111827]">{{ report()?.keyMetrics?.behavioralScore }}%</span>
                </div>
                <div class="w-full h-2 bg-[#EDF1F5] rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-primary to-[#06B6D4]" [style.width.%]="report()?.keyMetrics?.behavioralScore"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bullet Points Summary -->
          <div class="lg:col-span-2 glass p-8 rounded-3xl space-y-6 shadow-sm">
            <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">AI Executive Assessment</h3>
            <p class="text-xs text-[#4B5563] leading-relaxed">{{ report()?.detailedSummary }}</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#D9E2F1]">
              <!-- Positives -->
              <div class="space-y-3">
                <h4 class="text-xs font-bold text-success uppercase tracking-wider flex items-center space-x-2">
                  <span>✔ Key Strengths</span>
                </h4>
                <ul class="space-y-2 text-xs text-[#4B5563]">
                  @for (pos of feedback()?.positivePoints; track pos) {
                    <li class="flex items-start space-x-2">
                      <span class="text-success select-none mr-1">•</span>
                      <span>{{ pos }}</span>
                    </li>
                  }
                </ul>
              </div>

              <!-- Improvement suggestions -->
              <div class="space-y-3">
                <h4 class="text-xs font-bold text-warning uppercase tracking-wider flex items-center space-x-2">
                  <span>⚡ Development Plan</span>
                </h4>
                <ul class="space-y-2 text-xs text-[#4B5563]">
                  @for (tip of feedback()?.improvementTips; track tip) {
                    <li class="flex items-start space-x-2">
                      <span class="text-warning select-none mr-1">•</span>
                      <span>{{ tip }}</span>
                    </li>
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Question breakdown list -->
        <div class="space-y-4 text-left">
          <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Question by Question Review</h3>
          
          <div class="space-y-4">
            @for (ans of interview()?.answers; track ans._id; let i = $index) {
              <div class="glass p-6 rounded-2xl space-y-4 border-l-4 border-primary shadow-sm text-left">
                <div class="flex justify-between items-start gap-4">
                  <div class="space-y-1">
                    <span class="text-[9px] font-bold text-primary uppercase">Question {{ i + 1 }}</span>
                    <h4 class="text-sm font-bold text-[#111827] leading-relaxed">{{ ans.questionText }}</h4>
                  </div>
                  <span class="text-xs font-extrabold text-primary shrink-0 bg-primary/10 px-2.5 py-1 rounded-full">{{ ans.feedbackScore }}%</span>
                </div>

                <!-- Answer submitted -->
                <div class="bg-[#EDF1F5]/40 border border-[#D9E2F1] p-4 rounded-xl space-y-1.5 shadow-inner">
                  <span class="text-[9px] text-muted uppercase font-bold">Your Response:</span>
                  <p class="text-xs text-[#4B5563] leading-relaxed italic">
                    {{ ans.responseText || ans.codeSubmitted || '(Empty or Code Solution Submitted)' }}
                  </p>
                </div>

                <!-- AI Critique -->
                <div class="space-y-1.5 pt-1">
                  <span class="text-[9px] text-success uppercase font-bold flex items-center"><span class="w-1.5 h-1.5 rounded-full bg-success mr-1.5"></span>AI Critique & Suggested Approach:</span>
                  <p class="text-xs text-[#4B5563] leading-relaxed">
                    {{ ans.feedbackContent }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class FeedbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private interviewService = inject(InterviewService);

  interviewId = '';
  interview = signal<any | null>(null);
  feedback = signal<any | null>(null);
  report = signal<any | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.interviewId = params['id'];
      if (this.interviewId) {
        this.loadFeedbackDetails();
      }
    });
  }

  loadFeedbackDetails() {
    this.isLoading.set(true);
    this.interviewService.getInterviewDetails(this.interviewId).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.interview.set(res.interview);
          this.feedback.set(res.feedback);
          this.report.set(res.report);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        alert(err.message || 'Failed to retrieve report.');
      }
    });
  }

  downloadReport() {
    const url = this.interviewService.getReportDownloadUrl(this.interviewId);
    window.open(url, '_blank');
  }
}
