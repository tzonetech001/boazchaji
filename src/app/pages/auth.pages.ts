import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiService } from '../core/api';

// ==========================================
// 1. LOGIN PAGE
// ==========================================
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <main class="auth-page">
      <a class="auth-logo" routerLink="/login"><img ngSrc="/assets/images/boaz.jpg" width="216" height="66" priority alt="BOAZCHAJI"></a>
      <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <span class="eyebrow">TEAM WORKSPACE</span>
        <h1>{{ 'loginTitle' | translate }}</h1>
        <p>{{ 'loginSubtitle' | translate }}</p>
        
        @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
        
        <label class="field"><span>{{ 'authIdentifier' | translate }}</span>
          <input type="text" formControlName="identifier" placeholder="0712345678 / email@test.com">
        </label>
        
        <label class="field"><span>{{ 'password' | translate }}</span>
          <div class="password-control">
            <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="********">
            <button type="button" class="password-toggle" (click)="showPassword.update(v => !v)">{{ showPassword() ? '◉' : '◎' }}</button>
          </div>
        </label>
        
        <a routerLink="/forgot-password" class="forgot-link">{{ 'forgotPassword' | translate }}</a>
        
        <button class="button button-primary login-submit" type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? ('authSigningIn' | translate) : ('signIn' | translate) }} <span>→</span>
        </button>
      </form>
      <small class="auth-footer">© {{ 'remember' | translate }}</small>
    </main>
  `,
})
export class LoginPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  
  readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });
  
  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const { identifier, password } = this.form.getRawValue();

    this.api.login(identifier, password).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.loading.set(false);
        // Nimebadilisha kwenda /dashboard kwa sababu route ya workspace haipo
        this.router.navigate(['/dashboard']); 
      },
      error: (err) => {
        // PHP inarudisha "message" au "error" kutegemea kosa
        this.error.set(err.error?.message || err.error?.error || 'Login failed. Check your credentials.');
        this.loading.set(false);
      }
    });
  }
}

// ==========================================
// 2. FORGOT PASSWORD PAGE (Hatua 2)
// ==========================================
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <main class="auth-page">
      <a class="auth-logo" routerLink="/login"><img ngSrc="/assets/images/boaz.jpg" width="216" height="66" priority alt="BOAZCHAJI"></a>
      
      <!-- HATUA YA 1: WEKA EMAIL -->
      @if (step() === 1) {
        <form class="auth-card" [formGroup]="emailForm" (ngSubmit)="checkEmail()">
          <a class="back-link" routerLink="/login">← {{ 'authBack' | translate }}</a>
          <h1>{{ 'authForgotTitle' | translate }}</h1>
          <p>{{ 'authForgotCopy' | translate }}</p>
          
          @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
          
          <label class="field"><span>{{ 'authEmail' | translate }}</span>
            <input type="email" formControlName="email" placeholder="you@example.com">
          </label>
          
          <button class="button button-primary login-submit" type="submit" [disabled]="emailForm.invalid || checking()">
            {{ checking() ? ('authChecking' | translate) : ('authContinue' | translate) }} <span>→</span>
          </button>
        </form>
      }

      <!-- HATUA YA 2: WEKA NENOSIRI JIPYA -->
      @if (step() === 2) {
        <form class="auth-card" [formGroup]="passwordForm" (ngSubmit)="resetPassword()">
          <h1>{{ 'authResetTitle' | translate }}</h1>
          <p>{{ 'authResetCopy' | translate }}</p>
          
          @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
          @if (success()) { <div class="alert alert-success">{{ success() }} <a routerLink="/login">{{ 'signIn' | translate }}</a></div> }

          <label class="field"><span>{{ 'authNewPassword' | translate }}</span>
            <div class="password-control">
              <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="********">
              <button type="button" class="password-toggle" (click)="showPassword.update(v => !v)">{{ showPassword() ? '◉' : '◎' }}</button>
            </div>
          </label>
          
          <label class="field"><span>{{ 'authConfirmPassword' | translate }}</span>
            <div class="password-control">
              <input [type]="showConfirm() ? 'text' : 'password'" formControlName="confirmPassword" placeholder="********">
              <button type="button" class="password-toggle" (click)="showConfirm.update(v => !v)">{{ showConfirm() ? '◉' : '◎' }}</button>
            </div>
          </label>
          
          <button class="button button-primary login-submit" type="submit" [disabled]="passwordForm.invalid || saving() || success() !== ''">
            {{ saving() ? ('authUpdating' | translate) : ('authUpdate' | translate) }} <span>→</span>
          </button>
        </form>
      }
    </main>
  `,
})
export class ForgotPasswordPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  
  readonly step = signal(1);
  readonly checking = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);

  readonly emailForm = this.fb.nonNullable.group({ 
    email: ['', [Validators.required, Validators.email]] 
  });

  readonly passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  checkEmail(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.checking.set(true);
    this.error.set('');
    
    this.api.checkEmail(this.emailForm.controls.email.value).subscribe({
      next: () => { 
        this.step.set(2);
        this.checking.set(false); 
      },
      error: (err) => { 
        this.error.set(err.error?.message || err.error?.error || 'Email not found.'); 
        this.checking.set(false); 
      },
    });
  }

  resetPassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    
    const { password, confirmPassword } = this.passwordForm.getRawValue();
    if (password !== confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    const email = this.emailForm.controls.email.value;

    // Nimebadilisha kuwa resetPassword (kulingana na api.ts)
    this.api.resetPassword(email, password).subscribe({
      next: (res) => { 
        this.success.set(res.message || 'Password updated successfully.'); 
        this.saving.set(false); 
      },
      error: (err) => { 
        this.error.set(err.error?.message || err.error?.error || 'Failed to update password.'); 
        this.saving.set(false); 
      },
    });
  }
}