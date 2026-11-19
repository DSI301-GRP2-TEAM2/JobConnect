import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CandidatRegisterComponent } from './candidat-register.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('CandidatRegisterComponent (US-01)', () => {
  let fixture: ComponentFixture<CandidatRegisterComponent>;
  let component: CandidatRegisterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidatRegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CandidatRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('builds a form with the five required candidat fields', () => {
    expect(component.form.contains('nom')).toBeTrue();
    expect(component.form.contains('prenom')).toBeTrue();
    expect(component.form.contains('email')).toBeTrue();
    expect(component.form.contains('mdp')).toBeTrue();
    expect(component.form.contains('mdpConfirmation')).toBeTrue();
  });

  it('marks the form invalid when required fields are empty', () => {
    component.form.setValue({ nom: '', prenom: '', email: '', mdp: '', mdpConfirmation: '' });
    expect(component.form.valid).toBeFalse();
  });

  it('marks the form valid with proper values', () => {
    component.form.setValue({
      nom: 'Dupont', prenom: 'Jean',
      email: 'jean.dupont@email.fr',
      mdp: 'password123', mdpConfirmation: 'password123'
    });
    expect(component.form.valid).toBeTrue();
  });

  it('rejects an invalid email', () => {
    component.form.setValue({
      nom: 'Dupont', prenom: 'Jean',
      email: 'not-an-email',
      mdp: 'password123', mdpConfirmation: 'password123'
    });
    expect(component.form.valid).toBeFalse();
  });

  it('rejects a password shorter than 8 characters (backend rule)', () => {
    component.form.setValue({
      nom: 'Dupont', prenom: 'Jean',
      email: 'jean.dupont@email.fr',
      mdp: '1234567', mdpConfirmation: '1234567'
    });
    expect(component.form.valid).toBeFalse();
  });
});
