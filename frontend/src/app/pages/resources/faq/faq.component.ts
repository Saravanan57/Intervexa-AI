import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FaqItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-12 px-6 md:px-12 transition-colors duration-200">
      <div class="max-w-4xl mx-auto space-y-8">
        
        <!-- Header -->
        <div class="text-center space-y-4">
          <span class="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Resources & Help
          </span>
          <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p class="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
            Everything you need to know about Intervexa AI's ATS resume scoring, voice proctored mock interviews, and career readiness index.
          </p>
        </div>

        <!-- Filter Chips -->
        <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button 
            *ngFor="let cat of categories"
            (click)="selectCategory(cat)"
            [class]="selectedCategory() === cat 
              ? 'bg-purple-600 text-white font-medium px-4 py-2 rounded-xl text-xs shadow-md transition-all'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 transition-all'">
            {{ cat }}
          </button>
        </div>

        <!-- Accordion List -->
        <div class="space-y-4 pt-4">
          <div 
            *ngFor="let item of filteredFaqs(); trackBy: trackById"
            class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            
            <button 
              (click)="toggleFaq(item.id)"
              class="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-purple-500/50">
              <span class="text-base font-semibold text-slate-900 dark:text-white pr-4">
                {{ item.question }}
              </span>
              <span class="text-purple-600 dark:text-purple-400 text-xl transition-transform duration-200 transform"
                [class.rotate-180]="item.isOpen">
                ↓
              </span>
            </button>

            <div 
              *ngIf="item.isOpen"
              class="px-6 pb-6 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50">
              {{ item.answer }}
            </div>

          </div>
        </div>

        <!-- CTA Box -->
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white text-center space-y-4 shadow-xl mt-12">
          <h2 class="text-2xl font-bold">Have more questions?</h2>
          <p class="text-purple-100 text-sm max-w-xl mx-auto">
            Our support team and AI career advisors are ready to assist you anytime.
          </p>
          <div class="pt-2">
            <a 
              routerLink="/legal/support"
              class="inline-block bg-white text-purple-700 font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-md text-sm">
              Contact Support Desk →
            </a>
          </div>
        </div>

      </div>
    </div>
  `
})
export class FaqComponent {
  categories = ['All', 'ATS Resume', 'Mock Interview', 'Account & Privacy', 'Billing'];
  selectedCategory = signal<string>('All');

  faqs = signal<FaqItem[]>([
    {
      id: 1,
      category: 'ATS Resume',
      question: 'How accurate is the Intervexa AI ATS Resume Analyzer?',
      answer: 'Our ATS engine parses formatting, keywords, section hierarchies, and skills alignment against top enterprise ATS algorithms (Greenhouse, Lever, Workday) delivering over 95% accuracy compared to real recruiter screening metrics.',
      isOpen: true
    },
    {
      id: 2,
      category: 'ATS Resume',
      question: 'What file formats are supported for resume uploads?',
      answer: 'Intervexa AI supports PDF (.pdf) and Microsoft Word (.docx) documents up to 10MB in size.',
      isOpen: false
    },
    {
      id: 3,
      category: 'Mock Interview',
      question: 'How does the Real-Time Voice Speech Analysis work during interviews?',
      answer: 'During a live mock session, your browser captures audio input and feeds real-time speech analytics measuring filler word frequency, clarity, confidence score, and technical response depth using advanced AI models.',
      isOpen: false
    },
    {
      id: 4,
      category: 'Mock Interview',
      question: 'Can I practice specific domains like Frontend, Backend, or Data Science?',
      answer: 'Yes! You can select specific job roles, technologies (React, Node, Python, System Design), and difficulty levels (Junior, Mid, Senior, Lead).',
      isOpen: false
    },
    {
      id: 5,
      category: 'Account & Privacy',
      question: 'Is my uploaded resume data secure and kept confidential?',
      answer: 'Absolutely. All resume documents and interview voice transcripts are encrypted in transit via SSL/TLS and at rest with AES-256 encryption. We never share or sell candidate data.',
      isOpen: false
    },
    {
      id: 6,
      category: 'Billing',
      question: 'Is Intervexa AI free to use for job seekers?',
      answer: 'Intervexa AI offers a robust Free tier including full ATS resume scoring, candidate dashboard metrics, and starter mock interview sessions.',
      isOpen: false
    }
  ]);

  selectCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  toggleFaq(id: number) {
    this.faqs.update(items =>
      items.map(item => item.id === id ? { ...item, isOpen: !item.isOpen } : item)
    );
  }

  filteredFaqs() {
    const cat = this.selectedCategory();
    if (cat === 'All') return this.faqs();
    return this.faqs().filter(f => f.category === cat);
  }

  trackById(index: number, item: FaqItem) {
    return item.id;
  }
}
