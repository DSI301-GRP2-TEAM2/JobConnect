import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntrepriseRegisterComponent } from './entreprise-register.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('EntrepriseRegisterComponent (US-02)', () => {
  let fixture: ComponentFixture<EntrepriseRegisterComponent>;
  let component: EntrepriseRegisterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntrepriseRegisterComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(EntrepriseRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => expect(component).toBeTruthy());

  it('builds a form with the required entreprise fields', () => {
    expect(component.form.contains('nom')).toBeTrue();
    expect(component.form.contains('nomEntreprise')).toBeTrue();
    expect(component.form.contains('secteur')).toBeTrue();
    expect(component.form.contains('email')).toBeTrue();
    expect(component.form.contains('mdp')).toBeTrue();
    expect(component.form.contains('mdpConfirmation')).toBeTrue();
  });

  it('exposes the 5 activity sectors from the mockup', () => {
    expect(component.secteurs.length).toBe(5);
    expect(component.secteurs).toContain('Technologies de l\'Information (IT)');
    expect(component.secteurs).toContain('Finance / Banque');
    expect(component.secteurs).toContain('Santé / Pharmacie');
    expect(component.secteurs).toContain('Commerce / Retail');
    expect(component.secteurs).toContain('Industrie / Manufacturing');
  });

  it('marks the form invalid when required fields are empty', () => {
    component.form.setValue({ nom: '', nomEntreprise: '', secteur: '', email: '', mdp: '', mdpConfirmation: '' });
    expect(component.form.valid).toBeFalse();
  });

  it('marks the form valid with the required fields filled', () => {
    component.form.setValue({
      nom: 'Dupont',
      nomEntreprise: 'TechCorp Solutions',
      secteur: 'Technologies de l\'Information (IT)',
      email: 'rh@techcorp.fr',
      mdp: 'securepass2023',
      mdpConfirmation: 'securepass2023'
    });
    expect(component.form.valid).toBeTrue();
  });

  it('rejects an invalid email', () => {
    component.form.setValue({
      nom: 'Dupont', nomEntreprise: 'TechCorp', secteur: 'Technologies de l\'Information (IT)',
      email: 'not-an-email', mdp: 'securepass2023', mdpConfirmation: 'securepass2023'
    });
    expect(component.form.valid).toBeFalse();
  });

  it('rejects a short password (backend rule: 8 chars min)', () => {
    component.form.setValue({
      nom: 'Dupont', nomEntreprise: 'TechCorp', secteur: 'Technologies de l\'Information (IT)',
      email: 'rh@techcorp.fr', mdp: '1234567', mdpConfirmation: '1234567'
    });
    expect(component.form.valid).toBeFalse();
  });
});
