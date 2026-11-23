import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Offre } from '../../models/offre.model';
import { OffreService } from '../../services/offre.service';

@Component({
  selector: 'app-mes-offres', standalone: true, imports: [CommonModule],
  templateUrl: './mes-offres.component.html',
  styleUrls: ['./mes-offres.component.css']
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
