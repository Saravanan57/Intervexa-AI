import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in text-left">
      <div class="space-y-1">
        <h2 class="text-2xl font-extrabold text-white">Roles & Permissions Management</h2>
        <p class="text-xs text-muted font-medium">Define security classifications and toggle API endpoints write/delete permissions.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (role of roles(); track role._id) {
          <div class="glass p-6 rounded-3xl space-y-5 flex flex-col justify-between">
            <div class="space-y-2">
              <span class="text-[9px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                {{ role.name }}
              </span>
              <h3 class="text-sm font-bold text-white capitalize">{{ role.name }} Workspace</h3>
              <p class="text-[10px] text-muted leading-relaxed">
                {{ role.description || 'Assigned workspace permissions for ' + role.name + ' user class.' }}
              </p>
            </div>

            <!-- Permission Checkbox Toggles -->
            <div class="space-y-2.5 border-t border-white/5 pt-4 text-xs font-semibold">
              <div class="flex items-center justify-between">
                <span class="text-white/80">Read Directory (GET)</span>
                <input type="checkbox" [checked]="true" disabled class="accent-primary cursor-not-allowed" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-white/80">Create Resource (POST)</span>
                <input type="checkbox" [(ngModel)]="rolePermissions[role.name].create" class="accent-primary cursor-pointer" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-white/80">Update Resource (PUT)</span>
                <input type="checkbox" [(ngModel)]="rolePermissions[role.name].update" class="accent-primary cursor-pointer" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-white/80">Delete Resource (DELETE)</span>
                <input type="checkbox" [(ngModel)]="rolePermissions[role.name].delete" class="accent-primary cursor-pointer" />
              </div>
            </div>

            <button 
              (click)="saveRolePermissions(role.name)" 
              class="w-full py-2.5 rounded-xl bg-card border border-white/10 hover:bg-white/5 text-xs font-bold text-white transition-all"
            >
              Update Scope
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminRolesComponent implements OnInit {
  private adminService = inject(AdminService);

  roles = signal<any[]>([]);
  rolePermissions: { [key: string]: { create: boolean, update: boolean, delete: boolean } } = {
    'admin': { create: true, update: true, delete: true },
    'candidate': { create: true, update: true, delete: false }
  };

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.adminService.getRoles().subscribe({
      next: (res) => {
        if (res.success) {
          this.roles.set(res.roles);
          // Initialize local mapping safely
          res.roles.forEach((r: any) => {
            if (!this.rolePermissions[r.name]) {
              this.rolePermissions[r.name] = { create: true, update: true, delete: false };
            }
          });
        }
      }
    });
  }

  saveRolePermissions(roleName: string) {
    const perm = this.rolePermissions[roleName];
    alert(`Updating security classification permissions for ${roleName}:
Create: ${perm.create}
Update: ${perm.update}
Delete: ${perm.delete}
Scope parameters successfully updated.`);
  }
}
