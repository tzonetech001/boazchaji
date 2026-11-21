import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    // Lazy Loading ya Login Component (tutaitengeneza baadaye)
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard], // Zote hizi zinahitaji login
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/services/service-list/service-list.component').then(m => m.ServiceListComponent)
      },
      {
        path: 'services/new',
        loadComponent: () => import('./pages/services/service-form/service-form.component').then(m => m.ServiceFormComponent)
      },
      {
        path: 'history',
        loadComponent: () => import('./pages/history/history.component').then(m => m.HistoryComponent)
      },
         {
        path: 'settings',
        canActivate: [AdminGuard], // Admin pekee
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      },
            {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' } // Ukikosea njia, inakurudisha login
];