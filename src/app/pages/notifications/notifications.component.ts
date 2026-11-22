import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  private notifService = inject(NotificationService);
  private authService  = inject(AuthService);
  private apiService   = inject(ApiService);
  private fb           = inject(FormBuilder);
  langService          = inject(LanguageService);

  notifications: any[] = [];
  filteredNotifs: any[] = [];
  paginatedNotifs: any[] = [];
  agents: any[] = [];
  isAdmin = false;
  activeTab: 'all' | 'message' | 'system' = 'all';

  // Pagination
  currentPage = 1;
  pageSize = 30;
  totalPages = 1;

  // Bulk Select
  selectedIds = new Set<number>();
  isAllSelected = false;

  // Modals
  showSendModal = false;
  showViewModal = false;
  selectedNotification: any = null;

  // Forms
  notifForm: FormGroup;
  selectedAgents: number[] = [];
  selectedFile: File | null = null;
  isSubmitting = false;
  message = { text: '', type: 'success' as 'success' | 'error' };

  translations: Record<string, Record<string, string>> = {
    sw: {
      title: 'Taarifa (Notifications)', subtitle: 'Simamia taarifa na ujumbe wa mfumo.',
      newNotifBtn: 'Tuma Taarifa Mpya', tabAll: 'Zote', tabMessages: 'Jumbe za Admin', tabSystem: 'Taarifa za Mfumo',
      deleteSelected: 'Futa Zilizochaguliwa', noNotifications: 'Hakuna taarifa yoyote kwa sasa.',
      from: 'Kutoka', system: 'Mfumo', newLabel: 'Mpya', sendMessage: 'Tuma Ujumbe',
      recipients: 'Wapokeaji', allUsers: 'Kwa Wote (Broadcast)', subject: 'Kichwa cha Habari',
      messageContent: 'Ujumbe', attachment: 'Kiambatisho (PDF au Picha, max 2MB)',
      sendBtn: 'Tuma Sasa', cancel: 'Ghairi', viewDetails: 'Taarifa Kamili',
      confirmDeleteBulk: 'Una uhakika unataka kufuta taarifa zilizochaguliwa?',
      viewAttachment: 'Fungua Kiambatisho', prev: 'Nyuma', next: 'Mbele', page: 'Ukurasa',
      errSize: 'Faili ni kubwa mno. Max ni 2MB.', close: 'Funga'
    },
    en: {
      title: 'Notifications', subtitle: 'Manage system alerts and messages.',
      newNotifBtn: 'Send New Message', tabAll: 'All', tabMessages: 'Admin Messages', tabSystem: 'System Alerts',
      deleteSelected: 'Delete Selected', noNotifications: 'No notifications at the moment.',
      from: 'From', system: 'System', newLabel: 'New', sendMessage: 'Send Message',
      recipients: 'Recipients', allUsers: 'To Everyone (Broadcast)', subject: 'Subject',
      messageContent: 'Message', attachment: 'Attachment (PDF or Image, max 2MB)',
      sendBtn: 'Send Now', cancel: 'Cancel', viewDetails: 'Full Details',
      confirmDeleteBulk: 'Are you sure you want to delete selected notifications?',
      viewAttachment: 'Open Attachment', prev: 'Prev', next: 'Next', page: 'Page',
      errSize: 'File is too large. Max is 2MB.', close: 'Close'
    }
  };

  constructor() {
    this.notifForm = this.fb.group({
      title: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === 'admin';
    
    if (this.isAdmin) {
      this.apiService.getAgents().subscribe(res => this.agents = res);
    }
    this.loadNotifs();
  }

  t(key: string): string {
    return this.translations[this.langService.lang()]?.[key] ?? key;
  }

  loadNotifs() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.notifService.getNotifications(user.id, user.role).subscribe({
      next: (res) => { 
        this.notifications = res; 
        this.applyFilter();
      }
    });
  }

  setTab(tab: 'all' | 'message' | 'system') {
    this.activeTab = tab;
    this.applyFilter();
  }

  applyFilter() {
    let result = [...this.notifications];
    if (this.activeTab === 'message') {
      result = result.filter(n => n.type === 'message');
    } else if (this.activeTab === 'system') {
      result = result.filter(n => n.type === 'system' || !n.type);
    }
    
    this.filteredNotifs = result;
    this.currentPage = 1;
    this.updatePagination();
    this.selectedIds.clear();
    this.isAllSelected = false;
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredNotifs.length / this.pageSize);
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedNotifs = this.filteredNotifs.slice(start, start + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      this.selectedIds.clear();
      this.isAllSelected = false;
    }
  }

  // --- BULK SELECT ---
  toggleSelect(id: number) {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.checkAllSelected();
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.paginatedNotifs.forEach(n => this.selectedIds.add(n.id));
    } else {
      this.selectedIds.clear();
    }
    this.isAllSelected = event.target.checked;
  }

  checkAllSelected() {
    this.isAllSelected = this.paginatedNotifs.length > 0 && 
      this.paginatedNotifs.every(n => this.selectedIds.has(n.id));
  }

  bulkDelete() {
    if (this.selectedIds.size === 0) return;
    if (confirm(this.t('confirmDeleteBulk'))) {
      this.notifService.deleteNotifications(Array.from(this.selectedIds)).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => !this.selectedIds.has(n.id));
          this.applyFilter();
        }
      });
    }
  }

  // --- VIEW & MARK AS READ ---
  viewNotification(n: any) {
    this.selectedNotification = n;
    this.showViewModal = true;
    this.markRead(n); // Auto mark as read when viewing
  }

  markRead(n: any) {
    if (n.is_read) return;
    this.notifService.markAsRead(n.id).subscribe(() => {
      n.is_read = true;
      const user = this.authService.getCurrentUser();
      if (user) this.notifService.getNotifications(user.id, user.role).subscribe();
    });
  }

  // --- SEND MODAL (ADMIN) ---
  openSendModal() {
    this.notifForm.reset();
    this.selectedAgents = [];
    this.selectedFile = null;
    this.showSendModal = true;
  }

  toggleAgentSelection(id: number) {
    if (this.selectedAgents.includes(id)) {
      this.selectedAgents = this.selectedAgents.filter(a => a !== id);
    } else {
      this.selectedAgents.push(id);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.showMessage(this.t('errSize'), 'error');
        event.target.value = '';
        return;
      }
      this.selectedFile = file;
    }
  }

  sendNotification() {
    if (this.notifForm.invalid) return;
    this.isSubmitting = true;

    const user = this.authService.getCurrentUser();
    const formData = new FormData();
    formData.append('sender_id', user!.id.toString());
    formData.append('title', this.notifForm.value.title);
    formData.append('message', this.notifForm.value.message);
    formData.append('receiver_ids', JSON.stringify(this.selectedAgents));

    if (this.selectedFile) {
      formData.append('attachment', this.selectedFile);
    }

    this.notifService.sendNotification(formData).subscribe({
      next: () => {
        this.showSendModal = false;
        this.isSubmitting = false;
        this.showMessage('Ujumbe umetumwa kikamilifu!', 'success');
        this.loadNotifs();
      },
      error: (err: any) => {
        this.showMessage(err.error?.message || 'Imeshindwa kutuma', 'error');
        this.isSubmitting = false;
      }
    });
  }

  getAttachmentUrl(path: string): string {
    return `${environment.baseUrl}/${path}`;
  }

  showMessage(text: string, type: 'success' | 'error') {
    this.message = { text, type };
    setTimeout(() => this.message = { text: '', type: 'success' }, 3000);
  }
}