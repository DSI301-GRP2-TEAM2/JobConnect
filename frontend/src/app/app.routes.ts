import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CandidatRegisterComponent } from './components/candidat-register/candidat-register.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'JobConnect' },
  { path: 'register-candidat', component: CandidatRegisterComponent, title: 'Inscription - Candidat' },
  { path: '**', redirectTo: '' }
];
