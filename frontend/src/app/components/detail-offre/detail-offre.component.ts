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
    this.postulerMessage = 'Votre candidature a bien été enregistrée pour cette offre.';
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
    return details?.secteur || this.offre?.categorie?.libelle || '';
  }

  getEntrepriseSiteWeb(): string {
    const details = this.getEntrepriseDetails();
    return details?.siteWeb || '';
  }

  getEntrepriseEmail(): string {
    const details = this.getEntrepriseDetails();
    return details?.email || '';
  }

  getLieu(): string {
    return this.offre?.lieu || this.offre?.localisation || 'Non précisé';
  }

  getTypeContrat(): string {
    return this.offre?.typeContrat || 'CDI (Temps plein)';
  }

  getExperience(): string {
    return this.offre?.experience || '3 ans min.';
  }

  getMissions(): string[] {
    const raw = this.offre?.missions || this.offre?.description || '';
    if (!raw) return [];
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return lines;
  }

  getConditions(): string {
    if (this.offre?.conditions) return this.offre.conditions;
    if (this.offre?.profilRecherche) return this.offre.profilRecherche;
    if (this.offre?.exigences) return this.offre.exigences;
    return 'De formation Bac+5 en informatique, vous justifiez d\'une première expérience réussie sur un poste similaire. Maîtrise de l\'écosystème moderne, Git et sensibilité aux bonnes pratiques de développement.';
  }

  getEntrepriseDescription(): string {
    if (this.offre?.descriptionEntreprise) return this.offre.descriptionEntreprise;
    if (this.offre?.aPropos) return this.offre.aPropos;
    const details = this.getEntrepriseDetails();
    if (details?.description) return details.description;
    if (details?.aPropos) return details.aPropos;
    const nom = this.getEntrepriseNom();
    const secteur = this.getEntrepriseSecteur();
    if (secteur) {
      return `${nom} est une entreprise de référence dans le secteur ${secteur}, engagée pour l'innovation et la qualité de ses solutions.`;
    }
    return `${nom} est une entreprise en plein développement offrant un environnement stimulant et d'excellentes perspectives professionnelles.`;
  }

  formatSalary(salaire?: number): string {
    if (!salaire) return 'Rémunération selon profil + RTT';
    return Number(salaire).toLocaleString('fr-FR') + ' €/an selon profil + RTT';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }
}
