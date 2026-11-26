import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { EntrepriseViewService } from '../../services/entreprise-view.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  const api = environment.apiUrl + '/api';
  let fixture: ComponentFixture<HomeComponent>;
  let http: HttpTestingController;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    http = TestBed.inject(HttpTestingController);
    page = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  it('shows the catalogue to a candidate', () => {
    const auth = TestBed.inject(AuthService);
    auth.currentUser = { _id: '1', nom: 'Dupont', email: 'jean@example.com', role: 'candidat' };
    auth.currentToken = 'candidate-token';
    fixture.detectChanges();
    http.expectOne(api + '/offres').flush([]);
    fixture.detectChanges();

    expect(page.querySelector('app-catalogue')?.textContent).toContain('Aucune offre');
    expect(page.querySelector('app-mes-offres')).toBeNull();
  });

  it('opens the draft emitted by the company list and returns to the list', async () => {
    const auth = TestBed.inject(AuthService);
    auth.currentUser = { _id: '2', nom: 'JobConnect', email: 'jobs@example.com', role: 'entreprise' };
    auth.currentToken = 'company-token';
    const view = TestBed.inject(EntrepriseViewService);
    const draft = { _id: 'draft-1', titre: 'Brouillon à modifier', statut: 'brouillon', description: 'Description', dateCreation: '2026-01-01' };
    fixture.detectChanges();
    http.expectOne(api + '/offres/mes-offres').flush({ offres: [draft] });
    fixture.detectChanges();
    expect(page.querySelector('app-catalogue')).toBeNull();

    page.querySelector<HTMLButtonElement>('app-mes-offres article button')!.click();
    fixture.detectChanges();
    expect(view.selectedOfferId()).toBe(draft._id);
    http.expectOne(api + '/entreprise/offres/draft-1').flush({ offre: draft });
    http.expectOne(api + '/offres/categories').flush({ categories: [] });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(page.querySelector('app-offre-form h1')?.textContent).toContain('Modifier le brouillon');
    expect(page.querySelector<HTMLInputElement>('#titre')?.value).toBe(draft.titre);

    view.showList();
    fixture.detectChanges();
    http.expectOne(api + '/offres/mes-offres').flush({ offres: [draft] });
    expect(page.querySelector('app-mes-offres')).not.toBeNull();
    expect(page.querySelector('app-offre-form')).toBeNull();
  });
});
