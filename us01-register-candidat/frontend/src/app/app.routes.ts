import { Routes } from '@angular/router';
import { CandidatRegisterComponent } from './features/candidat-register/candidat-register.component';

export const routes: Routes = [
  { path: '', redirectTo: '/register-candidat', pathMatch: 'full' },
  { path: 'register-candidat', component: CandidatRegisterComponent, title: 'Inscription - Candidat' }
];
