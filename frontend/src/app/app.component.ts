import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { EntrepriseViewService } from './services/entreprise-view.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  authService = inject(AuthService);
  entrepriseView = inject(EntrepriseViewService);

  loginEmail = '';
  loginMdp = '';
  loginError = '';

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
