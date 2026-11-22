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
  api = inject(ApiService);
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
  showConfirmModal = false;
  selectedService: Service | null = null;

  // Confirm Modal Data
  confirmMessage = '';
  confirmActionType: 'service' | 'device_type' = 'service';
  targetIdToDelete: number | null = null;

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
      manageDeviceTypes: 'Simamia Aina za Vifaa',
      addedOk: 'Huduma imehifadhiwa!', statusUpdated: 'Hali imebadilishwa!',
      returnedOk: 'Kifaa kimechukuliwa!', errGeneral: 'Hitilafu imetokea.', 
      deletedOk: 'Imefutwa!', deleteBlocked: 'Hauwezi kufuta, kifaa kimeshaanza kuchukuliwa!',
      confirmDeleteTitle: 'Tafadhali Thibitisha',
      confirmDeleteService: 'Una uhakika unataka kufuta huduma hii?',
      confirmDeleteDeviceType: 'Una uhakika unataka kufuta aina hii ya kifaa?',
      yesDelete: 'Ndio, Futa', noCancel: 'Hapana, Ghairi',
      saveNewCustomer: 'Sajili Mteja Mpya',
      errValidation: 'Tafadhali jaza sehemu zote muhimu kwa usahihi (Chagua aina ya kifaa, hakikisha namba ina tarakimu 10).',
      errNoCustomer: 'Tafadhali chagua mteja au bofya "Sajili Mteja Mpya" kabla ya kuhifadhi.',
      selectAgentFirst: 'Tafadhali chagua Agent kwanza ili kuweza kutafuta au kuandika jina la mteja.',
      customerAddedOk: 'Mteja amesajiliwa!'
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
      manageDeviceTypes: 'Manage Device Types',
      addedOk: 'Service saved!', statusUpdated: 'Status updated!',
      returnedOk: 'Device taken!', errGeneral: 'An error occurred.', 
      deletedOk: 'Deleted!', deleteBlocked: 'Cannot delete, device partly/fully taken!',
      confirmDeleteTitle: 'Please Confirm',
      confirmDeleteService: 'Are you sure you want to delete this service?',
      confirmDeleteDeviceType: 'Are you sure you want to delete this device type?',
      yesDelete: 'Yes, Delete', noCancel: 'No, Cancel',
      saveNewCustomer: 'Save New Customer',
      errValidation: 'Please fill all required fields correctly (Select device type, ensure phone is 10 digits).',
      errNoCustomer: 'Please select a customer or click "Save New Customer" before saving.',
      selectAgentFirst: 'Please select an Agent first to search or enter a customer name.',
      customerAddedOk: 'Customer registered!'
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
    this.loadDeviceTypes();

    // Mabadiliko ya utafutaji wa Mteja
    this.serviceForm.get('customer_name')?.valueChanges
      .pipe(
        debounceTime(300), 
        distinctUntilChanged(),
        switchMap(value => {
          const query = typeof value === 'string' ? value : '';
          if (query.length > 1) {
            // Kama ni admin, chukua ID ya agent aliyechaguliwa. Kama ni agent, chukua ID yake.
            const searchAgentId = this.isAdmin 
              ? this.serviceForm.get('agent_id')?.value 
              : user?.id;
            
            if (searchAgentId) {
              return this.api.searchCustomers(query, searchAgentId);
            }
          }
          return of([]);
        })
      ).subscribe(results => {
        this.searchResults = results;
        this.showDropdown = results.length > 0;
      });

    // Kama Admin anabadilisha Agent, futa mteja aliyechaguliwa awali ili asichanganye
    if (this.isAdmin) {
      this.serviceForm.get('agent_id')?.valueChanges.subscribe(() => {
        this.serviceForm.patchValue({ customer_id: null, customer_name: '', customer_phone: '' });
        this.searchResults = [];
        this.showDropdown = false;
      });
    }

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

  loadDeviceTypes() {
    this.api.getDeviceTypes().subscribe(res => this.deviceTypes = res);
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

  selectCustomer(c: Customer) { 
    this.serviceForm.patchValue({ customer_id: c.id, customer_name: c.name, customer_phone: c.phone }); 
    this.showDropdown = false; 
  }

  saveNewCustomerInline() {
    const name = this.serviceForm.get('customer_name')?.value;
    const phone = this.serviceForm.get('customer_phone')?.value;
    const agentId = this.isAdmin ? this.serviceForm.value.agent_id : this.auth.getCurrentUser()?.id;

    if (!name || !phone) return this.showMessage('Weka jina na namba sahihi kwanza', 'error');
    if (!agentId) return this.showMessage(this.t('selectAgentFirst'), 'error');

    this.api.addCustomer({ name, phone, created_by_agent_id: agentId }).subscribe({
      next: (res) => {
        this.serviceForm.patchValue({ customer_id: res.id });
        this.showDropdown = false;
        this.showMessage(this.t('customerAddedOk'), 'success');
      },
      error: (err: any) => this.showMessage(err.error?.message || 'Hitilafu imetokea', 'error')
    });
  }

  // --- DEVICE TYPE MANAGEMENT ---
  openDeviceTypeModal() {
    this.newDeviceTypeName = '';
    this.showDeviceTypeModal = true;
  }

  saveDeviceType() {
    if (!this.newDeviceTypeName.trim()) return;
    this.api.addDeviceType(this.newDeviceTypeName).subscribe({
      next: (res) => {
        this.loadDeviceTypes();
        this.serviceForm.patchValue({ device_type_id: res.id });
        this.newDeviceTypeName = '';
        this.showMessage('Aina imeongezwa!', 'success');
      },
      error: (err: any) => this.showMessage(err.error?.message || 'Hitilafu imetokea', 'error')
    });
  }

  askDeleteDeviceType(id: number) {
    this.confirmActionType = 'device_type';
    this.targetIdToDelete = id;
    this.confirmMessage = this.t('confirmDeleteDeviceType');
    this.showConfirmModal = true;
  }

  // --- MULTIPLE IMAGES ---
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

  // --- SUBMIT SERVICE ---
  onSubmitAdd() {
    if (this.serviceForm.invalid) {
      this.showMessage(this.t('errValidation'), 'error');
      return;
    }

    if (!this.serviceForm.value.customer_id) {
      this.showMessage(this.t('errNoCustomer'), 'error');
      return;
    }

    this.isSubmitting = true;
    this.proceedToSaveService();
  }

  proceedToSaveService() {
    const formData = new FormData();
    Object.keys(this.serviceForm.value).forEach(key => {
      if (this.serviceForm.value[key] !== null) formData.append(key, this.serviceForm.value[key]);
    });
    
    this.selectedFiles.forEach(file => formData.append('images[]', file));

    this.api.addService(formData).subscribe({
      next: () => { 
        this.showMessage(this.t('addedOk'), 'success'); 
        this.loadData(); 
        this.closeModals(); 
        this.isSubmitting = false;
      },
      error: (err: any) => { 
        this.showMessage(err.error?.message || this.t('errGeneral'), 'error'); 
        this.isSubmitting = false; 
      }
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
      return this.showMessage(`Weka idadi kati ya 1 na ${maxQty}`, 'error');
    }

    this.api.updateServiceAction({ id: this.selectedService.id, action: 'return_quantity', return_qty: this.returnQuantity }).subscribe(() => {
      this.showMessage(this.t('returnedOk'), 'success'); this.loadData(); this.closeModals();
    });
  }

  // --- DELETE LOGIC ---
  askDeleteService(id: number) {
    this.confirmActionType = 'service';
    this.targetIdToDelete = id;
    this.confirmMessage = this.t('confirmDeleteService');
    this.showConfirmModal = true;
  }

  executeDelete() {
    if (!this.targetIdToDelete) return;

    if (this.confirmActionType === 'service') {
      this.api.deleteService(this.targetIdToDelete).subscribe({
        next: () => { 
          this.showMessage(this.t('deletedOk'), 'success'); 
          this.loadData(); 
          this.closeModals(); 
        },
        error: (err: any) => { 
          this.showMessage(err.error?.message || this.t('deleteBlocked'), 'error'); 
          this.closeModals(); 
        }
      });
    } else if (this.confirmActionType === 'device_type') {
      this.api.deleteDeviceType(this.targetIdToDelete).subscribe({
        next: () => { 
          this.showMessage('Aina ya kifaa imefutwa!', 'success'); 
          this.loadDeviceTypes(); 
          this.closeModals(); 
        },
        error: (err: any) => { 
          this.showMessage(err.error?.message || 'Imeshindwa kufuta', 'error'); 
          this.closeModals(); 
        }
      });
    }
  }

  closeModals() { 
    this.showAddModal = false; this.showViewModal = false; this.showStatusModal = false; 
    this.showReturnModal = false; this.showDeviceTypeModal = false; this.showConfirmModal = false; 
    this.isSubmitting = false;
    this.targetIdToDelete = null;
  }

  showMessage(text: string, type: 'success' | 'error') {
    this.message = { text, type };
    setTimeout(() => this.message = { text: '', type: 'success' }, 3000);
  }
}