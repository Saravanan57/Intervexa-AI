import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  notificationsList = signal<NotificationItem[]>([]);
  unreadCount = signal<number>(0);

  loadNotifications(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap((res) => {
        if (res.success && res.notifications) {
          this.notificationsList.set(res.notifications);
          const unread = res.notifications.filter((n: any) => !n.isRead).length;
          this.unreadCount.set(unread);
        }
      })
    );
  }

  markAsRead(notificationId?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/read`, { notificationId }).pipe(
      tap(() => {
        if (notificationId) {
          // Update local signals
          this.notificationsList.update(list => 
            list.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
          );
        } else {
          // Mark all read
          this.notificationsList.update(list => 
            list.map(n => ({ ...n, isRead: true }))
          );
        }
        const unread = this.notificationsList().filter(n => !n.isRead).length;
        this.unreadCount.set(unread);
      })
    );
  }
}
