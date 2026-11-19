import { Routes } from '@angular/router';
import { CandidatRegisterComponent } from './features/candidat-register/candidat-register.component';
import { EntrepriseRegisterComponent } from './features/entreprise-register/entreprise-register.component';
import { LoginComponent } from './features/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'register-candidat', component: CandidatRegisterComponent, title: 'Inscription - Candidat' },
  { path: 'register-entreprise', component: EntrepriseRegisterComponent, title: 'Inscription - Entreprise' },
  { path: 'login', component: LoginComponent, title: 'Connexion' }
];
