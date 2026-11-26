import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { CandidatRegisterComponent } from './candidat-register.component';

describe('CandidatRegisterComponent', () => {
  const url = environment.apiUrl + '/api/auth/register/candidat';
  const payload = { nom: 'Dupont', prenom: 'Jean', email: 'jean@example.com', mdp: 'password123' };
  let fixture: ComponentFixture<CandidatRegisterComponent>;
  let component: CandidatRegisterComponent;
  let http: HttpTestingController;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidatRegisterComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CandidatRegisterComponent);
    component = fixture.componentInstance;
    page = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows required-field errors and sends no request for an empty form', () => {
    page.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(component.form.invalid).toBeTrue();
    expect(page.textContent).toContain('Le nom est obligatoire.');
    expect(page.textContent).toContain("L'e-mail est obligatoire.");
    expect(page.textContent).toContain('La confirmation est obligatoire.');
    http.expectNone(url);
  });

  it('rejects whitespace-only names, malformed email and out-of-range passwords', () => {
    component.form.setValue({ nom: '  ', prenom: ' ', email: 'invalid', mdp: 'short', mdpConfirmation: 'short' });
    component.submit();

    expect(component.form.get('nom')?.hasError('pattern')).toBeTrue();
    expect(component.form.get('prenom')?.hasError('pattern')).toBeTrue();
    expect(component.form.get('email')?.hasError('email')).toBeTrue();
    expect(component.form.get('mdp')?.hasError('minlength')).toBeTrue();

    component.form.get('mdp')?.setValue('a'.repeat(73));
    expect(component.form.get('mdp')?.hasError('maxlength')).toBeTrue();
    http.expectNone(url);
  });

  it('rejects a password confirmation that does not match', () => {
    component.form.setValue({ ...payload, mdpConfirmation: 'different123' });
    component.submit();

    expect(component.errorMsg()).toBe('Les deux mots de passe ne correspondent pas.');
    http.expectNone(url);
  });

  it('registers the candidate and offers a link to open the login modal', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    component.form.setValue({ ...payload, mdpConfirmation: payload.mdp });
    page.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const request = http.expectOne({ method: 'POST', url });
    expect(request.request.body).toEqual(payload);
    expect(page.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBeTrue();
    request.flush({
      message: 'Compte créé',
      user: { id: '1', nom: payload.nom, prenom: payload.prenom, email: payload.email, role: 'candidat' }
    });
    fixture.detectChanges();

    expect(component.submitting()).toBeFalse();
    expect(component.form.pristine).toBeTrue();
    expect(page.querySelector('.form-success')?.textContent).toContain('Compte créé');
    expect(TestBed.inject(AuthService).showModal).toBeFalse();

    page.querySelector<HTMLButtonElement>('.success-block button')!.click();
    expect(TestBed.inject(AuthService).showModal).toBeTrue();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('shows the API error and keeps the form available after a duplicate email', () => {
    component.form.setValue({ ...payload, mdpConfirmation: payload.mdp });
    component.submit();
    http.expectOne(url).flush({ error: 'E-mail déjà utilisé' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(page.textContent).toContain('E-mail déjà utilisé');
    expect(component.form.get('email')?.value).toBe(payload.email);
    expect(page.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBeFalse();
  });

  it('shows a connection error when the registration API is unreachable', () => {
    component.form.setValue({ ...payload, mdpConfirmation: payload.mdp });
    component.submit();
    http.expectOne(url).error(new ProgressEvent('error'));

    expect(component.errorMsg()).toBe('Service indisponible. Vérifiez votre connexion.');
    expect(component.submitting()).toBeFalse();
  });
});
