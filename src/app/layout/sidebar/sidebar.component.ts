import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  isAdmin = false;
  unreadCount = 0;

  private authService = inject(AuthService);
  private router      = inject(Router);
  private notifService = inject(NotificationService);
  langService         = inject(LanguageService);

  translations: Record<string, Record<string, string>> = {
    sw: { mainMenu: 'Menyu Kuu', management: 'Usimamizi', account: 'Akaunti', dashboard: 'Dashibodi', users: 'Watumiaji', customers: 'Wateja', services: 'Huduma', history: 'Historia', notifications: 'Taarifa', settings: 'Mipangilio', profile: 'Wasifu', logout: 'Toka' },
    en: { mainMenu: 'Main Menu', management: 'Management', account: 'Account', dashboard: 'Dashboard', users: 'Users', customers: 'Customers', services: 'Services', history: 'History', notifications: 'Notifications', settings: 'Settings', profile: 'Profile', logout: 'Logout' }
  };

  ngOnInit() {
    this.isAdmin = this.authService.getUserRole() === 'admin';
    const user = this.authService.getCurrentUser();
    if (user) {
      this.notifService.getNotifications(user.id, user.role).subscribe();
      this.notifService.unreadCount$.subscribe(count => this.unreadCount = count);
    }
  }

  t(key: string): string { return this.translations[this.langService.lang()]?.[key] ?? key; }
  onLinkClick() { if (window.innerWidth <= 768) this.closeSidebar.emit(); }
  logout() { this.closeSidebar.emit(); this.authService.logout(); this.router.navigate(['/login']); }
}