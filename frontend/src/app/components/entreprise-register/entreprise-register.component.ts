import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-entreprise-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './entreprise-register.component.html',
  styles: [`
    .reg-error {
      color: var(--danger);
      font-size: 0.85rem;
      margin: 0.3rem 0 0;
    }
  `]
})
export class EntrepriseRegisterComponent {
  form: FormGroup;
  submitting = false;
  errorMsg = '';

  secteurs = [
    "Technologies de l'Information (IT)",
    'Finance / Banque',
    'Santé / Pharmacie',
    'Commerce / Retail',
    'Industrie / Manufacturing'
  ];

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.form = this.fb.group({
      nomEntreprise: ['', Validators.required],
      secteur: [''],
      email: ['', [Validators.required, Validators.email]],
      mdp: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      mdpConfirmation: ['', Validators.required]
    });
  }

  submit(): void {
    this.errorMsg = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value as { nomEntreprise: string; secteur: string; email: string; mdp: string; mdpConfirmation: string };
    if (v.mdp !== v.mdpConfirmation) {
      this.errorMsg = 'Les deux mots de passe ne correspondent pas.';
      return;
    }
    this.submitting = true;
    this.auth.registerEntreprise({
      nomEntreprise: v.nomEntreprise,
      secteur: v.secteur,
      email: v.email,
      mdp: v.mdp
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.form.reset();
        this.auth.closeEntrepriseModal();
        this.auth.openLoginModal();
      },
      error: (err) => {
        this.submitting = false;
        const apiErr = err?.error;
        if (apiErr?.errors && Array.isArray(apiErr.errors)) {
          this.errorMsg = apiErr.errors.join(', ');
        } else {
          this.errorMsg = apiErr?.error || 'Impossible de créer le compte. Vérifiez vos informations.';
        }
      }
    });
  }
}