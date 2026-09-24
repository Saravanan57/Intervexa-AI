import { Component, inject, HostListener, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { AuthModalComponent } from '../../core/components/auth-modal/auth-modal.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AuthModalComponent],
  template: `
    <div class="min-h-screen text-[#4B5563] flex flex-col font-sans relative overflow-x-hidden">
      <!-- Premium Background Glows -->
      <div class="absolute top-[5%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#0145F2]/5 to-[#06B6D4]/5 rounded-full blur-[130px] pointer-events-none -z-10 animate-float"></div>
      <div class="absolute bottom-[15%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-[#0145F2]/5 to-[#7C3AED]/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-float-delayed"></div>

      <!-- Header / Sticky Glass Navbar -->
      <header 
        [class.scrolled]="isScrolled()" 
        class="sticky top-0 z-50 w-full border-b border-transparent py-3.5 sm:py-4 px-4 sm:px-6 md:px-12 flex items-center justify-between bg-white/80 backdrop-blur-md"
      >
        <!-- Logo -->
        <a routerLink="/" class="flex items-center space-x-2 sm:space-x-2.5 text-xl sm:text-2xl font-bold tracking-tight text-[#111827] hover:opacity-90 shrink-0">
          <img src="assets/images/logo.png" alt="Intervexa AI Logo" class="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-md" />
          <span class="text-gradient-primary">Intervexa AI</span>
        </a>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-8 text-sm font-medium">
          <a routerLink="/resume-analyzer" routerLinkActive="text-primary font-semibold" class="hover:text-primary transition-colors py-1.5 text-[#111827]">Resume Analyzer</a>
          <a routerLink="/mock-interview" routerLinkActive="text-primary font-semibold" class="hover:text-primary transition-colors py-1.5 text-[#111827]">Mock Interview</a>
          @if (authService.isAuthenticated()) {
            <a routerLink="/dashboard" routerLinkActive="text-primary font-semibold" class="hover:text-primary transition-colors py-1.5 text-[#111827]">Dashboard</a>
            @if (authService.isAdmin()) {
              <a routerLink="/admin" routerLinkActive="text-primary font-semibold" class="hover:text-primary transition-colors py-1.5 text-[#111827]">Admin Settings</a>
            }
          }
        </nav>

        <!-- Right Side Auth Actions -->
        <div class="flex items-center space-x-2 sm:space-x-4 relative">
          @if (authService.isAuthenticated()) {
            <!-- Notifications Bell -->
            <div class="relative">
              <button 
                (click)="toggleNotifications()" 
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#D9E2F1] hover:bg-[#0145F2]/5 flex items-center justify-center text-sm transition-all"
                title="Notifications"
              >
                <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                @if (notificationService.unreadCount() > 0) {
                  <span class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-error text-[8px] font-bold flex items-center justify-center text-white border border-white">
                    {{ notificationService.unreadCount() }}
                  </span>
                }
              </button>

              <!-- Notifications Drawer Dropdown -->
              @if (showNotifications()) {
                <div class="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-xs sm:w-80 glass border border-[#D9E2F1] rounded-2xl p-4 shadow-xl z-50 space-y-3 animate-fade-in">
                  <div class="flex justify-between items-center border-b border-[#D9E2F1] pb-2">
                    <span class="text-xs font-bold text-[#111827]">Notifications</span>
                    <button 
                      (click)="markAllNotificationsRead()" 
                      class="text-[10px] font-semibold text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div class="max-h-60 overflow-y-auto space-y-2 pr-1">
                    @for (notif of notificationService.notificationsList(); track notif._id) {
                      <div 
                        (click)="markNotifRead(notif._id)"
                        [class.bg-[#0145F2]/5]="!notif.isRead"
                        class="p-2.5 rounded-xl border border-[#D9E2F1] cursor-pointer hover:bg-[#0145F2]/10 transition-colors flex items-start space-x-2.5"
                      >
                        <span class="text-xs shrink-0 mt-0.5">
                          @if (notif.type === 'success') {
                            <svg class="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          } @else if (notif.type === 'warning') {
                            <svg class="w-3.5 h-3.5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          } @else {
                            <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          }
                        </span>
                        <div class="space-y-0.5 text-left">
                          <p class="text-[11px] font-bold text-[#111827] leading-tight">{{ notif.title }}</p>
                          <p class="text-[10px] text-muted leading-relaxed">{{ notif.message }}</p>
                        </div>
                      </div>
                    } @empty {
                      <p class="text-[10px] text-muted text-center py-4">No notifications logged.</p>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Profile & Settings links -->
            <a 
              routerLink="/profile" 
              class="flex items-center space-x-1.5 sm:space-x-2 bg-white border border-[#D9E2F1] py-1 sm:py-1.5 px-2 sm:px-3 rounded-full hover:border-primary/45 transition-all cursor-pointer shadow-sm"
            >
              <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold uppercase text-white shadow-sm">
                {{ authService.currentUser()?.name?.charAt(0) || 'U' }}
              </div>
              <span class="text-xs hidden sm:inline-block font-bold text-[#111827]">{{ authService.currentUser()?.name }}</span>
            </a>

            <!-- Settings icon (hidden on small mobile, accessible in mobile menu) -->
            <a 
              routerLink="/settings" 
              class="hidden sm:flex w-9 h-9 rounded-full bg-white border border-[#D9E2F1] hover:bg-[#0145F2]/5 items-center justify-center text-sm transition-all"
              title="Settings"
            >
              <svg class="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </a>

            <!-- Logout button (hidden on small mobile, accessible in mobile menu) -->
            <button 
              (click)="logout()" 
              class="hidden sm:inline-block text-xs py-2 px-4 rounded-full border border-[#D9E2F1] hover:border-error hover:text-error transition-all font-semibold"
            >
              Logout
            </button>
          } @else {
            <button 
              (click)="authModalService.openModal('Sign in to access your Intervexa AI features.', 'login')" 
              class="text-xs sm:text-sm font-medium hover:text-primary transition-colors py-1.5 px-2 sm:px-4 text-[#4B5563] shrink-0"
            >
              Login
            </button>
            <button 
              (click)="authModalService.openModal('Create your free Intervexa AI account.', 'register')" 
              class="text-xs sm:text-sm font-semibold py-1.5 px-2.5 sm:px-5 rounded-full bg-gradient-to-r from-[#0145F2] to-[#1E5BFA] hover:opacity-95 transition-opacity shadow-md text-white shrink-0"
            >
              Register
            </button>
          }

          <!-- Mobile Menu Toggle -->
          <button (click)="toggleMobileMenu()" class="md:hidden flex flex-col justify-center items-center w-6 h-6 space-y-1 shrink-0 ml-1" aria-label="Toggle Navigation Menu">
            <span class="block w-5 h-0.5 bg-[#111827] transition-transform" [class.rotate-45]="isMobileMenuOpen()" [class.translate-y-1.5]="isMobileMenuOpen()"></span>
            <span class="block w-5 h-0.5 bg-[#111827] transition-opacity" [class.opacity-0]="isMobileMenuOpen()"></span>
            <span class="block w-5 h-0.5 bg-[#111827] transition-transform" [class.-rotate-45]="isMobileMenuOpen()" [class.-translate-y-1.5]="isMobileMenuOpen()"></span>
          </button>
        </div>
      </header>

      <!-- Mobile Dropdown Menu -->
      @if (isMobileMenuOpen()) {
        <div class="md:hidden glass border-b border-[#D9E2F1] py-5 px-6 flex flex-col space-y-3 text-sm font-semibold z-40 fixed top-[60px] sm:top-[73px] left-0 w-full animate-fade-in bg-white shadow-lg max-h-[calc(100vh-73px)] overflow-y-auto">
          <a routerLink="/resume-analyzer" (click)="toggleMobileMenu()" class="hover:text-primary py-2 text-[#4B5563]">Resume Analyzer</a>
          <a routerLink="/mock-interview" (click)="toggleMobileMenu()" class="hover:text-primary py-2 text-[#4B5563]">Mock Interview</a>
          @if (authService.isAuthenticated()) {
            <a routerLink="/dashboard" (click)="toggleMobileMenu()" class="hover:text-primary py-2 text-[#4B5563]">Dashboard</a>
            <a routerLink="/profile" (click)="toggleMobileMenu()" class="hover:text-primary py-2 text-[#4B5563]">Profile</a>
            <a routerLink="/settings" (click)="toggleMobileMenu()" class="hover:text-primary py-2 text-[#4B5563]">Settings</a>
            @if (authService.isAdmin()) {
              <a routerLink="/admin" (click)="toggleMobileMenu()" class="hover:text-primary py-2 text-[#4B5563]">Admin Settings</a>
            }
            <button (click)="toggleMobileMenu(); logout()" class="text-left text-error hover:opacity-80 py-2 font-bold border-t border-[#D9E2F1]/60 pt-3">
              Logout
            </button>
          } @else {
            <button (click)="toggleMobileMenu(); authModalService.openModal('Sign in to access your account.', 'login')" class="text-left hover:text-primary py-2 text-[#4B5563]">Login</button>
            <button (click)="toggleMobileMenu(); authModalService.openModal('Create your free Intervexa AI account.', 'register')" class="text-left hover:text-primary py-2 text-primary font-bold">Register</button>
          }
        </div>
      }

      <!-- Main Content Area -->
      <main class="flex-grow z-10">
        <router-outlet></router-outlet>
      </main>

      <!-- Auth Modal -->
      <app-auth-modal></app-auth-modal>

      <!-- Footer -->
      <footer class="border-t border-[#D9E2F1] bg-white py-12 px-6 md:px-12 mt-auto z-10">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="space-y-4">
            <span class="text-xl font-bold text-gradient-primary">Intervexa AI</span>
            <p class="text-xs text-muted leading-relaxed">
              Master every interview with AI. Upload your resume, practice mock sessions with real-time speech analytics, and unlock career goals.
            </p>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-[#111827] dark:text-white mb-4">Platform</h4>
            <ul class="space-y-2 text-xs text-muted">
              <li><a routerLink="/resume-analyzer" class="hover:text-primary transition-colors cursor-pointer focus:outline-none focus:underline">Resume Analyzer</a></li>
              <li><a routerLink="/mock-interview" class="hover:text-primary transition-colors cursor-pointer focus:outline-none focus:underline">Mock Interview Engine</a></li>
              <li><a routerLink="/dashboard" class="hover:text-primary transition-colors cursor-pointer focus:outline-none focus:underline">Candidate Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-[#111827] dark:text-white mb-4">Resources</h4>
            <ul class="space-y-2 text-xs text-muted">
              <li><a routerLink="/resources/faq" class="hover:text-primary transition-colors cursor-pointer focus:outline-none focus:underline">Frequently Asked Questions</a></li>
              <li><a routerLink="/resources/technical-guides" class="hover:text-primary transition-colors cursor-pointer focus:outline-none focus:underline">Technical Mock Guides</a></li>
              <li><a routerLink="/resources/hr-prep" class="hover:text-primary transition-colors cursor-pointer focus:outline-none focus:underline">HR Prep Frameworks</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-[#111827] dark:text-white mb-4">Legal</h4>
            <ul class="space-y-2 text-xs text-muted">
              <li><a routerLink="/legal/privacy" class="hover:text-primary transition-colors cursor-pointer focus:outline-none focus:underline">Privacy Policy</a></li>
              <li><a routerLink="/legal/terms" class="hover:text-primary transition-colors cursor-pointer focus:outline-none focus:underline">Terms of Service</a></li>
              <li><a routerLink="/legal/support" class="hover:text-primary transition-colors cursor-pointer focus:outline-none focus:underline">Support Desk</a></li>
            </ul>
          </div>
        </div>
        <div class="max-w-7xl mx-auto mt-12 pt-8 border-t border-[#D9E2F1] flex flex-col sm:flex-row items-center justify-between text-xs text-muted">
          <span>&copy; 2026 Intervexa AI. All rights reserved.</span>
          <span class="flex items-center space-x-6 mt-4 sm:mt-0">
            <a href="mailto:mamthasaravanan7@gmail.com" class="hover:text-primary transition-colors flex items-center space-x-1 font-medium">
              <span>✉ Email</span>
            </a>
            <a href="https://github.com/Saravanan57" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors flex items-center space-x-1 font-medium">
              <span>GitHub</span>
            </a>
            <a href="https://www.linkedin.com/in/saravanan-m-a75508241" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors flex items-center space-x-1 font-medium">
              <span>LinkedIn</span>
            </a>
          </span>
        </div>
      </footer>
    </div>
  `
})
export class MainLayoutComponent implements OnInit {
  authService = inject(AuthService);
  authModalService = inject(AuthModalService);
  notificationService = inject(NotificationService);
  router = inject(Router);
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  showNotifications = signal(false);

  ngOnInit() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo(0, 0);
    });

    if (this.authService.isAuthenticated()) {
      this.notificationService.loadNotifications().subscribe();
    }
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrolled = window.scrollY > 20;
    if (this.isScrolled() !== scrolled) {
      this.isScrolled.set(scrolled);
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  toggleNotifications() {
    this.showNotifications.update(s => !s);
    if (this.showNotifications()) {
      this.notificationService.loadNotifications().subscribe();
    }
  }

  markNotifRead(id: string) {
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllNotificationsRead() {
    this.notificationService.markAsRead().subscribe();
  }

  logout() {
    this.authService.logout().subscribe();
  }
}
