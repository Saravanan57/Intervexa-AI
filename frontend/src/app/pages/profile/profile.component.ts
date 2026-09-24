import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-8 relative text-left overflow-x-hidden">
      <div class="space-y-2 animate-fade-in text-left">
        <span class="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">Candidate Profile</span>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-[#111827] break-words">Your Candidate Profile</h2>
        <p class="text-xs text-muted">Manage your personal credentials, portfolio projects, and interview target preferences.</p>
      </div>

      @if (successMessage()) {
        <div class="bg-success/10 border border-success/20 text-success text-xs rounded-xl p-3.5 flex justify-between items-center shadow-sm">
          <span>🎉 {{ successMessage() }}</span>
          <button (click)="successMessage.set(null)" class="text-success font-bold hover:opacity-85">✕</button>
        </div>
      }

      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left details column (Personal Info + Socials) -->
        <div class="lg:col-span-1 space-y-6">
          <div class="glass p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-5 shadow-sm text-left">
            <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Personal Info</h3>
            
            <div class="space-y-3.5">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  formControlName="name" 
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text" 
                  formControlName="phone" 
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">College / University</label>
                <input 
                  type="text" 
                  formControlName="college" 
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Experience (Years)</label>
                <input 
                  type="number" 
                  formControlName="experience" 
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Target Job Role</label>
                <input 
                  type="text" 
                  formControlName="preferredJobRole" 
                  placeholder="e.g. Lead Frontend Developer"
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Preferred Language</label>
                <select 
                  formControlName="preferredInterviewLanguage"
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
              </div>
            </div>
          </div>

          <div class="glass p-6 rounded-3xl space-y-5 shadow-sm text-left">
            <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Social Links</h3>
            
            <div class="space-y-3.5">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">LinkedIn URL</label>
                <input 
                  type="text" 
                  formControlName="linkedIn" 
                  placeholder="linkedin.com/in/username"
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">GitHub Profile</label>
                <input 
                  type="text" 
                  formControlName="gitHub" 
                  placeholder="github.com/username"
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Portfolio Website</label>
                <input 
                  type="text" 
                  formControlName="portfolioWebsite" 
                  placeholder="portfolio.io"
                  class="w-full bg-white border border-[#D9E2F1] rounded-xl px-4 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right columns (Education, Projects, Certificates) -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Education Array -->
          <div class="glass p-6 rounded-3xl space-y-4 shadow-sm text-left">
            <div class="flex justify-between items-center">
              <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Education</h3>
              <button 
                type="button" 
                (click)="addEducation()" 
                class="text-[10px] font-bold bg-white border border-[#D9E2F1] hover:bg-[#0145F2]/5 text-[#111827] py-1.5 px-4 rounded-full transition-colors shadow-sm"
              >
                + Add School
              </button>
            </div>

            <div formArrayName="education" class="space-y-4">
              @for (edu of education.controls; track $index; let i = $index) {
                <div [formGroupName]="i" class="p-5 bg-white border border-[#D9E2F1] rounded-2xl relative space-y-3 shadow-sm hover:scale-[1.01] transition-transform">
                  <button 
                    type="button" 
                    (click)="removeEducation(i)" 
                    class="absolute top-4 right-4 text-[10px] text-error font-extrabold uppercase hover:opacity-80"
                  >
                    ✕ Remove
                  </button>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-left">
                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-[#4B5563] uppercase">Institution</label>
                      <input type="text" formControlName="institution" class="w-full bg-white border border-[#D9E2F1] rounded-lg px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-primary" />
                    </div>
                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-[#4B5563] uppercase">Degree & Field</label>
                      <input type="text" formControlName="degree" placeholder="BS, Computer Science" class="w-full bg-white border border-[#D9E2F1] rounded-lg px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4 text-left">
                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-[#4B5563] uppercase">Start Year</label>
                      <input type="number" formControlName="startYear" class="w-full bg-white border border-[#D9E2F1] rounded-lg px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-primary" />
                    </div>
                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-[#4B5563] uppercase">End Year</label>
                      <input type="number" formControlName="endYear" class="w-full bg-white border border-[#D9E2F1] rounded-lg px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Projects Array -->
          <div class="glass p-6 rounded-3xl space-y-4 shadow-sm text-left">
            <div class="flex justify-between items-center">
              <h3 class="text-xs font-bold text-[#111827] uppercase tracking-wider">Projects</h3>
              <button 
                type="button" 
                (click)="addProject()" 
                class="text-[10px] font-bold bg-white border border-[#D9E2F1] hover:bg-[#0145F2]/5 text-[#111827] py-1.5 px-4 rounded-full transition-colors shadow-sm"
              >
                + Add Project
              </button>
            </div>

            <div formArrayName="projects" class="space-y-4">
              @for (proj of projects.controls; track $index; let i = $index) {
                <div [formGroupName]="i" class="p-5 bg-white border border-[#D9E2F1] rounded-2xl relative space-y-3 shadow-sm hover:scale-[1.01] transition-transform">
                  <button 
                    type="button" 
                    (click)="removeProject(i)" 
                    class="absolute top-4 right-4 text-[10px] text-error font-extrabold uppercase hover:opacity-80"
                  >
                    ✕ Remove
                  </button>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-left">
                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-[#4B5563] uppercase">Project Name</label>
                      <input type="text" formControlName="name" class="w-full bg-white border border-[#D9E2F1] rounded-lg px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-primary" />
                    </div>
                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-[#4B5563] uppercase">Code / Live Link</label>
                      <input type="text" formControlName="link" placeholder="github.com/..." class="w-full bg-white border border-[#D9E2F1] rounded-lg px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-primary" />
                    </div>
                  </div>

                  <div class="space-y-1 text-left">
                    <label class="text-[9px] font-bold text-[#4B5563] uppercase">Project Description</label>
                    <textarea formControlName="description" rows="2" class="w-full bg-white border border-[#D9E2F1] rounded-lg p-2.5 text-xs text-[#111827] focus:outline-none resize-none focus:border-primary"></textarea>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Submit Bar -->
          <div class="flex justify-stretch sm:justify-end pt-4">
            <button 
              type="submit" 
              [disabled]="profileForm.invalid || isSaving()"
              class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-primary text-xs font-bold text-white shadow-lg shadow-primary/10 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              @if (isSaving()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving Changes...</span>
              } @else {
                <span>Save Profile Changes</span>
              }
            </button>
          </div>
        </div>

      </form>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  profileForm!: FormGroup;
  isSaving = signal(false);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    this.initForm();
    this.populateForm();
  }

  initForm() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      college: [''],
      experience: [0, [Validators.required, Validators.min(0)]],
      preferredJobRole: [''],
      preferredInterviewLanguage: ['English'],
      linkedIn: [''],
      gitHub: [''],
      portfolioWebsite: [''],
      education: this.fb.array([]),
      projects: this.fb.array([])
    });
  }

  // Getters for arrays
  get education() {
    return this.profileForm.get('education') as FormArray;
  }

  get projects() {
    return this.profileForm.get('projects') as FormArray;
  }

  populateForm() {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        phone: user.phone || '',
        college: user.college || '',
        experience: user.experience || 0,
        preferredJobRole: user.preferredJobRole || '',
        preferredInterviewLanguage: user.preferredInterviewLanguage || 'English',
        linkedIn: user.linkedIn || '',
        gitHub: user.gitHub || '',
        portfolioWebsite: user.portfolioWebsite || ''
      });

      // Populate Education Array
      if (user.education && user.education.length > 0) {
        user.education.forEach((edu: any) => {
          this.education.push(this.fb.group({
            institution: [edu.institution || ''],
            degree: [edu.degree || ''],
            startYear: [edu.startYear],
            endYear: [edu.endYear]
          }));
        });
      }

      // Populate Projects Array
      if (user.projects && user.projects.length > 0) {
        user.projects.forEach((proj: any) => {
          this.projects.push(this.fb.group({
            name: [proj.name || ''],
            description: [proj.description || ''],
            link: [proj.link || '']
          }));
        });
      }
    }
  }

  addEducation() {
    this.education.push(this.fb.group({
      institution: ['', Validators.required],
      degree: ['', Validators.required],
      startYear: [''],
      endYear: ['']
    }));
  }

  removeEducation(index: number) {
    this.education.removeAt(index);
  }

  addProject() {
    this.projects.push(this.fb.group({
      name: ['', Validators.required],
      description: [''],
      link: ['']
    }));
  }

  removeProject(index: number) {
    this.projects.removeAt(index);
  }

  onSubmit() {
    if (this.profileForm.invalid) return;

    this.isSaving.set(true);
    this.successMessage.set(null);

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.successMessage.set('Profile changes saved successfully.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        alert(err.message || 'Failed to update profile.');
      }
    });
  }
}
