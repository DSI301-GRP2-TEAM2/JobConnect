import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API_BASE_URL } from './api.config';

interface Categorie { id: string; libelle: string; description?: string; }
interface CreatedOffer { id: string; titre: string; statut: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  // Configure at deployment time via frontend/angular/src/app/api.config.ts.
  readonly apiUrl = API_BASE_URL;
  readonly form = this.fb.group({
    titre: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(10000)]],
    categorie: ['', Validators.required],
    salaire: [null as number | null, [Validators.min(0)]],
  });
  categories: Categorie[] = [];
  loadingCategories = false;
  saving = false;
  submitting = false;
  error = '';
  success = '';
  createdOffer: CreatedOffer | null = null;
  // Authentication is provided by the existing /api/auth/login route.
  // The temporary token field is only for running this standalone first module;
  // future company auth screens should store the session centrally.
  token = '';

  ngOnInit(): void {
    // No stored tokens: require explicit entry for this isolated module.
  }

  loadCategories(): void {
    if (!this.token.trim()) { this.error = 'Saisissez votre token JWT entreprise.'; return; }
    this.loadingCategories = true;
    this.error = '';
    this.http.get<{ categories: Categorie[] }>(`${this.apiUrl}/api/offres/categories`, { headers: this.authHeaders() }).subscribe({
      next: response => { this.categories = response.categories; this.loadingCategories = false; },
      error: err => { this.error = this.getError(err); this.loadingCategories = false; },
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (!this.token.trim()) { this.error = 'Saisissez votre token JWT entreprise.'; return; }
    if (this.form.invalid || this.saving) return;
    const { titre, description, categorie, salaire } = this.form.getRawValue();
    this.saving = true;
    this.error = '';
    this.success = '';
    this.createdOffer = null;
    this.http.post<{ message: string; offre: CreatedOffer }>(`${this.apiUrl}/api/offres`, {
      titre, description, categorie, ...(salaire === null || salaire === undefined ? {} : { salaire }),
    }, { headers: this.authHeaders() }).subscribe({
      next: response => {
        this.saving = false;
        this.createdOffer = response.offre;
        this.success = 'Offre enregistrée en brouillon.';
        this.form.reset({ titre: '', description: '', categorie: '', salaire: null });
      },
      error: err => { this.saving = false; this.error = this.getError(err); },
    });
  }

  submitForValidation(): void {
    const offer = this.createdOffer;
    if (!offer || offer.statut !== 'brouillon' || this.submitting) return;
    if (!this.token.trim()) { this.error = 'Saisissez votre token JWT entreprise.'; return; }

    this.submitting = true;
    this.error = '';
    this.success = '';
    this.http.patch<{ message: string; offre: CreatedOffer }>(
      `${this.apiUrl}/api/offres/${encodeURIComponent(offer.id)}/submit`,
      {},
      { headers: this.authHeaders() }
    ).subscribe({
      next: response => {
        this.submitting = false;
        this.createdOffer = response.offre;
        this.success = 'Offre soumise à validation. Statut : en attente.';
      },
      error: err => {
        this.submitting = false;
        this.error = this.getError(err);
      },
    });
  }

  private authHeaders(): { Authorization: string } {
    return { Authorization: `Bearer ${this.token.trim()}` };
  }
  private getError(err: HttpErrorResponse): string {
    const body = err.error;
    return Array.isArray(body?.errors) ? body.errors.join(' · ') : (body?.error || 'Erreur réseau ou serveur');
  }
}

