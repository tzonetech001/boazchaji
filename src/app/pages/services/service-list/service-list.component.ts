import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Service } from '../../../core/models/service.model';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.css']
})
export class ServiceListComponent implements OnInit {
  services: Service[] = [];
  isLoading = true;
  selectedImage: string | null = null;
  isAdmin = false;

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit() {
    // Angalia kama mtumiaji ni admin
    this.isAdmin = this.authService.getUserRole() === 'admin';
    this.loadServices();
  }

  loadServices() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || 'agent';
    const agentId = role === 'agent' ? user.id : undefined;

    this.apiService.getServices('pending', role, agentId).subscribe({
      next: (data) => {
        this.services = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  markPaid(service: Service) {
    if (confirm(`Je, una uhakika ${service.customer_name} amelia? Huduma itahamishwa kwenye Historia.`)) {
      this.apiService.markAsPaid(service.id!).subscribe({
        next: () => {
          this.services = this.services.filter(s => s.id !== service.id);
        }
      });
    }
  }

  viewImage(imagePath: string) {
    this.selectedImage = this.apiService.getImageUrl(imagePath);
  }

  closeImage() {
    this.selectedImage = null;
  }
}