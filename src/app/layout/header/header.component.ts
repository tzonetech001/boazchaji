import { Component, EventEmitter, Output, OnInit, Inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Output() sidebarToggle = new EventEmitter<void>();

  isDarkMode = false;
  isDropdownOpen = false;
  currentLang = 'sw';
  
  userName = 'Mtumiaji';
  userRole = 'Agent';
  userProfileImage = 'https://ui-avatars.com/api/?name=User&background=0284c7&color=fff';

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private router: Router,
    @Inject(TranslateService) private translate: TranslateService
  ) {}

  ngOnInit() {
    this.isDarkMode = this.themeService.isDarkMode();
    this.currentLang = this.translate.currentLang() || 'sw';
    
    // Chukua taarifa za mtumiaji kutoka AuthService
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = `${user.first_name} ${user.last_name}`;
      this.userRole = user.role === 'admin' ? 'Admin' : 'Agent';
      this.userProfileImage = `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=0284c7&color=fff`;
    }
  }

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.setTheme(this.isDarkMode ? 'dark' : 'light');
  }

  toggleLanguage() {
    this.currentLang = this.currentLang === 'sw' ? 'en' : 'sw';
    this.translate.use(this.currentLang);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}