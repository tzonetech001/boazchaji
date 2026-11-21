import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService } from '@ngx-translate/core'; // Assume umesha-install

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
  
  // Hizi zingine zinapaswa kutoka kwenye AuthService baada ya kulogin
  userName = 'John Doe';
  userRole = 'Agent';
  userProfileImage = 'https://ui-avatars.com/api/?name=John+Doe&background=0284c7&color=fff'; // Default Profile Image

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.isDarkMode = this.themeService.isDarkMode();
    this.currentLang = this.translate.currentLang || 'sw';
    
    // Kama una data za mtumiaji kutoka kwenye localStorage au AuthService
    // this.userName = this.authService.getUser().firstName;
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