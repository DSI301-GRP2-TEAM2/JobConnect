import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogueComponent } from './components/catalogue/catalogue.component';
import { DetailOffreComponent } from './components/detail-offre/detail-offre.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, CatalogueComponent, DetailOffreComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  currentView: 'catalogue' | 'detail' = 'catalogue';
  selectedOffreId: string | null = null;

  loginEmail = '';
  loginMdp = '';
  loginError = '';

  constructor(public authService: AuthService) {}

  onSelectOffre(id: string): void {
    this.selectedOffreId = id;
    this.currentView = 'detail';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onRetourCatalogue(): void {
    this.selectedOffreId = null;
    this.currentView = 'catalogue';
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        window.location.reload();
      },
      error: (err) => {
        this.loginError = err.error?.error || 'Identifiants incorrects';
      }
    });
  }
}
