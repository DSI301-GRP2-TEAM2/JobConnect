import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Offre } from '../../models/offre.model';
import { OffreService } from '../../services/offre.service';

@Component({
  selector: 'app-mes-offres', standalone: true, imports: [CommonModule],
  template: `
    <section class="list">
      <h1>Mes offres</h1>
      <div class="filters" aria-label="Filtrer par statut">
        <button *ngFor="let filter of filters" type="button" class="btn btn-outline btn-sm" [attr.aria-pressed]="selectedStatus === filter.value" (click)="selectedStatus = filter.value">{{ filter.label }}</button>
      </div>
      <p *ngIf="loading">Chargement des offres…</p>
      <p role="alert" *ngIf="error">{{ error }} <button class="btn btn-outline btn-sm" (click)="load()">Réessayer</button></p>
      <p *ngIf="!loading && !error && !offres.length">Vous n'avez pas encore créé d'offre.</p>
      <p *ngIf="!loading && !error && offres.length && !filteredOffres.length">Aucune offre pour ce statut.</p>
      <article *ngFor="let offre of filteredOffres" class="card">
        <h2>{{ offre.titre }}</h2>
        <p>{{ offre.categorie?.libelle || 'Catégorie indisponible' }} · {{ offre.dateCreation | date:'dd/MM/yyyy' }}</p>
        <p>Statut : <strong>{{ status(offre.statut) }}</strong></p>
        <p *ngIf="offre.statut === 'rejetee'">Motif du refus : {{ offre.motifRefus || 'Non précisé' }}</p>
        <p *ngIf="offre.localisation">{{ offre.localisation }} <span *ngIf="offre.typeContrat">· {{ offre.typeContrat }}</span></p>
        <button *ngIf="offre.statut === 'brouillon'" class="btn btn-outline" (click)="edit.emit(offre._id)">Ouvrir le brouillon</button>
      </article>
    </section>`,
  styles: ['.list { max-width: 760px; margin: auto; } .filters { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1rem 0; } .filters [aria-pressed="true"] { background: #1e293b; color: white; } .card { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 1.2rem; margin-top: 1rem; } .card h2 { font-size: 1.1rem; } .card p { margin: .4rem 0; }']
})
export class MesOffresComponent implements OnInit {
  @Output() edit = new EventEmitter<string>();
  offres: Offre[] = [];
  selectedStatus = '';
  filters = [{label: 'Toutes', value: ''}, {label: 'En attente', value: 'en_attente'}, {label: 'Publiées', value: 'publiee'}, {label: 'Refusées', value: 'rejetee'}];
  get filteredOffres(): Offre[] { return this.selectedStatus ? this.offres.filter(offre => offre.statut === this.selectedStatus) : this.offres; }
  loading = false;
  error = '';
  constructor(private service: OffreService) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = '';
    this.service.getMesOffres().subscribe({
      next: result => { this.offres = result.offres; this.loading = false; },
      error: err => { this.error = err.error?.error || 'Impossible de charger vos offres.'; this.loading = false; }
    });
  }
  status(value: string): string {
    return ({ brouillon: 'Brouillon', en_attente: 'En attente', publiee: 'Publiée', rejetee: 'Refusée' } as Record<string, string>)[value] || value;
  }
}
