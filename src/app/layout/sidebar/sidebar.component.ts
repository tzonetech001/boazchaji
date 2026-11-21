import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  isAdmin = false;

  constructor(private authService: AuthService) {
    // Hii itaangalia kama mtumiaji ni admin
    // this.isAdmin = this.authService.getUserRole() === 'admin';
    // Kwa sasa tunaweka true kwa majaribio:
    this.isAdmin = true; 
  }

  onLinkClick() {
    // Kwenye simu, ikibonyezwa link, sidebar ifunge
    if (window.innerWidth <= 768) {
      this.closeSidebar.emit();
    }
  }
}