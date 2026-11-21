import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  user: User | null = null;
  activeTab: 'profile' | 'security' = 'profile';
  
  successMessage = '';
  errorMessage = '';
  passwordMessage = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private themeService: ThemeService,
    private translate: TranslateService
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', Validators.required],
      second_name: [''],
      last_name: ['', Validators.required],
      email: [''],
      language: ['sw'],
      theme: ['light']
    });

    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.profileForm.patchValue({
        first_name: this.user.first_name,
        second_name: this.user.second_name || '',
        last_name: this.user.last_name,
        email: this.user.email || '',
        language: this.user.language || 'sw',
        theme: this.user.theme || 'light'
      });
    }
  }

  setTab(tab: 'profile' | 'security') {
    this.activeTab = tab;
    this.successMessage = '';
    this.errorMessage = '';
    this.passwordMessage = '';
  }

  onUpdateProfile() {
    if (this.profileForm.invalid || !this.user) return;

    const payload = { ...this.profileForm.value, id: this.user.id };
    
    this.apiService.updateProfile(payload).subscribe({
      next: (res) => {
        // Update localStorage
        const updatedUser = { ...this.user, ...this.profileForm.value } as User;
        this.authService.updateCurrentUser(updatedUser);
        
        // Badilisha theme na lugha papo hapo
        this.themeService.setTheme(this.profileForm.value.theme);
        this.translate.use(this.profileForm.value.language);

        this.successMessage = res.message;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => this.errorMessage = err.error.message
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid || !this.user) return;
    
    if (this.passwordForm.value.new_password !== this.passwordForm.value.confirm_password) {
      this.passwordMessage = 'Password mpya hazifanani.';
      return;
    }

    const payload = {
      id: this.user.id,
      action: 'change_password',
      current_password: this.passwordForm.value.current_password,
      new_password: this.passwordForm.value.new_password
    };

    this.apiService.changePassword(payload).subscribe({
      next: (res) => {
        this.passwordMessage = res.message;
        this.passwordForm.reset();
      },
      error: (err) => this.passwordMessage = err.error.message
    });
  }
}