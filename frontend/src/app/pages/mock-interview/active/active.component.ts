import { Component, inject, OnInit, OnDestroy, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InterviewService } from '../../../core/services/interview.service';

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
          <!-- Predicted score scorecard widget -->
          <div class="flex flex-wrap items-center gap-3 sm:gap-6 text-xs shrink-0 font-semibold text-[#4B5563]">
            <div class="flex items-center space-x-2">
              <span class="text-muted font-bold">PREDICTED SCORE:</span>
              <span class="text-primary font-extrabold text-sm">{{ session()?.predictedScore || 0 }}%</span>
            </div>
            <div class="flex items-center space-x-2 border-l border-[#D9E2F1] pl-3 sm:pl-6 font-mono">
              <span class="text-muted font-bold">TIMER:</span>
              <span class="text-[#111827] font-black text-sm">{{ formatTime(secondsElapsed()) }}</span>
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
              } @else {
                <div class="w-12 h-12 rounded-full bg-white border border-[#D9E2F1] flex items-center justify-center text-muted shadow-sm">
                  <svg class="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                </div>
                <span class="text-[9px] text-muted uppercase tracking-widest font-bold font-mono">Microphone is standby</span>
              }
            </div>

            <!-- Voice actions controllers -->
            <div class="flex flex-wrap items-center gap-3">
              @if (session()?.type !== 'Coding') {
                <button 
                  (click)="toggleRecording()" 
                  [class.bg-error]="isRecording()"
                  [class.bg-primary]="!isRecording()"
                  class="flex items-center space-x-2 py-2.5 px-5 rounded-full text-xs font-bold text-white transition-all hover:scale-[1.02] shadow-md"
                >
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                  <span>{{ isRecording() ? 'Stop Recording' : 'Speak Answer' }}</span>
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
                class="flex items-center space-x-2 py-2.5 px-5 rounded-full bg-white border border-[#D9E2F1] hover:bg-[#0145F2]/5 text-xs font-bold transition-all text-[#111827]"
              >
                <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                <span>Repeat Question</span>
              </button>
              <button 
                (click)="skipQuestion()" 
                [disabled]="isSubmitting()"
                class="flex items-center space-x-2 py-2.5 px-5 rounded-full bg-white border border-[#D9E2F1] hover:bg-error/5 hover:text-error text-xs font-bold transition-all text-muted disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>Skip Question ➡</span>
              </button>
            </div>
          </div>

          <!-- Right side input scorecard -->
          <div class="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl space-y-6 flex flex-col justify-between shadow-sm">
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
              } @else {
                <div class="w-12 h-12 rounded-full bg-white border border-[#D9E2F1] flex items-center justify-center text-muted shadow-sm">
                  <svg class="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                </div>
                <span class="text-[9px] text-muted uppercase tracking-widest font-bold font-mono">Microphone is standby</span>
              }
            </div>

            <!-- Voice actions controllers -->
            <div class="flex flex-wrap items-center gap-3">
              @if (session()?.type !== 'Coding') {
                <button 
                  (click)="toggleRecording()" 
                  [class.bg-error]="isRecording()"
                  [class.bg-primary]="!isRecording()"
                  class="flex items-center space-x-2 py-2.5 px-5 rounded-full text-xs font-bold text-white transition-all hover:scale-[1.02] shadow-md"
                >
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                  <span>{{ isRecording() ? 'Stop Recording' : 'Speak Answer' }}</span>
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
                class="flex items-center space-x-2 py-2.5 px-5 rounded-full bg-white border border-[#D9E2F1] hover:bg-[#0145F2]/5 text-xs font-bold transition-all text-[#111827]"
              >
                <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                <span>Repeat Question</span>
              </button>
              <button 
                (click)="skipQuestion()" 
                [disabled]="isSubmitting()"
                class="flex items-center space-x-2 py-2.5 px-5 rounded-full bg-white border border-[#D9E2F1] hover:bg-error/5 hover:text-error text-xs font-bold transition-all text-muted disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>Skip Question ➡</span>
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
                [disabled]="isSubmitting() || (!textResponse.trim() && !codeResponse.trim())"
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

  // States
  isCheckingSystem = signal(true);
  countdownNumber = signal(0);
  isRecording = signal(false);
  isSpeechPaused = signal(false);

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
    this.interviewService.closeSocket();
    window.speechSynthesis.cancel();
    
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
      
      setTimeout(() => this.speakQuestion(), 300);
    }
  }

  speakQuestion() {
    const qText = this.currentQuestionText();
    if (qText) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(qText);
      window.speechSynthesis.speak(utterance);
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

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

    this.recognition.onend = () => {
      if (this.isRecording() && !this.isSpeechPaused()) {
        this.recognition.start(); // Auto restart if recording is active
      }
    };
  }

  toggleRecording() {
    if (!this.recognition) {
      alert('Speech-to-text not supported in this browser. Please type.');
      return;
    }

    if (this.isRecording()) {
      this.recognition.stop();
      this.isRecording.set(false);
      this.isSpeechPaused.set(false);
    } else {
      window.speechSynthesis.cancel();
      this.recognition.start();
      this.isRecording.set(true);
      this.isSpeechPaused.set(false);
    }
  }

  togglePauseResume() {
    this.isSpeechPaused.update(p => !p);
    if (this.isSpeechPaused()) {
      this.recognition.stop();
    } else {
      this.recognition.start();
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
    if (this.recognition && this.isRecording()) {
      this.recognition.stop();
    }
  }

  submitAnswer() {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.stopSpeechRecognition();
    window.speechSynthesis.cancel();

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

  formatTime(secs: number): string {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }
}
