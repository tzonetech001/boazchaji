import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);
  langService  = inject(LanguageService);

  private API = `${environment.baseUrl}/api/users.php`;

  users: any[] = [];
  filtered: any[] = [];
  userForm: FormGroup;
  
  // Modal controls
  showAddModal = false;
  showEditModal = false;
  showViewModal = false;
  
  // Confirm Modal Controls
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmActionType: 'trash' | 'delete' | 'deactivate' | 'activate' | 'restore' | '' = '';
  confirmTargetId: number | null = null;

  selectedUser: any = null;
  currentEditId: number | null = null;
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' | 'trash' = 'all';

  message = { text: '', type: 'success' as 'success' | 'error' };

  translations: Record<string, Record<string, string>> = {
    sw: {
      title: 'Usimamizi wa Watumiaji', subtitle: 'Simamia mawakala na wasimamizi wa mfumo',
      addUser: 'Ongeza Mtumiaji', search: 'Tafuta kwa jina au namba...',
      all: 'Wote', active: 'Hai', inactive: 'Imezimwa', trash: 'Kapu la Uchafu',
      totalUsers: 'Jumla', activeUsers: 'Hai', inactiveUsers: 'Imezimwa', trashedUsers: 'Kapuni',
      firstName: 'Jina la Kwanza', secondName: 'Jina la Kati', lastName: 'Jina la Mwisho',
      phone: 'Namba ya Simu', email: 'Email', sex: 'Jinsia', male: 'Me', female: 'Ke',
      role: 'Wadhifa', admin: 'Msimamizi', agent: 'Wakala',
      password: 'Password', save: 'Hifadhi', update: 'Sasisha', cancel: 'Ghairi',
      edit: 'Hariri', view: 'Onyesha', activate: 'Wezesha', deactivate: 'Zima',
      trashUser: 'Weka Kapuni', restore: 'Rejesha', delete: 'Futa Kabisa',
      fullName: 'Jina Kamili', status: 'Hali', actions: 'Vitendo', noData: 'Hakuna watumiaji',
      addedOk: 'Mtumiaji ameongezwa!', updatedOk: 'Mtumiaji amesasishwa!', deactivatedOk: 'Mtumiaji amezimwa.',
      activatedOk: 'Mtumiaji amewezeshwa.', trashedOk: 'Mtumiaji amewekwa kapuni.', restoredOk: 'Mtumiaji amerejeshwa.',
      deletedOk: 'Mtumiaji amefutwa kabisa.', errLoad: 'Imeshindwa kupakia watumiaji.', errGeneral: 'Hitilafu imetokea.',
      viewDetails: 'Taarifa za Mtumiaji', close: 'Funga',
      confirmTitle: 'Tafadhali Thibitisha', confirmBtn: 'Ndio, Endelea', cancelBtn: 'Hapana, Ghairi',
      msgDeactivate: 'Una uhakika unataka kumzimia mtumiaji huyu? Hataweza kuingia kwenye mfumo.',
      msgTrash: 'Una uhakika unataka kuweka mtumiaji huyu kwenye kapu? Unaweza kumrejesha baadaye.',
      msgRestore: 'Una uhakika unataka kumrejesha mtumiaji huyu?',
      msgDelete: 'Futa KABISA? Kitendo hiki hakiwezi kurejeshwa!',
      msgActivate: 'Una uhakika unataka kumwezesha mtumiaji huyu?'
    },
    en: {
      title: 'User Management', subtitle: 'Manage system agents and admins',
      addUser: 'Add User', search: 'Search by name or phone...',
      all: 'All', active: 'Active', inactive: 'Inactive', trash: 'Trash',
      totalUsers: 'Total', activeUsers: 'Active', inactiveUsers: 'Inactive', trashedUsers: 'Trashed',
      firstName: 'First Name', secondName: 'Middle Name', lastName: 'Last Name',
      phone: 'Phone', email: 'Email', sex: 'Sex', male: 'Male', female: 'Female',
      role: 'Role', admin: 'Admin', agent: 'Agent',
      password: 'Password', save: 'Save', update: 'Update', cancel: 'Cancel',
      edit: 'Edit', view: 'View', activate: 'Activate', deactivate: 'Deactivate',
      trashUser: 'Move to Trash', restore: 'Restore', delete: 'Delete Permanently',
      fullName: 'Full Name', status: 'Status', actions: 'Actions', noData: 'No users found',
      addedOk: 'User added!', updatedOk: 'User updated!', deactivatedOk: 'User deactivated.',
      activatedOk: 'User activated.', trashedOk: 'User moved to trash.', restoredOk: 'User restored.',
      deletedOk: 'User deleted permanently.', errLoad: 'Failed to load users.', errGeneral: 'An error occurred.',
      viewDetails: 'User Details', close: 'Close',
      confirmTitle: 'Please Confirm', confirmBtn: 'Yes, Continue', cancelBtn: 'No, Cancel',
      msgDeactivate: 'Are you sure you want to deactivate this user? They will not be able to login.',
      msgTrash: 'Are you sure you want to move this user to trash? You can restore them later.',
      msgRestore: 'Are you sure you want to restore this user?',
      msgDelete: 'Delete PERMANENTLY? This action cannot be undone!',
      msgActivate: 'Are you sure you want to activate this user?'
    }
  };

  constructor() {
    this.userForm = this.fb.group({
      first_name:  ['', Validators.required],
      second_name: [''],
      last_name:   ['', Validators.required],
      phone:       ['', [Validators.required, Validators.pattern('^(07|06)[0-9]{8}$')]],
      email:       ['', [Validators.email]],
      sex:         ['Male', Validators.required],
      role:        ['agent', Validators.required],
      password:    ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() { this.loadUsers(); }

  t(key: string): string { return this.translations[this.langService.lang()]?.[key] ?? key; }

  getAvatarUrl(user: any): string {
    if (user.profile_image) {
      return `${environment.baseUrl}/uploads/${user.profile_image}`;
    }
    return `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=0284c7&color=fff`;
  }

  loadUsers() {
    this.http.get<any[]>(this.API).subscribe({
      next: (data) => { this.users = data || []; this.applyFilter(); },
      error: () => this.showMessage(this.t('errLoad'), 'error')
    });
  }

  applyFilter() {
    let list = [...this.users];
    if (this.statusFilter !== 'all') {
      list = list.filter(u => (u.status || 'active') === this.statusFilter);
    }
    const q = this.searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(u =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        (u.phone || '').includes(q)
      );
    }
    this.filtered = list;
  }

  countByStatus(status: string): number {
    return this.users.filter(u => (u.status || 'active') === status).length;
  }

  // --- MODAL LOGIC ---
  
  openAddModal() {
    this.userForm.reset({ sex: 'Male', role: 'agent' });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showAddModal = true;
  }

  openEditModal(user: any) {
    this.currentEditId = user.id;
    this.userForm.patchValue({
      first_name: user.first_name, second_name: user.second_name || '',
      last_name: user.last_name, phone: user.phone, email: user.email || '',
      sex: user.sex, role: user.role || 'agent', password: ''
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showEditModal = true;
  }

  openViewModal(user: any) {
    this.selectedUser = user;
    this.showViewModal = true;
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showViewModal = false;
    this.showConfirmModal = false;
    this.selectedUser = null;
    this.currentEditId = null;
  }

  // --- CONFIRM MODAL LOGIC ---
  
  askAction(type: 'trash' | 'delete' | 'deactivate' | 'activate' | 'restore', id: number) {
    this.confirmActionType = type;
    this.confirmTargetId = id;
    this.confirmTitle = this.t('confirmTitle');
    
    if (type === 'trash') this.confirmMessage = this.t('msgTrash');
    if (type === 'delete') this.confirmMessage = this.t('msgDelete');
    if (type === 'deactivate') this.confirmMessage = this.t('msgDeactivate');
    if (type === 'activate') this.confirmMessage = this.t('msgActivate');
    if (type === 'restore') this.confirmMessage = this.t('msgRestore');

    this.showConfirmModal = true;
  }

  executeConfirmAction() {
    if (!this.confirmTargetId) return;
    const id = this.confirmTargetId;

    switch (this.confirmActionType) {
      case 'trash':
        this.http.patch(`${this.API}?action=trash`, { id }).subscribe({
          next: () => { this.showMessage(this.t('trashedOk'), 'success'); this.loadUsers(); this.closeModals(); },
          error: () => { this.showMessage(this.t('errGeneral'), 'error'); this.closeModals(); }
        });
        break;
      case 'delete':
        this.http.delete(`${this.API}?id=${id}`).subscribe({
          next: () => { this.showMessage(this.t('deletedOk'), 'success'); this.loadUsers(); this.closeModals(); },
          error: (err) => { this.showMessage(err.error?.message || this.t('errGeneral'), 'error'); this.closeModals(); }
        });
        break;
      case 'deactivate':
        this.changeStatus(id, 'inactive', 'deactivatedOk');
        break;
      case 'activate':
        this.changeStatus(id, 'active', 'activatedOk');
        break;
      case 'restore':
        this.changeStatus(id, 'active', 'restoredOk');
        break;
    }
  }

  // --- CRUD ACTIONS ---

  onSubmitAdd() {
    if (this.userForm.invalid) return;
    this.http.post(this.API, this.userForm.value).subscribe({
      next: () => {
        this.showMessage(this.t('addedOk'), 'success');
        this.loadUsers();
        this.closeModals();
      },
      error: (err) => this.showMessage(err.error?.message || this.t('errGeneral'), 'error')
    });
  }

  onSubmitEdit() {
    if (this.userForm.invalid || !this.currentEditId) return;
    const body = { ...this.userForm.value, id: this.currentEditId };
    if (!body.password) delete body.password;

    this.http.put(this.API, body).subscribe({
      next: () => {
        this.showMessage(this.t('updatedOk'), 'success');
        this.loadUsers();
        this.closeModals();
      },
      error: () => this.showMessage(this.t('errGeneral'), 'error')
    });
  }

  changeStatus(id: number, status: string, messageKey: string) {
    this.http.put(this.API, { id, status }).subscribe({
      next: () => { this.showMessage(this.t(messageKey), 'success'); this.loadUsers(); this.closeModals(); },
      error: () => { this.showMessage(this.t('errGeneral'), 'error'); this.closeModals(); }
    });
  }

  showMessage(text: string, type: 'success' | 'error') {
    this.message = { text, type };
    setTimeout(() => this.message = { text: '', type: 'success' }, 2500);
  }
}