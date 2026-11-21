import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  agents: any[] = [];
  isAdmin = false;
  notifForm: FormGroup;

  translations: Record<string, Record<string, string>> = {
    sw: {
      title: 'Taarifa (Notifications)',
      subtitle: 'Simamia taarifa na ujumbe wa mfumo.',
      clearAll: 'Futa Zote',
      sendMessage: 'Tuma Ujumbe Mpya',
      receiver: 'Mpokeaji',
      allUsers: 'Kwa Wote (Broadcast)',
      subject: 'Kichwa cha Habari',
      subjectPlaceholder: 'Mfano: Kumbusho la Kazi',
      message: 'Ujumbe',
      messagePlaceholder: 'Andika ujumbe wako hapa...',
      sendBtn: 'Tuma Ujumbe',
      noNotifications: 'Hakuna taarifa yoyote kwa sasa.',
      from: 'Kutoka:',
      system: 'Mfumo',
      newLabel: 'Mpya',
      confirmDeleteAll: 'Una uhakika unataka kufuta taarifa zote?'
    },
    en: {
      title: 'Notifications',
      subtitle: 'Manage system alerts and messages.',
      clearAll: 'Clear All',
      sendMessage: 'Send New Message',
      receiver: 'Receiver',
      allUsers: 'To Everyone (Broadcast)',
      subject: 'Subject',
      subjectPlaceholder: 'e.g., Work Reminder',
      message: 'Message',
      messagePlaceholder: 'Write your message here...',
      sendBtn: 'Send Message',
      noNotifications: 'No notifications at the moment.',
      from: 'From:',
      system: 'System',
      newLabel: 'New',
      confirmDeleteAll: 'Are you sure you want to clear all notifications?'
    }
  };

  constructor() {
    this.notifForm = this.fb.group({
      receiver_id: [''],
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
      next: (res) => this.notifications = res,
      error: (err) => console.error('Failed to load notifications', err)
    });
  }

  sendNotif() {
    if (this.notifForm.invalid) return;
    const user = this.authService.getCurrentUser();
    
    const data = { 
      ...this.notifForm.value, 
      sender_id: user?.id 
    };
    
    this.notifService.sendNotification(data).subscribe({
      next: () => {
        this.notifForm.reset({ receiver_id: '' });
        this.loadNotifs();
      },
      error: () => alert('Imeshindwa kutuma ujumbe.')
    });
  }

  markRead(n: any) {
    if (n.is_read) return;
    
    this.notifService.markAsRead(n.id).subscribe({
      next: () => {
        n.is_read = true;
        // Update count kwenye sidebar
        const user = this.authService.getCurrentUser();
        if (user) {
          this.notifService.getNotifications(user.id, user.role).subscribe();
        }
      }
    });
  }

  clearAll() {
    if (confirm(this.t('confirmDeleteAll'))) {
      this.notifService.deleteAll().subscribe({
        next: () => this.loadNotifs(),
        error: () => alert('Imeshindwa kufuta taarifa.')
      });
    }
  }
}