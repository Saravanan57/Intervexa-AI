import { Component, inject, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ResumeService } from '../../core/services/resume.service';
import { InterviewService } from '../../core/services/interview.service';
import { NotificationService } from '../../core/services/notification.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-8 relative animate-fade-in text-left">
      <!-- Glow decoration -->
      <div class="absolute w-[300px] h-[300px] bg-primary/5 blur-[90px] rounded-full top-[10%] left-[20%] pointer-events-none -z-10"></div>

      <!-- Welcome Card Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-[#D9E2F1] p-8 rounded-3xl relative overflow-hidden shadow-sm">
        <div class="space-y-2 z-10 text-left">
          <span class="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">Candidate Workspace</span>
          <h2 class="text-3xl font-extrabold text-[#111827]">Welcome back, {{ authService.currentUser()?.name }}!</h2>
          <p class="text-xs text-muted">Ready to practice? Analyze your resume and review active AI recommendations.</p>
        </div>
        <div class="flex items-center space-x-3 z-10 shrink-0">
          <a 
            routerLink="/resume-analyzer" 
            class="text-xs font-bold py-3 px-6 rounded-full border border-[#D9E2F1] bg-white hover:bg-[#0145F2]/5 text-[#111827] transition-all shadow-sm"
          >
            Upload Resume
          </a>
          <a 
            routerLink="/mock-interview" 
            class="text-xs font-bold py-3 px-6 rounded-full bg-gradient-primary hover:opacity-95 text-white transition-all shadow-md shadow-primary/15"
          >
            Start Mock Interview
          </a>
        </div>
      </div>

      <!-- Core Summary Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <!-- Profile Completion -->
        <div class="glass p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div class="flex justify-between items-start">
            <span class="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Profile Setup</span>
            <span class="text-[10px] font-bold text-[#0145F2] bg-[#0145F2]/5 px-2.5 py-0.5 rounded-full">ACTIVE</span>
          </div>
          <div class="space-y-2">
            <span class="text-4xl font-extrabold text-[#111827]">{{ profileCompletionRate() }}%</span>
            <div class="w-full h-2 bg-[#EDF1F5] rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-primary to-[#06B6D4] transition-all duration-500" [style.width.%]="profileCompletionRate()"></div>
            </div>
          </div>
          <span class="text-[10px] text-muted leading-tight">Fill education & projects to unlock full visibility.</span>
        </div>

        <!-- Resume Match Score -->
        <div class="glass p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div class="flex justify-between items-start">
            <span class="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Resume ATS Rating</span>
            <span class="text-[10px] font-bold text-success bg-[#22C55E]/5 px-2.5 py-0.5 rounded-full">LATEST</span>
          </div>
          <div class="space-y-1">
            <span class="text-4xl font-extrabold text-gradient-primary">{{ latestResumeScore() }}%</span>
          </div>
          <span class="text-[10px] text-muted leading-tight">Derived from your latest uploaded PDF/Word resume.</span>
        </div>

        <!-- Total completed mocks -->
        <div class="glass p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div class="flex justify-between items-start">
            <span class="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Mock Sessions</span>
            <span class="text-[10px] font-bold text-primary bg-[#0145F2]/5 px-2.5 py-0.5 rounded-full">HISTORY</span>
          </div>
          <div class="space-y-1">
            <span class="text-4xl font-extrabold text-[#111827]">{{ completedCount() }} / {{ totalCount() }}</span>
            <p class="text-[9px] text-muted">Completed vs Scheduled interviews</p>
          </div>
          <span class="text-[10px] text-muted leading-tight">Practice makes perfect. Target 10+ sessions.</span>
        </div>

        <!-- Rank Category -->
        <div class="glass p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div class="flex justify-between items-start">
            <span class="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Candidate Rank</span>
            <span class="text-[10px] font-bold text-warning bg-[#F59E0B]/5 px-2.5 py-0.5 rounded-full">TIER</span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-xl shadow-sm">🏆</div>
            <div class="text-left">
              <p class="text-sm font-extrabold text-[#111827]">{{ currentRank() }}</p>
              <p class="text-[9px] text-muted">Avg mock score: <span class="text-primary font-bold">{{ avgMockScore() }}%</span></p>
            </div>
          </div>
          <span class="text-[10px] text-muted leading-tight">Mock grades translate directly to ranking levels.</span>
        </div>

      </div>

      <!-- Quick Action Cards Grid -->
      <div class="space-y-4">
        <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Quick Actions</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a routerLink="/mock-interview" class="glass p-5 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 hover:scale-[1.02] active:scale-[0.98] transition-all glass-hover shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            </div>
            <span class="text-xs font-bold text-[#111827]">Start Mock</span>
          </a>
          <a routerLink="/resume-analyzer" class="glass p-5 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 hover:scale-[1.02] active:scale-[0.98] transition-all glass-hover shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            </div>
            <span class="text-xs font-bold text-[#111827]">Upload Resume</span>
          </a>
          <a routerLink="/resume-analyzer" class="glass p-5 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 hover:scale-[1.02] active:scale-[0.98] transition-all glass-hover shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"/></svg>
            </div>
            <span class="text-xs font-bold text-[#111827]">ATS Analysis</span>
          </a>
          <a routerLink="/dashboard" class="glass p-5 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 hover:scale-[1.02] active:scale-[0.98] transition-all glass-hover shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <span class="text-xs font-bold text-[#111827]">Mock History</span>
          </a>
          <a routerLink="/profile" class="glass p-5 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 hover:scale-[1.02] active:scale-[0.98] transition-all glass-hover shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </div>
            <span class="text-xs font-bold text-[#111827]">Edit Profile</span>
          </a>
          <a routerLink="/settings" class="glass p-5 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 hover:scale-[1.02] active:scale-[0.98] transition-all glass-hover shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <span class="text-xs font-bold text-[#111827]">Settings</span>
          </a>
          <a (click)="triggerAlerts()" class="glass p-5 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 hover:scale-[1.02] active:scale-[0.98] transition-all glass-hover shadow-sm cursor-pointer">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </div>
            <span class="text-xs font-bold text-[#111827]">Notifications</span>
          </a>
          <a routerLink="/resume-analyzer" class="glass p-5 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 hover:scale-[1.02] active:scale-[0.98] transition-all glass-hover shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <span class="text-xs font-bold text-[#111827]">Career Roadmap</span>
          </a>
        </div>
      </div>

      <!-- Main Column Content (Score Chart + Feedback/Upcomings) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Weekly Progress Trend -->
        <div class="lg:col-span-2 glass p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Weekly Progress Trend</h3>
          <div class="relative w-full h-[250px] bg-background/30 border border-[#D9E2F1] rounded-xl p-4 flex items-center justify-center">
            @if (hasHistoryData()) {
              <canvas #scoreChart></canvas>
            } @else {
              <div class="text-center text-xs text-muted">
                <p class="font-semibold">No score logs detected.</p>
                <p class="mt-1 text-[10px]">Complete your first mock session to review progress trend charts.</p>
              </div>
            }
          </div>
        </div>

        <!-- Latest AI Feedback & Schedule Alerts -->
        <div class="space-y-6">
          
          <!-- Latest AI Feedback box -->
          <div class="glass p-6 rounded-2xl space-y-3 shadow-sm text-left">
            <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Latest AI Critique</h3>
            @if (latestFeedbackText()) {
              <div class="bg-primary/5 border border-primary/10 rounded-xl p-4.5">
                <p class="text-xs text-[#4B5563] leading-relaxed italic">
                  "{{ latestFeedbackText() }}"
                </p>
              </div>
            } @else {
              <p class="text-xs text-muted italic">Complete a mock session to load your latest AI critique.</p>
            }
          </div>

          <!-- Upcoming prep schedule alert -->
          <div class="glass p-6 rounded-2xl space-y-3 border-l-4 border-primary shadow-sm text-left">
            <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Prep Schedule Alerts</h3>
            <div class="space-y-2">
              <div class="bg-[#EDF1F5]/50 border border-[#D9E2F1] p-3.5 rounded-xl flex justify-between items-center text-xs">
                <div class="space-y-0.5">
                  <p class="font-bold text-[#111827]">System Design Mock</p>
                  <p class="text-[10px] text-muted">Configure and start practicing</p>
                </div>
                <a routerLink="/mock-interview" class="text-primary hover:underline font-bold text-[10px] tracking-wider uppercase">START</a>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- Achievements Shelf -->
      <div class="glass p-8 rounded-3xl space-y-6 shadow-sm">
        <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider text-left">Unlocked Achievements & Badges</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          @for (badge of authService.currentUser()?.achievements; track badge.badgeName) {
            <div class="bg-white border border-[#D9E2F1] p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:scale-105 transition-transform shadow-sm">
              <div class="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-3xl shadow-inner">
                {{ badge.badgeIcon }}
              </div>
              <p class="text-[11px] font-bold text-[#111827] leading-tight truncate max-w-[120px]">{{ badge.badgeName }}</p>
              <p class="text-[9px] text-muted leading-tight">{{ badge.description }}</p>
            </div>
          } @empty {
            <div class="col-span-full py-6 text-center text-xs text-muted">
              <span>No badges unlocked yet. Analyze your resume or finish mock sessions to earn rewards!</span>
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private resumeService = inject(ResumeService);
  private interviewService = inject(InterviewService);
  private notificationService = inject(NotificationService);

  @ViewChild('scoreChart') scoreChartCanvas!: ElementRef<HTMLCanvasElement>;

  latestResumeScore = signal<number>(0);
  avgMockScore = signal<number>(0);
  completedCount = signal<number>(0);
  totalCount = signal<number>(0);
  hasHistoryData = signal<boolean>(false);
  
  profileCompletionRate = signal<number>(0);
  currentRank = signal<string>('Bronze');
  latestFeedbackText = signal<string>('');

  ngOnInit() {
    this.loadResumeStats();
    this.loadInterviewStats();
    this.calculateProfileCompletion();
  }

  loadResumeStats() {
    this.resumeService.getHistory().subscribe({
      next: (res) => {
        if (res.success && res.resumes.length > 0) {
          const latest = res.resumes[0];
          this.latestResumeScore.set(latest.score || 0);
        }
      }
    });
  }

  loadInterviewStats() {
    this.interviewService.getHistory().subscribe({
      next: (res) => {
        if (res.success && res.sessions.length > 0) {
          this.totalCount.set(res.sessions.length);
          const completed = res.sessions.filter((s: any) => s.status === 'completed');
          this.completedCount.set(completed.length);
          
          if (completed.length > 0) {
            const sum = completed.reduce((acc: number, curr: any) => acc + curr.score, 0);
            const avg = Math.round(sum / completed.length);
            this.avgMockScore.set(avg);
            this.hasHistoryData.set(true);

            // Compute Rank Badge
            if (avg >= 90) this.currentRank.set('Diamond Spec');
            else if (avg >= 75) this.currentRank.set('Gold Specialist');
            else if (avg >= 50) this.currentRank.set('Silver Candidate');
            else this.currentRank.set('Bronze Prep');

            // Load latest feedback text block
            const latestSession = completed[0];
            this.interviewService.getInterviewDetails(latestSession._id).subscribe({
              next: (dRes) => {
                if (dRes.success && dRes.feedback) {
                  const tips = dRes.feedback.improvementTips || [];
                  this.latestFeedbackText.set(tips[0] || 'Keep practicing coding and domain challenges.');
                }
              }
            });
            
            setTimeout(() => this.buildChart(completed), 50);
          }
        }
      }
    });
  }

  calculateProfileCompletion() {
    const user = this.authService.currentUser();
    if (!user) return;

    let points = 0;
    let max = 6;

    if (user.name) points++;
    if (user.phone) points++;
    if (user.college) points++;
    if (user.skills && user.skills.length > 0) points++;
    if (user.education && user.education.length > 0) points++;
    if (user.projects && user.projects.length > 0) points++;

    const percent = Math.round((points / max) * 100);
    this.profileCompletionRate.set(percent);
  }

  triggerAlerts() {
    // Custom drawer trigger toggle simulation helper
    alert(`Checking notification inbox: You have ${this.notificationService.unreadCount()} unread alerts.`);
  }

  buildChart(sessions: any[]) {
    if (!this.scoreChartCanvas) return;
    
    const sorted = [...sessions].reverse();
    const labels = sorted.map(s => new Date(s.createdDate).toLocaleDateString());
    const dataPoints = sorted.map(s => s.score);

    new Chart(this.scoreChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Mock Interview Performance',
          data: dataPoints,
          borderColor: '#0145F2',
          backgroundColor: 'rgba(1, 69, 242, 0.06)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#0145F2',
          pointBorderColor: '#FFFFFF',
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(0, 0, 0, 0.04)' },
            ticks: { color: '#6B7280' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#6B7280' }
          }
        }
      }
    });
  }
}
