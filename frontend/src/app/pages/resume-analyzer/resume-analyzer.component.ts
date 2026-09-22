import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResumeService } from '../../core/services/resume.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';

@Component({
  selector: 'app-resume-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-8 relative text-left box-border overflow-hidden">
      <!-- Header -->
      <div class="space-y-2 text-left animate-fade-in max-w-full">
        <span class="inline-block text-[10px] font-bold text-[#0145F2] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
          ATS Resume Scanner
        </span>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-[#111827] break-words">AI Resume Analyzer</h2>
        <p class="text-xs text-slate-500 max-w-2xl leading-relaxed">
          Upload your resume and compare it against any job description to get ATS match scores, missing keyword audits, and actionable feedback.
        </p>
      </div>

      <!-- IF RESULT IS AVAILABLE: SHOW ATS DASHBOARD RESULT -->
      @if (analysisResult()) {
        @let resume = analysisResult()!;
        <div class="space-y-6 sm:space-y-8 animate-fade-in min-w-0">
          
          <!-- Top Action Bar & Scorecard Hero -->
          <div class="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xl space-y-6 min-w-0 box-border overflow-hidden">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-100 pb-6 min-w-0">
              
              <div class="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 min-w-0 w-full md:w-auto">
                <!-- Circular Score Gauge -->
                <div class="relative w-20 sm:w-24 h-20 sm:h-24 flex items-center justify-center shrink-0">
                  <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="#F1F5F9" stroke-width="8" fill="transparent"/>
                    <circle 
                      cx="50" cy="50" r="42" 
                      [attr.stroke]="resume.score >= 80 ? '#10B981' : (resume.score >= 60 ? '#F59E0B' : '#EF4444')" 
                      stroke-width="8" 
                      fill="transparent"
                      [attr.stroke-dasharray]="263.8"
                      [attr.stroke-dashoffset]="263.8 - (263.8 * resume.score) / 100"
                      stroke-linecap="round"
                      class="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div class="absolute flex flex-col items-center justify-center">
                    <span class="text-xl sm:text-2xl font-black text-[#111827]">{{ resume.score }}%</span>
                    <span class="text-[8px] font-bold text-slate-400 uppercase tracking-wider">ATS MATCH</span>
                  </div>
                </div>

                <div class="space-y-1 min-w-0 text-center sm:text-left">
                  <h3 class="text-xl sm:text-2xl font-bold text-[#111827] truncate max-w-full">{{ resume.fileName }}</h3>
                  <p class="text-xs text-slate-500">
                    Job Match Index: <span class="font-bold text-[#0145F2]">{{ resume.jobReadinessPercentage || resume.score }}%</span>
                  </p>
                  @if (resume.overallRecommendation) {
                    <p class="text-xs text-slate-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl mt-2 break-words">
                      💡 {{ resume.overallRecommendation }}
                    </p>
                  }
                </div>
              </div>

              <div class="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
                <button 
                  (click)="resetAnalysis()"
                  class="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm text-center"
                >
                  🔄 Analyze New Resume
                </button>
                <button 
                  (click)="printReport()"
                  class="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-[#0145F2] to-[#1E5BFA] text-xs font-bold text-white shadow-md hover:opacity-95 transition-all text-center"
                >
                  📥 Download Report
                </button>
              </div>
            </div>

            <!-- Tab Navigation (Horizontally scrollable on small mobile screens) -->
            <div class="flex border-b border-slate-200 text-xs font-bold space-x-4 sm:space-x-6 overflow-x-auto pb-1 scrollbar-none">
              <button 
                (click)="activeTab.set('overview')" 
                [class.text-[#0145F2]]="activeTab() === 'overview'"
                [class.border-[#0145F2]]="activeTab() === 'overview'"
                class="pb-3 border-b-2 border-transparent transition-all shrink-0"
              >
                Match Overview
              </button>
              <button 
                (click)="activeTab.set('keywords')" 
                [class.text-[#0145F2]]="activeTab() === 'keywords'"
                [class.border-[#0145F2]]="activeTab() === 'keywords'"
                class="pb-3 border-b-2 border-transparent transition-all shrink-0"
              >
                Keyword Audit
              </button>
              <button 
                (click)="activeTab.set('sections')" 
                [class.text-[#0145F2]]="activeTab() === 'sections'"
                [class.border-[#0145F2]]="activeTab() === 'sections'"
                class="pb-3 border-b-2 border-transparent transition-all shrink-0"
              >
                Section Feedback
              </button>
              <button 
                (click)="activeTab.set('audit')" 
                [class.text-[#0145F2]]="activeTab() === 'audit'"
                [class.border-[#0145F2]]="activeTab() === 'audit'"
                class="pb-3 border-b-2 border-transparent transition-all shrink-0"
              >
                Formatting & Grammar
              </button>
            </div>

            <!-- TAB 1: OVERVIEW -->
            @if (activeTab() === 'overview') {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 min-w-0">
                <!-- Summary Card -->
                <div class="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 min-w-0 box-border">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">Profile AI Summary</h4>
                  <p class="text-xs text-slate-700 leading-relaxed break-words">{{ resume.summary }}</p>
                </div>

                <!-- Core Strengths -->
                <div class="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 min-w-0 box-border">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-600">Core Strengths</h4>
                  <ul class="space-y-2">
                    @for (str of resume.strengths; track str) {
                      <li class="flex items-start text-xs text-slate-700 min-w-0">
                        <span class="text-emerald-500 mr-2 font-bold shrink-0">✓</span>
                        <span class="break-words min-w-0">{{ str }}</span>
                      </li>
                    }
                  </ul>
                </div>
              </div>
            }

            <!-- TAB 2: KEYWORDS & MISSING SKILLS -->
            @if (activeTab() === 'keywords') {
              <div class="space-y-6 pt-2 min-w-0">
                <!-- Matched Keywords -->
                <div class="space-y-3 min-w-0">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Matched Keywords (Found in Resume & Job Description)
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    @for (kw of (resume.keywordMatch || resume.skills); track kw) {
                      <span class="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center break-words max-w-full">
                        <span class="mr-1.5 shrink-0">✓</span> <span class="truncate">{{ kw }}</span>
                      </span>
                    } @empty {
                      <p class="text-xs text-slate-400">No matched keywords detected.</p>
                    }
                  </div>
                </div>

                <!-- Missing Keywords -->
                <div class="space-y-3 min-w-0">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-amber-600">
                    Missing Skills & High-Impact Keywords (Add to Boost ATS Ranking)
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    @for (kw of (resume.missingSkills || resume.keywordSuggestions); track kw) {
                      <span class="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center break-words max-w-full">
                        <span class="mr-1.5 shrink-0">⚠️</span> <span class="truncate">{{ kw }}</span>
                      </span>
                    } @empty {
                      <p class="text-xs text-slate-400">Great job! No major missing skills identified.</p>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- TAB 3: SECTION-WISE FEEDBACK -->
            @if (activeTab() === 'sections') {
              <div class="space-y-4 pt-2 min-w-0">
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 min-w-0 box-border">
                  <h5 class="text-xs font-bold text-slate-800">Summary Section</h5>
                  <p class="text-xs text-slate-600 leading-relaxed break-words">
                    {{ resume.sectionFeedback?.summary || 'Summary accurately represents your background. Ensure key technical tools are mentioned in the first 2 sentences.' }}
                  </p>
                </div>

                <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 min-w-0 box-border">
                  <h5 class="text-xs font-bold text-slate-800">Experience Section</h5>
                  <p class="text-xs text-slate-600 leading-relaxed break-words">
                    {{ resume.sectionFeedback?.experience || 'Bullet points are clear. Use action verbs and metric metrics (e.g. improved performance by 30%).' }}
                  </p>
                </div>

                <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 min-w-0 box-border">
                  <h5 class="text-xs font-bold text-slate-800">Skills Section</h5>
                  <p class="text-xs text-slate-600 leading-relaxed break-words">
                    {{ resume.sectionFeedback?.skills || 'Skills are parsed correctly. Ensure high priority job keywords appear at the top.' }}
                  </p>
                </div>
              </div>
            }

            <!-- TAB 4: AUDIT -->
            @if (activeTab() === 'audit') {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 min-w-0">
                <div class="space-y-3 min-w-0">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">Grammar Recommendations</h4>
                  <div class="space-y-2 min-w-0">
                    @for (g of resume.grammarIssues; track g.text) {
                      <div class="p-3 bg-red-50/50 border border-red-100 rounded-xl text-xs space-y-1 min-w-0 box-border">
                        <span class="text-red-600 line-through block break-words">{{ g.text }}</span>
                        <span class="text-emerald-600 font-bold block break-words">→ {{ g.suggestion }}</span>
                      </div>
                    } @empty {
                      <p class="text-xs text-slate-400">No major grammar errors detected.</p>
                    }
                  </div>
                </div>

                <div class="space-y-3 min-w-0">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">Formatting Audit</h4>
                  <div class="space-y-2 min-w-0">
                    @for (f of resume.formattingIssues; track f.text) {
                      <div class="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs space-y-1 min-w-0 box-border">
                        <span class="text-amber-700 block font-semibold break-words">{{ f.text }}</span>
                        <span class="text-slate-600 block break-words">Suggestion: {{ f.suggestion }}</span>
                      </div>
                    } @empty {
                      <p class="text-xs text-slate-400">Formatting structure is ATS friendly.</p>
                    }
                  </div>
                </div>
              </div>
            }

          </div>

        </div>
      } @else {
        <!-- INPUT STEPS (AVAILABLE TO GUEST CANDIDATES WITHOUT LOGIN) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 min-w-0">
          
          <!-- LEFT / STEPS COLUMN (Steps 1 & 2) -->
          <div class="lg:col-span-8 space-y-6 min-w-0">
            
            <!-- STEP 1: UPLOAD RESUME -->
            <div class="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-4 min-w-0 box-border">
              <div class="flex items-center space-x-3">
                <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0145F2] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <div>
                  <h3 class="text-sm sm:text-base font-bold text-slate-900">Step 1: Upload Resume</h3>
                  <p class="text-xs text-slate-500">Upload your resume in PDF or DOCX format (Max 10MB)</p>
                </div>
              </div>

              <!-- Drag & Drop Box -->
              <div 
                (dragover)="onDragOver($event)" 
                (dragleave)="onDragLeave($event)" 
                (drop)="onDrop($event)"
                [class.border-[#0145F2]]="isDragging()"
                [class.bg-blue-50/50]="isDragging()"
                class="border-2 border-dashed border-slate-200 hover:border-[#0145F2]/60 rounded-2xl p-5 sm:p-8 text-center space-y-4 transition-all cursor-pointer bg-slate-50/30 flex flex-col items-center justify-center min-h-[160px] max-w-full box-border"
              >
                @if (selectedFile()) {
                  <div class="flex items-center space-x-3 sm:space-x-4 bg-white border border-slate-200 p-3.5 sm:p-4 rounded-xl shadow-sm max-w-full box-border">
                    <span class="text-xl sm:text-2xl shrink-0">📄</span>
                    <div class="text-left min-w-0 truncate">
                      <p class="text-xs font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs">{{ selectedFile()?.name }}</p>
                      <p class="text-[10px] text-slate-400">{{ (selectedFile()!.size / 1024 / 1024).toFixed(2) }} MB</p>
                    </div>
                    <button (click)="clearSelectedFile($event)" class="text-xs text-red-500 hover:underline font-bold ml-2 shrink-0">
                      Remove
                    </button>
                  </div>
                } @else {
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-[#0145F2] flex items-center justify-center mb-1 shrink-0">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                  </div>
                  <div class="space-y-1">
                    <p class="text-xs font-bold text-slate-800">Drag & Drop your resume here</p>
                    <p class="text-[11px] text-slate-400">or click button below to select file</p>
                  </div>
                  <label class="px-5 py-2 rounded-full bg-white border border-slate-200 hover:border-[#0145F2] text-xs font-bold text-slate-800 cursor-pointer shadow-sm transition-all inline-block">
                    Browse File
                    <input type="file" (change)="onFileChange($event)" class="hidden" accept=".pdf,.docx,.doc" />
                  </label>
                }
              </div>
            </div>

            <!-- STEP 2: PASTE JOB DESCRIPTION -->
            <div class="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-4 min-w-0 box-border">
              <div class="flex items-center space-x-3">
                <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0145F2] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <div>
                  <h3 class="text-sm sm:text-base font-bold text-slate-900">Step 2: Paste Job Description</h3>
                  <p class="text-xs text-slate-500">Copy & paste the full target job posting to run ATS keyword comparison</p>
                </div>
              </div>

              <textarea 
                [(ngModel)]="jobDescription"
                rows="6"
                placeholder="Paste the target job description here (e.g. Responsibilities, Required Skills, Tech Stack)..."
                class="w-full max-w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 focus:outline-none focus:border-[#0145F2] focus:bg-white transition-all leading-relaxed box-border"
              ></textarea>
            </div>

            <!-- STEP 3: ACTION BUTTON -->
            <div class="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 min-w-0 box-border">
              <div class="text-center sm:text-left">
                <p class="text-xs font-bold text-slate-900">Ready to compare with AI?</p>
                <p class="text-[11px] text-slate-500">Our engine evaluates ATS keyword density and formatting match.</p>
              </div>

              <button 
                (click)="onViewAnalysisClick()"
                [disabled]="!selectedFile() || isLoading()"
                class="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#0145F2] to-[#1E5BFA] text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:opacity-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center space-x-2 box-border shrink-0"
              >
                @if (isLoading()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Analyzing Resume...</span>
                } @else {
                  <span>View AI Analysis</span>
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                }
              </button>
            </div>

          </div>

          <!-- RIGHT / INFO & HISTORY COLUMN -->
          <div class="lg:col-span-4 space-y-6 min-w-0">
            <!-- Information Box -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-5 sm:p-6 space-y-3 text-left box-border">
              <span class="text-xl">✨</span>
              <h4 class="text-sm font-bold text-slate-900">How ATS Matching Works</h4>
              <p class="text-xs text-slate-600 leading-relaxed break-words">
                Applicant Tracking Systems (ATS) scan for exact keyword alignment. By comparing your resume against the JD, we uncover missing skills before recruiters reject your application.
              </p>
            </div>

            <!-- Analysis History (Shown if user logged in) -->
            @if (authService.isAuthenticated()) {
              <div class="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 text-left shadow-sm min-w-0 box-border">
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Analysis History</h3>
                <div class="space-y-2.5 min-w-0">
                  @for (item of history(); track item._id) {
                    <div 
                      (click)="selectHistoryItem(item)"
                      class="p-3 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl cursor-pointer transition-all flex items-center justify-between min-w-0"
                    >
                      <div class="space-y-0.5 min-w-0 truncate pr-2">
                        <p class="text-xs font-bold text-slate-800 truncate">{{ item.fileName }}</p>
                        <p class="text-[10px] text-slate-400 truncate">{{ item.createdAt | date:'shortDate' }}</p>
                      </div>
                      <span class="text-xs font-extrabold text-[#0145F2] bg-blue-50 px-2 py-1 rounded-lg shrink-0">
                        {{ item.score }}%
                      </span>
                    </div>
                  } @empty {
                    <p class="text-xs text-slate-400 py-2 text-center">No previous uploads found.</p>
                  }
                </div>
              </div>
            }
          </div>

        </div>
      }
    </div>
  `
})
export class ResumeAnalyzerComponent implements OnInit {
  resumeService = inject(ResumeService);
  authService = inject(AuthService);
  authModalService = inject(AuthModalService);

  selectedFile = signal<File | null>(null);
  jobDescription = '';
  isDragging = signal(false);
  isLoading = signal(false);
  analysisResult = signal<any | null>(null);
  activeTab = signal<'overview' | 'keywords' | 'sections' | 'audit'>('overview');
  history = signal<any[]>([]);

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadHistory();
      this.checkAndRestorePendingWorkflow();
    }
  }

  loadHistory() {
    this.resumeService.getHistory().subscribe({
      next: (res) => {
        if (res.success && res.resumes) {
          this.history.set(res.resumes);
        }
      }
    });
  }

  checkAndRestorePendingWorkflow() {
    const pending = this.authModalService.getPendingResume();
    if (pending && pending.fileBase64) {
      this.isLoading.set(true);
      const blob = this.base64ToBlob(pending.fileBase64, pending.fileType);
      
      this.resumeService.analyzeResumeData(blob, pending.fileName, pending.jobDescription).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.authModalService.clearPendingResume();
          if (res.success && res.resume) {
            this.analysisResult.set(res.resume);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.authModalService.clearPendingResume();
        }
      });
    }
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.handleFile(e.dataTransfer.files[0]);
    }
  }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
      alert('Please upload a PDF or DOCX file.');
      return;
    }
    this.selectedFile.set(file);
  }

  clearSelectedFile(e: Event) {
    e.stopPropagation();
    this.selectedFile.set(null);
  }

  onViewAnalysisClick() {
    const file = this.selectedFile();
    if (!file) return;

    // RULE: IF USER IS NOT LOGGED IN -> SAVE TO PENDING & OPEN AUTH MODAL
    if (!this.authService.isAuthenticated()) {
      this.convertFileToBase64(file).then(base64 => {
        this.authModalService.savePendingResume({
          fileName: file.name,
          fileType: file.type || 'application/pdf',
          fileBase64: base64,
          jobDescription: this.jobDescription
        });

        this.authModalService.openModal(
          'Please login to view your AI Resume Analysis.',
          'login',
          () => {
            // Callback executed automatically after successful login
            this.checkAndRestorePendingWorkflow();
          }
        );
      });
      return;
    }

    // IF LOGGED IN -> DIRECT ANALYZE
    this.executeAnalysis(file, this.jobDescription);
  }

  executeAnalysis(file: File, jd: string) {
    this.isLoading.set(true);
    this.resumeService.analyzeResume(file, jd).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.resume) {
          this.analysisResult.set(res.resume);
          this.loadHistory();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        alert(err.error?.message || 'Resume analysis failed. Please try again.');
      }
    });
  }

  selectHistoryItem(item: any) {
    this.analysisResult.set(item);
  }

  resetAnalysis() {
    this.analysisResult.set(null);
    this.selectedFile.set(null);
    this.jobDescription = '';
  }

  printReport() {
    window.print();
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private base64ToBlob(base64: string, type: string): Blob {
    const arr = base64.split(',');
    const bstr = atob(arr[1] || arr[0]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: type });
  }
}
