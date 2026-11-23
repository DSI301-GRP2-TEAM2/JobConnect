import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { CategorieOption, OffreService } from '../../services/offre.service';
import { OffreCreee, OffreDraft } from '../../models/offre.model';

@Component({
  selector: 'app-offre-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offre-form.component.html',
  styleUrls: ['./offre-form.component.css']
})
export class OffreFormComponent implements OnInit {
  categories: CategorieOption[] = [];
  draft: OffreDraft = this.emptyDraft();
  createdOffer: OffreCreee | null = null;
  loadingCategories = false;
  saving = false;
  submitting = false;
  error = '';
  success = '';

  constructor(public authService: AuthService, private offreService: OffreService) {}

  ngOnInit(): void { this.loadCategories(); }

  loadCategories(): void {
    this.loadingCategories = true;
    this.offreService.getCategoriesEntreprise().subscribe({
      next: response => { this.categories = response.categories; this.loadingCategories = false; },
      error: err => { this.error = this.getError(err); this.loadingCategories = false; }
    });
  }

  save(form: NgForm): void {
    if (form.invalid || this.saving || this.submitting) { form.control.markAllAsTouched(); return; }
    this.saving = true;
    this.error = '';
    this.success = '';
    const draft: OffreDraft = {
      ...this.draft,
      titre: this.draft.titre.trim(),
      description: this.draft.description.trim(),
      localisation: this.draft.localisation?.trim(),
      typeContrat: this.draft.typeContrat?.trim(),
      missionsPrincipales: this.draft.missionsPrincipales?.trim(),
      exigencesCandidat: this.draft.exigencesCandidat?.trim()
    };
    this.offreService.createOffre(draft).subscribe({
      next: response => {
        this.createdOffer = response.offre;
        this.success = 'Offre enregistrée en brouillon.';
        this.draft = this.emptyDraft();
        form.resetForm(this.draft);
        this.saving = false;
      },
      error: err => { this.error = this.getError(err); this.saving = false; }
    });
  }

  submitForValidation(): void {
    const offer = this.createdOffer;
    if (!offer || offer.statut !== 'brouillon' || this.submitting) return;
    this.submitting = true;
    this.error = '';
    this.success = '';
    this.offreService.submitOffre(offer.id).subscribe({
      next: response => {
        this.createdOffer = response.offre;
        this.success = 'Offre soumise à validation. Statut : en attente.';
        this.submitting = false;
      },
      error: err => { this.error = this.getError(err); this.submitting = false; }
    });
  }

  private emptyDraft(): OffreDraft {
    return { titre: '', description: '', categorie: '', localisation: '', typeContrat: '', missionsPrincipales: '', exigencesCandidat: '' };
  }

  private getError(err: HttpErrorResponse): string {
    return Array.isArray(err.error?.errors) ? err.error.errors.join(' · ') : (err.error?.error || 'Erreur réseau ou serveur');
  }
}
