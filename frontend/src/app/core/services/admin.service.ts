import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, userData);
  }

  editUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/edit`, userData);
  }

  updateUserStatus(userId: string, status: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/status`, { userId, status });
  }

  resetUserPassword(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/reset-password`, payload);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  getQuestions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/questions`);
  }

  createQuestion(questionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/questions`, questionData);
  }

  updateQuestion(id: string, questionData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/questions/${id}`, questionData);
  }

  deleteQuestion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/questions/${id}`);
  }

  getInterviews(): Observable<any> {
    return this.http.get(`${this.apiUrl}/interviews`);
  }

  deleteInterview(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/interviews/${id}`);
  }

  getResumes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/resumes`);
  }

  deleteResume(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/resumes/${id}`);
  }

  getRoles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/roles`);
  }

  broadcastNotification(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications/broadcast`, payload);
  }

  getSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings`);
  }

  updateSetting(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/settings`, payload);
  }
}
