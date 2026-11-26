import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { EntrepriseViewService } from './services/entreprise-view.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let auth: AuthService;
  let http: HttpTestingController;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AppComponent);
    page = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('opens and closes the login modal from the header', () => {
    page.querySelector<HTMLButtonElement>('.auth-buttons button')!.click();
    fixture.detectChanges();
    expect(page.querySelector('.modal-overlay')?.classList.contains('active')).toBeTrue();

    page.querySelector<HTMLButtonElement>('.modal-close')!.click();
    fixture.detectChanges();
    expect(page.querySelector('.modal-overlay')?.classList.contains('active')).toBeFalse();
  });

  it('submits login credentials and shows the API error in the modal', async () => {
    auth.openLoginModal();
    fixture.componentInstance.loginEmail = ' jean@example.com ';
    fixture.componentInstance.loginMdp = 'wrong-password';
    fixture.detectChanges();
    await fixture.whenStable();
    page.querySelector('form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne({ method: 'POST', url: environment.apiUrl + '/api/auth/login' });
    expect(request.request.body).toEqual({ email: 'jean@example.com', mdp: 'wrong-password' });
    request.flush({ error: 'Mot de passe incorrect' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(page.querySelector('.login-error')?.textContent).toContain('Mot de passe incorrect');
    expect(auth.showModal).toBeTrue();
  });

  it('routes the registration link to the candidate form', async () => {
    await fixture.ngZone!.run(async () => {
      page.querySelector<HTMLAnchorElement>('.auth-buttons a')!.click();
      await fixture.whenStable();
    });
    fixture.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/register-candidat');
    expect(page.querySelector('app-candidat-register form')).not.toBeNull();
  });

  it('switches between company tabs and displays the company initials', () => {
    auth.currentToken = 'company-token';
    auth.currentUser = { _id: '1', nom: 'JobConnect', email: 'jobs@example.com', role: 'entreprise' };
    fixture.detectChanges();
    const [list, create] = Array.from(page.querySelectorAll<HTMLButtonElement>('.nav-tab'));
    expect(page.querySelector('.avatar-circle')?.textContent).toBe('J');
    expect(list.classList.contains('active')).toBeTrue();

    create.click();
    fixture.detectChanges();
    expect(create.classList.contains('active')).toBeTrue();
    expect(TestBed.inject(EntrepriseViewService).selectedOfferId()).toBeNull();

    list.click();
    fixture.detectChanges();
    expect(list.classList.contains('active')).toBeTrue();
  });
});
