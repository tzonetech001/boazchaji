import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { User } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private fb       = inject(FormBuilder);
  private api      = inject(ApiService);
  private auth     = inject(AuthService);
  langService      = inject(LanguageService);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  user: User | null = null;
  activeTab: 'profile' | 'security' = 'profile';
  isUploading = false;

  successMessage = '';
  errorMessage   = '';
  passwordMessage = '';

  stats = { pending_count: 0, paid_count: 0, total_count: 0 };

  translations: Record<string, Record<string, string>> = {
    sw: {
      personalInfo: 'Taarifa Binafsi', security: 'Usalama',
      firstName: 'Jina la Kwanza', secondName: 'Jina la Kati', lastName: 'Jina la Mwisho',
      email: 'Email', saveChanges: 'Hifadhi Mabadiliko',
      currentPassword: 'Password ya Sasa', newPassword: 'Password Mpya', confirmPassword: 'Rudia Password Mpya',
      changePassword: 'Badilisha Password', saved: 'Taarifa zimehifadhiwa!',
      passwordOk: 'Password imebadilishwa kikamilifu!', passwordMismatch: 'Password mpya hazifanani.',
      passwordErr: 'Imeshindwa kubadilisha password.', joined: 'Alijiunga',
      pendingServices: 'Huduma Zinazosubiri', paidServices: 'Zilizolipiwa', totalServices: 'Jumla ya Huduma',
      roleAdmin: 'Msimamizi', roleAgent: 'Wakala'
    },
    en: {
      personalInfo: 'Personal Info', security: 'Security',
      firstName: 'First Name', secondName: 'Middle Name', lastName: 'Last Name',
      email: 'Email', saveChanges: 'Save Changes',
      currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm New Password',
      changePassword: 'Change Password', saved: 'Information saved!',
      passwordOk: 'Password changed successfully!', passwordMismatch: 'New passwords do not match.',
      passwordErr: 'Failed to change password.', joined: 'Joined',
      pendingServices: 'Pending Services', paidServices: 'Paid Services', totalServices: 'Total Services',
      roleAdmin: 'Administrator', roleAgent: 'Agent'
    }
  };

  constructor() {
    this.profileForm = this.fb.group({
      first_name:  ['', Validators.required],
      second_name: [''],
      last_name:   ['', Validators.required],
      email:       ['', Validators.email]
    });

    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password:     ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadUser();
    this.loadStats();
  }

  loadUser() {
    // Tunatumia observable ili kama kuna mabadiliko yoyote ya user, i-refresh
    this.auth.currentUser$.subscribe(u => {
      if (u) {
        this.user = u;
        this.profileForm.patchValue({
          first_name:  u.first_name,
          second_name: u.second_name || '',
          last_name:   u.last_name,
          email:       u.email || ''
        });
      }
    });
  }

  t(key: string): string {
    return this.translations[this.langService.lang()]?.[key] ?? key;
  }

  get avatarUrl(): string {
    const profileImage = (this.user as (User & { profile_image?: string }) | null)?.profile_image;
    if (profileImage) {
      return `${environment.baseUrl}/uploads/${profileImage}`;
    }
    return `https://ui-avatars.com/api/?name=${this.user?.first_name}+${this.user?.last_name}&background=0284c7&color=fff&size=160`;
  }

  get displayRole(): string { return this.t(this.user?.role === 'admin' ? 'roleAdmin' : 'roleAgent'); }
  get joinedDate(): string {
    const d = (this.user as any)?.created_at;
    return d ? new Date(d).toLocaleDateString() : '—';
  }

  setTab(tab: 'profile' | 'security') {
    this.activeTab = tab;
    this.successMessage = ''; this.errorMessage = ''; this.passwordMessage = '';
  }

  loadStats() {
    if (!this.user) return;
    this.api.getStats(this.user.role, this.user.id).subscribe({
      next: (s) => this.stats = {
        pending_count: s.pending_count || 0,
        paid_count: s.paid_count || 0,
        total_count: (s.pending_count || 0) + (s.paid_count || 0)
      },
      error: () => {}
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file || !this.user) return;

    this.isUploading = true;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('id', this.user.id.toString());
    formData.append('action', 'upload_image');

    this.api.uploadProfileImage(formData).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.successMessage = res.message || 'Picha imebadilishwa!';
        
        // Sasisha user local storage (Hii inasababisha header i-update papo hapo)
        const updatedUser = { ...this.user, profile_image: res.image_path } as User;
        this.auth.updateCurrentUser(updatedUser);
        
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isUploading = false;
        this.errorMessage = err.error?.message || 'Imeshindwa kupandisha picha.';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  onUpdateProfile() {
    if (this.profileForm.invalid || !this.user) return;
    const payload = { ...this.profileForm.value, id: this.user.id };

    this.api.updateProfile(payload).subscribe({
      next: (res: any) => {
        const updated = { ...this.user, ...this.profileForm.value } as User;
        this.auth.updateCurrentUser(updated);
        this.successMessage = this.t('saved');
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err: any) => this.errorMessage = err.error?.message || 'Hitilafu imetokea.'
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid || !this.user) return;
    if (this.passwordForm.value.new_password !== this.passwordForm.value.confirm_password) {
      this.passwordMessage = this.t('passwordMismatch');
      return;
    }

    const payload = {
      id: this.user.id,
      action: 'change_password',
      current_password: this.passwordForm.value.current_password,
      new_password: this.passwordForm.value.new_password
    };

    this.api.changePassword(payload).subscribe({
      next: (res: any) => {
        this.passwordMessage = res.message || this.t('passwordOk');
        this.passwordForm.reset();
      },
      error: (err: any) => this.passwordMessage = err.error?.message || this.t('passwordErr')
    });
  }
}