import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        redirectTo: 'services',
        pathMatch: 'full'
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/services/service-list/service-list.component').then(m => m.ServiceListComponent)
      },
      {
        path: 'services/new',
        redirectTo: 'services',
        pathMatch: 'full'
      },
      {
        path: 'history',
        loadComponent: () => import('./pages/history/history.component').then(m => m.HistoryComponent)
      },
      {
        path: 'settings',
        canActivate: [AdminGuard],
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      },
      // Ndani ya children array:
{
  path: 'users',
  canActivate: [AdminGuard],
  loadComponent: () => import('./pages/users/user-management.component').then(m => m.UserManagementComponent)
},
{
  path: 'settings',
  loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
},
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];