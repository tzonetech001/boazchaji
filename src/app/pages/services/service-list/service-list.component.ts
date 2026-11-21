import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Service } from '../../../core/models/service.model';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.css']
})
export class ServiceListComponent implements OnInit {
  services: Service[] = [];
  filteredServices: Service[] = [];
  isLoading = true;
  isAdmin = false;
  searchQuery = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 30;
  totalPages = 1;

  // Modals
  selectedService: Service | null = null;
  showViewModal = false;
  showStatusModal = false;
  showTakeModal = false;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.isAdmin = this.auth.getUserRole() === 'admin';
    this.loadData();
  }

  loadData() {
    const user = this.auth.getCurrentUser();
    const role = user?.role || 'agent';
    const agentId = role === 'agent' ? user?.id : undefined;

    this.api.getServices('pending', role, agentId).subscribe(data => {
      this.services = data;
      this.applyFilter();
      this.isLoading = false;
    });
  }

  applyFilter() {
    let result = this.services;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.customer_name?.toLowerCase().includes(q) ?? false) ||
        (s.customer_phone?.includes(q) ?? false)
      );
    }
    this.totalPages = Math.ceil(result.length / this.pageSize);
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    
    const start = (this.currentPage - 1) * this.pageSize;
    this.filteredServices = result.slice(start, start + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilter();
    }
  }

  openView(s: Service) { this.selectedService = s; this.showViewModal = true; }
  
  openStatusModal(s: Service) { this.selectedService = s; this.showStatusModal = true; }
  
  updateStatus(newStatus: string) {
    this.api.updateServiceAction({ id: this.selectedService?.id, action: 'update_status', status: newStatus }).subscribe(() => {
      this.closeModals(); this.loadData();
    });
  }

  openTakeModal(s: Service) { this.selectedService = s; this.showTakeModal = true; }

  confirmTake() {
    this.api.updateServiceAction({ id: this.selectedService?.id, action: 'take_device' }).subscribe(() => {
      this.closeModals(); this.loadData();
      alert("Kifaa kimechukuliwa! Kama alikuwa amelipia, sasa kiko kwenye Historia.");
    });
  }

  closeModals() { this.showViewModal = false; this.showStatusModal = false; this.showTakeModal = false; }
}