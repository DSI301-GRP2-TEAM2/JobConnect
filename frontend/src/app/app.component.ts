import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfilComponent } from './components/profil/profil.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfilComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  loginEmail = '';
  loginMdp = '';
  loginError = '';

  constructor(public authService: AuthService) {}

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
