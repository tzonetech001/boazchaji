import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivityEntry, Customer, DashboardData, DeviceType, ServiceRecord, User } from './models';

export const apiBaseUrl = 'http://localhost/boazchaji/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  login(phone: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${apiBaseUrl}/auth/login`, { phone, password });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${apiBaseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string, confirmPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${apiBaseUrl}/auth/reset-password`, {
      token,
      password,
      confirm_password: confirmPassword,
    });
  }

  dashboard(agentId?: number): Observable<DashboardData> {
    const params = agentId ? new HttpParams().set('agent_id', agentId) : undefined;
    return this.http.get<DashboardData>(`${apiBaseUrl}/dashboard`, { params });
  }

  customers(search = ''): Observable<{ items: Customer[] }> {
    const params = new HttpParams().set('search', search);
    return this.http.get<{ items: Customer[] }>(`${apiBaseUrl}/customers`, { params });
  }

  deviceTypes(): Observable<{ items: DeviceType[] }> {
    return this.http.get<{ items: DeviceType[] }>(`${apiBaseUrl}/device_types`);
  }

  addDeviceType(name: string): Observable<{ device_type: DeviceType }> {
    return this.http.post<{ device_type: DeviceType }>(`${apiBaseUrl}/device_types`, { name });
  }

  services(status: 'pending' | 'paid', agentId?: number): Observable<{ items: ServiceRecord[] }> {
    let params = new HttpParams().set('status', status);
    if (agentId) params = params.set('agent_id', agentId);
    return this.http.get<{ items: ServiceRecord[] }>(`${apiBaseUrl}/services`, { params });
  }

  createService(form: FormData): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(`${apiBaseUrl}/services`, form);
  }

  markPaid(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${apiBaseUrl}/services/${id}/pay`, {});
  }

  users(): Observable<{ items: User[] }> {
    return this.http.get<{ items: User[] }>(`${apiBaseUrl}/users`);
  }

  createUser(input: Record<string, string>): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(`${apiBaseUrl}/users`, input);
  }

  activity(): Observable<{ items: ActivityEntry[] }> {
    return this.http.get<{ items: ActivityEntry[] }>(`${apiBaseUrl}/activity`);
  }

  updatePreferences(id: number, language: 'sw' | 'en', theme: 'light' | 'dark'): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${apiBaseUrl}/users/${id}/preferences`, { language, theme });
  }

  updateProfileImage(id: number, image: File): Observable<{ profile_image_path: string }> {
    const form = new FormData();
    form.append('image', image);
    return this.http.post<{ profile_image_path: string }>(`${apiBaseUrl}/users/${id}/profile-image`, form);
  }
}
