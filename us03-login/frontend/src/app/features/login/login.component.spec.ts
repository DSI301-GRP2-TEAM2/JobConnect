import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('LoginComponent (US-03)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => expect(component).toBeTruthy());

  it('builds a form with email and mdp fields', () => {
    expect(component.form.contains('email')).toBeTrue();
    expect(component.form.contains('mdp')).toBeTrue();
  });

  it('marks the form invalid when fields are empty', () => {
    component.form.setValue({ email: '', mdp: '' });
    expect(component.form.valid).toBeFalse();
  });

  it('marks the form valid with proper values', () => {
    component.form.setValue({ email: 'jean.dupont@email.fr', mdp: 'password123' });
    expect(component.form.valid).toBeTrue();
  });

  it('rejects an invalid email', () => {
    component.form.setValue({ email: 'not-an-email', mdp: 'password123' });
    expect(component.form.valid).toBeFalse();
  });

  it('requires the password', () => {
    component.form.setValue({ email: 'jean.dupont@email.fr', mdp: '' });
    expect(component.form.valid).toBeFalse();
  });
});
