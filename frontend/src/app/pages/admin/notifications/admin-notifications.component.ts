import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
      <div class="space-y-1">
        <h2 class="text-2xl font-extrabold text-white">Broadcast alerts Panel</h2>
        <p class="text-xs text-muted font-medium">Broadcast custom popups, system warnings, or achievement notices directly to all candidate accounts.</p>
      </div>

      @if (successMessage()) {
        <div class="bg-success/10 border border-success/20 text-success text-xs rounded-xl p-3.5 flex justify-between items-center">
          <span>🎉 {{ successMessage() }}</span>
          <button (click)="successMessage.set(null)" class="text-success font-bold hover:opacity-85">✕</button>
        </div>
      }

      <div class="glass p-6 rounded-3xl space-y-4">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">Compose Notification</h3>

        <div class="space-y-3">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-white/80">Alert Header Title</label>
            <input 
              type="text" 
              [(ngModel)]="title"
              placeholder="e.g. 🏆 System Scheduled Maintenance"
              class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" 
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-white/80">Message details</label>
            <textarea 
              rows="4" 
              [(ngModel)]="message"
              placeholder="Write the notification details here..."
              class="w-full bg-[#0B1120] border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none resize-none"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-white/80">Category Type</label>
              <select [(ngModel)]="notifType" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                <option value="info">📢 Info Notice</option>
                <option value="success">🏆 Achievement / Success</option>
                <option value="warning">⚠ Warning Status</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-white/80">Broadcasting Scope</label>
              <select [(ngModel)]="scope" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                <option value="all">All Active Candidates</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-4">
          <button 
            (click)="broadcastAlert()" 
            [disabled]="isSending() || !title.trim() || !message.trim()"
            class="px-6 py-2.5 rounded-xl bg-gradient-primary text-xs font-bold text-white shadow-lg disabled:opacity-50 transition-all flex items-center space-x-2"
          >
            @if (isSending()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Sending alert...</span>
            } @else {
              <span>Send Broadcast Alert</span>
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class AdminNotificationsComponent {
  private adminService = inject(AdminService);

  title = '';
  message = '';
  notifType = 'info';
  scope = 'all';

  isSending = signal(false);
  successMessage = signal<string | null>(null);

  broadcastAlert() {
    this.isSending.set(true);
    const payload = {
      title: this.title,
      message: this.message,
      type: this.notifType
    };

    this.adminService.broadcastNotification(payload).subscribe({
      next: (res) => {
        this.isSending.set(false);
        if (res.success) {
          this.successMessage.set('Broadcast notifications sent successfully to all candidates.');
          this.title = '';
          this.message = '';
        }
      },
      error: () => this.isSending.set(false)
    });
  }
}
