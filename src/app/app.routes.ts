import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { EmployeeDetailPageComponent } from './pages/employee-detail/employee-detail-page.component';
import { EmployeeFormPageComponent } from './pages/employee-form/employee-form-page.component';
import { EmployeeListPageComponent } from './pages/employee-list/employee-list-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { SignupPageComponent } from './pages/signup/signup-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'employees'
  },
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'signup',
    component: SignupPageComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'employees',
    component: EmployeeListPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'employees/new',
    component: EmployeeFormPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'employees/:id',
    component: EmployeeDetailPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'employees/:id/edit',
    component: EmployeeFormPageComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'employees'
  }
];
