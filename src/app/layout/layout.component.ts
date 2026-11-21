import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  isSidebarOpen = true;
  isMobile = false;

  ngOnInit() {
    this.updateScreen();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateScreen();
  }

  private updateScreen() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    // Kama tumebadilisha kutoka desktop → mobile, funga sidebar ili kisiwe kikubwa
    if (this.isMobile && !wasMobile) this.isSidebarOpen = false;
    // Kama tumebadilisha kutoka mobile → desktop, fungua sidebar
    if (!this.isMobile && wasMobile)  this.isSidebarOpen = true;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }
}