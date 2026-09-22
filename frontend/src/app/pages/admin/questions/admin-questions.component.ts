import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in text-left">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="space-y-1">
          <h2 class="text-2xl font-extrabold text-white">System Question Bank</h2>
          <p class="text-xs text-muted font-medium">Add, update, or deprecate practice questions for technical, HR, and coding mock sessions.</p>
        </div>
        <div class="flex items-center space-x-3">
          <button 
            (click)="exportQuestions()" 
            class="px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 text-xs font-bold text-white transition-colors"
          >
            📥 Export Bank
          </button>
          <button 
            (click)="openAddModal()" 
            class="px-5 py-2.5 rounded-full bg-gradient-primary hover:opacity-95 text-xs font-bold text-white transition-opacity shadow-md"
          >
            + Add Question
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <input 
          type="text" 
          [(ngModel)]="searchQuery" 
          (ngModelChange)="applyFilters()"
          placeholder="Search question prompts..."
          class="w-full bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
        />

        <select 
          [(ngModel)]="selectedCategory" 
          (change)="applyFilters()"
          class="bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
        >
          <option value="all">All Tech Domains</option>
          <option value="Java">Java</option>
          <option value="Angular">Angular</option>
          <option value="Node.js">Node.js</option>
          <option value="Express">Express</option>
          <option value="MongoDB">MongoDB</option>
          <option value="JavaScript">JavaScript</option>
          <option value="TypeScript">TypeScript</option>
          <option value="Python">Python</option>
          <option value="React">React</option>
          <option value="DevOps">DevOps</option>
          <option value="Cloud">Cloud</option>
          <option value="HR">HR</option>
          <option value="Behavioral">Behavioral</option>
          <option value="Coding">Coding</option>
        </select>

        <select 
          [(ngModel)]="selectedDifficulty" 
          (change)="applyFilters()"
          class="bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select 
          [(ngModel)]="selectedType" 
          (change)="applyFilters()"
          class="bg-card border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="Technical">Technical</option>
          <option value="Voice">Voice</option>
          <option value="HR">HR</option>
          <option value="Behavioral">Behavioral</option>
          <option value="Coding">Coding</option>
        </select>
      </div>

      <!-- Question List Table -->
      <div class="glass p-6 rounded-3xl overflow-hidden">
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-white/5 text-muted">
                <th class="pb-3 font-semibold uppercase w-[50%]">Question Prompt</th>
                <th class="pb-3 font-semibold uppercase">Category</th>
                <th class="pb-3 font-semibold uppercase">Difficulty</th>
                <th class="pb-3 font-semibold uppercase">Type</th>
                <th class="pb-3 font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (q of filteredQuestions(); track q._id) {
                <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td class="py-3 font-medium text-white max-w-xs truncate" [title]="q.text">
                    {{ q.text }}
                  </td>
                  <td class="py-3 text-muted uppercase text-[10px] font-bold">{{ q.category }}</td>
                  <td class="py-3">
                    <span 
                      [class.text-success]="q.difficulty === 'easy'"
                      [class.text-warning]="q.difficulty === 'medium'"
                      [class.text-error]="q.difficulty === 'hard'"
                      class="font-bold capitalize text-[10px]"
                    >
                      {{ q.difficulty }}
                    </span>
                  </td>
                  <td class="py-3 text-muted">{{ q.type }}</td>
                  <td class="py-3 space-x-3">
                    <button (click)="openEditModal(q)" class="text-xs text-primary font-bold hover:underline">Edit</button>
                    <button (click)="deleteQuestion(q)" class="text-xs text-error font-bold hover:underline">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-8 text-center text-xs text-muted">No questions found in this folder.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- CREATE / EDIT MODAL -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="glass p-6 rounded-3xl w-full max-w-lg space-y-4 animate-fade-in text-left">
            <div class="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 class="text-sm font-bold text-white uppercase">{{ editQuestionId ? 'Modify Question' : 'Add New Question' }}</h3>
              <button (click)="closeModal()" class="text-muted hover:text-white">✕</button>
            </div>
            
            <div class="space-y-3">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/80">Question Text</label>
                <textarea rows="3" [(ngModel)]="modalQuestion.text" class="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none"></textarea>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-white/80">Question Type</label>
                  <select [(ngModel)]="modalQuestion.type" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                    <option value="Technical">Technical</option>
                    <option value="Voice">Voice</option>
                    <option value="HR">HR</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Coding">Coding</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-white/80">Domain / Tech</label>
                  <select [(ngModel)]="modalQuestion.category" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                    <option value="Java">Java</option>
                    <option value="Angular">Angular</option>
                    <option value="Node.js">Node.js</option>
                    <option value="Express">Express</option>
                    <option value="MongoDB">MongoDB</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="Python">Python</option>
                    <option value="React">React</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Cloud">Cloud</option>
                    <option value="HR">HR</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Coding">Coding</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-white/80">Difficulty</label>
                  <select [(ngModel)]="modalQuestion.difficulty" class="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-white/80">Sample Answer Key / Keywords</label>
                <textarea rows="2" [(ngModel)]="modalQuestion.sampleAnswer" placeholder="e.g. indices, join types, cluster indexing..." class="w-full bg-[#0B1120] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none"></textarea>
              </div>

              @if (modalQuestion.type === 'Coding') {
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-white/80">Coding Editor Stub Template</label>
                  <textarea rows="3" [(ngModel)]="modalQuestion.codeTemplate" placeholder="function solve() { ... }" class="w-full bg-[#070b13] border border-white/10 rounded-xl p-2.5 text-xs text-emerald-400 font-mono focus:outline-none resize-none"></textarea>
                </div>
              }
            </div>

            <div class="flex justify-end space-x-3 pt-2">
              <button (click)="closeModal()" class="px-4 py-2 rounded-full border border-white/10 text-xs font-semibold text-white">Cancel</button>
              <button (click)="saveQuestion()" class="px-5 py-2 rounded-full bg-primary text-xs font-semibold text-white">Save Question</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminQuestionsComponent implements OnInit {
  private adminService = inject(AdminService);

  questions = signal<any[]>([]);
  filteredQuestions = signal<any[]>([]);

  // Search/Filters
  searchQuery = '';
  selectedCategory = 'all';
  selectedDifficulty = 'all';
  selectedType = 'all';

  // Modal Settings
  showModal = signal(false);
  editQuestionId: string | null = null;
  modalQuestion = { text: '', type: 'Technical', difficulty: 'medium', category: 'JavaScript', sampleAnswer: '', codeTemplate: '' };

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.adminService.getQuestions().subscribe({
      next: (res) => {
        if (res.success) {
          this.questions.set(res.questions);
          this.applyFilters();
        }
      }
    });
  }

  applyFilters() {
    let list = this.questions();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item => item.text.toLowerCase().includes(q));
    }

    if (this.selectedCategory !== 'all') {
      list = list.filter(item => item.category === this.selectedCategory);
    }

    if (this.selectedDifficulty !== 'all') {
      list = list.filter(item => item.difficulty === this.selectedDifficulty);
    }

    if (this.selectedType !== 'all') {
      list = list.filter(item => item.type === this.selectedType);
    }

    this.filteredQuestions.set(list);
  }

  openAddModal() {
    this.editQuestionId = null;
    this.modalQuestion = { text: '', type: 'Technical', difficulty: 'medium', category: 'JavaScript', sampleAnswer: '', codeTemplate: '' };
    this.showModal.set(true);
  }

  openEditModal(q: any) {
    this.editQuestionId = q._id;
    this.modalQuestion = {
      text: q.text,
      type: q.type,
      difficulty: q.difficulty,
      category: q.category,
      sampleAnswer: q.sampleAnswer || '',
      codeTemplate: q.codeTemplate || ''
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveQuestion() {
    if (!this.modalQuestion.text.trim()) return;

    if (this.editQuestionId) {
      this.adminService.updateQuestion(this.editQuestionId, this.modalQuestion).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadQuestions();
            this.closeModal();
          }
        }
      });
    } else {
      this.adminService.createQuestion(this.modalQuestion).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadQuestions();
            this.closeModal();
          }
        }
      });
    }
  }

  deleteQuestion(q: any) {
    const doubleCheck = confirm('Delete this question permanently from the system Question Bank?');
    if (doubleCheck) {
      this.adminService.deleteQuestion(q._id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadQuestions();
          }
        }
      });
    }
  }

  exportQuestions() {
    const list = this.filteredQuestions();
    let csv = 'Text,Type,Difficulty,Category,SampleAnswer\n';
    list.forEach(q => {
      csv += `"${q.text.replace(/"/g, '""')}","${q.type}","${q.difficulty}","${q.category}","${(q.sampleAnswer || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Intervexa-AI-Question-Bank.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
