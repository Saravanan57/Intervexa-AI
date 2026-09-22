import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto px-6 md:px-12 py-10 space-y-8 relative text-left">
      <div class="space-y-2 animate-fade-in text-left">
        <span class="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">Preferences</span>
        <h2 class="text-3xl font-extrabold text-[#111827]">Platform Settings</h2>
        <p class="text-xs text-muted">Configure your email notifications, layout theme mode, and privacy preferences.</p>
      </div>

      @if (successMsg()) {
        <div class="bg-success/10 border border-success/20 text-success text-xs rounded-xl p-3.5 flex justify-between items-center shadow-sm">
          <span>🎉 {{ successMsg() }}</span>
          <button (click)="successMsg.set(null)" class="text-success font-bold hover:opacity-85">✕</button>
        </div>
      }

      <div class="space-y-6">
        <!-- Theme Mode -->
        <div class="glass p-6 rounded-3xl space-y-4 shadow-sm text-left">
          <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Layout Preference</h3>
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <p class="text-xs font-bold text-[#111827]">Theme Selection</p>
              <p class="text-[10px] text-muted">Switch between dark mode Vercel styling and classic light templates.</p>
            </div>
            <button 
              (click)="toggleTheme()" 
              class="px-5 py-2.5 rounded-full bg-white border border-[#D9E2F1] hover:bg-[#0145F2]/5 text-xs font-bold transition-all text-[#111827] shadow-sm"
            >
              {{ isDarkMode() ? '🌙 Dark Mode' : '☀️ Light Mode' }}
            </button>
          </div>
        </div>

        <!-- Privacy & Visibility -->
        <div class="glass p-6 rounded-3xl space-y-4 shadow-sm text-left">
          <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Privacy Settings</h3>
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <p class="text-xs font-bold text-[#111827]">Profile Visibility</p>
              <p class="text-[10px] text-muted">Allow recruiter index tags searching for your matching resume skills.</p>
            </div>
            <input 
              type="checkbox" 
              [(ngModel)]="profileVisibility" 
              class="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>
        </div>

        <!-- Notifications -->
        <div class="glass p-6 rounded-3xl space-y-4 shadow-sm text-left">
          <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Email Notifications</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <p class="text-xs font-bold text-[#111827]">Interview Complete Summaries</p>
                <p class="text-[10px] text-muted">Send automated PDF detailed report files to my registered email upon session completion.</p>
              </div>
              <input 
                type="checkbox" 
                [(ngModel)]="emailOnInterview" 
                class="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>
            <div class="flex items-center justify-between border-t border-[#D9E2F1] pt-3">
              <div class="space-y-0.5">
                <p class="text-xs font-bold text-[#111827]">ATS Parsing Flags</p>
                <p class="text-[10px] text-muted">Deliver a summary list of missing high value keywords to my registered email.</p>
              </div>
              <input 
                type="checkbox" 
                [(ngModel)]="emailOnResume" 
                class="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="glass p-6 rounded-3xl border border-error/20 space-y-4 shadow-sm text-left">
          <h3 class="text-xs font-bold text-error uppercase tracking-wider">Danger Zone</h3>
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="space-y-0.5">
              <p class="text-xs font-bold text-[#111827]">Delete Profile Account</p>
              <p class="text-[10px] text-muted">Permanently wipe all mock histories, resume parsing reports, and achievements data.</p>
            </div>
            <button 
              (click)="onDeleteAccount()" 
              class="px-5 py-2.5 rounded-full bg-error hover:opacity-90 text-xs font-bold text-white transition-opacity shrink-0 shadow-sm"
            >
              Delete Account
            </button>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end">
          <button 
            (click)="saveSettings()"
            class="px-6 py-2.5 rounded-full bg-gradient-primary text-xs font-bold text-white shadow-lg shadow-primary/10 hover:opacity-95"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  isDarkMode = signal(true);
  profileVisibility = true;
  emailOnInterview = true;
  emailOnResume = false;
  successMsg = signal<string | null>(null);

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.isDarkMode.set(savedTheme === 'dark');
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    this.applyTheme(this.isDarkMode());
  }

  private applyTheme(isDark: boolean) {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  saveSettings() {
    this.successMsg.set('Settings configuration saved successfully.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeleteAccount() {
    const doubleCheck = confirm('Are you absolutely sure you want to delete your Intervexa AI account? This action is permanent and cannot be undone.');
    if (doubleCheck) {
      alert('Delete account process initiated. Cleaning up profile...');
      this.authService.logoutLocal();
    }
  }
}
