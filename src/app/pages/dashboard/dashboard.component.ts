import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  langService         = inject(LanguageService);

  stats = { pending_total: 0, pending_count: 0, paid_total: 0, paid_count: 0, agents_count: 0 };

  translations: Record<string, Record<string, string>> = {
    sw: {
      welcome: 'Karibu',
      dashboardTitle: 'Dashibodi',
      subtitle: 'Muhtasari wa huduma zako',
      pendingTitle: 'Hazijalipiwa',
      pendingDesc: 'Huduma zinazosubiri malipo',
      paidTitle: 'Zilizolipiwa',
      paidDesc: 'Huduma zilizolipiwa kikamilifu',
      agentsTitle: 'Mawakala',
      agentsDesc: 'Jumla ya mawakala hai',
      records: 'Rekodi',
      loadError: 'Imeshindwa kupakia takwimu'
    },
    en: {
      welcome: 'Welcome',
      dashboardTitle: 'Dashboard',
      subtitle: 'Overview of your services',
      pendingTitle: 'Unpaid',
      pendingDesc: 'Services awaiting payment',
      paidTitle: 'Paid',
      paidDesc: 'Fully paid services',
      agentsTitle: 'Agents',
      agentsDesc: 'Total active agents',
      records: 'Records',
      loadError: 'Failed to load stats'
    }
  };

  t(key: string): string {
    return this.translations[this.langService.lang()]?.[key] ?? key;
  }

  getUserName(): string {
    const u = this.authService.getCurrentUser();
    return u ? `${u.first_name} ${u.last_name}` : '';
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.http.get<any>(`http://localhost/boazchaji/backend/api/stats.php?role=${user.role}&agent_id=${user.id}`)
      .subscribe({
        next: (res) => this.stats = res,
        error: () => console.error(this.t('loadError'))
      });
  }
}