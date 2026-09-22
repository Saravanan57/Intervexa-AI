import { Component, inject, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8 animate-fade-in text-left">
      <!-- Glow background -->
      <div class="absolute w-[350px] h-[350px] bg-[#7C3AED]/5 blur-[120px] rounded-full top-[10%] left-[30%] pointer-events-none"></div>

      <div class="space-y-1">
        <h2 class="text-2xl font-extrabold text-white">System Overview Analytics</h2>
        <p class="text-xs text-muted font-medium">Verify overall Intervexa AI platform health status metrics and mock completions.</p>
      </div>

      @if (isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-6 animate-pulse">
          <div class="h-24 bg-white/5 rounded-2xl" *ngFor="let i of [1,2,3,4]"></div>
        </div>
      } @else if (stats()) {
        <!-- Overview Grid cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="glass p-5 rounded-2xl flex flex-col justify-between space-y-3">
            <span class="text-[10px] font-bold text-muted uppercase tracking-wider">Total Users</span>
            <div class="space-y-0.5">
              <span class="text-3xl font-extrabold text-white">{{ stats().totalUsers }}</span>
              <p class="text-[9px] text-muted">{{ stats().newUsersToday }} newly registered today</p>
            </div>
          </div>

          <div class="glass p-5 rounded-2xl flex flex-col justify-between space-y-3">
            <span class="text-[10px] font-bold text-muted uppercase tracking-wider">Active Users</span>
            <div class="space-y-0.5">
              <span class="text-3xl font-extrabold text-white">{{ stats().activeUsers }}</span>
              <p class="text-[9px] text-muted">Daily Active (DAU): {{ stats().dailyActiveUsers }}</p>
            </div>
          </div>

          <div class="glass p-5 rounded-2xl flex flex-col justify-between space-y-3">
            <span class="text-[10px] font-bold text-muted uppercase tracking-wider">Total Mock Sessions</span>
            <div class="space-y-0.5">
              <span class="text-3xl font-extrabold text-white">{{ stats().completedInterviews }} / {{ stats().totalInterviews }}</span>
              <p class="text-[9px] text-muted">Completed vs Scheduled sessions</p>
            </div>
          </div>

          <div class="glass p-5 rounded-2xl flex flex-col justify-between space-y-3">
            <span class="text-[10px] font-bold text-muted uppercase tracking-wider">Average Mock Score</span>
            <div class="space-y-0.5">
              <span class="text-3xl font-extrabold text-primary">{{ stats().averageScore }}%</span>
              <p class="text-[9px] text-muted">Average ATS match score: 78%</p>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Line Chart: Registrations -->
          <div class="glass p-6 rounded-2xl space-y-4">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">Registrations Slope</h3>
            <div class="relative h-[250px] w-full bg-background/50 rounded-xl p-4 flex items-center justify-center">
              <canvas #registrationsChart></canvas>
            </div>
          </div>

          <!-- Pie Chart: Technology popularities -->
          <div class="glass p-6 rounded-2xl space-y-4">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">Technology popularity</h3>
            <div class="relative h-[250px] w-full bg-background/50 rounded-xl p-4 flex items-center justify-center">
              <canvas #techChart></canvas>
            </div>
          </div>
        </div>

        <!-- Performers & Activity Logs -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Top Performers -->
          <div class="glass p-6 rounded-2xl space-y-4">
            <h3 class="text-xs font-bold text-success uppercase tracking-wider">Top Candidates</h3>
            <div class="space-y-3">
              @for (perf of stats().topPerformers; track perf.date) {
                <div class="bg-card p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p class="font-bold text-white">{{ perf.candidateName }}</p>
                    <p class="text-[10px] text-muted">{{ perf.domain }}</p>
                  </div>
                  <span class="text-success font-bold">{{ perf.score }}%</span>
                </div>
              } @empty {
                <p class="text-[11px] text-muted text-center py-4">No top scores logged yet.</p>
              }
            </div>
          </div>

          <!-- Low Performers -->
          <div class="glass p-6 rounded-2xl space-y-4">
            <h3 class="text-xs font-bold text-error uppercase tracking-wider">Needs Attention</h3>
            <div class="space-y-3">
              @for (perf of stats().lowPerformers; track perf.date) {
                <div class="bg-card p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p class="font-bold text-white">{{ perf.candidateName }}</p>
                    <p class="text-[10px] text-muted">{{ perf.domain }}</p>
                  </div>
                  <span class="text-error font-bold">{{ perf.score }}%</span>
                </div>
              } @empty {
                <p class="text-[11px] text-muted text-center py-4">No low scores logged.</p>
              }
            </div>
          </div>

          <!-- Audit activity log trail -->
          <div class="glass p-6 rounded-2xl space-y-4">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">Live Audit Trail</h3>
            <div class="max-h-48 overflow-y-auto space-y-2 pr-1 font-mono text-[9px] text-muted leading-relaxed">
              @for (log of logs(); track log._id) {
                <div class="border-b border-white/5 pb-2">
                  <span class="text-white font-bold">[{{ log.action }}]</span>
                  <span class="block text-[8px] mt-0.5">{{ log.details }} (IP: {{ log.ipAddress }})</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  @ViewChild('registrationsChart') registrationsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('techChart') techCanvas!: ElementRef<HTMLCanvasElement>;

  stats = signal<any | null>(null);
  logs = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.adminService.getStats().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.stats.set(res.stats);
          this.logs.set(res.recentLogs);
          setTimeout(() => this.buildCharts(), 50);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  buildCharts() {
    const s = this.stats();
    if (!s) return;

    // 1. Line Chart: Monthly Registrations
    if (this.registrationsCanvas) {
      new Chart(this.registrationsCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: s.registrationChart.labels,
          datasets: [{
            label: 'Registrations',
            data: s.registrationChart.data,
            borderColor: '#7C3AED',
            backgroundColor: 'rgba(124, 58, 237, 0.05)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#06B6D4'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9CA3AF' } },
            x: { grid: { display: false }, ticks: { color: '#9CA3AF' } }
          }
        }
      });
    }

    // 2. Pie Chart: Tech Popularity
    if (this.techCanvas) {
      const keys = Object.keys(s.techPopularity);
      const vals = Object.values(s.techPopularity);
      
      new Chart(this.techCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: keys.length > 0 ? keys : ['JavaScript', 'TypeScript', 'Node.js'],
          datasets: [{
            data: vals.length > 0 ? vals : [5, 3, 2],
            backgroundColor: ['#7C3AED', '#06B6D4', '#E11D48', '#10B981', '#F59E0B'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#9CA3AF', font: { size: 9, weight: 'bold' } }
            }
          }
        }
      });
    }
  }
}
