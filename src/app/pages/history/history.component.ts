import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../core/models/service.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  services: Service[] = [];
  isLoading = true;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    const role = user?.role || 'agent';
    const agentId = role === 'agent' ? user?.id : undefined;

    this.api.getServices('history', role, agentId).subscribe({
      next: (data) => { this.services = data; this.isLoading = false; },
      error: () => this.isLoading = false
    });
  }

  deleteService(id: number) {
    if (confirm("Una uhakika unataka kufuta huduma hii kabisa?")) {
      this.api.deleteService(id).subscribe({
        next: () => { this.services = this.services.filter(s => s.id !== id); },
        error: (err) => alert(err.error.message)
      });
    }
  }
}