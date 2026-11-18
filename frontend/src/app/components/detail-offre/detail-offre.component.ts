import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OffreService } from '../../services/offre.service';
import { EntrepriseDetail, Offre } from '../../models/offre.model';

@Component({
  selector: 'app-detail-offre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-offre.component.html',
  styleUrls: ['./detail-offre.component.css']
})
export class DetailOffreComponent implements OnInit {
  @Input() offreId!: string;
  @Output() retour = new EventEmitter<void>();

  offre: Offre | null = null;
  loading = false;
  error = '';
  postulerMessage = '';

  constructor(private offreService: OffreService) {}

  ngOnInit(): void {
    if (this.offreId) {
      this.loadDetail();
    }
  }

  loadDetail(): void {
    this.loading = true;
    this.error = '';
    this.offreService.getOffreById(this.offreId).subscribe({
      next: (data) => {
        this.loading = false;
        this.offre = data;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 404) {
          this.error = 'Offre introuvable ou non publiée';
        } else if (err.status === 401 || err.status === 403) {
          this.error = 'Accès non autorisé';
        } else {
          this.error = 'Impossible de charger les détails de l\'offre';
        }
      }
    });
  }

  onRetour(): void {
    this.retour.emit();
  }

  postuler(): void {
    this.postulerMessage = 'La candidature sera disponible dans la prochaine version (US-18).';
  }

  getEntrepriseNom(): string {
    return this.offre?.entreprise?.nomEntreprise || 'Entreprise';
  }

  private getEntrepriseDetails(): EntrepriseDetail | null {
    const entId = this.offre?.entreprise?.id;
    if (entId && typeof entId === 'object') {
      return entId as EntrepriseDetail;
    }
    return null;
  }

  getEntrepriseSecteur(): string {
    const details = this.getEntrepriseDetails();
    return details?.secteur || this.offre?.categorie?.libelle || 'Non précisé';
  }

  getEntrepriseSiteWeb(): string {
    const details = this.getEntrepriseDetails();
    return details?.siteWeb || '';
  }

  getEntrepriseEmail(): string {
    const details = this.getEntrepriseDetails();
    return details?.email || 'Non précisé';
  }

  formatSalary(salaire?: number): string {
    if (!salaire) return 'Salaire non précisé';
    return Number(salaire).toLocaleString('fr-FR') + ' €/an';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }
}
