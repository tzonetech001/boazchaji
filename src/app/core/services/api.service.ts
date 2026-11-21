import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from '../models/customer.model';
import { Service } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Badilisha URL hii kulingana na server yako
  private baseUrl = 'http://localhost/boazchaji/backend/api';

  constructor(private http: HttpClient) {}

  // --- CUSTOMERS ---
  searchCustomers(query: string): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.baseUrl}/customers.php?search=${query}`);
  }

  addCustomer(customer: Customer): Observable<any> {
    return this.http.post(`${this.baseUrl}/customers.php`, customer);
  }

  // --- SERVICES ---
  addService(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/services.php`, formData);
  }

  // --- DEVICE TYPES ---
  getDeviceTypes(): Observable<any[]> {
    // Tutapitia hii baadaye
    return this.http.get<any[]>(`${this.baseUrl}/device_types.php`);
  }

  // Ongeza ndani ya ApiService class

  // --- SERVICES ---
  getServices(status: string, role: string, agentId?: number): Observable<Service[]> {
    let params = new HttpParams().set('status', status).set('role', role);
    if (agentId) {
      params = params.set('agent_id', agentId.toString());
    }
    return this.http.get<Service[]>(`${this.baseUrl}/services.php`, { params });
  }

  markAsPaid(serviceId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/services.php`, { id: serviceId });
  }

  // Helper ya kupata full image URL
  getImageUrl(path: string): string {
    if (!path) return '';
    // Badilisha hii kulingana na server yako
    return `http://localhost/boazchaji/backend/${path}`;
  }
  // Ongeza ndani ya ApiService class

  // --- USERS (ADMIN) ---
  getAgents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users.php`);
  }

  addAgent(agent: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users.php`, agent);
  }

  deleteAgent(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users.php?id=${id}`);
  }

  // --- STATS ---
  getStats(role: string, agentId?: number): Observable<any> {
    let params = new HttpParams().set('role', role);
    if (agentId) params = params.set('agent_id', agentId.toString());
    return this.http.get(`${this.baseUrl}/stats.php`, { params });
  }

  // Ongeza ndani ya ApiService class

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/profile.php`, data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/profile.php`, data);
  }
}