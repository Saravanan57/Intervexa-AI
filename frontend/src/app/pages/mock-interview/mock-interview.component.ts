import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InterviewService } from '../../core/services/interview.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';

@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-8 relative text-left box-border overflow-hidden">
      <!-- Header -->
      <div class="space-y-2 text-left animate-fade-in max-w-full">
        <span class="inline-block text-[10px] font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-wider">
          Real-Time Voice & Technical Mocks
        </span>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-[#111827] break-words">AI Mock Interview Engine</h2>
        <p class="text-xs text-slate-500 max-w-2xl leading-relaxed">
          Configure your mock session below. Experience real-time speech analytics, coding stubs, and HR evaluations.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 min-w-0">
        
        <!-- CONFIGURATION FORM CARD -->
        <div class="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xl space-y-6 min-w-0 overflow-hidden box-border">
          <div class="border-b border-slate-100 pb-4">
            <h3 class="text-base sm:text-lg font-bold text-slate-900">Session Configuration</h3>
            <p class="text-xs text-slate-500">Tailor the interview parameters to match your target job application</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 min-w-0">
            
            <!-- 1. Interview Type -->
            <div class="space-y-1.5 min-w-0">
              <label class="text-xs font-bold text-slate-700 block">Interview Type</label>
              <select 
                [(ngModel)]="selectedType" 
                class="w-full max-w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0145F2] focus:bg-white transition-all cursor-pointer font-medium box-border"
              >
                <option value="HR">HR Interview</option>
                <option value="Technical">Technical Interview</option>
                <option value="Coding">Coding Interview</option>
                <option value="Behavioral">Behavioral Interview</option>
              </select>
            </div>

            <!-- 2. Job Role (Custom Searchable & Categorized Dropdown) -->
            <div class="space-y-1.5 min-w-0 relative job-role-dropdown-container">
              <label class="text-xs font-bold text-slate-700 block">Job Role</label>
              
              <!-- Trigger Button -->
              <button 
                type="button"
                (click)="toggleRoleDropdown($event)"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0145F2] focus:bg-white transition-all cursor-pointer font-medium flex items-center justify-between shadow-sm"
              >
                <span class="truncate font-semibold text-slate-800">{{ selectedJobRole }}</span>
                <span class="text-slate-400 text-xs ml-2">▼</span>
              </button>

              <!-- Popup Panel -->
              <div 
                *ngIf="isRoleDropdownOpen()"
                class="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-3 space-y-2 max-h-80 flex flex-col text-left"
              >
                <!-- Search Box -->
                <div class="relative shrink-0" (click)="$event.stopPropagation()">
                  <input 
                    type="text" 
                    [ngModel]="roleSearchTerm()"
                    (ngModelChange)="roleSearchTerm.set($event)"
                    placeholder="Search 50+ roles (e.g. AI, DevOps, Recruiter)..."
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <!-- Categorized Options List -->
                <div class="overflow-y-auto space-y-3 pr-1 flex-1 max-h-60">
                  <div *ngFor="let catGroup of filteredJobRoleCategories()">
                    <div class="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded-md mb-1">
                      {{ catGroup.category }}
                    </div>
                    <div class="space-y-0.5">
                      <button 
                        *ngFor="let roleItem of catGroup.roles"
                        type="button"
                        (click)="selectRole(roleItem)"
                        [class.bg-purple-50]="roleItem === selectedJobRole"
                        [class.text-purple-700]="roleItem === selectedJobRole"
                        [class.font-bold]="roleItem === selectedJobRole"
                        class="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-between"
                      >
                        <span>{{ roleItem }}</span>
                        <span *ngIf="roleItem === selectedJobRole" class="text-purple-600 text-xs">✓</span>
                      </button>
                    </div>
                  </div>

                  <div *ngIf="filteredJobRoleCategories().length === 0" class="text-xs text-slate-400 text-center py-4">
                    No matching job roles found.
                  </div>
                </div>
              </div>

            </div>

            <!-- 3. Difficulty -->
            <div class="space-y-1.5 min-w-0">
              <label class="text-xs font-bold text-slate-700 block">Difficulty</label>
              <select 
                [(ngModel)]="selectedDifficulty" 
                class="w-full max-w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0145F2] focus:bg-white transition-all cursor-pointer font-medium box-border"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <!-- 4. Experience -->
            <div class="space-y-1.5 min-w-0">
              <label class="text-xs font-bold text-slate-700 block">Experience</label>
              <select 
                [(ngModel)]="experienceLevel" 
                class="w-full max-w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0145F2] focus:bg-white transition-all cursor-pointer font-medium box-border"
              >
                <option value="Fresher">Fresher</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="Senior">Senior (5+ Years)</option>
              </select>
            </div>

            <!-- 5. Interview Duration -->
            <div class="space-y-1.5 min-w-0">
              <label class="text-xs font-bold text-slate-700 block">Interview Duration</label>
              <select 
                [(ngModel)]="durationLimit" 
                class="w-full max-w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0145F2] focus:bg-white transition-all cursor-pointer font-medium box-border"
              >
                <option [ngValue]="10">10 Minutes</option>
                <option [ngValue]="20">20 Minutes</option>
                <option [ngValue]="30">30 Minutes</option>
              </select>
            </div>

            <!-- 6. Voice Mode Toggle -->
            <div class="space-y-1.5 min-w-0">
              <label class="text-xs font-bold text-slate-700 block">Voice Mode</label>
              <div 
                (click)="voiceEnabled = !voiceEnabled"
                class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-purple-300 transition-all select-none box-border"
              >
                <div class="flex items-center space-x-2 min-w-0 truncate">
                  <span class="text-base shrink-0">{{ voiceEnabled ? '🎙️' : '🔇' }}</span>
                  <span class="text-xs font-bold text-slate-800 truncate">Enable Voice Interview</span>
                </div>
                <div 
                  [class.bg-purple-600]="voiceEnabled"
                  [class.bg-slate-300]="!voiceEnabled"
                  class="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative shrink-0"
                >
                  <div 
                    [class.translate-x-4]="voiceEnabled"
                    [class.translate-x-0]="!voiceEnabled"
                    class="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out"
                  ></div>
                </div>
              </div>
            </div>

          </div>

          <!-- START INTERVIEW BUTTON -->
          <div class="pt-4 border-t border-slate-100 min-w-0">
            <button 
              (click)="onStartInterviewClick()" 
              [disabled]="isLoading()"
              class="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center space-x-2 box-border"
            >
              @if (isLoading()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Generating Session...</span>
              } @else {
                <span>Start Interview</span>
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              }
            </button>
          </div>
        </div>

        <!-- RIGHT SIDE PREVIEW / INFO CARDS -->
        <div class="lg:col-span-5 space-y-6 min-w-0">
          
          <div class="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border border-purple-100 rounded-3xl p-5 sm:p-6 space-y-3 sm:space-y-4 text-left box-border">
            <div class="flex items-center space-x-3 min-w-0">
              <div class="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                🎙️
              </div>
              <div class="min-w-0 truncate">
                <h4 class="text-sm font-bold text-slate-900 truncate">Real-Time Voice Engine</h4>
                <p class="text-[11px] text-slate-500 truncate">Live speech-to-text feedback</p>
              </div>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed break-words">
              When voice mode is enabled, your spoken responses are transcribed live in browser and scored on clarity, technical accuracy, and answer structure.
            </p>
          </div>

          <!-- Feature Cards Overview -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2 box-border min-w-0">
              <span class="text-lg block">💻</span>
              <h5 class="text-xs font-bold text-slate-900 truncate">Adaptive Depth</h5>
              <p class="text-[11px] text-slate-500 leading-relaxed break-words">Questions dynamically match your selected job role and target experience level.</p>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2 box-border min-w-0">
              <span class="text-lg block">📊</span>
              <h5 class="text-xs font-bold text-slate-900 truncate">Instant Evaluation</h5>
              <p class="text-[11px] text-slate-500 leading-relaxed break-words">Receive automated breakdown scorecards on communication and technical depth.</p>
            </div>
          </div>

          <!-- Past Interview History (If Logged In) -->
          @if (authService.isAuthenticated()) {
            <div class="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 text-left shadow-sm min-w-0 box-border">
              <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Past Interview Sessions</h4>
              <div class="space-y-2.5 min-w-0">
                @for (item of history(); track item._id) {
                  <div 
                    [routerLink]="['/mock-interview/feedback', item._id]"
                    class="p-3 border border-slate-100 hover:border-purple-200 hover:bg-purple-50/40 rounded-xl cursor-pointer transition-all flex items-center justify-between min-w-0"
                  >
                    <div class="space-y-0.5 min-w-0 truncate pr-2">
                      <p class="text-xs font-bold text-slate-800 truncate">{{ item.type }} - {{ item.domain }}</p>
                      <p class="text-[10px] text-slate-400 truncate">{{ item.createdAt | date:'shortDate' }} • {{ item.difficulty | titlecase }}</p>
                    </div>
                    <span class="text-xs font-extrabold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg shrink-0">
                      {{ item.predictedScore || 80 }}%
                    </span>
                  </div>
                } @empty {
                  <p class="text-xs text-slate-400 py-2 text-center">No past interviews recorded.</p>
                }
              </div>
            </div>
          }

        </div>

      </div>
    </div>
  `
})
export class MockInterviewComponent implements OnInit {
  interviewService = inject(InterviewService);
  authService = inject(AuthService);
  authModalService = inject(AuthModalService);
  router = inject(Router);

  // Configuration Fields
  selectedType = 'Technical';
  selectedJobRole = 'Full Stack Developer';
  selectedDifficulty = 'Medium';
  experienceLevel = '1-3 Years';
  durationLimit = 20;
  questionPoolSize = 5;
  voiceEnabled = true;

  // Dropdown & Search Signals
  isRoleDropdownOpen = signal(false);
  roleSearchTerm = signal('');
  isLoading = signal(false);
  history = signal<any[]>([]);

  jobRoleCategories = [
    {
      category: 'Software Engineering',
      roles: [
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'Angular Developer',
        'React Developer',
        'Node.js Developer',
        'Java Developer',
        'Python Developer',
        'Mobile App Developer (iOS/Android)',
        'Embedded Systems Engineer',
        'Game Developer',
        'Firmware Engineer',
        'Site Reliability Engineer (SRE)'
      ]
    },
    {
      category: 'AI & Data Science',
      roles: [
        'AI / ML Engineer',
        'Data Scientist',
        'Data Engineer',
        'MLOps Engineer',
        'Computer Vision Engineer',
        'NLP Specialist',
        'Data Analyst',
        'Business Intelligence (BI) Developer'
      ]
    },
    {
      category: 'Cloud & DevOps',
      roles: [
        'DevOps Engineer',
        'Cloud Architect (AWS/Azure/GCP)',
        'Infrastructure Engineer',
        'Kubernetes Administrator',
        'System Administrator',
        'Cloud Security Engineer'
      ]
    },
    {
      category: 'Cybersecurity & IT',
      roles: [
        'Cybersecurity Analyst',
        'Penetration Tester (Ethical Hacker)',
        'Information Security Manager',
        'Security Architect',
        'SOC Analyst',
        'Network Engineer'
      ]
    },
    {
      category: 'QA & Software Testing',
      roles: [
        'QA Automation Engineer',
        'Manual Test Engineer',
        'Performance Test Engineer',
        'SDET (Software Development Engineer in Test)'
      ]
    },
    {
      category: 'Design & User Experience',
      roles: [
        'UI / UX Designer',
        'Product Designer',
        'Interaction Designer',
        'Visual Designer',
        'UX Researcher'
      ]
    },
    {
      category: 'Product & Project Management',
      roles: [
        'Product Manager',
        'Technical Program Manager (TPM)',
        'Project Manager',
        'Scrum Master',
        'Agile Coach',
        'Product Owner'
      ]
    },
    {
      category: 'Business Analysis & Strategy',
      roles: [
        'Business Analyst',
        'Strategy Consultant',
        'Operations Manager',
        'Data & Analytics Consultant',
        'Solutions Architect'
      ]
    },
    {
      category: 'Marketing & Growth',
      roles: [
        'Growth Marketer',
        'Digital Marketing Manager',
        'SEO Specialist',
        'Content Strategist',
        'Social Media Manager',
        'Email Marketing Specialist'
      ]
    },
    {
      category: 'Human Resources & Talent',
      roles: [
        'HR Generalist',
        'Technical Recruiter',
        'HR Business Partner (HRBP)',
        'Talent Acquisition Specialist',
        'Compensation & Benefits Analyst'
      ]
    },
    {
      category: 'Finance & Accounting',
      roles: [
        'Financial Analyst',
        'Accountant',
        'Investment Banking Analyst',
        'Risk Management Specialist',
        'Tax Consultant'
      ]
    },
    {
      category: 'Sales & Customer Support',
      roles: [
        'Account Executive',
        'Sales Development Representative (SDR)',
        'Customer Success Manager (CSM)',
        'Technical Support Specialist',
        'Account Manager'
      ]
    }
  ];

  toggleRoleDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.isRoleDropdownOpen.update(v => !v);
  }

  selectRole(role: string) {
    this.selectedJobRole = role;
    this.isRoleDropdownOpen.set(false);
    this.roleSearchTerm.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.job-role-dropdown-container')) {
      this.isRoleDropdownOpen.set(false);
    }
  }

  filteredJobRoleCategories() {
    const term = this.roleSearchTerm().toLowerCase().trim();
    if (!term) return this.jobRoleCategories;

    return this.jobRoleCategories
      .map(cat => {
        const matchesCategory = cat.category.toLowerCase().includes(term);
        const filteredRoles = cat.roles.filter(r => r.toLowerCase().includes(term));
        if (matchesCategory) {
          return cat;
        }
        return {
          category: cat.category,
          roles: filteredRoles
        };
      })
      .filter(cat => cat.roles.length > 0);
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadHistory();
      this.checkAndRestorePendingWorkflow();
    }
  }

  loadHistory() {
    this.interviewService.getHistory().subscribe({
      next: (res) => {
        if (res.success && res.interviews) {
          this.history.set(res.interviews);
        }
      }
    });
  }

  checkAndRestorePendingWorkflow() {
    const pending = this.authModalService.getPendingInterview();
    if (pending) {
      this.selectedType = pending.type;
      this.selectedJobRole = pending.jobRole || pending.domain;
      this.selectedDifficulty = pending.difficulty;
      this.experienceLevel = pending.experience;
      this.durationLimit = pending.durationLimit;
      this.questionPoolSize = pending.questionPoolSize;
      this.voiceEnabled = pending.voiceEnabled;

      this.executeStartInterview();
      this.authModalService.clearPendingInterview();
    }
  }

  onStartInterviewClick() {
    // RULE: IF USER IS NOT LOGGED IN -> SAVE SELECTIONS TO SESSION STORAGE & SHOW AUTH MODAL
    if (!this.authService.isAuthenticated()) {
      this.authModalService.savePendingInterview({
        type: this.selectedType,
        domain: this.selectedJobRole,
        experience: this.experienceLevel,
        difficulty: this.selectedDifficulty,
        durationLimit: this.durationLimit,
        questionPoolSize: this.questionPoolSize,
        voiceEnabled: this.voiceEnabled,
        jobRole: this.selectedJobRole
      });

      this.authModalService.openModal(
        'Login to start your AI Mock Interview.',
        'login',
        () => {
          // Callback executed automatically after successful login
          this.checkAndRestorePendingWorkflow();
        }
      );
      return;
    }

    // IF LOGGED IN -> DIRECT START
    this.executeStartInterview();
  }

  executeStartInterview() {
    this.isLoading.set(true);

    const config = {
      type: this.selectedType,
      domain: this.selectedJobRole,
      jobRole: this.selectedJobRole,
      experience: this.experienceLevel,
      difficulty: this.selectedDifficulty.toLowerCase(),
      durationLimit: Number(this.durationLimit),
      questionCount: Number(this.questionPoolSize),
      voiceEnabled: this.voiceEnabled
    };

    this.interviewService.createSession(config).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        // Robust ID check: backend returns res.interview.id or res.interview._id or res.interviewId
        const interviewId = res.interview?.id || res.interview?._id || res.interviewId || res.id;
        if (res.success && interviewId) {
          this.router.navigate(['/mock-interview/active', interviewId]);
        } else {
          alert('Could not start session. Invalid interview ID returned.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        alert(err.error?.message || err.message || 'Failed to start interview session. Please try again.');
      }
    });
  }
}
