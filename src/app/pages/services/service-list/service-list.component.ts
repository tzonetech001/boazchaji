import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { Service } from '../../../core/models/service.model';
import { Customer } from '../../../core/models/customer.model';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.css']
})
export class ServiceListComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  langService = inject(LanguageService);

  services: Service[] = [];
  filteredServices: Service[] = [];
  isLoading = true;
  isAdmin = false;
  searchQuery = '';
  currentPage = 1;
  pageSize = 30;
  totalPages = 1;

  // Modals
  showAddModal = false;
  showViewModal = false;
  showStatusModal = false;
  showReturnModal = false;
  showDeviceTypeModal = false;
  selectedService: Service | null = null;

  // Forms & Data
  serviceForm: FormGroup;
  searchResults: Customer[] = [];
  showDropdown = false;
  deviceTypes: any[] = [];
  agents: any[] = [];
  
  // Multiple Images
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];

  // Variables za Ziada
  isSubmitting = false;
  newDeviceTypeName = '';
  returnQuantity = 1;
  message = { text: '', type: 'success' as 'success' | 'error' };

  translations: Record<string, Record<string, string>> = {
    sw: {
      title: 'Huduma Zinazosubiri', subtitle: 'Hizi ni kazi ambazo bado hazijalipiwa au hazijachukuliwa.',
      addBtn: 'Rekodi Mpya', searchPlaceholder: 'Tafuta kwa jina, simu au kifaa...',
      customer: 'Mteja', device: 'Kifaa', qty: 'Idadi', total: 'Jumla', status: 'Hali',
      agent: 'Agent', actions: 'Vitendo', paid: 'Amelipa', pending: 'Hajalipa',
      view: 'Onyesha', updateStatus: 'Badilisha Hali', takeDevice: 'Chukua', delete: 'Futa',
      noData: 'Hakuna huduma inayosubiri.', addService: 'Rekodi Huduma Mpya', 
      selectAgent: 'Chagua Agent', customerName: 'Jina la Mteja', customerPhone: 'Namba ya Simu',
      deviceName: 'Jina la Kifaa', deviceType: 'Aina ya Kifaa', amount: 'Kiasi (TZS)',
      paidCheck: 'Amelipia Kikamilifu', image: 'Picha (Unaweza kuchagua nyingi)',
      save: 'Hifadhi', cancel: 'Ghairi', close: 'Funga',
      confirmStatus: 'Badilisha Hali ya Malipo', confirmStatusMsg: 'Je, mteja amelipia huduma hii?',
      yesPaid: 'Ndio, Amelipa', noUnpaid: 'Hapana, Hajalipa',
      returnDevice: 'Chukua Kifaa', returnMsg: 'Weka idadi ya vifaa anavyochukua sasa:',
      confirmReturn: 'Chukua', addDeviceType: 'Ongeza Aina ya Kifaa', saveDeviceType: 'Hifadhi',
      addedOk: 'Huduma imehifadhiwa!', statusUpdated: 'Hali imebadilishwa!',
      returnedOk: 'Kifaa kimechukuliwa!', errGeneral: 'Hitilafu imetokea.', 
      deletedOk: 'Imefutwa!', deleteBlocked: 'Hauwezi kufuta, kifaa kimeshaanza kuchukuliwa!'
    },
    en: {
      title: 'Pending Services', subtitle: 'These are jobs not yet paid or taken.',
      addBtn: 'New Record', searchPlaceholder: 'Search by name, phone or device...',
      customer: 'Customer', device: 'Device', qty: 'Qty', total: 'Total', status: 'Status',
      agent: 'Agent', actions: 'Actions', paid: 'Paid', pending: 'Unpaid',
      view: 'View', updateStatus: 'Update Status', takeDevice: 'Take', delete: 'Delete',
      noData: 'No pending services.', addService: 'Record New Service', 
      selectAgent: 'Select Agent', customerName: 'Customer Name', customerPhone: 'Phone Number',
      deviceName: 'Device Name', deviceType: 'Device Type', amount: 'Amount (TZS)',
      paidCheck: 'Fully Paid', image: 'Images (Multiple allowed)',
      save: 'Save', cancel: 'Cancel', close: 'Close',
      confirmStatus: 'Update Payment Status', confirmStatusMsg: 'Did the customer pay?',
      yesPaid: 'Yes, Paid', noUnpaid: 'No, Unpaid',
      returnDevice: 'Take Device', returnMsg: 'Enter quantity being taken now:',
      confirmReturn: 'Take', addDeviceType: 'Add Device Type', saveDeviceType: 'Save',
      addedOk: 'Service saved!', statusUpdated: 'Status updated!',
      returnedOk: 'Device taken!', errGeneral: 'An error occurred.', 
      deletedOk: 'Deleted!', deleteBlocked: 'Cannot delete, device partly/fully taken!'
    }
  };

  constructor() {
    this.serviceForm = this.fb.group({
      customer_id: [null], 
      customer_name: ['', Validators.required],
      customer_phone: ['', [Validators.required, Validators.pattern('^(06|07)[0-9]{8}$')]],
      device_type_id: ['', Validators.required],
      device_name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      amount: [300, [Validators.required, Validators.min(0)]],
      status: ['pending'],
      agent_id: [null, Validators.required]
    });
  }

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    this.isAdmin = user?.role === 'admin';
    if (this.isAdmin) this.api.getAgents().subscribe(res => this.agents = res);
    this.api.getDeviceTypes().subscribe(res => this.deviceTypes = res);

    this.serviceForm.get('customer_name')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(),
        switchMap(value => (typeof value === 'string' && value.length > 1) ? this.api.searchCustomers(value) : of([]))
      ).subscribe(results => {
        this.searchResults = results;
        this.showDropdown = results.length > 0;
      });

    this.loadData();
  }

  t(key: string): string { return this.translations[this.langService.lang()]?.[key] ?? key; }

  loadData() {
    const user = this.auth.getCurrentUser();
    const role = user?.role || 'agent';
    const agentId = role === 'agent' ? user?.id : undefined;

    this.isLoading = true;
    this.api.getServices('pending', role, agentId).subscribe({
      next: (data) => { this.services = data; this.applyFilter(); this.isLoading = false; },
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
    this.totalPages = Math.ceil(result.length / this.pageSize);
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.pageSize;
    this.filteredServices = result.slice(start, start + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.applyFilter(); }
  }

  // --- ADD MODAL ---
  openAddModal() {
    this.serviceForm.reset({ quantity: 1, amount: 300, status: 'pending' });
    if (!this.isAdmin) this.serviceForm.patchValue({ agent_id: this.auth.getCurrentUser()?.id });
    this.imagePreviews = [];
    this.selectedFiles = [];
    this.showAddModal = true;
  }

  selectCustomer(c: Customer) { this.serviceForm.patchValue({ customer_id: c.id, customer_name: c.name, customer_phone: c.phone }); this.showDropdown = false; }

  openDeviceTypeModal() {
    this.newDeviceTypeName = '';
    this.showDeviceTypeModal = true;
  }

  saveDeviceType() {
    if (!this.newDeviceTypeName.trim()) return;
    this.api.addDeviceType(this.newDeviceTypeName).subscribe(res => {
      this.deviceTypes.push({ id: res.id, name: this.newDeviceTypeName });
      this.serviceForm.patchValue({ device_type_id: res.id });
      this.showDeviceTypeModal = false;
    });
  }

  onFilesSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.selectedFiles.push(files[i]);
        const reader = new FileReader();
        reader.onload = (e: any) => this.imagePreviews.push(e.target.result);
        reader.readAsDataURL(files[i]);
      }
    }
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  // SUBMIT ADD SERVICE
  onSubmitAdd() {
    if (this.serviceForm.invalid) return;
    this.isSubmitting = true;

    // Kama ni mteja mpya (hana ID), mhifadhi kwanza
    if (!this.serviceForm.value.customer_id && this.serviceForm.value.customer_name && this.serviceForm.value.customer_phone) {
      this.api.addCustomer({ name: this.serviceForm.value.customer_name, phone: this.serviceForm.value.customer_phone }).subscribe({
        next: (res) => {
          this.serviceForm.patchValue({ customer_id: res.id });
          this.proceedToSaveService();
        },
        error: () => { this.showMessage('Imeshindwa kuongeza mteja mpya', 'error'); this.isSubmitting = false; }
      });
    } else if (this.serviceForm.value.customer_id) {
      this.proceedToSaveService();
    } else {
      this.showMessage('Chagua mteja au jaza jina na namba', 'error');
      this.isSubmitting = false;
    }
  }

  proceedToSaveService() {
    const formData = new FormData();
    Object.keys(this.serviceForm.value).forEach(key => {
      if (this.serviceForm.value[key] !== null) formData.append(key, this.serviceForm.value[key]);
    });
    
    this.selectedFiles.forEach(file => formData.append('images[]', file));

    this.api.addService(formData).subscribe({
      next: () => { this.showMessage(this.t('addedOk'), 'success'); this.loadData(); this.closeModals(); },
      error: (err) => { this.showMessage(err.error?.message || this.t('errGeneral'), 'error'); this.isSubmitting = false; }
    });
  }

  // --- ACTION MODALS ---
  openView(s: Service) { this.selectedService = s; this.showViewModal = true; }
  openStatusModal(s: Service) { this.selectedService = s; this.showStatusModal = true; }
  openReturnModal(s: Service) { 
    this.selectedService = s; 
    this.returnQuantity = 1; 
    this.showReturnModal = true; 
  }

  updateStatus(newStatus: string) {
    if (!this.selectedService) return;
    this.api.updateServiceAction({ id: this.selectedService.id, action: 'update_status', status: newStatus }).subscribe(() => {
      this.showMessage(this.t('statusUpdated'), 'success'); this.loadData(); this.closeModals();
    });
  }

  confirmReturn() {
    if (!this.selectedService) return;
    const takenQty = (this.selectedService as any).taken_quantity || 0;
    const maxQty = this.selectedService.quantity - takenQty;
    
    if (this.returnQuantity < 1 || this.returnQuantity > maxQty) {
      return alert(`Weka idadi kati ya 1 na ${maxQty}`);
    }

    this.api.updateServiceAction({ id: this.selectedService.id, action: 'return_quantity', return_qty: this.returnQuantity }).subscribe(() => {
      this.showMessage(this.t('returnedOk'), 'success'); this.loadData(); this.closeModals();
    });
  }

  deleteService(id: number) {
    if (!confirm('Una uhakika unataka kufuta huduma hii?')) return;
    this.api.deleteService(id).subscribe({
      next: () => { this.showMessage(this.t('deletedOk'), 'success'); this.loadData(); },
      error: (err) => this.showMessage(err.error?.message || this.t('deleteBlocked'), 'error')
    });
  }

  closeModals() { 
    this.showAddModal = false; this.showViewModal = false; this.showStatusModal = false; 
    this.showReturnModal = false; this.showDeviceTypeModal = false; this.isSubmitting = false;
  }

  showMessage(text: string, type: 'success' | 'error') {
    this.message = { text, type };
    setTimeout(() => this.message = { text: '', type: 'success' }, 2500);
  }
}