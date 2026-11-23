import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { map } from 'rxjs';
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
export class OffreFormComponent implements OnInit, OnChanges {
  categories: CategorieOption[] = [];
  @Input() offerId: string | null = null;
  draft: OffreDraft = this.emptyDraft();
  createdOffer: OffreCreee | null = null;
  loadingCategories = false;
  saving = false;
  submitting = false;
  error = '';
  success = '';

  constructor(public authService: AuthService, private offreService: OffreService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['offerId']) return;
    this.draft = this.emptyDraft(); this.createdOffer = null; this.error = ''; this.success = '';
    if (this.offerId) {
      this.saving = true;
      this.offreService.getMonOffre(this.offerId).subscribe({
      next: ({ offre }) => {
        this.saving = false;
        if (offre.statut !== 'brouillon') { this.error = 'Seul un brouillon peut être modifié.'; return; }
        this.draft = { titre: offre.titre, description: offre.description, categorie: offre.categorie?._id || '', salaire: offre.salaire, localisation: offre.localisation || '', typeContrat: offre.typeContrat || '', missionsPrincipales: offre.missionsPrincipales || '', exigencesCandidat: offre.exigencesCandidat || '' };
        this.createdOffer = { ...this.draft, id: offre._id, statut: offre.statut };
      },
      error: err => { this.error = this.getError(err); this.saving = false; }
    });
    }
  }

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
    const request = this.offerId
      ? this.offreService.updateOffre(this.offerId, draft).pipe(map(response => response.offre._id))
      : this.offreService.createOffre(draft).pipe(map(response => response.offre.id));
    request.subscribe({
      next: id => {
        this.createdOffer = { ...draft, id, statut: 'brouillon' };
        this.success = 'Offre enregistrée en brouillon.';
        if (!this.offerId) this.draft = this.emptyDraft();
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
