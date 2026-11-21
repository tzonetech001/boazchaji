import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { AuthService, authGuard } from './core/auth';
import { ShellComponent } from './shell/shell.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/workspace.pages').then(module => module.LoginPage) },
  { path: 'forgot-password', loadComponent: () => import('./pages/auth.pages').then(module => module.ForgotPasswordPage) },
  { path: 'reset-password', loadComponent: () => import('./pages/auth.pages').then(module => module.ResetPasswordPage) },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/workspace.pages').then(module => module.DashboardPage) },
      { path: 'services/new', loadComponent: () => import('./pages/workspace.pages').then(module => module.ServiceFormPage) },
      { path: 'services', loadComponent: () => import('./pages/workspace.pages').then(module => module.ServicesPage) },
      { path: 'history', loadComponent: () => import('./pages/workspace.pages').then(module => module.ServicesPage), data: { status: 'paid' } },
      { path: 'customers', loadComponent: () => import('./pages/workspace.pages').then(module => module.CustomersPage) },
      {
        path: 'agents',
        loadComponent: () => import('./pages/agents.page').then(module => module.AgentsPage),
        canActivate: [() => inject(AuthService).user()?.role === 'admin' || inject(Router).createUrlTree(['/dashboard'])],
      },
      { path: 'settings', loadComponent: () => import('./pages/workspace.pages').then(module => module.SettingsPage) },
      { path: 'profile', loadComponent: () => import('./pages/profile.page').then(module => module.ProfilePage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
