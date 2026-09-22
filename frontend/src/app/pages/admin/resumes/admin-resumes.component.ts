import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-resumes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in text-left">
      <div class="space-y-1">
        <h2 class="text-2xl font-extrabold text-white">Resume Audits History</h2>
        <p class="text-xs text-muted font-medium">Verify parsed resumes, inspect ATS match ratings, and download or delete file logs.</p>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input 
          type="text" 
          [(ngModel)]="searchQuery" 
          (ngModelChange)="onFilter()"
          placeholder="Search by candidate name or file name..."
          class="w-full bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
        />

        <select 
          [(ngModel)]="selectedScore" 
          (change)="onFilter()"
          class="bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
        >
          <option value="all">All ATS Ratings</option>
          <option value="90">90% match rate</option>
          <option value="75">75% match rate</option>
          <option value="50">50% match rate</option>
        </select>
      </div>

      <!-- Resume Roster -->
      <div class="glass p-6 rounded-3xl overflow-hidden">
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-white/5 text-muted">
                <th class="pb-3 font-semibold uppercase">Candidate</th>
                <th class="pb-3 font-semibold uppercase">File Name</th>
                <th class="pb-3 font-semibold uppercase">ATS Score</th>
                <th class="pb-3 font-semibold uppercase">Job Readiness</th>
                <th class="pb-3 font-semibold uppercase">Date Uploaded</th>
                <th class="pb-3 font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (resume of filteredResumes(); track resume._id) {
                <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td class="py-3 font-bold text-white">
                    {{ resume.user?.name || 'Deleted Candidate' }}
                    <p class="text-[9px] text-muted font-normal">{{ resume.user?.email || 'N/A' }}</p>
                  </td>
                  <td class="py-3 text-muted truncate max-w-xs" [title]="resume.fileName">{{ resume.fileName }}</td>
                  <td class="py-3">
                    <span class="text-primary font-black text-xs">{{ resume.score }}%</span>
                  </td>
                  <td class="py-3">
                    <span class="text-secondary font-bold text-xs">{{ resume.jobReadinessPercentage || 0 }}%</span>
                  </td>
                  <td class="py-3 text-muted">{{ resume.createdDate | date:'mediumDate' }}</td>
                  <td class="py-3 space-x-3">
                    <button (click)="downloadSimulated(resume)" class="text-xs text-primary font-bold hover:underline">Download</button>
                    <button (click)="deleteResume(resume)" class="text-xs text-error font-bold hover:underline">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-8 text-center text-xs text-muted">No resume audit logs matches the query.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminResumesComponent implements OnInit {
  private adminService = inject(AdminService);

  resumes = signal<any[]>([]);
  filteredResumes = signal<any[]>([]);

  searchQuery = '';
  selectedScore = 'all';

  ngOnInit() {
    this.loadResumes();
  }

  loadResumes() {
    this.adminService.getResumes().subscribe({
      next: (res) => {
        if (res.success) {
          this.resumes.set(res.resumes);
          this.onFilter();
        }
      }
    });
  }

  onFilter() {
    let list = this.resumes();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(r => 
        r.fileName?.toLowerCase().includes(q) || 
        r.user?.name?.toLowerCase().includes(q)
      );
    }

    if (this.selectedScore !== 'all') {
      const min = parseInt(this.selectedScore);
      list = list.filter(r => r.score >= min);
    }

    this.filteredResumes.set(list);
  }

  downloadSimulated(resume: any) {
    alert(`Downloading resume file from system file storage gateway: ${resume.fileName}`);
    // Simulate plain text backup download
    const blob = new Blob([resume.parsedText || 'Parsed resume text content.'], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Parsed-Backup-${resume.fileName}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  deleteResume(resume: any) {
    const check = confirm('Delete this resume log permanently from the system?');
    if (check) {
      this.adminService.deleteResume(resume._id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadResumes();
          }
        }
      });
    }
  }
}
