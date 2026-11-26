import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogueComponent } from '../catalogue/catalogue.component';
import { OffreFormComponent } from '../offre-form/offre-form.component';
import { MesOffresComponent } from '../mes-offres/mes-offres.component';
import { AuthService } from '../../services/auth.service';
import { EntrepriseViewService } from '../../services/entreprise-view.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CatalogueComponent, OffreFormComponent, MesOffresComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  authService = inject(AuthService);
  entrepriseView = inject(EntrepriseViewService);

  onEditOffer(id: string): void {
    this.entrepriseView.showForm(id);
  }
}
