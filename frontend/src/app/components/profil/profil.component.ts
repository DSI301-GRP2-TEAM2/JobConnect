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

  isDragOver: boolean = false;
  cvUploading: boolean = false;
  cvDeleting: boolean = false;
  cvErrorMessage: string = '';
  cvErrorFilename: string = '';

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

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.handleFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.handleFile(file);
    }
  }

  handleFile(file: File): void {
    this.cvErrorMessage = '';
    this.cvErrorFilename = '';

    const allowed = ['.pdf', '.docx', '.doc'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      this.cvErrorFilename = file.name;
      this.cvErrorMessage = 'Format non supporté. Veuillez utiliser un fichier PDF ou DOCX';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.cvErrorFilename = file.name;
      this.cvErrorMessage = 'Le fichier dépasse la taille maximale autorisée (5 Mo)';
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.authService.openLoginModal();
      return;
    }

    this.cvUploading = true;
    this.profilService.uploadCv(file).subscribe({
      next: (res) => {
        this.cvUploading = false;
        if (res.user) {
          this.profil.cv = res.user.cv;
          this.profil.cvNomOriginal = res.user.cvNomOriginal || file.name;
          this.profil.cvTaille = res.user.cvTaille || file.size;
          this.profil.cvDateUpload = res.user.cvDateUpload;
        } else {
          this.profil.cv = res.cv;
          this.profil.cvNomOriginal = file.name;
          this.profil.cvTaille = file.size;
        }
      },
      error: (err) => {
        this.cvUploading = false;
        this.cvErrorFilename = file.name;
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          this.cvErrorMessage = err.error.errors[0];
        } else {
          this.cvErrorMessage = err.error?.error || 'Erreur lors du téléversement du CV';
        }
      }
    });
  }

  deleteCv(): void {
    if (!this.authService.isAuthenticated()) return;
    this.cvDeleting = true;
    this.profilService.deleteCv().subscribe({
      next: () => {
        this.cvDeleting = false;
        this.profil.cv = undefined;
        this.profil.cvNomOriginal = undefined;
        this.profil.cvTaille = undefined;
        this.profil.cvDateUpload = undefined;
        this.cvErrorMessage = '';
      },
      error: (err) => {
        this.cvDeleting = false;
        this.cvErrorMessage = err.error?.error || 'Erreur lors de la suppression du CV';
      }
    });
  }

  getCvFilename(): string {
    if (this.profil.cvNomOriginal) return this.profil.cvNomOriginal;
    if (this.profil.cv) {
      const parts = this.profil.cv.split('/');
      return parts[parts.length - 1];
    }
    const prenom = this.profil.prenom || 'Sarah';
    const nom = this.profil.nom || 'Jérôme';
    return `CV_${prenom}_${nom}_2023.pdf`;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes || bytes <= 0) return '2.4 Mo';
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    }
    return Math.round(bytes / 1024) + ' Ko';
  }
}
