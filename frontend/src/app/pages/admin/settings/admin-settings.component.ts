import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in text-left">
      <div class="space-y-1">
        <h2 class="text-2xl font-extrabold text-white">System Settings</h2>
        <p class="text-xs text-muted font-medium">Configure global mail setups, authentication parameters, API credentials, and maintenance mode status.</p>
      </div>

      @if (successMessage()) {
        <div class="bg-success/10 border border-success/20 text-success text-xs rounded-xl p-3.5 flex justify-between items-center">
          <span>🎉 {{ successMessage() }}</span>
          <button (click)="successMessage.set(null)" class="text-success font-bold hover:opacity-85">✕</button>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- General and SMTP -->
        <div class="lg:col-span-2 space-y-6">
          <!-- General Application Parameters -->
          <div class="glass p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Application Parameters</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/85">Platform Brand Name</label>
                <input type="text" [(ngModel)]="appName" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/85">Mock Credit Limit</label>
                <input type="number" [(ngModel)]="creditLimit" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" />
              </div>
            </div>
          </div>

          <!-- SMTP logs config -->
          <div class="glass p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">SMTP Server Configuration</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/85">SMTP Host Server</label>
                <input type="text" [(ngModel)]="smtpHost" placeholder="smtp.gmail.com" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/85">SMTP Port</label>
                <input type="number" [(ngModel)]="smtpPort" placeholder="587" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/85">Sender Mail Username</label>
                <input type="text" [(ngModel)]="smtpUser" placeholder="notifications@interviewai.io" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/85">SMTP Secure Pass</label>
                <input type="password" [(ngModel)]="smtpPass" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" />
              </div>
            </div>
          </div>
        </div>

        <!-- Security / Keys Column -->
        <div class="lg:col-span-1 space-y-6">
          <div class="glass p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Secrets & API Keys</h3>
            
            <div class="space-y-3">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/85">JWT Secret Key</label>
                <input type="text" [(ngModel)]="jwtSecret" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/85">Gemini API Key</label>
                <input type="password" [(ngModel)]="geminiKey" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" />
              </div>
            </div>
          </div>

          <div class="glass p-6 rounded-3xl border border-warning/20 space-y-4">
            <h3 class="text-sm font-bold text-warning uppercase tracking-wider">Maintenance Mode</h3>
            
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <p class="text-xs font-bold text-white">Activate Overrides</p>
                <p class="text-[9px] text-muted">Blocks mock sessions during database backups.</p>
              </div>
              <input type="checkbox" [(ngModel)]="maintenanceMode" class="w-4 h-4 accent-primary cursor-pointer" />
            </div>
          </div>
        </div>

      </div>

      <!-- Save Bar -->
      <div class="flex justify-end pt-4">
        <button 
          (click)="saveSettings()" 
          class="px-8 py-3.5 rounded-xl bg-gradient-primary text-xs font-bold text-white shadow-lg"
        >
          Save System Configuration
        </button>
      </div>
    </div>
  `
})
export class AdminSettingsComponent implements OnInit {
  private adminService = inject(AdminService);

  // Settings properties
  appName = 'Intervexa AI';
  creditLimit = 5;
  smtpHost = 'smtp.gmail.com';
  smtpPort = 587;
  smtpUser = '';
  smtpPass = '';
  jwtSecret = 'interviewai-supersecret-token-key-2026';
  geminiKey = '';
  maintenanceMode = false;

  successMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.adminService.getSettings().subscribe({
      next: (res) => {
        if (res.success && res.settings) {
          const limit = res.settings.find((s: any) => s.key === 'MOCK_CREDIT_LIMIT');
          const model = res.settings.find((s: any) => s.key === 'DEFAULT_MODEL');
          if (limit) this.creditLimit = parseInt(limit.value);
          if (model) this.jwtSecret = model.value;
        }
      }
    });
  }

  saveSettings() {
    this.adminService.updateSetting({ key: 'MOCK_CREDIT_LIMIT', value: this.creditLimit.toString() }).subscribe({
      next: () => {
        this.successMessage.set('System parameters updated successfully.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}
