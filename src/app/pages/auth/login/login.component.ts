import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb           = inject(FormBuilder);
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private http         = inject(HttpClient);
  langService          = inject(LanguageService);
  private themeService = inject(ThemeService);

  currentView: 'login' | 'forgot' | 'reset' = 'login';
  
  loginForm: FormGroup;
  forgotForm: FormGroup;
  resetForm: FormGroup;
  
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  
  resetUserId: number | null = null;
  isDarkMode = false;

  private apiUrl = `${environment.baseUrl}/api/auth.php`;

  translations: Record<string, Record<string, string>> = {
    sw: {
      brandingSubtitle: 'Mfumo wa Kurekodi Huduma za Kuchaji Simu, Betri, Radio, Laptop..',
      welcomeBack: 'Karibu Tena',
      welcomeBackDesc: 'Tafadhali ingia kwenye akaunti yako.',
      forgotTitle: 'Kurejesha Nywila',
      forgotDesc: 'Weka email yako kurejesha nywila.',
      resetTitle: 'Weka Nywila Mpya',
      resetDesc: 'Weka nywila yako mpya hapa chini.',
      phoneLabel: 'Namba ya Simu',
      phonePlaceholder: '07XXXXXXXX',
      phoneError: 'Namba lazima ianze na 07 au 06 na iwe na tarakimu 10.',
      passwordLabel: 'Nywila',
      forgotPasswordLink: 'Umesahau Nywila?',
      loginBtn: 'Ingia',
      emailLabel: 'Email Yako',
      emailPlaceholder: 'mfano@gmail.com',
      emailError: 'Weka email sahihi.',
      findEmailBtn: 'Tafuta Email',
      backToLogin: 'Rudi Login',
      newPasswordLabel: 'Nywila Mpya',
      confirmPasswordLabel: 'Rudia Nywila Mpya',
      passwordMismatch: 'Nywila hazifanani.',
      resetBtn: 'Badilisha Nywila',
      changeLangTooltip: 'Badilisha Lugha',
      changeThemeTooltip: 'Badilisha Mwonekano'
    },
    en: {
      brandingSubtitle: 'System for Recording Phone, Battery, Radio, Laptop Charging Services..',
      welcomeBack: 'Welcome Back',
      welcomeBackDesc: 'Please login to your account.',
      forgotTitle: 'Forgot Password',
      forgotDesc: 'Enter your email to reset password.',
      resetTitle: 'Set New Password',
      resetDesc: 'Enter your new password below.',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '07XXXXXXXX',
      phoneError: 'Number must start with 07 or 06 and have 10 digits.',
      passwordLabel: 'Password',
      forgotPasswordLink: 'Forgot Password?',
      loginBtn: 'Login',
      emailLabel: 'Your Email',
      emailPlaceholder: 'example@gmail.com',
      emailError: 'Enter a valid email.',
      findEmailBtn: 'Find Email',
      backToLogin: 'Back to Login',
      newPasswordLabel: 'New Password',
      confirmPasswordLabel: 'Confirm New Password',
      passwordMismatch: 'Passwords do not match.',
      resetBtn: 'Change Password',
      changeLangTooltip: 'Change Language',
      changeThemeTooltip: 'Toggle Theme'
    }
  };

  constructor() {
    this.loginForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern('^(07|06)[0-9]{8}$')]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.isDarkMode = this.themeService.isDarkMode();
  }

  t(key: string): string {
    return this.translations[this.langService.lang()]?.[key] ?? key;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.setTheme(this.isDarkMode ? 'dark' : 'light');
  }

  toggleLanguage() {
    this.langService.toggle();
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('new_password')?.value === g.get('confirm_password')?.value
      ? null : { 'mismatch': true };
  }

  onLogin() {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Hitilafu imetokea. Jaribu tena.';
      }
    });
  }

  onForgotPassword() {
    if (this.forgotForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post(`${this.apiUrl}?action=forgot_password`, this.forgotForm.value).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.resetUserId = res.user_id;
        this.successMessage = res.message;
        setTimeout(() => {
          this.currentView = 'reset';
          this.successMessage = '';
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Email haipo.';
      }
    });
  }

  onResetPassword() {
    if (this.resetForm.invalid || !this.resetUserId) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      user_id: this.resetUserId,
      password: this.resetForm.value.new_password
    };

    this.http.post(`${this.apiUrl}?action=reset_password`, payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = res.message;
        setTimeout(() => {
          this.currentView = 'login';
          this.successMessage = '';
          this.resetForm.reset();
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Imeshindwa kubadilisha nywila.';
      }
    });
  }

  switchView(view: 'login' | 'forgot' | 'reset') {
    this.currentView = view;
    this.errorMessage = '';
    this.successMessage = '';
  }
}