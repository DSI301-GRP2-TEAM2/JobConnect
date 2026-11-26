import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { OffreService } from './offre.service';

describe('OffreService', () => {
  const api = environment.apiUrl + '/api';
  let http: HttpTestingController;
  let service: OffreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentToken: 'test-token' } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(OffreService);
  });

  afterEach(() => http.verify());

  it('sends the bearer token when loading published offers', () => {
    const offers = [{ _id: '1', titre: 'Développeur', description: 'Créer un site', dateCreation: '2026-01-01', statut: 'publiee' }];
    const result = jasmine.createSpy('published offers');
    service.getOffresPubliees().subscribe(result);

    const request = http.expectOne({ method: 'GET', url: api + '/offres' });
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush(offers);

    expect(result).toHaveBeenCalledWith(offers);
  });

  it('encodes the offer identifier and forwards an API error', () => {
    const error = jasmine.createSpy('submission error');
    service.submitOffre('draft/1').subscribe({ error });

    const request = http.expectOne({ method: 'PATCH', url: api + '/offres/draft%2F1/submit' });
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(request.request.body).toEqual({});
    request.flush({ error: 'Offre introuvable' }, { status: 404, statusText: 'Not Found' });

    expect(error).toHaveBeenCalledWith(jasmine.objectContaining({ status: 404, error: { error: 'Offre introuvable' } }));
  });
});
