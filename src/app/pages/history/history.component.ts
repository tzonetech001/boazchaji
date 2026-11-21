import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
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
  selectedImage: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || 'agent';
    const agentId = role === 'agent' ? user.id : undefined;

    this.apiService.getServices('paid', role, agentId).subscribe({
      next: (data) => {
        this.services = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  viewImage(imagePath: string) {
    this.selectedImage = this.apiService.getImageUrl(imagePath);
  }

  closeImage() { this.selectedImage = null; }
}