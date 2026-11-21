import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api';
import { ActivityEntry, User } from '../core/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule],
  template: `
    <div class="page-heading"><div><div class="eyebrow">TEAM ACCESS</div><h1>Manage agents</h1><p>Invite your team and follow their charging-shop activity.</p></div><button class="button button-primary" (click)="showForm.set(!showForm())">＋ Add agent</button></div>
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
    @if (success()) { <div class="alert alert-success">{{ success() }}</div> }
    @if (showForm()) {
      <section class="panel agent-form-panel"><div class="panel-heading"><div><h2>Add a charging-shop agent</h2><p>They will get their own private workspace.</p></div><button class="icon-button" (click)="showForm.set(false)" aria-label="Close form">×</button></div>
        <form class="agent-form-grid" [formGroup]="form" (ngSubmit)="create()">
          <label class="field"><span>First name <b>*</b></span><input formControlName="first_name" autocomplete="given-name"></label>
          <label class="field"><span>Last name <b>*</b></span><input formControlName="last_name" autocomplete="family-name"></label>
          <label class="field"><span>Phone number <b>*</b></span><input formControlName="phone" placeholder="07XX XXX XXX" inputmode="tel"><small>10 digits, starting with 06 or 07.</small></label>
          <label class="field"><span>Email (optional)</span><input formControlName="email" type="email" autocomplete="email"></label>
          <label class="field field-wide"><span>Temporary password <b>*</b></span><div class="password-control"><input formControlName="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="new-password"><button type="button" class="password-toggle" (click)="showPassword.update(value => !value)" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">{{ showPassword() ? '◉' : '◎' }}</button></div><small>At least 8 characters with letters and numbers.</small></label>
          <div class="field-wide agent-form-actions"><button type="button" class="button button-quiet" (click)="showForm.set(false)">Cancel</button><button type="submit" class="button button-primary" [disabled]="form.invalid || saving()">{{ saving() ? 'Creating…' : 'Create agent →' }}</button></div>
        </form>
      </section>
    }
    <section class="panel list-panel"><div class="panel-heading agent-list-heading"><div><h2>Your agents</h2><p>{{ agents().length }} team members</p></div></div>
      @if (agents().length) {<div class="table-wrap"><table><thead><tr><th>Agent</th><th>Phone</th><th>Services recorded</th><th>Paid total</th><th>Joined</th></tr></thead><tbody>@for (agent of agents(); track agent.id) {<tr><td><span class="agent-cell"><span class="avatar small-avatar">{{ agent.first_name[0] }}{{ agent.last_name[0] }}</span><strong>{{ agent.first_name }} {{ agent.last_name }}</strong></span></td><td>{{ agent.phone }}</td><td>{{ count(agent.id) }}</td><td class="amount-cell">{{ total(agent.id) | currency:'TZS':'symbol-narrow':'1.0-0' }}</td><td>{{ agent.created_at | date:'MMM d, y' }}</td></tr>}</tbody></table></div>} @else {<div class="empty-state"><span>♧</span><strong>No agents yet.</strong><small>Add an agent to start tracking team activity.</small></div>}
    </section>
    <section class="panel activity-panel"><div class="panel-heading"><div><h2>Recent activity</h2><p>Actions across the team</p></div></div>
      @if (activity().length) {<div class="activity-list">@for (entry of activity(); track entry.id) {<div class="activity-item"><span class="activity-dot"></span><div><strong>{{ entry.first_name }} {{ entry.last_name }}</strong><span>{{ entry.action_taken }}</span></div><small>{{ entry.timestamp | date:'MMM d, h:mm a' }}</small></div>}</div>} @else {<div class="empty-inline">No activity recorded yet.</div>}
    </section>
  `,
})
export class AgentsPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly agents = signal<Array<User & { created_at?: string }>>([]);
  readonly activity = signal<ActivityEntry[]>([]);
  readonly serviceStats = signal<Array<{ agent_id: number; service_count: number; paid_total: number }>>([]);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly showPassword = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly form = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^(07|06)[0-9]{8}$/)]],
    email: ['', Validators.email],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&._-]+$/)]],
  });

  ngOnInit(): void {
    this.load();
    this.api.activity().subscribe({ next: response => this.activity.set(response.items), error: () => this.error.set('Could not load recent activity.') });
    this.api.dashboard().subscribe({
      next: data => this.serviceStats.set((data.agents ?? []).map(agent => ({ agent_id: agent.id, service_count: agent.service_count, paid_total: Number(agent.paid_total) }))),
      error: () => this.error.set('Could not load agent performance.'),
    });
  }

  create(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const values = this.form.getRawValue();
    this.api.createUser(values).subscribe({
      next: ({ user }) => {
        this.success.set(`${user.first_name} ${user.last_name} can now sign in.`);
        this.form.reset({ first_name: '', last_name: '', phone: '', email: '', password: '' });
        this.showForm.set(false);
        this.saving.set(false);
        this.load();
      },
      error: () => { this.error.set('Could not create agent. The phone or email may already be registered.'); this.saving.set(false); },
    });
  }

  count(agentId: number): number { return this.serviceStats().find(item => item.agent_id === agentId)?.service_count ?? 0; }
  total(agentId: number): number { return this.serviceStats().find(item => item.agent_id === agentId)?.paid_total ?? 0; }

  private load(): void {
    this.api.users().subscribe({ next: response => this.agents.set(response.items), error: () => this.error.set('Could not load agents.') });
  }
}
