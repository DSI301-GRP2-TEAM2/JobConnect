import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const api = environment.apiUrl + '/api/auth';
  const user = { _id: '1', nom: 'Dupont', prenom: 'Jean', email: 'jean@example.com', role: 'candidat' };
  let http: HttpTestingController;

  function clearSession(): void {
    localStorage.removeItem('jobconnect_token');
    localStorage.removeItem('jobconnect_user');
  }

  beforeEach(() => {
    clearSession();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    clearSession();
  });

  it('stores a successful login and closes the login modal', () => {
    const service = TestBed.inject(AuthService);
    const response = { user, token: 'candidate-token' };
    const result = jasmine.createSpy('login result');
    service.openLoginModal();
    service.login(user.email, 'password123').subscribe(result);

    const request = http.expectOne({ method: 'POST', url: api + '/login' });
    expect(request.request.body).toEqual({ email: user.email, mdp: 'password123' });
    request.flush(response);

    expect(result).toHaveBeenCalledWith(response);
    expect(service.currentUser).toEqual(user);
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.isEntreprise()).toBeFalse();
    expect(service.showModal).toBeFalse();
    expect(localStorage.getItem('jobconnect_token')).toBe(response.token);
    expect(localStorage.getItem('jobconnect_user')).toBe(JSON.stringify(user));
  });

  it('leaves the user signed out after rejected credentials', () => {
    const service = TestBed.inject(AuthService);
    const error = jasmine.createSpy('login error');
    service.openLoginModal();
    service.login(user.email, 'wrong-password').subscribe({ error });
    http.expectOne({ method: 'POST', url: api + '/login' })
      .flush({ error: 'Identifiants incorrects' }, { status: 401, statusText: 'Unauthorized' });

    expect(error).toHaveBeenCalledWith(jasmine.objectContaining({ status: 401 }));
    expect(service.currentUser).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.showModal).toBeTrue();
    expect(localStorage.getItem('jobconnect_token')).toBeNull();
  });

  it('restores a company session and clears it on logout', () => {
    const company = { ...user, role: 'entreprise' };
    localStorage.setItem('jobconnect_user', JSON.stringify(company));
    localStorage.setItem('jobconnect_token', 'company-token');

    const service = TestBed.inject(AuthService);
    expect(service.currentUser).toEqual(company);
    expect(service.isEntreprise()).toBeTrue();
    expect(service.isAuthenticated()).toBeFalse();

    service.logout();
    expect(service.isEntreprise()).toBeFalse();
    expect(service.currentUser).toBeNull();
    expect(localStorage.getItem('jobconnect_token')).toBeNull();
    expect(localStorage.getItem('jobconnect_user')).toBeNull();
  });

  it('clears an unreadable saved session', () => {
    localStorage.setItem('jobconnect_user', '{');
    localStorage.setItem('jobconnect_token', 'old-token');

    const service = TestBed.inject(AuthService);
    expect(service.currentUser).toBeNull();
    expect(service.currentToken).toBeNull();
    expect(localStorage.getItem('jobconnect_user')).toBeNull();
  });
});
