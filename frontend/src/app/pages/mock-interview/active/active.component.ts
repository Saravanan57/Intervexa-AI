import { Component, inject, OnInit, OnDestroy, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InterviewService } from '../../../core/services/interview.service';

export type SpeechState =
  | 'idle'
  | 'speakingQuestion'
  | 'releasingAudio'
  | 'startingRecognition'
  | 'listening'
  | 'paused'
  | 'processing';

@Component({
  selector: 'app-active-interview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-8 relative text-left overflow-x-hidden">
      
      <!-- PHASE 1: PRE-INTERVIEW SYSTEM CHECK -->
      @if (isCheckingSystem()) {
        <div class="max-w-3xl mx-auto glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl space-y-6 animate-fade-in shadow-sm">
          <div class="text-center space-y-2">
            <span class="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">Device Configuration</span>
            <h3 class="text-2xl font-extrabold text-[#111827]">System Check Wizard</h3>
            <p class="text-xs text-muted">Test your devices below to ensure optimal AI mock assessments.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <!-- Camera & Canvas Video Preview -->
            <div class="bg-[#EDF1F5]/40 border border-[#D9E2F1] rounded-2xl p-5 flex flex-col items-center justify-center space-y-3 min-h-[220px]">
              <span class="text-xs font-bold text-[#111827] uppercase tracking-wider">Webcam Preview</span>
              <div class="w-full h-36 bg-[#F8FAFC] border border-[#D9E2F1] rounded-xl overflow-hidden relative flex items-center justify-center shadow-inner">
                <video #webcamPreview autoplay playsinline [muted]="true" class="w-full h-full object-cover"></video>
                @if (!hasCameraPermission()) {
                  <span class="text-[10px] text-muted absolute flex items-center"><span class="w-2 h-2 rounded-full bg-error mr-2 animate-ping"></span>Camera offline or loading permissions...</span>
                }
              </div>
            </div>

            <!-- Mic & Volume Meter -->
            <div class="bg-[#EDF1F5]/40 border border-[#D9E2F1] rounded-2xl p-5 flex flex-col justify-between min-h-[220px] text-left">
              <div class="space-y-2">
                <span class="text-xs font-bold text-[#111827] uppercase tracking-wider">Microphone Tester</span>
                <p class="text-[10px] text-muted leading-relaxed">Speak into your microphone. The meter below should dance dynamically.</p>
              </div>

              <!-- Meter visualizer -->
              <div class="space-y-2.5">
                <div class="flex justify-between text-[9px] font-bold text-muted uppercase tracking-wider">
                  <span>INPUT LEVEL:</span>
                  <span class="text-primary font-bold">{{ micVolume() }}%</span>
                </div>
                <div class="w-full h-4 bg-white border border-[#D9E2F1] rounded-full overflow-hidden flex items-center px-1">
                  <div class="h-2 bg-gradient-primary rounded-full transition-all duration-75" [style.width.%]="micVolume()"></div>
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <span 
                  [class.bg-success]="hasMicPermission()" 
                  [class.bg-error]="!hasMicPermission()" 
                  class="w-2.5 h-2.5 rounded-full"
                ></span>
                <span class="text-[10px] font-bold uppercase text-[#111827]">{{ hasMicPermission() ? 'Mic Connected' : 'Mic Disconnected' }}</span>
              </div>
            </div>
          </div>

          <!-- Speakers Tester -->
          <div class="p-4 bg-[#EDF1F5]/20 border border-[#D9E2F1] rounded-2xl flex justify-between items-center shadow-sm">
            <div class="space-y-0.5 text-left">
              <h4 class="text-xs font-bold text-[#111827]">Speaker Sound Check</h4>
              <p class="text-[10px] text-muted">Play a sample chime to verify speaker clarity.</p>
            </div>
            <button 
              (click)="playSampleChime()" 
              class="px-4 py-2 rounded-full bg-white border border-[#D9E2F1] hover:bg-[#0145F2]/5 text-[10px] font-bold text-[#111827] transition-all shadow-sm flex items-center space-x-1.5"
            >
              <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
              <span>Play Sound</span>
            </button>
          </div>

          <!-- Next button -->
          <div class="flex justify-end pt-4 border-t border-[#D9E2F1]">
            <button 
              (click)="startCountdown()" 
              [disabled]="!hasMicPermission()"
              class="px-8 py-3 rounded-full bg-gradient-primary text-xs font-bold shadow-lg shadow-primary/10 text-white disabled:opacity-50 transition-all"
            >
              Proctor Verification Complete
            </button>
          </div>
        </div>
      }

      <!-- PHASE 2: STARTING COUNTDOWN -->
      @else if (countdownNumber() > 0) {
        <div class="min-h-[50vh] flex flex-col justify-center items-center space-y-6">
          <span class="text-8xl font-black text-gradient-primary animate-ping">
            {{ countdownNumber() }}
          </span>
          <span class="text-xs font-bold text-[#111827] uppercase tracking-widest">Mock session is starting...</span>
        </div>
      }

      <!-- PHASE 3: ACTIVE MOCK PANEL -->
      @else if (session()) {
        <!-- Header details status bar -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#D9E2F1] p-4 sm:p-6 rounded-2xl shadow-sm">
          <div class="flex flex-wrap items-center gap-3">
            <span class="w-3 h-3 rounded-full bg-error animate-pulse shrink-0"></span>
            <span class="text-xs font-bold text-[#111827] uppercase tracking-wider">Live {{ session()?.type }} ({{ session()?.domain }} - {{ session()?.difficulty }})</span>
          </div>
          <!-- Predicted score, timer & end interview widget -->
          <div class="flex flex-wrap items-center gap-3 sm:gap-6 text-xs shrink-0 font-semibold text-[#4B5563]">
            <div class="flex items-center space-x-2">
              <span class="text-muted font-bold">PREDICTED SCORE:</span>
              <span class="text-primary font-extrabold text-sm">{{ session()?.predictedScore || 0 }}%</span>
            </div>
            <div class="flex items-center space-x-2 border-l border-[#D9E2F1] pl-3 sm:pl-6 font-mono">
              <span class="text-muted font-bold">TIMER:</span>
              <span class="text-[#111827] font-black text-sm">{{ formatTime(secondsElapsed()) }}</span>
            </div>
            <div class="border-l border-[#D9E2F1] pl-3 sm:pl-6">
              <button 
                type="button"
                (click)="openEndInterviewConfirm()"
                [disabled]="isSubmitting() || isEnding()"
                class="px-4 py-1.5 rounded-full border border-error/30 hover:border-error bg-error/5 hover:bg-error text-error hover:text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                title="End interview session now"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                <span>End Interview</span>
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Left side question card with AI Avatar -->
          <div class="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl space-y-6 flex flex-col justify-between min-h-[420px] shadow-sm">
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-[9px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Question {{ currentIdx() + 1 }} of {{ totalQuestions() }}</span>
                <span class="text-[9px] text-muted font-semibold">{{ totalQuestions() - currentIdx() - 1 }} remaining</span>
              </div>
              <h3 class="text-lg md:text-xl font-bold leading-relaxed text-[#111827]">
                {{ currentQuestionText() }}
              </h3>
            </div>

            <!-- Visual AI Avatar waveforms -->
            <div class="flex flex-col items-center justify-center space-y-4 py-8 bg-[#EDF1F5]/40 border border-[#D9E2F1] rounded-2xl relative overflow-hidden shadow-inner">
              @if (isRecording() && !isSpeechPaused()) {
                <div class="flex items-end space-x-1.5 h-16">
                  <div class="wave-bar w-1 bg-primary h-6 rounded-full" style="animation-delay: 0.1s"></div>
                  <div class="wave-bar w-1 bg-primary/80 h-12 rounded-full" style="animation-delay: 0.2s"></div>
                  <div class="wave-bar w-1 bg-primary h-14 rounded-full" style="animation-delay: 0.3s"></div>
                  <div class="wave-bar w-1 bg-primary/80 h-8 rounded-full" style="animation-delay: 0.4s"></div>
                  <div class="wave-bar w-1 bg-primary h-10 rounded-full" style="animation-delay: 0.5s"></div>
                </div>
                <span class="text-[9px] text-primary uppercase tracking-widest font-bold font-mono">Listening and transcribing...</span>
              } @else if (isSpeechPaused()) {
                <div class="w-12 h-12 rounded-full bg-white border border-[#D9E2F1] flex items-center justify-center text-muted font-bold text-xs shadow-sm">
                  ||
                </div>
                <span class="text-[9px] text-warning uppercase tracking-widest font-bold font-mono">Speech recording paused</span>
              } @else if (isSynthesizing()) {
                <div class="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm animate-pulse">
                  <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                </div>
                <span class="text-[9px] text-primary uppercase tracking-widest font-bold font-mono">AI is reading question...</span>
              } @else {
                <div class="w-12 h-12 rounded-full bg-white border border-[#D9E2F1] flex items-center justify-center text-muted shadow-sm">
                  <svg class="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                </div>
                <span class="text-[9px] text-muted uppercase tracking-widest font-bold font-mono">Microphone is standby</span>
              }
            </div>

            <!-- Voice Notice Banner if mic error / permission issue -->
            @if (speechNotice()) {
              <div class="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-xl flex items-center justify-between shadow-sm">
                <span class="leading-snug">{{ speechNotice() }}</span>
                <button type="button" (click)="clearSpeechNotice()" class="text-amber-900 font-bold ml-2 text-xs shrink-0 hover:opacity-75">✕</button>
              </div>
            }

            <!-- Voice actions controllers -->
            <div class="flex flex-wrap items-center gap-3">
              @if (session()?.type !== 'Coding') {
                <button 
                  (click)="toggleRecording()" 
                  [disabled]="isStartingRecognition()"
                  [class.bg-error]="isRecording()"
                  [class.bg-primary]="!isRecording()"
                  class="flex items-center space-x-2 py-2.5 px-5 rounded-full text-xs font-bold text-white transition-all hover:scale-[1.02] shadow-md disabled:opacity-60"
                >
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                  <span>{{ isRecording() ? 'Stop Recording' : (isStartingRecognition() ? 'Connecting Mic...' : 'Speak Answer') }}</span>
                </button>
                @if (isRecording()) {
                  <button 
                    (click)="togglePauseResume()" 
                    class="flex items-center space-x-2 py-2.5 px-5 rounded-full bg-white border border-[#D9E2F1] hover:bg-[#EDF1F5] text-xs font-bold text-[#111827] transition-all"
                  >
                    <span>{{ isSpeechPaused() ? '▶ Resume' : '⏸ Pause' }}</span>
                  </button>
                }
              }
              <button 
                (click)="speakQuestion()" 
                [disabled]="isSynthesizing()"
                class="flex items-center space-x-2 py-2.5 px-5 rounded-full bg-white border border-[#D9E2F1] hover:bg-[#0145F2]/5 text-xs font-bold transition-all text-[#111827] disabled:opacity-60"
              >
                <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                <span>Repeat Question</span>
              </button>
              <button 
                (click)="skipQuestion()" 
                [disabled]="isSubmitting() || isEnding()"
                class="flex items-center space-x-2 py-2.5 px-5 rounded-full bg-white border border-[#D9E2F1] hover:bg-error/5 hover:text-error text-xs font-bold transition-all text-muted disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>Skip Question ➡</span>
              </button>
              <button 
                type="button"
                (click)="openEndInterviewConfirm()" 
                [disabled]="isSubmitting() || isEnding()"
                class="flex items-center space-x-1.5 py-2.5 px-4 rounded-full bg-white border border-error/30 hover:bg-error hover:text-white text-xs font-bold transition-all text-error disabled:opacity-50 disabled:pointer-events-none shadow-sm"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                <span>End Interview</span>
              </button>
            </div>
          </div>

          <!-- Right side input scorecard -->
          <div class="glass p-8 rounded-3xl space-y-6 flex flex-col justify-between shadow-sm">
            <div class="space-y-4">
              <div class="flex justify-between items-center flex-wrap gap-2">
                <h3 class="text-sm font-bold text-[#111827] uppercase tracking-wider">Your Answer</h3>
                
                <!-- Word count indicator -->
                @if (session()?.type !== 'Coding') {
                  <div class="text-[10px] text-muted flex items-center space-x-3 flex-wrap">
                    <span>WORDS: <strong class="text-[#111827] font-bold">{{ wordCount() }}</strong></span>
                    <span>WPM: <strong class="text-primary font-bold">{{ wpm() }}</strong></span>
                    <span>FILLERS (um/uh): <strong class="text-warning font-bold">{{ fillerCount() }}</strong></span>
                    <span>MIN LIMIT: <strong class="text-[#111827] font-bold">15</strong></span>
                  </div>
                }
              </div>
              
              @if (session()?.type === 'Coding') {
                <div class="relative w-full rounded-2xl overflow-hidden border border-[#D9E2F1] font-mono text-xs shadow-inner">
                  <div class="bg-[#EDF1F5] px-4 py-2 text-[#4B5563] border-b border-[#D9E2F1] flex justify-between items-center select-none">
                    <span class="font-bold">solution.js</span>
                    <span class="text-[10px] font-bold bg-[#0145F2]/10 px-2 py-0.5 rounded text-primary">JavaScript</span>
                  </div>
                  <textarea 
                    [(ngModel)]="codeResponse"
                    placeholder="// Write your code solution here..."
                    class="w-full bg-[#F8FAFC] p-4 text-[#0F172A] focus:outline-none h-[280px] resize-none leading-relaxed font-mono"
                  ></textarea>
                </div>
              } @else {
                <textarea 
                  [(ngModel)]="textResponse"
                  (ngModelChange)="onTextChange()"
                  placeholder="Type your response here, or click 'Speak Answer' and speak..."
                  class="w-full bg-white border border-[#D9E2F1] rounded-2xl p-4 text-xs text-[#111827] focus:outline-none focus:border-primary h-[320px] resize-none leading-relaxed shadow-sm"
                ></textarea>
              }
            </div>

            <!-- Length Validation indicator -->
            <div class="flex items-center justify-between border-t border-[#D9E2F1] pt-6 flex-wrap gap-4">
              @if (session()?.type !== 'Coding' && wordCount() < 15) {
                <span class="text-[10px] text-error font-semibold flex items-center"><span class="w-1.5 h-1.5 rounded-full bg-error mr-1.5 animate-pulse"></span>Short response. Speak/type at least 15 words.</span>
              } @else {
                <span class="text-[10px] text-success font-semibold flex items-center"><span class="w-1.5 h-1.5 rounded-full bg-success mr-1.5"></span>Ready to submit.</span>
              }

              <button 
                (click)="submitAnswer()" 
                [disabled]="isSubmitting() || isEnding() || (!textResponse.trim() && !codeResponse.trim())"
                class="py-3 px-6 rounded-full bg-gradient-primary text-xs font-bold text-white shadow-lg shadow-primary/10 hover:opacity-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center space-x-2"
              >
                @if (isSubmitting()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>AI Grader scoring...</span>
                } @else {
                  <span>Submit Answer</span>
                }
              </button>
            </div>
          </div>
        </div>

        <!-- Confirmation Modal for End Interview -->
        @if (showEndConfirm()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div class="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#D9E2F1] text-left">
              <div class="flex items-center space-x-3 text-error">
                <div class="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <div>
                  <h4 class="text-base font-bold text-[#111827]">End Interview?</h4>
                  <p class="text-xs text-muted">Are you sure you want to end the interview?</p>
                </div>
              </div>
              
              <p class="text-xs text-[#4B5563] leading-relaxed">
                Your completed answers will be preserved and evaluated using the AI scorecard. You will be taken directly to your feedback and score report.
              </p>

              <div class="flex justify-end items-center space-x-3 pt-2 border-t border-[#D9E2F1]">
                <button
                  type="button"
                  (click)="cancelEndConfirm()"
                  [disabled]="isEnding()"
                  class="px-5 py-2.5 rounded-full border border-[#D9E2F1] hover:bg-[#EDF1F5] text-xs font-bold text-[#111827] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  (click)="confirmEndInterview()"
                  [disabled]="isEnding()"
                  class="px-6 py-2.5 rounded-full bg-error hover:bg-error/90 text-xs font-bold text-white transition-all shadow-md shadow-error/20 flex items-center space-x-2 disabled:opacity-50"
                >
                  @if (isEnding()) {
                    <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Ending Interview...</span>
                  } @else {
                    <span>End Interview</span>
                  }
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .wave-bar {
      transition: height 0.1s ease;
    }
  `]
})
export class ActiveInterviewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private interviewService = inject(InterviewService);

  @ViewChild('webcamPreview') webcamEl!: ElementRef<HTMLVideoElement>;

  interviewId = '';
  session = signal<any | null>(null);
  isLoadingSession = signal(true);
  isSubmitting = signal(false);
  isEnding = signal(false);
  showEndConfirm = signal(false);

  // States
  isCheckingSystem = signal(true);
  countdownNumber = signal(0);
  isRecording = signal(false);
  isSpeechPaused = signal(false);
  isSynthesizing = signal(false);
  isStartingRecognition = signal(false);
  speechNotice = signal<string | null>(null);
  speechState = signal<SpeechState>('idle');

  // Internal speech flags & timer refs
  private isRecognitionActive = false;
  private restartTimeout: any = null;
  hadRecognitionError = false;

  // Checks
  hasMicPermission = signal(false);
  hasCameraPermission = signal(false);
  micVolume = signal(0);
  audioContext: AudioContext | null = null;
  audioStream: MediaStream | null = null;
  videoStream: MediaStream | null = null;

  // Question details
  currentIdx = signal(0);
  totalQuestions = signal(0);
  currentQuestionText = signal('');
  textResponse = '';
  codeResponse = '';
  wordCount = signal(0);
  wpm = signal(0);
  fillerCount = signal(0);

  // Timers
  secondsElapsed = signal(0);
  timerInterval: any = null;

  // Speech
  recognition: any = null;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.interviewId = params['id'];
      if (this.interviewId) {
        this.runSystemChecks();
      }
    });
  }

  ngOnDestroy() {
    this.stopTimer();
    this.stopSpeechRecognition();
    this.isRecording.set(false);
    this.interviewService.closeSocket();
    this.stopSpeechSynthesisSync();
    this.speechState.set('idle');
    
    // Stop local video and audio streams
    if (this.audioStream) this.audioStream.getTracks().forEach(t => t.stop());
    if (this.videoStream) this.videoStream.getTracks().forEach(t => t.stop());
    if (this.audioContext) this.audioContext.close();
  }

  runSystemChecks() {
    // 1. Microphone checks using Web Audio API
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.audioStream = stream;
      this.hasMicPermission.set(true);

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = this.audioContext.createAnalyser();
      const microphone = this.audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i=0; i<bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;
        this.micVolume.set(Math.min(100, Math.round(average * 2))); // Amplify visual
        if (this.isCheckingSystem()) {
          requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();
    }).catch(err => {
      console.warn('Microphone permission blocked or not connected:', err.message);
    });

    // 2. Camera Checks
    setTimeout(() => {
      if (this.webcamEl) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
          this.videoStream = stream;
          this.hasCameraPermission.set(true);
          this.webcamEl.nativeElement.srcObject = stream;
        }).catch(err => {
          console.warn('Camera access denied:', err.message);
        });
      }
    }, 150);
  }

  playSampleChime() {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, context.currentTime); // A4 note
    gain.gain.setValueAtTime(0.1, context.currentTime);
    osc.start();
    osc.stop(context.currentTime + 0.5);
  }

  startCountdown() {
    this.isCheckingSystem.set(false);
    this.countdownNumber.set(3);

    // Stop checking streams to clean up context
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.hasCameraPermission.set(false);
    }

    const interval = setInterval(() => {
      this.countdownNumber.update(n => n - 1);
      if (this.countdownNumber() === 0) {
        clearInterval(interval);
        this.loadSessionDetails();
      }
    }, 1000);
  }

  loadSessionDetails() {
    this.isLoadingSession.set(true);
    this.interviewService.getInterviewDetails(this.interviewId).subscribe({
      next: (res: any) => {
        this.isLoadingSession.set(false);
        if (res.success && res.interview) {
          this.session.set(res.interview);
          this.totalQuestions.set(res.interview.questions.length);
          this.currentIdx.set(res.interview.currentQuestionIndex);
          
          if (res.interview.status === 'completed') {
            this.router.navigate(['/mock-interview/feedback', this.interviewId]);
            return;
          }

          this.loadQuestion();
          this.startTimer();
          this.initSpeechRecognition();
          this.interviewService.initSocket(this.interviewId);
        }
      },
      error: (err: any) => {
        this.isLoadingSession.set(false);
        alert(err.message || 'Failed to load session details.');
        this.router.navigate(['/mock-interview']);
      }
    });
  }

  isAndroid(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Android/i.test(ua);
  }

  isMobileDevice(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    return isMobileUa || (isTouch && window.innerWidth <= 820);
  }

  getAudioSettlingDelay(): number {
    if (this.isAndroid()) {
      return 750; // Android Chrome requires 500-1000ms for Google Speech Services / AudioTrack release
    }
    if (this.isMobileDevice()) {
      return 450;
    }
    return 60; // Desktop Chrome can switch quickly
  }

  showSpeechNotice(msg: string) {
    this.speechNotice.set(msg);
  }

  clearSpeechNotice() {
    this.speechNotice.set(null);
  }

  stopSpeechSynthesisSync() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.isSynthesizing.set(false);
    if (this.speechState() === 'speakingQuestion') {
      this.speechState.set('idle');
    }
  }

  async stopSpeechSynthesis(): Promise<void> {
    this.stopSpeechSynthesisSync();
    // On mobile devices, especially Android, Google Speech Services / AudioTrack requires a cooldown to release the audio subsystem
    const cooldownMs = this.getAudioSettlingDelay();
    await new Promise(resolve => setTimeout(resolve, cooldownMs));
  }

  loadQuestion() {
    const s = this.session();
    const idx = this.currentIdx();
    if (s && idx < s.questions.length) {
      const q = s.questions[idx];
      this.currentQuestionText.set(q.text);
      this.textResponse = '';
      this.codeResponse = q.codeTemplate || '';
      this.wordCount.set(0);
      this.secondsElapsed.set(0);
      this.clearSpeechNotice();

      // Ensure speech recognition is cleanly stopped before reading next question
      this.stopSpeechRecognition();
      this.isRecording.set(false);
      this.isSpeechPaused.set(false);
      
      setTimeout(() => this.speakQuestion(), 300);
    }
  }

  async speakQuestion() {
    const qText = this.currentQuestionText();
    if (!qText || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // 1. Stop any active microphone SpeechRecognition cleanly before reading question aloud
    this.stopSpeechRecognition();
    this.isRecording.set(false);
    this.isSpeechPaused.set(false);

    // 2. Cancel any pending or ongoing speech synthesis
    this.stopSpeechSynthesisSync();
    this.speechState.set('speakingQuestion');
    this.isSynthesizing.set(true);

    if (this.isMobileDevice()) {
      await new Promise(resolve => setTimeout(resolve, this.isAndroid() ? 150 : 100));
    }

    const utterance = new SpeechSynthesisUtterance(qText);
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      this.speechState.set('speakingQuestion');
      this.isSynthesizing.set(true);
    };

    utterance.onend = () => {
      this.isSynthesizing.set(false);
      if (this.speechState() === 'speakingQuestion') {
        this.speechState.set('idle');
      }
    };

    utterance.onerror = (e) => {
      this.isSynthesizing.set(false);
      if (this.speechState() === 'speakingQuestion') {
        this.speechState.set('idle');
      }
      console.warn('Speech synthesis playback ended with notice/error:', e);
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.isSynthesizing.set(false);
      if (this.speechState() === 'speakingQuestion') {
        this.speechState.set('idle');
      }
      console.warn('Failed to invoke speechSynthesis.speak:', err);
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = !this.isMobileDevice();
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isRecognitionActive = true;
      this.isStartingRecognition.set(false);
      this.isRecording.set(true);
      this.isSpeechPaused.set(false);
      this.speechState.set('listening');
      this.hadRecognitionError = false;
      this.clearSpeechNotice();
    };

    this.recognition.onresult = (event: any) => {
      if (this.isSpeechPaused()) return;

      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }

      if (finalTranscript) {
        this.textResponse += finalTranscript;
        this.onTextChange();
        this.interviewService.sendSpeechChunk(this.interviewId, this.textResponse);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isStartingRecognition.set(false);
      const error = event?.error;
      console.warn('[SPEECH RECOGNITION ERROR]:', error);
      this.hadRecognitionError = true;

      if (error === 'not-allowed' || error === 'service-not-allowed') {
        this.stopSpeechRecognition();
        this.isRecording.set(false);
        this.speechState.set('idle');
        this.showSpeechNotice('Microphone access was denied. Please allow microphone permissions in your browser to speak your answer.');
      } else if (error === 'audio-capture') {
        this.stopSpeechRecognition();
        this.isRecording.set(false);
        this.speechState.set('idle');
        this.showSpeechNotice('Microphone is busy or being used by another application. Please tap "Speak Answer" again to retry.');
      } else if (error === 'network') {
        this.stopSpeechRecognition();
        this.isRecording.set(false);
        this.speechState.set('idle');
        this.showSpeechNotice('Speech recognition network error occurred. You can type your response in the answer box.');
      } else if (error === 'aborted') {
        this.isRecognitionActive = false;
        if (this.speechState() === 'startingRecognition' || this.isMobileDevice()) {
          this.speechState.set('idle');
          this.isRecording.set(false);
        }
      } else if (error === 'no-speech') {
        // Natural silence timeout on mobile; will cleanly finish in onend
      } else {
        this.stopSpeechRecognition();
        this.isRecording.set(false);
        this.speechState.set('idle');
        this.showSpeechNotice('Voice recognition paused. Tap "Speak Answer" to continue or type your answer.');
      }
    };

    this.recognition.onend = () => {
      this.isRecognitionActive = false;
      this.isStartingRecognition.set(false);

      // On Android and mobile devices, NEVER auto-restart in a loop to avoid conflict with Speech Services
      if (this.isMobileDevice() || this.hadRecognitionError) {
        this.isRecording.set(false);
        this.isSpeechPaused.set(false);
        this.speechState.set('idle');
        this.recognition = null;
        return;
      }

      // On desktop: safe auto-restart for continuous dictation if user hasn't paused or finished
      if (this.isRecording() && !this.isSpeechPaused() && !this.isSynthesizing() && !this.isSubmitting() && !this.isEnding()) {
        const restartDelay = 100;
        this.restartTimeout = setTimeout(() => {
          if (this.isRecording() && !this.isSpeechPaused() && !this.isRecognitionActive && !this.isSynthesizing()) {
            this.safeStartRecognition();
          }
        }, restartDelay);
      } else {
        this.speechState.set('idle');
      }
    };
  }

  async safeStartRecognition(): Promise<void> {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.showSpeechNotice('Speech-to-text not supported in this browser. Please type your response.');
      this.isRecording.set(false);
      this.speechState.set('idle');
      return;
    }

    // Guard: Prevent start if submitting, ending, or session processing
    if (this.isSubmitting() || this.isEnding() || this.speechState() === 'processing') {
      this.isRecording.set(false);
      return;
    }

    // Guard: Prevent duplicate start calls or start during transition
    if (this.isRecognitionActive || this.speechState() === 'listening') {
      return;
    }
    if (this.speechState() === 'releasingAudio' || this.speechState() === 'startingRecognition' || this.isStartingRecognition()) {
      return;
    }

    // 1. Fully release speech synthesis first
    this.speechState.set('releasingAudio');
    this.isStartingRecognition.set(true);
    await this.stopSpeechSynthesis();

    // Check if recording state was cancelled while waiting for cooldown
    if (!this.isRecording() || this.isSubmitting() || this.isEnding()) {
      this.isStartingRecognition.set(false);
      this.speechState.set('idle');
      return;
    }

    // 2. Extra event loop tick isolation before starting recognition (crucial for Android Chrome audio HAL)
    this.speechState.set('startingRecognition');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Guard again
    if (!this.isRecording() || this.isSubmitting() || this.isEnding()) {
      this.isStartingRecognition.set(false);
      this.speechState.set('idle');
      return;
    }

    // 3. Ensure a fresh recognition instance on mobile or if previous instance had error
    if (!this.recognition || this.isMobileDevice() || this.hadRecognitionError) {
      this.initSpeechRecognition();
    }

    if (!this.recognition) {
      this.isStartingRecognition.set(false);
      this.isRecording.set(false);
      this.speechState.set('idle');
      return;
    }

    // 4. Start recognition safely
    try {
      this.recognition.start();
    } catch (err: any) {
      this.isStartingRecognition.set(false);
      if (err.name === 'InvalidStateError') {
        // Recognition was already active
        this.isRecognitionActive = true;
        this.speechState.set('listening');
      } else {
        console.warn('SpeechRecognition start failed:', err);
        this.isRecording.set(false);
        this.isRecognitionActive = false;
        this.speechState.set('idle');
        this.hadRecognitionError = true;
        this.showSpeechNotice('Microphone is busy or being initialized. Please tap "Speak Answer" to try again.');
      }
    }
  }

  async toggleRecording() {
    if (this.isSubmitting() || this.isEnding()) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.showSpeechNotice('Speech-to-text not supported in this browser. Please type.');
      return;
    }

    if (this.isRecording()) {
      this.stopSpeechRecognition();
      this.isRecording.set(false);
      this.isSpeechPaused.set(false);
      this.speechState.set('idle');
    } else {
      this.isRecording.set(true);
      this.isSpeechPaused.set(false);
      await this.safeStartRecognition();
    }
  }

  async togglePauseResume() {
    this.isSpeechPaused.update(p => !p);
    if (this.isSpeechPaused()) {
      this.stopSpeechRecognition();
      this.speechState.set('paused');
    } else {
      await this.safeStartRecognition();
    }
  }

  skipQuestion() {
    if (this.isSubmitting()) return;
    this.textResponse = 'Question skipped by candidate.';
    this.codeResponse = '// Question skipped by candidate.';
    this.submitAnswer();
  }

  onTextChange() {
    const text = this.textResponse.toLowerCase();
    
    // Count fillers
    const fillers = ['um', 'uh', 'like', 'you know'];
    let count = 0;
    fillers.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'g');
      const matches = text.match(regex);
      if (matches) count += matches.length;
    });
    this.fillerCount.set(count);

    const words = this.textResponse.trim().split(/\s+/).filter(w => w.length > 0);
    this.wordCount.set(words.length);

    // Calculate dynamic WPM
    const minutes = Math.max(1, this.secondsElapsed()) / 60;
    this.wpm.set(Math.round(words.length / minutes));
  }

  stopSpeechRecognition() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    this.isStartingRecognition.set(false);
    if (this.recognition) {
      try {
        if (this.isRecognitionActive) {
          this.recognition.stop();
        } else {
          this.recognition.abort();
        }
      } catch (e) {
        try {
          this.recognition.abort();
        } catch (err) {}
      }
      if (this.isMobileDevice()) {
        this.recognition = null;
      }
    }
    this.isRecognitionActive = false;
  }

  submitAnswer() {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.speechState.set('processing');
    this.stopSpeechRecognition();
    this.isRecording.set(false);
    this.isSpeechPaused.set(false);
    this.stopSpeechSynthesisSync();

    const payload = {
      interviewId: this.interviewId,
      responseText: this.textResponse || 'Question skipped by candidate.',
      codeSubmitted: this.codeResponse || '// Question skipped by candidate.',
      duration: this.secondsElapsed()
    };

    this.interviewService.submitAnswer(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        if (res.success) {
          // Update predicted score dynamically on screen
          if (this.session()) {
            this.session.update((s: any) => ({ ...s, predictedScore: res.predictedScore }));
          }

          if (res.finished || res.currentQuestionIndex >= this.totalQuestions()) {
            this.router.navigate(['/mock-interview/feedback', this.interviewId]);
          } else {
            this.currentIdx.set(res.currentQuestionIndex);
            this.loadQuestion();
          }
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        alert(err.message || 'Answer submission failed.');
      }
    });
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.secondsElapsed.update(s => s + 1);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  openEndInterviewConfirm() {
    this.showEndConfirm.set(true);
  }

  cancelEndConfirm() {
    this.showEndConfirm.set(false);
  }

  confirmEndInterview() {
    if (this.isEnding()) return;
    this.isEnding.set(true);
    this.speechState.set('processing');
    this.stopTimer();
    this.stopSpeechRecognition();
    this.isRecording.set(false);
    this.isSpeechPaused.set(false);
    this.stopSpeechSynthesisSync();

    this.interviewService.finishSession(this.interviewId).subscribe({
      next: () => {
        this.isEnding.set(false);
        this.showEndConfirm.set(false);
        this.router.navigate(['/mock-interview/feedback', this.interviewId]);
      },
      error: () => {
        this.isEnding.set(false);
        this.showEndConfirm.set(false);
        // Even if finish API encounters a network glitch, navigate to feedback
        this.router.navigate(['/mock-interview/feedback', this.interviewId]);
      }
    });
  }

  formatTime(secs: number): string {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }
}
