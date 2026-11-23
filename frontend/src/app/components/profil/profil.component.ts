import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfilService } from '../../services/profil.service';
import { AuthService } from '../../services/auth.service';
import { ProfilCandidat } from '../../models/profil.model';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  profil: ProfilCandidat = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    ville: '',
    titre: '',
    competences: [],
    bio: ''
  };

  newTag: string = '';
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private profilService: ProfilService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadProfil();
    } else {
      const u = this.authService.currentUser;
      if (u) {
        this.profil.nom = u.nom || '';
        this.profil.prenom = u.prenom || '';
        this.profil.email = u.email || '';
      }
    }
  }

  loadProfil(): void {
    this.loading = true;
    this.errorMessage = '';
    this.profilService.getProfil().subscribe({
      next: (data) => {
        this.profil = {
          ...data,
          competences: Array.isArray(data.competences) ? data.competences : []
        };
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Erreur lors du chargement du profil';
        this.loading = false;
      }
    });
  }

  addTag(): void {
    const val = this.newTag.trim();
    if (!val) return;
    if (!this.profil.competences) {
      this.profil.competences = [];
    }
    if (!this.profil.competences.includes(val)) {
      this.profil.competences.push(val);
    }
    this.newTag = '';
  }

  removeTag(index: number): void {
    if (this.profil.competences) {
      this.profil.competences.splice(index, 1);
    }
  }

  onTagKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.authService.isAuthenticated()) {
      this.authService.openLoginModal();
      return;
    }

    if (!this.profil.nom || !this.profil.nom.trim()) {
      this.errorMessage = 'Le nom est obligatoire';
      return;
    }

    if (!this.profil.prenom || !this.profil.prenom.trim()) {
      this.errorMessage = 'Le prénom est obligatoire';
      return;
    }

    this.loading = true;
    const payload: Partial<ProfilCandidat> = {
      nom: this.profil.nom.trim(),
      prenom: this.profil.prenom.trim(),
      telephone: this.profil.telephone ? this.profil.telephone.trim() : '',
      ville: this.profil.ville ? this.profil.ville.trim() : '',
      titre: this.profil.titre ? this.profil.titre.trim() : '',
      competences: this.profil.competences || [],
      bio: this.profil.bio ? this.profil.bio.trim() : ''
    };

    this.profilService.updateProfil(payload).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Profil mis à jour avec succès';
        this.loading = false;
        if (res.user) {
          this.profil = {
            ...res.user,
            competences: Array.isArray(res.user.competences) ? res.user.competences : []
          };
          const cur = this.authService.currentUser;
          if (cur) {
            cur.nom = res.user.nom;
            cur.prenom = res.user.prenom;
            localStorage.setItem('jobconnect_user', JSON.stringify(cur));
          }
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          this.errorMessage = err.error.errors.join(', ');
        } else {
          this.errorMessage = err.error?.error || 'Erreur lors de la mise à jour';
        }
      }
    });
  }
}
