import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-[#070b13] flex font-sans relative overflow-x-hidden">
      
      <!-- Mobile Backdrop Overlay -->
      @if (isSidebarOpen()) {
        <div 
          (click)="isSidebarOpen.set(false)" 
          class="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        ></div>
      }

      <!-- Side Navigation Bar -->
      <aside 
        class="fixed inset-y-0 left-0 z-40 w-64 border-r border-white/5 bg-[#090e1a]/95 backdrop-blur-md flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 shadow-2xl md:shadow-none"
        [class.-translate-x-full]="!isSidebarOpen()"
        [class.translate-x-0]="isSidebarOpen()"
      >
        <div class="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between">
          <a routerLink="/" (click)="closeSidebarOnMobile()" class="flex items-center space-x-2 text-xl font-bold tracking-tight">
            <img src="assets/images/logo.png" alt="Intervexa AI Logo" class="w-7 h-7 object-contain rounded-md" />
            <span class="text-gradient-primary">Intervexa AI</span>
            <span class="text-[9px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
          </a>
          <button (click)="isSidebarOpen.set(false)" class="md:hidden text-muted hover:text-white p-1" aria-label="Close Sidebar">
            ✕
          </button>
        </div>

        <nav class="flex-grow p-4 space-y-1 overflow-y-auto text-xs font-bold">
          <a 
            routerLink="dashboard" 
            routerLinkActive="bg-white/5 text-primary"
            (click)="closeSidebarOnMobile()"
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>📊</span> <span>Dashboard</span>
          </a>
          
          <a 
            routerLink="users" 
            routerLinkActive="bg-white/5 text-primary"
            (click)="closeSidebarOnMobile()"
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>👥</span> <span>Users Directory</span>
          </a>

          <a 
            routerLink="questions" 
            routerLinkActive="bg-white/5 text-primary"
            (click)="closeSidebarOnMobile()"
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>📚</span> <span>Question Bank</span>
          </a>

          <a 
            routerLink="interviews" 
            routerLinkActive="bg-white/5 text-primary"
            (click)="closeSidebarOnMobile()"
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>🎙</span> <span>Mock Interviews</span>
          </a>

          <a 
            routerLink="resumes" 
            routerLinkActive="bg-white/5 text-primary"
            (click)="closeSidebarOnMobile()"
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>📝</span> <span>Resume Audits</span>
          </a>

          <a 
            routerLink="roles" 
            routerLinkActive="bg-white/5 text-primary"
            (click)="closeSidebarOnMobile()"
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>🔑</span> <span>Roles & Permissions</span>
          </a>

          <a 
            routerLink="notifications" 
            routerLinkActive="bg-white/5 text-primary"
            (click)="closeSidebarOnMobile()"
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>🔔</span> <span>Broadcast Panel</span>
          </a>

          <a 
            routerLink="settings" 
            routerLinkActive="bg-white/5 text-primary"
            (click)="closeSidebarOnMobile()"
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>⚙</span> <span>System Settings</span>
          </a>
        </nav>

        <!-- Logout bottom section -->
        <div class="p-4 border-t border-white/5">
          <button 
            (click)="logout()" 
            class="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-error/10 hover:text-error text-xs font-bold transition-all text-left text-muted"
          >
            <span>🚪</span> <span>Logout System</span>
          </button>
        </div>
      </aside>

      <!-- Main Layout Body -->
      <div class="flex-grow flex flex-col min-w-0">
        
        <!-- Top Navbar -->
        <header class="h-16 border-b border-white/5 bg-[#090e1a]/40 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button 
              (click)="isSidebarOpen.set(true)" 
              class="md:hidden flex flex-col justify-center items-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 space-y-1 text-white p-1.5"
              aria-label="Open Admin Menu"
            >
              <span class="block w-4 h-0.5 bg-white"></span>
              <span class="block w-4 h-0.5 bg-white"></span>
              <span class="block w-4 h-0.5 bg-white"></span>
            </button>
            <div class="text-xs font-bold text-muted flex items-center space-x-2">
              <span>Admin</span>
              <span>/</span>
              <span class="text-white">Console</span>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
              <span class="w-2 h-2 rounded-full bg-success"></span>
              <span class="text-[10px] font-bold text-white uppercase">{{ authService.currentUser()?.name }}</span>
            </div>
          </div>
        </header>

        <!-- Dynamic Content Router Outlet -->
        <main class="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8 relative">
          <router-outlet></router-outlet>
        </main>
      </div>

    </div>
  `
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  isSidebarOpen = signal(false);

  closeSidebarOnMobile() {
    this.isSidebarOpen.set(false);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login'])
    });
  }
}
