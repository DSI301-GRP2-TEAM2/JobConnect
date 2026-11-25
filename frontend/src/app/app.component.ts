import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogueComponent } from './components/catalogue/catalogue.component';
import { ProfilComponent } from './components/profil/profil.component';
import { OffreFormComponent } from './components/offre-form/offre-form.component';
import { MesOffresComponent } from './components/mes-offres/mes-offres.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, CatalogueComponent, ProfilComponent, OffreFormComponent, MesOffresComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  currentView: 'offres' | 'profil' = 'offres';
  companyView: 'list' | 'form' = 'list';
  selectedOfferId: string | null = null;
  loginEmail = '';
  loginMdp = '';
  loginError = '';

  constructor(public authService: AuthService) {}

  openOffer(id: string | null): void {
    this.selectedOfferId = id;
    this.companyView = 'form';
  }

  setView(view: 'offres' | 'profil'): void {
    this.currentView = view;
  }

  getInitials(): string {
    const user = this.authService.currentUser;
    if (!user) return 'SJ';
    const p = user.prenom ? user.prenom[0].toUpperCase() : '';
    const n = user.nom ? user.nom[0].toUpperCase() : '';
    return p + n || 'SJ';
  }

  handleLogin(): void {
    this.loginError = '';
    this.authService.login(this.loginEmail.trim(), this.loginMdp).subscribe({
      next: () => {
        this.loginEmail = '';
        this.loginMdp = '';
        if (this.currentView !== 'profil') {
          window.location.reload();
        }
      },
      error: (err) => {
        this.loginError = err.error?.error || 'Identifiants incorrects';
      }
    });
  }
}
