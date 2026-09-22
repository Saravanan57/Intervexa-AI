import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-interviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in text-left">
      <div class="space-y-1">
        <h2 class="text-2xl font-extrabold text-white">Mock Interview Logs</h2>
        <p class="text-xs text-muted font-medium">Review scored candidate evaluations, filter historical mock records, and clean up logs.</p>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <input 
          type="text" 
          [(ngModel)]="candidateQuery" 
          (ngModelChange)="onFilterChange()"
          placeholder="Search by candidate name..."
          class="w-full bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
        />

        <select 
          [(ngModel)]="selectedDomain" 
          (change)="onFilterChange()"
          class="bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
        >
          <option value="all">All Domains</option>
          <option value="Java">Java</option>
          <option value="Angular">Angular</option>
          <option value="Node.js">Node.js</option>
          <option value="Express">Express</option>
          <option value="MongoDB">MongoDB</option>
          <option value="JavaScript">JavaScript</option>
          <option value="TypeScript">TypeScript</option>
          <option value="Python">Python</option>
          <option value="React">React</option>
          <option value="DevOps">DevOps</option>
          <option value="Cloud">Cloud</option>
        </select>

        <select 
          [(ngModel)]="selectedScore" 
          (change)="onFilterChange()"
          class="bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
        >
          <option value="all">All Scores</option>
          <option value="90">90% and above</option>
          <option value="75">75% and above</option>
          <option value="50">50% and above</option>
          <option value="low">Under 50%</option>
        </select>

        <select 
          [(ngModel)]="selectedStatus" 
          (change)="onFilterChange()"
          class="bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="active">Active</option>
        </select>
      </div>

      <!-- Roster table -->
      <div class="glass p-6 rounded-3xl overflow-hidden">
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-white/5 text-muted">
                <th class="pb-3 font-semibold uppercase">Candidate</th>
                <th class="pb-3 font-semibold uppercase">Domain / Tech</th>
                <th class="pb-3 font-semibold uppercase">Difficulty</th>
                <th class="pb-3 font-semibold uppercase">Score Rating</th>
                <th class="pb-3 font-semibold uppercase">Status</th>
                <th class="pb-3 font-semibold uppercase">Date Completed</th>
                <th class="pb-3 font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (session of filteredSessions(); track session._id) {
                <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td class="py-3 font-bold text-white">
                    {{ session.user?.name || 'Deleted Candidate' }}
                    <p class="text-[9px] text-muted font-normal">{{ session.user?.email || 'N/A' }}</p>
                  </td>
                  <td class="py-3 text-muted uppercase text-[10px] font-bold">{{ session.domain || 'General' }}</td>
                  <td class="py-3 capitalize text-muted">{{ session.difficulty }}</td>
                  <td class="py-3">
                    <span 
                      [class.text-success]="session.score >= 75"
                      [class.text-warning]="session.score >= 50 && session.score < 75"
                      [class.text-error]="session.score < 50"
                      class="font-black text-xs"
                    >
                      {{ session.score }}%
                    </span>
                  </td>
                  <td class="py-3">
                    <span 
                      [class.bg-success/15]="session.status === 'completed'"
                      [class.text-success]="session.status === 'completed'"
                      [class.bg-warning/15]="session.status === 'active'"
                      [class.text-warning]="session.status === 'active'"
                      class="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold"
                    >
                      {{ session.status }}
                    </span>
                  </td>
                  <td class="py-3 text-muted">{{ session.createdDate | date:'mediumDate' }}</td>
                  <td class="py-3">
                    <button (click)="deleteSession(session)" class="text-xs text-error font-bold hover:underline">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="py-8 text-center text-xs text-muted">No mock interview records matches the query.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminInterviewsComponent implements OnInit {
  private adminService = inject(AdminService);

  sessions = signal<any[]>([]);
  filteredSessions = signal<any[]>([]);

  // Search/Filters
  candidateQuery = '';
  selectedDomain = 'all';
  selectedScore = 'all';
  selectedStatus = 'all';

  ngOnInit() {
    this.loadSessions();
  }

  loadSessions() {
    this.adminService.getInterviews().subscribe({
      next: (res) => {
        if (res.success) {
          this.sessions.set(res.sessions);
          this.onFilterChange();
        }
      }
    });
  }

  onFilterChange() {
    let list = this.sessions();

    if (this.candidateQuery.trim()) {
      const q = this.candidateQuery.toLowerCase();
      list = list.filter(s => s.user?.name?.toLowerCase().includes(q) || s.user?.email?.toLowerCase().includes(q));
    }

    if (this.selectedDomain !== 'all') {
      list = list.filter(s => s.domain === this.selectedDomain);
    }

    if (this.selectedScore !== 'all') {
      if (this.selectedScore === '90') list = list.filter(s => s.score >= 90);
      else if (this.selectedScore === '75') list = list.filter(s => s.score >= 75);
      else if (this.selectedScore === '50') list = list.filter(s => s.score >= 50);
      else if (this.selectedScore === 'low') list = list.filter(s => s.score < 50);
    }

    if (this.selectedStatus !== 'all') {
      list = list.filter(s => s.status === this.selectedStatus);
    }

    this.filteredSessions.set(list);
  }

  deleteSession(session: any) {
    const check = confirm('Delete this interview session record permanently?');
    if (check) {
      this.adminService.deleteInterview(session._id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadSessions();
          }
        }
      });
    }
  }
}
