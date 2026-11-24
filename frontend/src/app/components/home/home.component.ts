import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogueComponent } from '../catalogue/catalogue.component';
import { OffreFormComponent } from '../offre-form/offre-form.component';
import { MesOffresComponent } from '../mes-offres/mes-offres.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CatalogueComponent, OffreFormComponent, MesOffresComponent],
  template: `
    <app-mes-offres *ngIf="authService.isEntreprise() && companyView === 'list'" (edit)="openOffer($event)"></app-mes-offres>
    <app-offre-form *ngIf="authService.isEntreprise() && companyView === 'form'" [offerId]="selectedOfferId"></app-offre-form>
    <app-catalogue *ngIf="!authService.isEntreprise()"></app-catalogue>
  `
})
export class HomeComponent {
  companyView: 'list' | 'form' = 'list';
  selectedOfferId: string | null = null;

  constructor(public authService: AuthService) {}

  openOffer(id: string | null): void {
    this.selectedOfferId = id;
    this.companyView = 'form';
  }
}
