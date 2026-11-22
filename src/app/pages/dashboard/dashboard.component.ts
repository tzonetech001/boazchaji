import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts'; // <-- Badilisha hii
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective], // <-- Badilisha hii
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  langService         = inject(LanguageService);

  stats = { pending_total: 0, pending_count: 0, paid_total: 0, paid_count: 0, agents_count: 0, customers_count: 0 };
  currentMonth = '';
  
  // Live Clock
  currentTime = '';
  private timeInterval: any;

  // Recent Customers Auto-Scroll
  recentCustomers: any[] = [];
  displayCustomers: any[] = [];
  private scrollInterval: any;

  // Chart.js Config
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{ data: [], label: 'Mauzo (TZS)', fill: true, tension: 0.4, borderColor: '#0284c7', backgroundColor: 'rgba(2, 132, 199, 0.1)' }]
  };
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true }
    }
  };

  translations: Record<string, Record<string, string>> = {
    sw: {
      welcome: 'Karibu',
      subtitle: 'Hapa kuna muhtasari wa mfumo wako leo.',
      pendingTitle: 'Hazijalipiwa',
      pendingDesc: 'Huduma zinazosubiri malipo',
      paidTitle: 'Zilizolipiwa',
      paidDesc: 'Huduma zilizolipiwa kikamilifu',
      agentsTitle: 'Mawakala',
      agentsDesc: 'Jumla ya mawakala hai',
      customersTitle: 'Wateja',
      customersDesc: 'Jumla ya wateja waliyosajiliwa',
      records: 'Rekodi',
      salesGraph: 'Mauzo ya Mwezi',
      recentCustomers: 'Wateja wa Hivi Karibuni',
      noCustomers: 'Hakuna wateja bado',
      eatTime: 'Saa za Dar es Salaam (EAT)'
    },
    en: {
      welcome: 'Welcome',
      subtitle: 'Here is the overview of your system today.',
      pendingTitle: 'Unpaid',
      pendingDesc: 'Services awaiting payment',
      paidTitle: 'Paid',
      paidDesc: 'Fully paid services',
      agentsTitle: 'Agents',
      agentsDesc: 'Total active agents',
      customersTitle: 'Customers',
      customersDesc: 'Total registered customers',
      records: 'Records',
      salesGraph: 'Monthly Sales',
      recentCustomers: 'Recent Customers',
      noCustomers: 'No customers yet',
      eatTime: 'Dar es Salaam Time (EAT)'
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
    // 1. Anzisha Saa (EAT)
    this.startClock();

    // 2. Pata Data
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    this.http.get<any>(`${environment.baseUrl}/api/stats.php?role=${user.role}&agent_id=${user.id}`)
      .subscribe({
        next: (res) => {
          this.stats = res;
          this.currentMonth = res.current_month;
          
          // Weka Data kwenye Chart
          this.setupChart(res.chart_data);

          // Weka Wateja kwenye Auto-Scroll
          this.recentCustomers = res.recent_customers || [];
          this.displayCustomers = [...this.recentCustomers];
          this.startAutoScroll();
        },
        error: (err) => console.error('Failed to load stats', err)
      });
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    if (this.scrollInterval) clearInterval(this.scrollInterval);
  }

  // --- LIVE CLOCK (EAT) ---
  private startClock() {
    const updateTime = () => {
      this.currentTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Dar_es_Salaam',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      }).format(new Date());
    };
    updateTime();
    this.timeInterval = setInterval(updateTime, 1000);
  }

  // --- CHART SETUP ---
  private setupChart(data: number[]) {
    const daysInMonth = data.length;
    const labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    
    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          label: 'TZS',
          fill: true,
          tension: 0.4,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          pointBackgroundColor: '#0284c7',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#0284c7'
        }
      ]
    };
  }

  // --- RECENT CUSTOMERS AUTO-SCROLL ---
  private startAutoScroll() {
    if (this.recentCustomers.length <= 3) return; // Usiscroll kama ni wachache

    this.scrollInterval = setInterval(() => {
      const firstItem = this.displayCustomers.shift();
      if (firstItem) this.displayCustomers.push(firstItem);
    }, 2000); // Inabadilika kila baada ya sekunde 2
  }
}