import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { AuthService, authGuard } from './core/auth';
import { ShellComponent } from './shell/shell.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/auth.pages').then(m => m.LoginPage) },
  { path: 'forgot-password', loadComponent: () => import('./pages/auth.pages').then(m => m.ForgotPasswordPage) },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/workspace.pages').then(m => m.DashboardPage) },
      { path: 'services/new', loadComponent: () => import('./pages/workspace.pages').then(m => m.ServiceFormPage) },
      { path: 'services', loadComponent: () => import('./pages/workspace.pages').then(m => m.ServicesPage) },
      { path: 'history', loadComponent: () => import('./pages/workspace.pages').then(m => m.ServicesPage), data: { status: 'paid' } },
      { path: 'customers', loadComponent: () => import('./pages/workspace.pages').then(m => m.CustomersPage) },
      {
        path: 'agents',
        loadComponent: () => import('./pages/agents.page').then(m => m.AgentsPage),
        canActivate: [() => inject(AuthService).user()?.role === 'admin' || inject(Router).createUrlTree(['/dashboard'])],
      },
      { path: 'settings', loadComponent: () => import('./pages/workspace.pages').then(m => m.SettingsPage) },
      { path: 'profile', loadComponent: () => import('./pages/profile.page').then(m => m.ProfilePage) },
    ],
  },
  { path: '**', redirectTo: '' },
];