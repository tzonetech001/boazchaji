import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private sessionTimeout: any;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.resetSessionTimer();
    // Kila mtumiaji anapofanya kitu, tunasasisha muda
    window.addEventListener('click', () => this.resetSessionTimer());
    window.addEventListener('keypress', () => this.resetSessionTimer());
  }

  resetSessionTimer() {
    if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
    
    // Dakika 20 = 20 * 60 * 1000 milliseconds
    this.sessionTimeout = setTimeout(() => {
      if (this.authService.isLoggedIn()) {
        this.authService.logout();
        alert('Muda wa kukaa umeisha. Tafadhali ingia tena.');
        this.router.navigate(['/login']);
      }
    }, 20 * 60 * 1000);
  }
}