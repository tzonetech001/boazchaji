import { CurrencyPipe, DatePipe, DecimalPipe, LowerCasePipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { ApiService } from '../core/api';
import { AuthService } from '../core/auth';
import { Customer, DashboardData, DeviceType, ServiceRecord } from '../core/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, LowerCasePipe, RouterLink, TranslatePipe],
  template: `
    <div class="page-heading"><div><div class="eyebrow">OVERVIEW</div><h1>{{ 'welcome' | translate }}, {{ auth.user()?.first_name }} <span class="wave">✦</span></h1><p>{{ 'overview' | translate }}</p></div><a class="button button-primary" routerLink="/services/new"><span>＋</span> {{ 'newService' | translate }}</a></div>
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
    @if (data(); as dashboard) {
      <div class="stats-grid">
        <article class="stat-card"><div class="stat-top"><span class="stat-icon mint">◷</span><span class="stat-note">↗ This month</span></div><div class="stat-label">{{ 'pendingAmount' | translate }}</div><div class="stat-value">{{ dashboard.stats.pending_amount | currency:'TZS':'symbol-narrow':'1.0-0' }}</div><div class="stat-foot"><span class="dot dot-orange"></span>{{ dashboard.stats.pending_count }} {{ 'pending' | translate | lowercase }}</div></article>
        <article class="stat-card"><div class="stat-top"><span class="stat-icon blue">↗</span><span class="stat-note positive">↗ Today</span></div><div class="stat-label">{{ 'paidToday' | translate }}</div><div class="stat-value">{{ dashboard.stats.paid_today | currency:'TZS':'symbol-narrow':'1.0-0' }}</div><div class="stat-foot"><span class="dot dot-green"></span>{{ 'paid' | translate }} {{ 'services' | translate | lowercase }}</div></article>
        <article class="stat-card"><div class="stat-top"><span class="stat-icon violet">▤</span><span class="stat-note">{{ 'recentServices' | translate }}</span></div><div class="stat-label">{{ 'totalServices' | translate }}</div><div class="stat-value">{{ dashboard.stats.total_services | number }}</div><div class="stat-foot"><span class="dot dot-blue"></span>{{ dashboard.recent.length }} {{ 'recentServices' | translate | lowercase }}</div></article>
      </div>
        @if (agentList().length) { <section class="panel agent-performance"><div class="panel-heading"><div><h2>Agent performance</h2><p>Charging-shop activity at a glance</p></div><div class="panel-heading-actions"><select class="agent-filter" [value]="selectedAgent()" (change)="filterAgent($any($event.target).value)"><option value="">All agents</option>@for (agent of agentList(); track agent.id) {<option [value]="agent.id">{{ agent.first_name }} {{ agent.last_name }}</option>}</select><a routerLink="/agents" class="text-link">{{ 'viewAll' | translate }} <span>→</span></a></div></div><div class="table-wrap"><table><thead><tr><th>{{ 'agent' | translate }}</th><th>{{ 'phone' | translate }}</th><th>{{ 'totalServices' | translate }}</th><th>{{ 'paidTotal' | translate }}</th></tr></thead><tbody>@for (agent of dashboard.agents; track agent.id) {<tr><td><span class="agent-cell"><span class="avatar small-avatar">{{ agent.first_name[0] }}{{ agent.last_name[0] }}</span><strong>{{ agent.first_name }} {{ agent.last_name }}</strong></span></td><td>{{ agent.phone }}</td><td>{{ agent.service_count }}</td><td class="amount-cell">{{ agent.paid_total | currency:'TZS':'symbol-narrow':'1.0-0' }}</td></tr>}</tbody></table></div></section> }
      <section class="panel recent-panel"><div class="panel-heading"><div><h2>{{ 'recentServices' | translate }}</h2><p>Your latest charging-shop activity</p></div><a routerLink="/services" class="text-link">{{ 'viewAll' | translate }} <span>→</span></a></div>
        @if (dashboard.recent.length) { <div class="table-wrap"><table><thead><tr><th>{{ 'customer' | translate }}</th><th>{{ 'deviceType' | translate }}</th><th>{{ 'date' | translate }}</th><th>{{ 'amount' | translate }}</th><th>{{ 'status' | translate }}</th></tr></thead><tbody>@for (item of dashboard.recent; track item.id) {<tr><td><span class="customer-cell"><span class="customer-avatar">{{ item.customer_name[0] }}</span><strong>{{ item.customer_name }}</strong></span></td><td><span class="device-cell"><span>▣</span>{{ item.device_name }}</span></td><td>{{ item.created_at | date:'MMM d, y' }}</td><td class="amount-cell">{{ item.quantity * item.amount | currency:'TZS':'symbol-narrow':'1.0-0' }}</td><td><span class="status-pill" [class.paid]="item.status === 'paid'"><i></i>{{ item.status | translate }}</span></td></tr>}</tbody></table></div> } @else { <div class="empty-state"><span>▤</span><strong>{{ 'noServices' | translate }}</strong><a routerLink="/services/new" class="text-link">{{ 'newService' | translate }} →</a></div> }
      </section>
    } @else { <div class="loading-card"><span class="loader"></span>{{ 'loading' | translate }}</div> }
  `,
})
export class DashboardPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  readonly data = signal<DashboardData | null>(null);
  readonly error = signal('');
  readonly agentList = signal<NonNullable<DashboardData['agents']>>([]);
  readonly selectedAgent = signal('');

  ngOnInit(): void {
    this.load();
  }

  filterAgent(id: string): void { this.selectedAgent.set(id); this.load(); }

  private load(): void {
    this.api.dashboard(this.selectedAgent() ? Number(this.selectedAgent()) : undefined).subscribe({
      next: data => {
        this.data.set(data);
        if (data.agents) this.agentList.set(data.agents);
      },
      error: () => this.error.set('Unable to load dashboard. Verify the API connection.'),
    });
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, RouterLink, TranslatePipe],
  template: `
    <div class="page-heading"><div><div class="eyebrow">{{ history ? 'COMPLETED SERVICES' : 'SERVICE QUEUE' }}</div><h1>{{ (history ? 'history' : 'services') | translate }}</h1><p>{{ history ? 'A record of completed charging services and payments.' : 'Keep track of every phone charging service in progress.' }}</p></div><a class="button button-primary" routerLink="/services/new">＋ {{ 'newService' | translate }}</a></div>
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
    <section class="panel list-panel"><div class="list-toolbar"><div class="list-filters"><div class="search-box"><span>⌕</span><input placeholder="Search customers or devices" [value]="query()" (input)="query.set($any($event.target).value)"></div>@if (auth.user()?.role === 'admin') {<select class="agent-filter" [value]="selectedAgent()" (change)="filterAgent($any($event.target).value)"><option value="">All agents</option>@for (agent of agents(); track agent.id) {<option [value]="agent.id">{{ agent.first_name }} {{ agent.last_name }}</option>}</select>}</div><span class="result-count">{{ filtered().length }} records</span></div>
      @if (filtered().length) { <div class="table-wrap"><table><thead><tr><th>{{ 'customer' | translate }}</th><th>{{ 'deviceType' | translate }}</th><th>{{ 'date' | translate }}</th><th>{{ 'quantity' | translate }}</th><th>{{ 'total' | translate }}</th><th>{{ 'image' | translate }}</th><th>{{ 'status' | translate }}</th>@if (!history) { <th></th> }</tr></thead><tbody>@for (item of filtered(); track item.id) {<tr><td><span class="customer-cell"><span class="customer-avatar">{{ item.customer_name[0] }}</span><span><strong>{{ item.customer_name }}</strong><small>{{ item.customer_phone || '—' }}</small></span></span></td><td><span class="device-cell"><span>▣</span><span><strong>{{ item.device_name }}</strong><small>{{ item.device_type }}</small></span></span></td><td>{{ item.created_at | date:'MMM d, y · h:mm a' }}</td><td>{{ item.quantity }}</td><td class="amount-cell">{{ item.quantity * item.amount | currency:'TZS':'symbol-narrow':'1.0-0' }}</td><td>@if (item.image_path) {<button class="button button-small button-quiet" (click)="viewImage(item)">View photo</button>} @else {<span>—</span>}</td><td><span class="status-pill" [class.paid]="item.status === 'paid'"><i></i>{{ item.status | translate }}</span></td>@if (!history) {<td><button class="button button-small button-success" (click)="markPaid(item)" [disabled]="paying() === item.id">{{ 'markPaid' | translate }} ✓</button></td>}</tr>}</tbody></table></div> } @else { <div class="empty-state"><span>▤</span><strong>{{ query() ? 'No matching records.' : ('noServices' | translate) }}</strong></div> }
    </section>
    @if (selectedImage(); as image) { <div class="modal-backdrop" (click)="selectedImage.set(null)"><section class="image-modal" (click)="$event.stopPropagation()"><div class="panel-heading"><div><h2>Device photo</h2><p>{{ image.device_name }} · {{ image.customer_name }}</p></div><button class="icon-button" (click)="selectedImage.set(null)" aria-label="Close photo">×</button></div><img [src]="image.image_path" [alt]="image.device_name"><button class="button button-quiet" (click)="selectedImage.set(null)">Close</button></section></div> }
  `,
})
export class ServicesPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly items = signal<ServiceRecord[]>([]);
  readonly query = signal('');
  readonly paying = signal<number | null>(null);
  readonly error = signal('');
  readonly selectedImage = signal<ServiceRecord | null>(null);
  readonly agents = signal<Array<{ id: number; first_name: string; last_name: string }>>([]);
  readonly selectedAgent = signal('');
  history = false;
  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.items().filter(item => `${item.customer_name} ${item.device_name} ${item.device_type}`.toLowerCase().includes(query));
  });

  ngOnInit(): void {
    this.history = this.route.snapshot.data['status'] === 'paid';
    if (this.auth.user()?.role === 'admin') {
      this.api.users().subscribe({ next: response => this.agents.set(response.items), error: () => this.error.set('Could not load agents.') });
    }
    this.load();
  }

  filterAgent(id: string): void { this.selectedAgent.set(id); this.load(); }
  viewImage(item: ServiceRecord): void { this.selectedImage.set(item); }

  markPaid(item: ServiceRecord): void {
    this.paying.set(item.id);
    this.api.markPaid(item.id).subscribe({
      next: () => { this.items.update(items => items.filter(service => service.id !== item.id)); this.paying.set(null); },
      error: () => { this.error.set('Could not update payment status. Please retry.'); this.paying.set(null); },
    });
  }

  private load(): void {
    this.api.services(this.history ? 'paid' : 'pending', this.selectedAgent() ? Number(this.selectedAgent()) : undefined).subscribe({
      next: response => this.items.set(response.items),
      error: () => this.error.set('Could not load services. Verify the API connection.'),
    });
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="page-heading"><div><div class="eyebrow">PHONE CHARGING SERVICE</div><h1>{{ 'newService' | translate }}</h1><p>Record a phone charging service and keep your customer history up to date.</p></div><a class="button button-quiet" routerLink="/services">← {{ 'services' | translate }}</a></div>
    @if (success()) { <div class="alert alert-success">{{ 'created' | translate }} <a routerLink="/services">View pending services →</a></div> }
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
    <form class="service-form" [formGroup]="form" (ngSubmit)="submit()">
      <section class="form-panel panel"><div class="form-section-title"><span class="section-number">01</span><div><h2>Customer details</h2><p>{{ 'addCustomerHint' | translate }}</p></div></div>
        <div class="form-grid"><label class="field field-wide"><span>{{ 'customer' | translate }} <b>*</b></span><input list="customer-options" formControlName="customerName" placeholder="Search by name or enter a new customer" (input)="customerChanged()"><datalist id="customer-options">@for (customer of suggestions(); track customer.id) {<option [value]="customer.name">{{ customer.phone }}</option>}</datalist>@if (form.controls.customerName.invalid && form.controls.customerName.touched) {<small class="field-error">Enter the customer's name.</small>}</label>
        <label class="field"><span>{{ 'phone' | translate }}</span><input formControlName="customerPhone" placeholder="07XX XXX XXX" inputmode="tel"><small>{{ 'phoneValidation' | translate }}</small></label>
        @if (auth.user()?.role === 'admin') {<label class="field"><span>{{ 'assignAgent' | translate }} <b>*</b></span><select formControlName="agentId"><option value="">Select an agent</option>@for (agent of agents(); track agent.id) {<option [value]="agent.id">{{ agent.first_name }} {{ agent.last_name }}</option>}</select></label>}</div>
      </section>
      <section class="form-panel panel"><div class="form-section-title"><span class="section-number">02</span><div><h2>Device details</h2><p>Tell us what needs attention.</p></div></div>
        <div class="form-grid"><label class="field"><span>{{ 'deviceType' | translate }} <b>*</b></span><select formControlName="deviceTypeId"><option value="">Choose a type</option>@for (type of types(); track type.id) {<option [value]="type.id">{{ type.name }}</option>}</select></label><div class="field add-type-field"><span>Quick add type</span><div class="inline-input"><input [value]="newType()" (input)="newType.set($any($event.target).value)" placeholder="e.g. Laptop"><button type="button" class="button button-outline button-small" (click)="addType()" [disabled]="!newType().trim()">＋</button></div></div>
        <label class="field field-wide"><span>{{ 'deviceName' | translate }} <b>*</b></span><input formControlName="deviceName" placeholder="e.g. Samsung Galaxy A14"></label>
        <label class="field"><span>{{ 'quantity' | translate }} <b>*</b></span><input type="number" formControlName="quantity" min="1" step="1"></label><label class="field"><span>{{ 'amount' | translate }} (TZS) <b>*</b></span><div class="money-input"><span>TZS</span><input type="number" formControlName="amount" min="0" step="100"></div></label></div>
        <div class="total-strip"><div><span>{{ 'total' | translate }}</span><small>{{ form.controls.quantity.value || 0 }} × {{ form.controls.amount.value || 0 }} TZS</small></div><strong>{{ total() | number:'1.0-0' }} <small>TZS</small></strong></div>
      </section>
      <section class="form-panel panel"><div class="form-section-title"><span class="section-number">03</span><div><h2>{{ 'image' | translate }}</h2><p>Add a photo so your team can identify the device.</p></div></div>
        <label class="upload-area" [class.has-image]="preview()"><input type="file" accept="image/png,image/jpeg,image/webp" (change)="chooseImage($event)"><span class="upload-icon">↑</span><strong>{{ preview() ? 'Change device photo' : 'Click to upload or drag a photo here' }}</strong><small>PNG, JPG or WebP · Max 5 MB</small></label>
        @if (preview()) {<div class="image-preview"><img [src]="preview()" alt="Device preview"><button type="button" class="button button-quiet button-small" (click)="removeImage()">Remove photo</button></div>}
      </section>
      <div class="form-actions"><span><i class="required-dot"></i> Required fields</span><div><a class="button button-quiet" routerLink="/services">{{ 'cancel' | translate }}</a><button type="submit" class="button button-primary" [disabled]="form.invalid || saving()"><span>{{ saving() ? 'Saving…' : ('saveService' | translate) }}</span><span>→</span></button></div></div>
    </form>
  `,
})
export class ServiceFormPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = this.fb.nonNullable.group({
    customerName: ['', Validators.required],
    customerPhone: ['', Validators.pattern(/^(07|06)[0-9]{8}$/)],
    customerId: [0],
    deviceTypeId: ['', Validators.required],
    deviceName: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    amount: [300, [Validators.required, Validators.min(0)]],
    agentId: [''],
  });
  readonly suggestions = signal<Customer[]>([]);
  readonly types = signal<DeviceType[]>([]);
  readonly agents = signal<Array<{ id: number; first_name: string; last_name: string }>>([]);
  readonly newType = signal('');
  readonly preview = signal<string | null>(null);
  readonly success = signal(false);
  readonly error = signal('');
  readonly saving = signal(false);
  private image: File | null = null;
  readonly total = signal(300);

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(values => {
      this.total.set(Number(values.quantity || 0) * Number(values.amount || 0));
    });
    this.api.deviceTypes().subscribe({ next: response => this.types.set(response.items), error: () => this.error.set('Could not load device types.') });
    if (this.auth.user()?.role === 'admin') this.api.users().subscribe({ next: response => this.agents.set(response.items), error: () => this.error.set('Could not load agents.') });
    this.form.controls.customerName.valueChanges.pipe(
      debounceTime(250), distinctUntilChanged(),
      switchMap(name => name.trim().length > 1 ? this.api.customers(name.trim()) : of({ items: [] })),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: response => this.suggestions.set(response.items), error: () => this.suggestions.set([]) });
  }

  customerChanged(): void {
    const match = this.suggestions().find(customer => customer.name.toLowerCase() === this.form.controls.customerName.value.trim().toLowerCase());
    this.form.controls.customerId.setValue(match?.id ?? 0);
    if (match?.phone) this.form.controls.customerPhone.setValue(match.phone);
  }

  chooseImage(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.error.set('Choose a JPG, PNG or WebP image smaller than 5 MB.');
      return;
    }
    this.error.set('');
    if (this.preview()) URL.revokeObjectURL(this.preview()!);
    this.image = file;
    this.preview.set(URL.createObjectURL(file));
  }

  removeImage(): void {
    if (this.preview()) URL.revokeObjectURL(this.preview()!);
    this.preview.set(null);
    this.image = null;
  }

  addType(): void {
    const name = this.newType().trim();
    if (!name) return;
    this.api.addDeviceType(name).subscribe({
      next: response => { this.types.update(types => [...types, response.device_type]); this.form.controls.deviceTypeId.setValue(String(response.device_type.id)); this.newType.set(''); },
      error: () => this.error.set('Could not add that device type. It may already exist.'),
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const values = this.form.getRawValue();
    if (values.customerPhone && !/^(07|06)[0-9]{8}$/.test(values.customerPhone)) {
      this.error.set('Use a 10-digit customer phone number starting with 06 or 07.');
      return;
    }
    if (this.auth.user()?.role === 'admin' && !values.agentId) {
      this.error.set('Select an agent for this service.');
      return;
    }
    const body = new FormData();
    if (values.customerId) body.append('customer_id', String(values.customerId));
    else {
      body.append('customer_name', values.customerName.trim());
      if (values.customerPhone) body.append('customer_phone', values.customerPhone);
    }
    body.append('device_type_id', values.deviceTypeId);
    body.append('device_name', values.deviceName.trim());
    body.append('quantity', String(values.quantity));
    body.append('amount', String(values.amount));
    if (values.agentId) body.append('agent_id', values.agentId);
    if (this.image) body.append('image', this.image);
    this.saving.set(true);
    this.error.set('');
    this.api.createService(body).subscribe({
      next: () => { this.success.set(true); this.form.reset({ customerName: '', customerPhone: '', customerId: 0, deviceTypeId: '', deviceName: '', quantity: 1, amount: 300, agentId: '' }); this.removeImage(); this.saving.set(false); },
      error: () => { this.error.set('Service could not be saved. Check the form and API connection.'); this.saving.set(false); },
    });
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div class="page-heading"><div><div class="eyebrow">CUSTOMER DIRECTORY</div><h1>{{ 'customers' | translate }}</h1><p>{{ 'customersSubtitle' | translate }}</p></div></div>
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
    <section class="panel list-panel"><div class="list-toolbar"><div class="search-box"><span>⌕</span><input [placeholder]="'search' | translate" [value]="query()" (input)="search($any($event.target).value)"></div><span class="result-count">{{ customers().length }} customers</span></div>
    @if (customers().length) {<div class="customer-grid">@for (customer of customers(); track customer.id) {<article class="customer-card"><span class="customer-avatar">{{ customer.name[0] }}</span><div><strong>{{ customer.name }}</strong><small>{{ customer.phone || 'No phone number' }}</small></div><span class="card-arrow">→</span></article>}</div>} @else {<div class="empty-state"><span>♙</span><strong>No customers found.</strong><small>Customers are added when you record their first service.</small></div>}</section>
  `,
})
export class CustomersPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly customers = signal<Customer[]>([]);
  readonly query = signal('');
  readonly error = signal('');
  ngOnInit(): void { this.load(''); }
  search(value: string): void { this.query.set(value); this.load(value); }
  private load(query: string): void {
    this.api.customers(query).subscribe({ next: response => this.customers.set(response.items), error: () => this.error.set('Could not load customers.') });
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="page-heading"><div><div class="eyebrow">WORKSPACE PREFERENCES</div><h1>{{ 'settings' | translate }}</h1><p>Make BOAZCHAJI feel right for you.</p></div></div>
    @if (saved()) { <div class="alert alert-success">Preferences saved.</div> } @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
    <section class="panel settings-panel"><form [formGroup]="form" (ngSubmit)="save()"><div class="setting-row"><div><strong>{{ 'language' | translate }}</strong><small>Choose the language used across your workspace.</small></div><select formControlName="language"><option value="sw">Kiswahili</option><option value="en">English</option></select></div><div class="setting-row"><div><strong>{{ 'theme' | translate }}</strong><small>Switch between light and dark appearance.</small></div><select formControlName="theme"><option value="light">{{ 'light' | translate }}</option><option value="dark">{{ 'dark' | translate }}</option></select></div><div class="setting-footer"><button class="button button-primary" type="submit">{{ 'saveService' | translate }} →</button></div></form></section>
  `,
})
export class SettingsPage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  readonly saved = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    language: [this.auth.user()?.language ?? 'sw' as 'sw' | 'en'],
    theme: [this.auth.user()?.theme ?? 'light' as 'light' | 'dark'],
  });
  save(): void {
    const user = this.auth.user();
    if (!user) return;
    const { language, theme } = this.form.getRawValue();
    this.error.set('');
    const updated = { ...user, language, theme };
    localStorage.setItem('boazchaji.user', JSON.stringify(updated));
    this.auth.user.set(updated);
    this.translate.use(language);
    document.documentElement.dataset['theme'] = theme;
    this.api.updatePreferences(user.id, language, theme).subscribe({
      next: () => this.saved.set(true),
      error: () => { this.saved.set(false); this.error.set('Could not save your preferences. Check the API connection.'); },
    });
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <main class="login-page"><section class="login-intro"><a class="login-brand" routerLink="/login"><img ngSrc="/assets/images/boaz.jpg" width="216" height="66" priority alt="BOAZCHAJI Phone Charging Shop"></a><div class="login-message"><span class="eyebrow">YOUR PHONE-CHARGING SHOP, IN SYNC</span><h1>Every phone charged.<br><em>Every customer remembered.</em></h1><p>Keep customer details, phone charging services, and payments organized in one simple place.</p><div class="login-benefits"><span>✓ &nbsp;Track every phone charging service</span><span>✓ &nbsp;Know what's paid and pending</span><span>✓ &nbsp;Keep your regular customers close</span></div></div><span class="login-decoration">✳</span><small class="login-copyright">© 2026 BOAZCHAJI PHONE CHARGING SHOP</small></section>
    <section class="login-form-side"><form class="login-card" [formGroup]="form" (ngSubmit)="submit()"><span class="eyebrow">TEAM WORKSPACE</span><h2>{{ 'loginTitle' | translate }}</h2><p>{{ 'loginSubtitle' | translate }}</p>@if (error()) {<div class="alert alert-error">{{ error() }}</div>}<label class="field"><span>{{ 'phone' | translate }}</span><input type="tel" formControlName="phone" placeholder="07XX XXX XXX" autocomplete="tel" inputmode="tel"></label><label class="field"><span>{{ 'password' | translate }}</span><div class="password-control"><input [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="Enter your password" autocomplete="current-password"><button type="button" class="password-toggle" (click)="showPassword.update(value => !value)" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">{{ showPassword() ? '◉' : '◎' }}</button></div></label><a class="forgot-link" routerLink="/forgot-password">{{ 'forgotPassword' | translate }}</a><button class="button button-primary login-submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Signing in…' : ('signIn' | translate) }} <span>→</span></button><div class="login-secure"><span>♧</span> {{ 'remember' | translate }}</div></form><div class="login-language"><button (click)="toggleLanguage()">{{ language() === 'sw' ? 'Kiswahili' : 'English' }} ⌄</button></div></section></main>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  readonly form = this.fb.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(/^(07|06)[0-9]{8}$/)]],
    password: ['', Validators.required],
  });
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly language = signal<'sw' | 'en'>('sw');
  toggleLanguage(): void {
    const language = this.language() === 'sw' ? 'en' : 'sw';
    this.language.set(language);
    this.translate.use(language);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { phone, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');
    this.auth.login(phone, password).subscribe({
      next: ({ user }) => { this.translate.use(user.language); document.documentElement.dataset['theme'] = user.theme; this.loading.set(false); void this.router.navigateByUrl('/dashboard'); },
      error: () => { this.error.set('Sign-in failed. Check your number and password.'); this.loading.set(false); },
    });
  }
}
