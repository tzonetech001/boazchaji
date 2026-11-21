import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Output() sidebarToggle = new EventEmitter<void>();

  private themeService = inject(ThemeService);
  private authService  = inject(AuthService);
  private router       = inject(Router);
  langService          = inject(LanguageService);

  isDarkMode = false;
  isDropdownOpen = false;
  userName = 'Mtumiaji';
  userRole = 'agent';
  userProfileImage = 'https://ui-avatars.com/api/?name=User&background=0284c7&color=fff';

  translations: Record<string, Record<string, string>> = {
    sw: {
      settings: 'Mipangilio', profile: 'Wasifu', logout: 'Toka',
      admin: 'Msimamizi', agent: 'Wakala', switchLanguage: 'Badilisha Lugha',
      toggleTheme: 'Badilisha Mwonekano', menu: 'Menyu'
    },
    en: {
      settings: 'Settings', profile: 'Profile', logout: 'Logout',
      admin: 'Administrator', agent: 'Agent', switchLanguage: 'Switch Language',
      toggleTheme: 'Toggle Theme', menu: 'Menu'
    }
  };

  ngOnInit() {
    this.isDarkMode = this.themeService.isDarkMode();
    
    this.authService.currentUser$.subscribe((user: User | null) => {
      if (user) {
        this.userName = `${user.first_name} ${user.last_name}`;
        this.userRole = user.role === 'admin' ? 'admin' : 'agent';
        
        const profileImage = (user as User & { profile_image?: string | null }).profile_image;
        if (profileImage) {
          // Hapa tunatumia baseUrl kutoka environment
          this.userProfileImage = `${environment.baseUrl}/uploads/${profileImage}`;
        } else {
          this.userProfileImage = `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=0284c7&color=fff`;
        }
      }
    });
  }

  t(key: string): string { return this.translations[this.langService.lang()]?.[key] ?? key; }
  toggleSidebar()    { this.sidebarToggle.emit(); }
  toggleDropdown()   { this.isDropdownOpen = !this.isDropdownOpen; }
  toggleLanguage()   { this.langService.toggle(); }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.setTheme(this.isDarkMode ? 'dark' : 'light');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}