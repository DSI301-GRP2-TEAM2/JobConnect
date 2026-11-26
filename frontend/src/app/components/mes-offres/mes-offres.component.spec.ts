import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { MesOffresComponent } from './mes-offres.component';

describe('MesOffresComponent', () => {
  const url = environment.apiUrl + '/api/offres/mes-offres';
  const draft = { _id: '1', titre: 'Offre en cours', description: 'Description du poste', dateCreation: '2026-01-01', statut: 'brouillon' };
  let fixture: ComponentFixture<MesOffresComponent>;
  let http: HttpTestingController;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesOffresComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(MesOffresComponent);
    http = TestBed.inject(HttpTestingController);
    page = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('filters company offers, shows the refusal reason and emits the selected draft ID', () => {
    http.expectOne({ method: 'GET', url }).flush({
      offres: [draft, { ...draft, _id: '2', titre: 'Offre refusée', statut: 'rejetee', motifRefus: 'Description incomplète' }]
    });
    fixture.detectChanges();

    expect(page.querySelectorAll('article').length).toBe(2);
    const edit = jasmine.createSpy('edit draft');
    fixture.componentInstance.edit.subscribe(edit);
    page.querySelector<HTMLButtonElement>('article button')!.click();
    expect(edit).toHaveBeenCalledWith(draft._id);

    const filters = Array.from(page.querySelectorAll<HTMLButtonElement>('.filters button'));
    filters.find(button => button.textContent?.trim() === 'Refusées')!.click();
    fixture.detectChanges();
    expect(page.querySelectorAll('article').length).toBe(1);
    expect(page.querySelector('article')?.textContent).toContain('Description incomplète');
    expect(page.querySelector('article button')).toBeNull();

    filters.find(button => button.textContent?.trim() === 'Publiées')!.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('Aucune offre pour ce statut.');
  });

  it('shows the API error and retries loading the company offers', () => {
    http.expectOne(url).flush({ error: 'Service indisponible' }, { status: 503, statusText: 'Service Unavailable' });
    fixture.detectChanges();

    expect(page.querySelector('[role=alert]')?.textContent).toContain('Service indisponible');
    page.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    http.expectOne(url).flush({ offres: [] });
    fixture.detectChanges();

    expect(page.querySelector('[role=alert]')).toBeNull();
    expect(page.textContent).toContain("Vous n'avez pas encore créé d'offre.");
  });
});
