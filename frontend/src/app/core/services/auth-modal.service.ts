import { Injectable, signal } from '@angular/core';

export interface PendingResumeWorkflow {
  fileName: string;
  fileType: string;
  fileBase64: string;
  jobDescription: string;
}

export interface PendingInterviewWorkflow {
  type: string;
  domain: string;
  experience: string;
  difficulty: string;
  durationLimit: number;
  questionPoolSize: number;
  voiceEnabled: boolean;
  jobRole: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthModalService {
  isOpen = signal<boolean>(false);
  mode = signal<'login' | 'register'>('login');
  message = signal<string>('Please sign in to continue accessing AI features.');
  private callback: (() => void) | null = null;

  openModal(message?: string, mode: 'login' | 'register' = 'login', callback?: () => void) {
    if (message) {
      this.message.set(message);
    } else {
      this.message.set('Please sign in to continue accessing AI features.');
    }
    this.mode.set(mode);
    this.callback = callback || null;
    this.isOpen.set(true);
  }

  closeModal() {
    this.isOpen.set(false);
  }

  setMode(mode: 'login' | 'register') {
    this.mode.set(mode);
  }

  handleAuthSuccess() {
    this.isOpen.set(false);
    if (this.callback) {
      const cb = this.callback;
      this.callback = null;
      cb();
    }
  }

  // SessionStorage workflow helpers
  savePendingResume(data: PendingResumeWorkflow) {
    sessionStorage.setItem('pending_resume_data', JSON.stringify(data));
  }

  getPendingResume(): PendingResumeWorkflow | null {
    const data = sessionStorage.getItem('pending_resume_data');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  clearPendingResume() {
    sessionStorage.removeItem('pending_resume_data');
  }

  savePendingInterview(data: PendingInterviewWorkflow) {
    sessionStorage.setItem('pending_mock_interview', JSON.stringify(data));
  }

  getPendingInterview(): PendingInterviewWorkflow | null {
    const data = sessionStorage.getItem('pending_mock_interview');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  clearPendingInterview() {
    sessionStorage.removeItem('pending_mock_interview');
  }
}
