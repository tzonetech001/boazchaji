import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: any = { pending_total: 0, pending_count: 0, paid_total: 0, paid_count: 0, agents_count: 0 };
  userRole = 'agent';
  userName = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userRole = user.role;
    this.userName = user.first_name;

    const agentId = this.userRole === 'agent' ? user.id : undefined;
    this.apiService.getStats(this.userRole, agentId).subscribe(data => {
      this.stats = data;
    });
  }
}