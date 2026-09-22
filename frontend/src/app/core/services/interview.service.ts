import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/interviews`;
  private socketUrl = environment.socketUrl;
  private socket: Socket | null = null;

  // Signal to track live transcription feedback
  liveTranscript = signal<string>('');

  createSession(config: { 
    type: string; 
    skills?: string[]; 
    experience?: string; 
    difficulty?: string; 
    domain?: string; 
    durationLimit?: number; 
    questionCount?: number; 
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/session`, config);
  }

  submitAnswer(answer: { interviewId: string; responseText?: string; codeSubmitted?: string; audioUrl?: string; duration?: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit-answer`, answer);
  }

  getHistory(): Observable<any> {
    return this.http.get(`${this.apiUrl}/history`);
  }

  getInterviewDetails(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getReportDownloadUrl(id: string): string {
    return `${this.apiUrl}/${id}/download`;
  }

  // Socket Connection Management
  initSocket(interviewId: string) {
    this.closeSocket();
    
    this.socket = io(this.socketUrl);
    
    this.socket.on('connect', () => {
      this.socket?.emit('join-session', { interviewId });
    });

    this.socket.on('speech-transcript-update', (data: { text: string }) => {
      this.liveTranscript.set(data.text);
    });
  }

  sendSpeechChunk(interviewId: string, text: string) {
    if (this.socket) {
      this.socket.emit('speech-chunk', { interviewId, text });
    }
  }

  closeSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.liveTranscript.set('');
  }
}
