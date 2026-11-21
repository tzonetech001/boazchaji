import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from '../models/customer.model';
import { Service } from '../models/service.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Base URL inatoka kwenye environment
  private get apiUrl(): string {
    return `${environment.baseUrl}/api`;
  }

  constructor(private http: HttpClient) {}

  // ==========================================
  // CUSTOMERS
  // ==========================================
  searchCustomers(query: string): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.apiUrl}/customers.php?search=${query}`);
  }

  addCustomer(customer: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/customers.php`, customer);
  }

  // ==========================================
  // SERVICES
  // ==========================================
  addService(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/services.php`, formData);
  }

  getServices(status: string, role: string, agentId?: number, search?: string): Observable<Service[]> {
    let params = new HttpParams().set('status', status).set('role', role);
    if (agentId) params = params.set('agent_id', agentId.toString());
    if (search) params = params.set('search', search);
    
    return this.http.get<Service[]>(`${this.apiUrl}/services.php`, { params });
  }

  getServiceById(id: number): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/services.php?id=${id}`);
  }

  updateServiceAction(data: any): Observable<any> {
    // Inatumika kwa kubadilisha status (paid/pending) au kuchukua kifaa (taken)
    return this.http.put(`${this.apiUrl}/services.php`, data);
  }

  markAsPaid(serviceId: number): Observable<any> {
    // Njia ya zamani, tumia updateServiceAction kwa sasa
    return this.http.put(`${this.apiUrl}/services.php`, { id: serviceId, action: 'update_status', status: 'paid' });
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/services.php?id=${id}`);
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    return `${environment.baseUrl}/${path}`;
  }

  // ==========================================
  // DEVICE TYPES
  // ==========================================
  getDeviceTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/device_types.php`);
  }

  addDeviceType(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/device_types.php`, { name });
  }

  // ==========================================
  // USERS (ADMIN)
  // ==========================================
  getAgents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users.php`);
  }

  addAgent(agent: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users.php`, agent);
  }

  updateAgent(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users.php`, data);
  }

  deleteAgent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users.php?id=${id}`);
  }

  // ==========================================
  // STATS
  // ==========================================
  getStats(role: string, agentId?: number): Observable<any> {
    let params = new HttpParams().set('role', role);
    if (agentId) params = params.set('agent_id', agentId.toString());
    return this.http.get(`${this.apiUrl}/stats.php`, { params });
  }

  // ==========================================
  // PROFILE
  // ==========================================
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile.php`, data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile.php`, data);
  }

  uploadProfileImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile.php`, formData);
  }
}