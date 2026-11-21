import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiService } from '../core/api';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <main class="auth-page">
      <a class="auth-logo" routerLink="/login"><img ngSrc="/assets/images/boaz.jpg" width="216" height="66" priority alt="BOAZCHAJI Phone Charging Shop"></a>
      <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <a class="back-link" routerLink="/login">← {{ 'authBack' | translate }}</a>
        <span class="eyebrow">{{ 'authResetLabel' | translate }}</span><h1>{{ 'authForgotTitle' | translate }}</h1>
        <p>{{ 'authForgotCopy' | translate }}</p>
        @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
        @if (sent()) { <div class="alert alert-success"><strong>Check your inbox.</strong> If that email belongs to an account, we’ve sent a secure reset link. Open the link to enter and confirm your new password. For privacy, this page does not report whether an email is registered.</div> }
        <label class="field"><span>{{ 'authEmail' | translate }}</span><input type="email" formControlName="email" autocomplete="email" placeholder="you@example.com"></label>
        <button class="button button-primary login-submit" type="submit" [disabled]="form.invalid || sending()">{{ sending() ? ('authSending' | translate) : ('authSend' | translate) }} <span>→</span></button>
      </form>
      <small class="auth-footer">BOAZCHAJI · PHONE CHARGING SHOP</small>
    </main>
  `,
})
export class ForgotPasswordPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.sending.set(true);
    this.error.set('');
    this.api.forgotPassword(this.form.controls.email.value).subscribe({
      next: () => { this.sent.set(true); this.sending.set(false); },
      error: () => { this.error.set('Could not request a reset link. Please try again later.'); this.sending.set(false); },
    });
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <main class="auth-page">
      <a class="auth-logo" routerLink="/login"><img ngSrc="/assets/images/boaz.jpg" width="216" height="66" priority alt="BOAZCHAJI Phone Charging Shop"></a>
      <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <a class="back-link" routerLink="/login">← {{ 'authBack' | translate }}</a>
        <span class="eyebrow">{{ 'authResetLabel' | translate }}</span><h1>{{ 'authResetTitle' | translate }}</h1>
        <p>{{ 'authResetCopy' | translate }}</p>
        @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
        @if (success()) { <div class="alert alert-success">{{ success() }} <a routerLink="/login">Sign in</a></div> }
        <label class="field"><span>{{ 'authNewPassword' | translate }}</span><div class="password-control"><input [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" placeholder="At least 8 characters"><button type="button" class="password-toggle" (click)="showPassword.update(value => !value)" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">{{ showPassword() ? '◉' : '◎' }}</button></div></label>
        <label class="field"><span>{{ 'authConfirmPassword' | translate }}</span><div class="password-control"><input [type]="showConfirmation() ? 'text' : 'password'" formControlName="confirmation" autocomplete="new-password" placeholder="Enter the same password again"><button type="button" class="password-toggle" (click)="showConfirmation.update(value => !value)" [attr.aria-label]="showConfirmation() ? 'Hide confirmation password' : 'Show confirmation password'">{{ showConfirmation() ? '◉' : '◎' }}</button></div></label>
        <button class="button button-primary login-submit" type="submit" [disabled]="form.invalid || saving() || success()">{{ saving() ? ('authUpdating' | translate) : ('authUpdate' | translate) }} <span>→</span></button>
      </form>
      <small class="auth-footer">Reset links expire after 30 minutes.</small>
    </main>
  `,
})
export class ResetPasswordPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&._-]+$/)]],
    confirmation: ['', Validators.required],
  });
  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);
  readonly saving = signal(false);
  readonly success = signal('');
  readonly error = signal('');
  private readonly token = new URLSearchParams(this.route.snapshot.fragment ?? '').get('token')
    ?? this.route.snapshot.queryParamMap.get('token')
    ?? '';

  constructor() {
    if (!/^[a-f0-9]{64}$/.test(this.token)) this.error.set('This reset link is invalid. Request a new one.');
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { password, confirmation } = this.form.getRawValue();
    if (password !== confirmation) { this.error.set('Passwords do not match.'); return; }
    this.saving.set(true);
    this.error.set('');
    this.api.resetPassword(this.token, password, confirmation).subscribe({
      next: response => { this.success.set(response.message); this.saving.set(false); },
      error: () => { this.error.set('This link is invalid or expired. Request a new reset link.'); this.saving.set(false); },
    });
  }
}
