import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OffreService } from '../../services/offre.service';
import { AuthService } from '../../services/auth.service';
import { Offre } from '../../models/offre.model';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogue.component.html',
  styleUrls: ['./catalogue.component.css']
})
export class CatalogueComponent implements OnInit {
  @Output() selectOffre = new EventEmitter<string>();

  allOffres: Offre[] = [];
  pagedOffres: Offre[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;
  pages: number[] = [];
  loading = false;
  error = '';

  constructor(
    private offreService: OffreService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadOffres();
    }
  }

  loadOffres(): void {
    this.loading = true;
    this.error = '';
    this.offreService.getOffresPubliees().subscribe({
      next: (offres) => {
        this.loading = false;
        this.allOffres = offres || [];
        this.currentPage = 1;
        this.updatePagination();
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401 || err.status === 403) {
          this.error = 'Accès réservé aux candidats';
        } else {
          this.error = 'Impossible de charger les offres';
        }
      }
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.allOffres.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.pagedOffres = this.allOffres.slice(start, start + this.itemsPerPage);

    this.pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.pages.push(i);
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  voirDetail(id: string): void {
    this.selectOffre.emit(id);
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
