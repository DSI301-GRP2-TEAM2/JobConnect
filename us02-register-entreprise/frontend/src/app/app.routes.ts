import { Routes } from '@angular/router';
import { CandidatRegisterComponent } from './features/candidat-register/candidat-register.component';
import { EntrepriseRegisterComponent } from './features/entreprise-register/entreprise-register.component';

export const routes: Routes = [
  { path: '', redirectTo: '/register-candidat', pathMatch: 'full' },
  { path: 'register-candidat', component: CandidatRegisterComponent, title: 'Inscription - Candidat' },
  { path: 'register-entreprise', component: EntrepriseRegisterComponent, title: 'Inscription - Entreprise' }
];
