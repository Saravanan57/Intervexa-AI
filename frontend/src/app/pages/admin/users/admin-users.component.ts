import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in text-left">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="space-y-1">
          <h2 class="text-2xl font-extrabold text-white">Candidate Registry</h2>
          <p class="text-xs text-muted font-medium font-sans">Manage credentials, suspend active profiles, and override access authorizations.</p>
        </div>
        <div class="flex items-center space-x-3">
          <button 
            (click)="exportToCSV()" 
            class="px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 text-xs font-bold text-white transition-colors"
          >
            📥 Export CSV
          </button>
          <button 
            (click)="openCreateModal()" 
            class="px-5 py-2.5 rounded-full bg-gradient-primary hover:opacity-95 text-xs font-bold text-white transition-opacity shadow-md"
          >
            + Add New User
          </button>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input 
          type="text" 
          [(ngModel)]="searchQuery" 
          (ngModelChange)="onFilterChange()"
          placeholder="Search candidates by name, email..."
          class="w-full bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
        />

        <select 
          [(ngModel)]="selectedRole" 
          (change)="onFilterChange()"
          class="bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="candidate">Candidate</option>
          <option value="admin">Administrator</option>
        </select>

        <select 
          [(ngModel)]="selectedStatus" 
          (change)="onFilterChange()"
          class="bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Suspended</option>
        </select>
      </div>

      <!-- Roster table -->
      <div class="glass p-6 rounded-3xl overflow-hidden">
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-white/5 text-muted">
                <th class="pb-3 font-semibold uppercase">Candidate</th>
                <th class="pb-3 font-semibold uppercase">Email</th>
                <th class="pb-3 font-semibold uppercase">Role</th>
                <th class="pb-3 font-semibold uppercase">Status</th>
                <th class="pb-3 font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filteredUsers(); track user._id) {
                <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td class="py-3 font-bold text-white">
                    <div class="flex items-center space-x-2.5">
                      <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center font-bold text-[10px] uppercase">
                        {{ user.name.charAt(0) }}
                      </div>
                      <span>{{ user.name }}</span>
                    </div>
                  </td>
                  <td class="py-3 text-muted">{{ user.email }}</td>
                  <td class="py-3 uppercase text-[10px] font-bold text-white/80">
                    {{ user.role?.name || 'candidate' }}
                  </td>
                  <td class="py-3">
                    <span 
                      [class.bg-success/15]="user.status === 'active'"
                      [class.text-success]="user.status === 'active'"
                      [class.bg-error/15]="user.status === 'inactive'"
                      [class.text-error]="user.status === 'inactive'"
                      class="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold"
                    >
                      {{ user.status === 'active' ? 'Active' : 'Suspended' }}
                    </span>
                  </td>
                  <td class="py-3 space-x-3">
                    <button (click)="openEditModal(user)" class="text-xs text-primary font-bold hover:underline">Edit</button>
                    <button (click)="toggleBlockUser(user)" class="text-xs text-warning font-bold hover:underline">
                      {{ user.status === 'active' ? 'Suspend' : 'Activate' }}
                    </button>
                    <button (click)="openResetModal(user)" class="text-xs text-muted font-bold hover:underline">Reset Pass</button>
                    <button (click)="deleteUser(user)" class="text-xs text-error font-bold hover:underline">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-8 text-center text-xs text-muted">No users matching search filters.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- CREATE / EDIT MODAL -->
      @if (showCreateEditModal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="glass p-6 rounded-3xl w-full max-w-md space-y-4 animate-fade-in text-left">
            <div class="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 class="text-sm font-bold text-white uppercase">{{ editUserId ? 'Edit Profile details' : 'Create User Account' }}</h3>
              <button (click)="closeModal()" class="text-muted hover:text-white">✕</button>
            </div>
            
            <div class="space-y-3">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/80">Full Name</label>
                <input type="text" [(ngModel)]="modalUser.name" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/80">Email address</label>
                <input type="email" [disabled]="!!editUserId" [(ngModel)]="modalUser.email" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none disabled:opacity-50" />
              </div>
              @if (!editUserId) {
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-white/80">Initial Password</label>
                  <input type="password" [(ngModel)]="modalUser.password" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
              }
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-white/80">User Role</label>
                  <select [(ngModel)]="modalUser.roleName" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                    <option value="candidate">Candidate</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-white/80">Initial Status</label>
                  <select [(ngModel)]="modalUser.status" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                    <option value="active">Active</option>
                    <option value="inactive">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex justify-end space-x-3 pt-2">
              <button (click)="closeModal()" class="px-4 py-2 rounded-full border border-white/10 text-xs font-semibold text-white">Cancel</button>
              <button (click)="saveUser()" class="px-5 py-2 rounded-full bg-primary text-xs font-semibold text-white">Save Account</button>
            </div>
          </div>
        </div>
      }

      <!-- RESET PASSWORD MODAL -->
      @if (showResetModal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="glass p-6 rounded-3xl w-full max-w-sm space-y-4 animate-fade-in text-left">
            <div class="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 class="text-sm font-bold text-white uppercase">Reset password credential</h3>
              <button (click)="closeResetModal()" class="text-muted hover:text-white">✕</button>
            </div>

            <p class="text-[10px] text-muted leading-tight">Resetting password credentials for candidate <strong>{{ resetTargetName }}</strong>.</p>
            
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-white/80">New Password</label>
              <input type="password" [(ngModel)]="newResetPassword" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
            </div>

            <div class="flex justify-end space-x-3 pt-2">
              <button (click)="closeResetModal()" class="px-4 py-2 rounded-full border border-white/10 text-xs font-semibold text-white">Cancel</button>
              <button (click)="submitPasswordReset()" class="px-5 py-2 rounded-full bg-primary text-xs font-semibold text-white">Save Changes</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  users = signal<any[]>([]);
  filteredUsers = signal<any[]>([]);

  // Filters
  searchQuery = '';
  selectedRole = 'all';
  selectedStatus = 'all';

  // Modal States
  showCreateEditModal = signal(false);
  editUserId: string | null = null;
  modalUser = { name: '', email: '', password: '', roleName: 'candidate', status: 'active' };

  // Reset Modal States
  showResetModal = signal(false);
  resetUserId = '';
  resetTargetName = '';
  newResetPassword = '';

  ngOnInit() {
    this.loadUsersList();
  }

  loadUsersList() {
    this.adminService.getUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.users.set(res.users);
          this.onFilterChange();
        }
      }
    });
  }

  onFilterChange() {
    let list = this.users();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (this.selectedRole !== 'all') {
      list = list.filter(u => u.role?.name === this.selectedRole);
    }

    if (this.selectedStatus !== 'all') {
      list = list.filter(u => u.status === this.selectedStatus);
    }

    this.filteredUsers.set(list);
  }

  openCreateModal() {
    this.editUserId = null;
    this.modalUser = { name: '', email: '', password: '', roleName: 'candidate', status: 'active' };
    this.showCreateEditModal.set(true);
  }

  openEditModal(user: any) {
    this.editUserId = user._id;
    this.modalUser = {
      name: user.name,
      email: user.email,
      password: '',
      roleName: user.role?.name || 'candidate',
      status: user.status
    };
    this.showCreateEditModal.set(true);
  }

  closeModal() {
    this.showCreateEditModal.set(false);
  }

  saveUser() {
    if (this.editUserId) {
      const payload = { userId: this.editUserId, ...this.modalUser };
      this.adminService.editUser(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadUsersList();
            this.closeModal();
          }
        }
      });
    } else {
      this.adminService.createUser(this.modalUser).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadUsersList();
            this.closeModal();
          }
        },
        error: (err) => alert(err.error?.message || 'Failed to create user.')
      });
    }
  }

  toggleBlockUser(user: any) {
    const targetStatus = user.status === 'active' ? 'inactive' : 'active';
    this.adminService.updateUserStatus(user._id, targetStatus).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadUsersList();
        }
      }
    });
  }

  openResetModal(user: any) {
    this.resetUserId = user._id;
    this.resetTargetName = user.name;
    this.newResetPassword = '';
    this.showResetModal.set(true);
  }

  closeResetModal() {
    this.showResetModal.set(false);
  }

  submitPasswordReset() {
    if (!this.newResetPassword.trim()) return;
    this.adminService.resetUserPassword({ userId: this.resetUserId, newPassword: this.newResetPassword }).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Credentials reset successfully.');
          this.closeResetModal();
        }
      }
    });
  }

  deleteUser(user: any) {
    const check = confirm(`Are you sure you want to delete ${user.name}? This removes their resume uploads and mock stats.`);
    if (check) {
      this.adminService.deleteUser(user._id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadUsersList();
          }
        }
      });
    }
  }

  exportToCSV() {
    const list = this.filteredUsers();
    let csv = 'Name,Email,Role,Status,Created Date\n';
    
    list.forEach(u => {
      csv += `"${u.name}","${u.email}","${u.role?.name || 'candidate'}","${u.status}","${new Date(u.createdDate).toLocaleDateString()}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Intervexa-AI-Users-Roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
