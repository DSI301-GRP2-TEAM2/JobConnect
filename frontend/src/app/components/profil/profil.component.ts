import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfilService } from '../../services/profil.service';
import { AuthService } from '../../services/auth.service';
import { CandidatProfil } from '../../models/profil.model';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  profil: CandidatProfil = {
    nom: '',
    prenom: '',
    titre: '',
    email: '',
    telephone: '',
    adresse: ''
  };

  loading = false;
  saving = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private profilService: ProfilService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadProfil();
    }
  }

  loadProfil(): void {
    this.loading = true;
    this.errorMessage = '';
    this.profilService.getProfil().subscribe({
      next: (data) => {
        this.loading = false;
        this.profil = {
          nom: data.nom || '',
          prenom: data.prenom || '',
          titre: data.titre || '',
          email: data.email || '',
          telephone: data.telephone || '',
          adresse: data.adresse || ''
        };
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Accès réservé aux candidats connectés';
        } else {
          this.errorMessage = 'Impossible de charger les données du profil';
        }
      }
    });
  }

  onSubmit(): void {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = {
      nom: this.profil.nom ? this.profil.nom.trim() : '',
      prenom: this.profil.prenom ? this.profil.prenom.trim() : '',
      titre: this.profil.titre ? this.profil.titre.trim() : '',
      telephone: this.profil.telephone ? this.profil.telephone.trim() : '',
      adresse: this.profil.adresse ? this.profil.adresse.trim() : ''
    };

    this.profilService.updateProfil(payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.successMessage = 'Profil mis à jour avec succès !';
        if (res.user && this.authService.currentUser) {
          this.authService.currentUser.nom = res.user.nom;
          this.authService.currentUser.prenom = res.user.prenom;
          localStorage.setItem('jobconnect_user', JSON.stringify(this.authService.currentUser));
        }
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.errors
          ? err.error.errors.join(', ')
          : (err.error?.error || 'Erreur lors de la mise à jour du profil');
        this.errorMessage = msg;
      }
    });
  }
}
