import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { OffreFormComponent } from './offre-form.component';

describe('OffreFormComponent', () => {
  const api = environment.apiUrl + '/api';
  const categories = [{ id: 'tech', libelle: 'Informatique' }];
  const draft = {
    titre: 'Développeur',
    description: 'Développement du site',
    localisation: 'Paris',
    typeContrat: 'CDI',
    missionsPrincipales: 'Maintenir le site',
    profilRecherche: 'Connaissance Angular',
    categorie: 'tech'
  };
  const createdOffer = { ...draft, id: 'draft-1', statut: 'brouillon' };
  const storedOffer = { ...draft, _id: 'draft-1', statut: 'brouillon', categorie: { _id: 'tech', libelle: 'Informatique' } };
  let fixture: ComponentFixture<OffreFormComponent>;
  let component: OffreFormComponent;
  let http: HttpTestingController;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OffreFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(OffreFormComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    page = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  async function loadCategories(): Promise<void> {
    fixture.detectChanges();
    http.expectOne({ method: 'GET', url: api + '/offres/categories' }).flush({ categories });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function setField(name: string, value: string): void {
    const field = page.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('#' + name)!;
    field.value = value;
    field.dispatchEvent(new Event(field.tagName === 'SELECT' ? 'change' : 'input'));
  }

  async function fillDraft(): Promise<void> {
    await loadCategories();
    for (const [name, value] of Object.entries(draft)) {
      setField(name, value);
    }
    fixture.detectChanges();
  }

  function submitForm(): void {
    page.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('loads category options and prevents saving an invalid offer', async () => {
    await loadCategories();
    expect(page.querySelector('#categorie option[value=tech]')?.textContent).toBe('Informatique');
    expect(page.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBeTrue();

    submitForm();
    expect(page.textContent).toContain('Titre obligatoire.');
    expect(page.textContent).toContain('Catégorie obligatoire.');
    http.expectNone({ method: 'POST', url: api + '/offres' });
  });

  it('saves a trimmed draft and submits it for validation', async () => {
    await fillDraft();
    setField('titre', '  Développeur  ');
    submitForm();
    const save = http.expectOne({ method: 'POST', url: api + '/offres' });
    expect(save.request.body).toEqual(draft);
    expect(component.saving).toBeTrue();
    save.flush({ message: 'Brouillon créé', offre: createdOffer });
    fixture.detectChanges();

    expect(component.createdOffer).toEqual(createdOffer);
    expect(page.querySelector('[role=status]')?.textContent).toContain('Offre enregistrée en brouillon.');
    page.querySelector<HTMLButtonElement>('.draft-action button')!.click();
    fixture.detectChanges();
    expect(page.querySelector<HTMLButtonElement>('.draft-action button')?.disabled).toBeTrue();

    const submit = http.expectOne({ method: 'PATCH', url: api + '/offres/draft-1/submit' });
    submit.flush({ message: 'Offre soumise', offre: { ...createdOffer, statut: 'en_attente' } });
    fixture.detectChanges();

    expect(component.createdOffer?.statut).toBe('en_attente');
    expect(page.querySelector('[role=status]')?.textContent).toContain('Offre soumise à validation');
    expect(page.querySelector('.draft-action')).toBeNull();
  });

  it('keeps the form available when the API rejects a draft', async () => {
    await fillDraft();
    submitForm();
    http.expectOne({ method: 'POST', url: api + '/offres' }).flush(
      { errors: ['Catégorie indisponible', 'Description invalide'] },
      { status: 400, statusText: 'Bad Request' }
    );
    fixture.detectChanges();

    expect(page.querySelector('[role=alert]')?.textContent).toContain('Catégorie indisponible · Description invalide');
    expect(component.draft.titre).toBe(draft.titre);
    expect(page.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBeFalse();
    expect(page.querySelector('.draft-action')).toBeNull();
  });

  it('loads and updates an existing draft before allowing submission', async () => {
    fixture.componentRef.setInput('offerId', 'draft-1');
    fixture.detectChanges();
    http.expectOne({ method: 'GET', url: api + '/entreprise/offres/draft-1' }).flush({ offre: storedOffer });
    await loadCategories();

    expect(page.querySelector<HTMLInputElement>('#titre')?.value).toBe(draft.titre);
    expect(page.querySelector<HTMLSelectElement>('#categorie')?.value).toBe('tech');
    setField('titre', 'Titre modifié');
    fixture.detectChanges();
    expect(page.querySelector('.draft-action')).toBeNull();

    submitForm();
    const update = http.expectOne({ method: 'PATCH', url: api + '/entreprise/offres/draft-1' });
    expect(update.request.body).toEqual({ ...draft, titre: 'Titre modifié', salaire: undefined });
    update.flush({ offre: { ...storedOffer, titre: 'Titre modifié' } });
    fixture.detectChanges();

    expect(component.createdOffer?.titre).toBe('Titre modifié');
    expect(page.querySelector('.draft-action')).not.toBeNull();
  });

  it('keeps a draft available for retry if submission fails', async () => {
    await fillDraft();
    submitForm();
    http.expectOne({ method: 'POST', url: api + '/offres' }).flush({ message: 'Brouillon créé', offre: createdOffer });
    fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.draft-action button')!.click();
    http.expectOne({ method: 'PATCH', url: api + '/offres/draft-1/submit' }).flush(
      { error: 'Soumission indisponible' }, { status: 503, statusText: 'Service Unavailable' }
    );
    fixture.detectChanges();

    expect(page.querySelector('[role=alert]')?.textContent).toContain('Soumission indisponible');
    expect(component.createdOffer?.statut).toBe('brouillon');
    expect(page.querySelector<HTMLButtonElement>('.draft-action button')?.disabled).toBeFalse();
  });
});
