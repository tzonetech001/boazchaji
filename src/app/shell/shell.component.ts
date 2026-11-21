import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../core/auth';
import { ApiService } from '../core/api';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  template: `
    <div class="app-shell" [class.sidebar-open]="menuOpen()">
      <aside class="sidebar">
        <a class="brand" routerLink="/dashboard"><img ngSrc="/assets/images/boaz.jpg" width="144" height="44" priority alt="BOAZCHAJI Phone Charging Shop"></a>
        <div class="nav-caption">{{ 'dashboard' | translate }}</div>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active"><span class="nav-icon">⌂</span>{{ 'dashboard' | translate }}</a>
          <a routerLink="/services" routerLinkActive="active"><span class="nav-icon">▤</span>{{ 'services' | translate }}<span class="nav-count">{{ pendingCount() }}</span></a>
          <a routerLink="/customers" routerLinkActive="active"><span class="nav-icon">♙</span>{{ 'customers' | translate }}</a>
          <a routerLink="/history" routerLinkActive="active"><span class="nav-icon">◷</span>{{ 'history' | translate }}</a>
          @if (auth.user()?.role === 'admin') {
            <div class="nav-caption nav-caption-spaced">{{ 'settings' | translate }}</div>
            <a routerLink="/agents" routerLinkActive="active"><span class="nav-icon">♧</span>{{ 'agents' | translate }}</a>
          }
          <a routerLink="/settings" routerLinkActive="active"><span class="nav-icon">⚙</span>{{ 'settings' | translate }}</a>
        </nav>
        <div class="sidebar-bottom">
          <div class="support-card"><span class="support-bubble">✳</span><strong>Need a hand?</strong><small>We're here to help you run your phone-charging shop.</small></div>
          <div class="user-mini"><a class="avatar" routerLink="/profile" aria-label="Edit profile">@if (auth.user()?.profile_image_path) {<img [src]="auth.user()?.profile_image_path" alt="">} @else {{{ initials }}}</a><div><strong>{{ auth.user()?.first_name }} {{ auth.user()?.last_name }}</strong><small>{{ auth.user()?.role === 'admin' ? 'Administrator' : 'Charging shop agent' }}</small></div><button class="icon-button logout" (click)="auth.logout()" aria-label="Log out">↗</button></div>
        </div>
      </aside>
      @if (menuOpen()) { <button class="scrim" (click)="menuOpen.set(false)" aria-label="Close navigation"></button> }
      <main class="main-area">
        <header class="topbar">
          <div class="topbar-left"><button class="icon-button menu-button" (click)="menuOpen.update(v => !v)" aria-label="Toggle navigation">☰</button><div class="breadcrumb">Workspace <span>/</span> <strong>{{ pageName }}</strong></div></div>
          <div class="topbar-actions"><span class="date-label">{{ today }}</span><button class="icon-button" (click)="toggleTheme()" [attr.aria-label]="'Toggle theme'">{{ dark() ? '☼' : '◐' }}</button><button class="language-button" (click)="toggleLanguage()">{{ language() === 'sw' ? 'SW' : 'EN' }} <span>⌄</span></button><a class="avatar top-avatar" routerLink="/profile" aria-label="Open profile">@if (auth.user()?.profile_image_path) {<img [src]="auth.user()?.profile_image_path" alt="">} @else {{{ initials }}}</a></div>
        </header>
        <section class="page-content">@if (preferencesError()) { <div class="alert alert-error">{{ preferencesError() }}</div> }<router-outlet /></section>
      </main>
    </div>
  `,
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  readonly menuOpen = signal(false);
  readonly pendingCount = signal(0);
  readonly preferencesError = signal('');
  readonly language = signal<'sw' | 'en'>(this.auth.user()?.language ?? 'sw');
  readonly dark = signal(this.auth.user()?.theme === 'dark');
  readonly today = new Intl.DateTimeFormat(this.language() === 'sw' ? 'sw-TZ' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
  readonly initials = `${this.auth.user()?.first_name?.[0] ?? 'B'}${this.auth.user()?.last_name?.[0] ?? 'C'}`.toUpperCase();
  get pageName(): string { return this.router.url.split('?')[0].split('/').filter(Boolean).pop()?.replace('-', ' ') ?? 'Dashboard'; }

  constructor() {
    this.translate.use(this.language());
    document.documentElement.dataset['theme'] = this.dark() ? 'dark' : 'light';
    this.api.services('pending').subscribe({ next: (result) => this.pendingCount.set(result.items.length), error: () => this.pendingCount.set(0) });
  }

  toggleLanguage(): void {
    const language = this.language() === 'sw' ? 'en' : 'sw';
    this.language.set(language);
    this.translate.use(language);
    this.savePreferences();
  }

  toggleTheme(): void {
    const dark = !this.dark();
    this.dark.set(dark);
    document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
    this.savePreferences();
  }

  private savePreferences(): void {
    const user = this.auth.user();
    if (!user) return;
    const theme: 'dark' | 'light' = this.dark() ? 'dark' : 'light';
    const updated = { ...user, language: this.language(), theme };
    localStorage.setItem('boazchaji.user', JSON.stringify(updated));
    this.auth.user.set(updated);
    this.preferencesError.set('');
    this.api.updatePreferences(user.id, this.language(), theme).subscribe({
      error: () => this.preferencesError.set('Preference change could not be saved to your account.'),
    });
  }
}
