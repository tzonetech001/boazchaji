import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);
  langService  = inject(LanguageService);

  private API = `${environment.baseUrl}/api/customers.php`;

  customers: any[] = [];
  filtered: any[] = [];
  searchTerm = '';
  loading = false;

  // Modal Controls
  showFormModal = false;
  showConfirmModal = false;
  isEditing = false;
  currentEditId: number | null = null;
  confirmTargetId: number | null = null;

  customerForm: FormGroup;
  message = { text: '', type: 'success' as 'success' | 'error' };

  translations: Record<string, Record<string, string>> = {
    sw: {
      title: 'Wateja',
      subtitle: 'Simamia orodha ya wateja wako',
      addCustomer: 'Ongeza Mteja',
      search: 'Tafuta kwa jina au namba...',
      totalCustomers: 'Jumla ya Wateja',
      withPhone: 'Wenye Namba',
      newThisWeek: 'Wapya Wiki Hii',
      name: 'Jina',
      phone: 'Namba ya Simu',
      actions: 'Vitendo',
      save: 'Hifadhi',
      update: 'Sasisha',
      cancel: 'Ghairi',
      edit: 'Hariri',
      delete: 'Futa',
      noData: 'Hakuna wateja bado',
      confirmTitle: 'Tafadhali Thibitisha',
      confirmDelete: 'Una uhakika unataka kumfuta mteja huyu? Kitendo hiki hakiwezi kurejeshwa.',
      confirmBtn: 'Ndio, Futa',
      cancelBtn: 'Hapana, Ghairi',
      addedOk: 'Mteja ameongezwa kikamilifu!',
      updatedOk: 'Mteja amesasishwa kikamilifu!',
      deletedOk: 'Mteja amefutwa.',
      errAdd: 'Imeshindwa kuongeza mteja.',
      errUpdate: 'Imeshindwa kusasisha mteja.',
      errLoad: 'Imeshindwa kupakia wateja.',
      nameRequired: 'Jina linahitajika',
      phoneInvalid: 'Namba si sahihi (mfano: 0712345678)'
    },
    en: {
      title: 'Customers',
      subtitle: 'Manage your customer list',
      addCustomer: 'Add Customer',
      search: 'Search by name or phone...',
      totalCustomers: 'Total Customers',
      withPhone: 'With Phone',
      newThisWeek: 'New This Week',
      name: 'Name',
      phone: 'Phone',
      actions: 'Actions',
      save: 'Save',
      update: 'Update',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      noData: 'No customers yet',
      confirmTitle: 'Please Confirm',
      confirmDelete: 'Are you sure you want to delete this customer? This action cannot be undone.',
      confirmBtn: 'Yes, Delete',
      cancelBtn: 'No, Cancel',
      addedOk: 'Customer added successfully!',
      updatedOk: 'Customer updated successfully!',
      deletedOk: 'Customer deleted.',
      errAdd: 'Failed to add customer.',
      errUpdate: 'Failed to update customer.',
      errLoad: 'Failed to load customers.',
      nameRequired: 'Name is required',
      phoneInvalid: 'Invalid phone (e.g., 0712345678)'
    }
  };

  constructor() {
    this.customerForm = this.fb.group({
      name:  ['', Validators.required],
      phone: ['', Validators.pattern('^(07|06)[0-9]{8}$')]
    });
  }

  ngOnInit() { this.load(); }

  t(key: string): string {
    return this.translations[this.langService.lang()]?.[key] ?? key;
  }

  get initials() {
    return (name: string) =>
      name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  load() {
    this.loading = true;
    this.http.get<any[]>(`${this.API}?search=`)
      .subscribe({
        next: (res) => { 
          this.customers = res; 
          this.applyFilter(); 
          this.loading = false; 
        },
        error: () => { 
          this.showMessage(this.t('errLoad'), 'error'); 
          this.loading = false; 
        }
      });
  }

  applyFilter() {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) { this.filtered = [...this.customers]; return; }
    this.filtered = this.customers.filter(c =>
      c.name?.toLowerCase().includes(q) || (c.phone || '').includes(q)
    );
  }

  countWithPhone(): number {
    return this.customers.filter(c => c.phone && c.phone.trim()).length;
  }

  // --- MODAL LOGIC ---

  openAddModal() {
    this.isEditing = false;
    this.currentEditId = null;
    this.customerForm.reset();
    this.showFormModal = true;
  }

  openEditModal(customer: any) {
    this.isEditing = true;
    this.currentEditId = customer.id;
    this.customerForm.patchValue({ 
      name: customer.name, 
      phone: customer.phone || '' 
    });
    this.showFormModal = true;
  }

  closeModals() {
    this.showFormModal = false;
    this.showConfirmModal = false;
    this.currentEditId = null;
    this.confirmTargetId = null;
    this.customerForm.reset();
  }

  submit() {
    if (this.customerForm.invalid) return;
    const body = this.customerForm.value;

    if (this.isEditing && this.currentEditId) {
      this.http.put(`${this.API}?id=${this.currentEditId}`, body).subscribe({
        next: () => { 
          this.showMessage(this.t('updatedOk'), 'success'); 
          this.load(); 
          this.closeModals(); 
        },
        error: () => { this.showMessage(this.t('errUpdate'), 'error'); }
      });
    } else {
      this.http.post(this.API, body).subscribe({
        next: () => { 
          this.showMessage(this.t('addedOk'), 'success'); 
          this.load(); 
          this.closeModals(); 
        },
        error: () => { this.showMessage(this.t('errAdd'), 'error'); }
      });
    }
  }

  // --- DELETE LOGIC ---

  askDelete(id: number) {
    this.confirmTargetId = id;
    this.showConfirmModal = true;
  }

  confirmDelete() {
    if (!this.confirmTargetId) return;
    
    this.http.delete(`${this.API}?id=${this.confirmTargetId}`).subscribe({
      next: () => { 
        this.showMessage(this.t('deletedOk'), 'success'); 
        this.load(); 
        this.closeModals(); 
      },
      error: () => { 
        this.showMessage(this.t('errLoad'), 'error'); 
        this.closeModals(); 
      }
    });
  }

  showMessage(text: string, type: 'success' | 'error') {
    this.message = { text, type };
    setTimeout(() => this.message = { text: '', type: 'success' }, 2500);
  }
}