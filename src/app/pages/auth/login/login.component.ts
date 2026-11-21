import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  currentView: 'login' | 'forgot' | 'reset' = 'login';
  
  loginForm: FormGroup;
  forgotForm: FormGroup;
  resetForm: FormGroup;
  
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  
  resetUserId: number | null = null;

  private apiUrl = 'http://localhost/boazchaji/backend/api/auth.php';

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
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

  passwordMatchValidator(g: FormGroup) {
    return g.get('new_password')?.value === g.get('confirm_password')?.value
      ? null : { 'mismatch': true };
  }

  onLogin() {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error.message || 'Hitilafu imetokea.';
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
        this.errorMessage = err.error.message || 'Email haipo.';
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
        this.errorMessage = err.error.message;
      }
    });
  }

  switchView(view: 'login' | 'forgot' | 'reset') {
    this.currentView = view;
    this.errorMessage = '';
    this.successMessage = '';
  }
}