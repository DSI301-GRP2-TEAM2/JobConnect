import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-candidat-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './candidat-register.component.html',
  styles: [`
    .reg-error {
      color: var(--danger);
      font-size: 0.85rem;
      margin: 0.3rem 0 0;
    }
  `]
})
export class CandidatRegisterComponent {
  form: FormGroup;
  submitting = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
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
    const v = this.form.value as { nom: string; prenom: string; email: string; mdp: string; mdpConfirmation: string };
    if (v.mdp !== v.mdpConfirmation) {
      this.errorMsg = 'Les deux mots de passe ne correspondent pas.';
      return;
    }
    this.submitting = true;
    this.auth.register({ nom: v.nom, prenom: v.prenom, email: v.email, mdp: v.mdp }).subscribe({
      next: () => {
        this.submitting = false;
        this.form.reset();
        this.auth.closeRegisterModal();
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