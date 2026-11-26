import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { CatalogueComponent } from './catalogue.component';

describe('CatalogueComponent', () => {
  const url = environment.apiUrl + '/api/offres';
  const offers = Array.from({ length: 6 }, (_, index) => ({
    _id: String(index + 1),
    titre: 'Offre ' + (index + 1),
    description: 'Description du poste ' + (index + 1),
    dateCreation: '2026-01-01',
    statut: 'publiee',
    localisation: 'Paris'
  }));
  let fixture: ComponentFixture<CatalogueComponent>;
  let auth: AuthService;
  let http: HttpTestingController;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogueComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(CatalogueComponent);
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    page = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  function signIn(): void {
    auth.currentToken = 'candidate-token';
    auth.currentUser = { _id: '1', nom: 'Dupont', email: 'jean@example.com', role: 'candidat' };
    fixture.detectChanges();
  }

  it('prompts a guest to sign in without loading offers', () => {
    fixture.detectChanges();

    expect(page.querySelector('.unauth-box')?.textContent).toContain('Candidat');
    page.querySelector<HTMLButtonElement>('.unauth-box button')!.click();
    expect(auth.showModal).toBeTrue();
    http.expectNone(url);
  });

  it('paginates published offers and opens and closes a preview', () => {
    spyOn(window, 'scrollTo');
    signIn();
    expect(page.textContent).toContain('Chargement des offres');
    http.expectOne({ method: 'GET', url }).flush(offers);
    fixture.detectChanges();

    expect(page.querySelectorAll('.offre-item').length).toBe(5);
    expect(page.querySelector('.offre-title')?.textContent).toBe('Offre 1');
    page.querySelectorAll<HTMLButtonElement>('.page-number')[1].click();
    fixture.detectChanges();
    expect(page.querySelectorAll('.offre-item').length).toBe(1);
    expect(page.querySelector('.offre-title')?.textContent).toBe('Offre 6');

    page.querySelector<HTMLButtonElement>('.btn-voir')!.click();
    fixture.detectChanges();
    expect(page.querySelector('.modal-card')?.textContent).toContain('Description du poste 6');
    page.querySelector<HTMLButtonElement>('.modal-close')!.click();
    fixture.detectChanges();
    expect(page.querySelector('.modal-card')).toBeNull();
  });

  it('shows a forbidden error and can retry to an empty catalogue', () => {
    signIn();
    http.expectOne(url).flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(page.querySelector('.error-box')?.textContent).toContain('Accès réservé aux candidats');
    page.querySelector<HTMLButtonElement>('.error-box button')!.click();
    http.expectOne(url).flush([]);
    fixture.detectChanges();

    expect(page.querySelector('.error-box')).toBeNull();
    expect(page.textContent).toContain('Aucune offre');
  });
});
