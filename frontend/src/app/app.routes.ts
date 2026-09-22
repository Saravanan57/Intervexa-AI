import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main/main.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingPageComponent)
      },
      {
        path: 'auth/login',
        loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'auth/register',
        loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'auth/forgot-password',
        loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'auth/reset-password',
        loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      },
      {
        path: 'reset-password',
        redirectTo: 'auth/reset-password',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard]
      },
      {
        path: 'resume-analyzer',
        loadComponent: () => import('./pages/resume-analyzer/resume-analyzer.component').then(m => m.ResumeAnalyzerComponent)
      },
      {
        path: 'mock-interview',
        loadComponent: () => import('./pages/mock-interview/mock-interview.component').then(m => m.MockInterviewComponent)
      },
      {
        path: 'mock-interview/active/:id',
        loadComponent: () => import('./pages/mock-interview/active/active.component').then(m => m.ActiveInterviewComponent),
        canActivate: [authGuard]
      },
      {
        path: 'mock-interview/feedback/:id',
        loadComponent: () => import('./pages/mock-interview/feedback/feedback.component').then(m => m.FeedbackComponent),
        canActivate: [authGuard]
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [authGuard]
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [authGuard]
      },
      {
        path: 'resources/faq',
        loadComponent: () => import('./pages/resources/faq/faq.component').then(m => m.FaqComponent)
      },
      {
        path: 'resources/technical-guides',
        loadComponent: () => import('./pages/resources/technical-guides/technical-guides.component').then(m => m.TechnicalGuidesComponent)
      },
      {
        path: 'resources/hr-prep',
        loadComponent: () => import('./pages/resources/hr-prep/hr-prep.component').then(m => m.HrPrepComponent)
      },
      {
        path: 'legal/privacy',
        loadComponent: () => import('./pages/legal/privacy/privacy.component').then(m => m.PrivacyComponent)
      },
      {
        path: 'legal/terms',
        loadComponent: () => import('./pages/legal/terms/terms.component').then(m => m.TermsComponent)
      },
      {
        path: 'legal/support',
        loadComponent: () => import('./pages/legal/support/support.component').then(m => m.SupportComponent)
      },
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        canActivate: [authGuard, adminGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
          },
          {
            path: 'users',
            loadComponent: () => import('./pages/admin/users/admin-users.component').then(m => m.AdminUsersComponent)
          },
          {
            path: 'questions',
            loadComponent: () => import('./pages/admin/questions/admin-questions.component').then(m => m.AdminQuestionsComponent)
          },
          {
            path: 'interviews',
            loadComponent: () => import('./pages/admin/interviews/admin-interviews.component').then(m => m.AdminInterviewsComponent)
          },
          {
            path: 'resumes',
            loadComponent: () => import('./pages/admin/resumes/admin-resumes.component').then(m => m.AdminResumesComponent)
          },
          {
            path: 'roles',
            loadComponent: () => import('./pages/admin/roles/admin-roles.component').then(m => m.AdminRolesComponent)
          },
          {
            path: 'settings',
            loadComponent: () => import('./pages/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent)
          },
          {
            path: 'notifications',
            loadComponent: () => import('./pages/admin/notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent)
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
