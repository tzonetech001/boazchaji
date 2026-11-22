import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { Service } from '../../core/models/service.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  langService = inject(LanguageService);

  services: Service[] = [];
  filteredServices: Service[] = [];
  paginatedServices: Service[] = [];
  
  isLoading = true;
  isAdmin = false;
  searchQuery = '';
  selectedImage: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 30;
  totalPages = 1;

  // Bulk Selection
  selectedIds = new Set<number>();
  isAllSelected = false;

  translations: Record<string, Record<string, string>> = {
    sw: {
      title: 'Historia ya Malipo',
      subtitle: 'Hizi ni kazi zote ambazo zimekamilika, kulipiwa, na kuchukuliwa.',
      searchPlaceholder: 'Tafuta kwa jina, simu au kifaa...',
      deleteSelected: 'Futa Zilizochaguliwa',
      noData: 'Historia ni tupu!',
      noDataDesc: 'Hakuna huduma iliyolipiwa na kuchukuliwa bado.',
      customer: 'Mteja',
      device: 'Kifaa',
      qty: 'Idadi',
      total: 'Jumla (TZS)',
      image: 'Picha',
      date: 'Tarehe',
      status: 'Hali',
      actions: 'Vitendo',
      paidTaken: 'Amelipa & Amechukua',
      viewImage: 'Ona',
      delete: 'Futa',
      confirmDelete: 'Una uhakika unataka kufuta huduma hii?',
      confirmBulkDelete: 'Una uhakika unataka kufuta huduma zote ulizochagua?',
      deletedOk: 'Huduma imefutwa!',
      bulkDeletedOk: 'Huduma zote zilizochaguliwa zimefutwa!',
      errDelete: 'Imeshindwa kufuta huduma.',
      noPhone: 'Hakuna namba',
      prev: 'Nyuma',
      next: 'Mbele',
      page: 'Ukurasa'
    },
    en: {
      title: 'Payment History',
      subtitle: 'These are all jobs that are completed, paid, and taken.',
      searchPlaceholder: 'Search by name, phone or device...',
      deleteSelected: 'Delete Selected',
      noData: 'History is empty!',
      noDataDesc: 'No services have been paid and taken yet.',
      customer: 'Customer',
      device: 'Device',
      qty: 'Qty',
      total: 'Total (TZS)',
      image: 'Image',
      date: 'Date',
      status: 'Status',
      actions: 'Actions',
      paidTaken: 'Paid & Taken',
      viewImage: 'View',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this service?',
      confirmBulkDelete: 'Are you sure you want to delete all selected services?',
      deletedOk: 'Service deleted!',
      bulkDeletedOk: 'All selected services deleted!',
      errDelete: 'Failed to delete service.',
      noPhone: 'No phone',
      prev: 'Prev',
      next: 'Next',
      page: 'Page'
    }
  };

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    this.isAdmin = user?.role === 'admin';
    this.loadHistory();
  }

  t(key: string): string {
    return this.translations[this.langService.lang()]?.[key] ?? key;
  }

  loadHistory() {
    const user = this.auth.getCurrentUser();
    const role = user?.role || 'agent';
    const agentId = role === 'agent' ? user?.id : undefined;

    this.isLoading = true;
    this.api.getServices('history', role, agentId).subscribe({
      next: (data) => { 
        this.services = data; 
        this.applyFilter(); 
        this.isLoading = false; 
      },
      error: () => this.isLoading = false
    });
  }

  applyFilter() {
    let result = this.services;
    
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.customer_name?.toLowerCase().includes(q) ?? false) ||
        (s.customer_phone?.includes(q) ?? false) ||
        (s.device_name?.toLowerCase().includes(q) ?? false)
      );
    }

    this.filteredServices = result;
    this.currentPage = 1; // Reset to page 1 on search
    this.updatePagination();
    
    // Clear selection on filter
    this.selectedIds.clear();
    this.isAllSelected = false;
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredServices.length / this.pageSize);
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedServices = this.filteredServices.slice(start, start + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      this.selectedIds.clear(); // Clear selection on page change
      this.isAllSelected = false;
    }
  }

  // --- BULK SELECTION LOGIC ---
  toggleSelect(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.checkAllSelected();
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    if (checked) {
      this.paginatedServices.forEach(s => { if(s.id) this.selectedIds.add(s.id); });
    } else {
      this.selectedIds.clear();
    }
    this.isAllSelected = checked;
  }

  checkAllSelected() {
    this.isAllSelected = this.paginatedServices.length > 0 && 
      this.paginatedServices.every(s => this.selectedIds.has(s.id!));
  }

  // --- DELETE LOGIC ---
  deleteService(id: number) {
    if (!confirm(this.t('confirmDelete'))) return;

    this.api.deleteService(id).subscribe({
      next: () => {
        this.services = this.services.filter(s => s.id !== id);
        this.applyFilter(); // Updates list and pagination
        this.showMessage(this.t('deletedOk'), 'success');
      },
      error: () => this.showMessage(this.t('errDelete'), 'error')
    });
  }

  bulkDelete() {
    if (this.selectedIds.size === 0) return;
    if (!confirm(this.t('confirmBulkDelete'))) return;

    const idsToDelete = Array.from(this.selectedIds);
    const requests = idsToDelete.map(id => this.api.deleteService(id));

    forkJoin(requests).subscribe({
      next: () => {
        this.services = this.services.filter(s => !this.selectedIds.has(s.id!));
        this.applyFilter();
        this.showMessage(this.t('bulkDeletedOk'), 'success');
      },
      error: () => {
        this.showMessage(this.t('errDelete'), 'error');
        this.loadHistory(); // Reload to reflect partial success/failure
      }
    });
  }

  // --- UTILS & MODALS ---
  viewImage(imagePath: string) {
    this.selectedImage = this.api.getImageUrl(imagePath);
  }

  closeImage() {
    this.selectedImage = null;
  }

  showMessage(text: string, type: 'success' | 'error') {
    // Simple alert for now, can be replaced with your custom Toast logic
    alert(text);
  }
}