import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/resumes`;

  analyzeResume(file: File, jobDescription: string = ''): Observable<any> {
    const formData = new FormData();
    formData.append('resume', file);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }
    return this.http.post(`${this.apiUrl}/analyze`, formData);
  }

  analyzeResumeData(fileBlob: Blob, fileName: string, jobDescription: string = ''): Observable<any> {
    const formData = new FormData();
    formData.append('resume', fileBlob, fileName);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }
    return this.http.post(`${this.apiUrl}/analyze`, formData);
  }

  getHistory(): Observable<any> {
    return this.http.get(`${this.apiUrl}/history`);
  }

  getResumeById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
}
