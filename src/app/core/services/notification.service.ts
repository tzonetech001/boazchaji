import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.baseUrl}/api/notifications.php`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotifications(userId: number, role: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?user_id=${userId}&role=${role}`).pipe(
      tap(notifs => {
        const unread = notifs.filter(n => !n.is_read).length;
        this.unreadCountSubject.next(unread);
      })
    );
  }

  sendNotification(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(this.apiUrl, { id });
  }

  deleteNotifications(ids?: number[]): Observable<any> {
    return this.http.delete(this.apiUrl, { body: { ids } });
  }
}