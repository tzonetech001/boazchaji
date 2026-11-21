import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../core/auth';
import { ApiService } from '../core/api';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-heading"><div><div class="eyebrow">YOUR ACCOUNT</div><h1>Profile</h1><p>Keep your profile photo up to date across your workspace.</p></div></div>
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
    @if (success()) { <div class="alert alert-success">{{ success() }}</div> }
    <section class="panel profile-panel">
      <div class="profile-cover"></div>
      <div class="profile-body">
        <div class="profile-photo-wrap">
          @if (preview()) { <img class="profile-photo" [src]="preview()" alt="Your profile photo"> }
          @else { <span class="profile-photo profile-initials">{{ initials }}</span> }
          <label class="photo-change" for="profile-photo-input" aria-label="Choose a profile photo">＋</label>
          <input id="profile-photo-input" class="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" (change)="chooseImage($event)">
        </div>
        <div class="profile-info"><h2>{{ user()?.first_name }} {{ user()?.second_name }} {{ user()?.last_name }}</h2><p>{{ user()?.role === 'admin' ? 'Administrator' : 'Charging-shop agent' }} <span>·</span> {{ user()?.phone }}</p></div>
        <div class="profile-details"><div><span>PHONE NUMBER</span><strong>{{ user()?.phone }}</strong></div><div><span>EMAIL ADDRESS</span><strong>{{ user()?.email || 'No email added' }}</strong></div><div><span>PROFILE PHOTO</span><strong>JPG, PNG or WebP · up to 5 MB</strong></div></div>
        <div class="profile-actions"><small>Your photo appears in the header and team profile.</small><button class="button button-primary" (click)="save()" [disabled]="!image() || saving()">{{ saving() ? 'Uploading…' : 'Save photo →' }}</button></div>
      </div>
    </section>
  `,
})
export class ProfilePage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly user = this.auth.user;
  readonly preview = signal<string | null>(this.user()?.profile_image_path ?? null);
  readonly error = signal('');
  readonly success = signal('');
  readonly saving = signal(false);
  readonly image = signal<File | null>(null);
  readonly initials = `${this.user()?.first_name?.[0] ?? 'B'}${this.user()?.last_name?.[0] ?? 'C'}`.toUpperCase();

  chooseImage(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.error.set('Choose a JPG, PNG or WebP image smaller than 5 MB.');
      return;
    }
    this.revokePreview();
    this.image.set(file);
    this.preview.set(URL.createObjectURL(file));
    this.error.set('');
    this.success.set('');
  }

  save(): void {
    const user = this.user();
    const image = this.image();
    if (!user || !image) return;
    this.saving.set(true);
    this.error.set('');
    this.api.updateProfileImage(user.id, image).subscribe({
      next: response => {
        const updated = { ...user, profile_image_path: response.profile_image_path };
        this.auth.user.set(updated);
        localStorage.setItem('boazchaji.user', JSON.stringify(updated));
        this.revokePreview();
        this.preview.set(response.profile_image_path);
        this.image.set(null);
        this.success.set('Your profile photo has been updated.');
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Could not upload your profile photo. Please try again.');
        this.saving.set(false);
      },
    });
  }

  private revokePreview(): void {
    const current = this.preview();
    if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
  }
}
