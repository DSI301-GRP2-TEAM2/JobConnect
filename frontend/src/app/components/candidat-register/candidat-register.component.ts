import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterCandidatPayload } from '../../models/auth.model';

@Component({
  selector: 'app-candidat-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './candidat-register.component.html',
  styleUrls: ['./candidat-register.component.css']
})
export class CandidatRegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  submitting = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    nom: ['', [Validators.required, Validators.pattern(/\S/)]],
    prenom: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    mdp: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    mdpConfirmation: ['', [Validators.required]]
  });

  submit(): void {
    this.errorMsg.set(null);
    this.successMsg.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value as RegisterCandidatPayload & { mdpConfirmation: string };
    if (v.mdp !== v.mdpConfirmation) {
      this.errorMsg.set('Les deux mots de passe ne correspondent pas.');
      return;
    }

    this.submitting.set(true);
    const { mdpConfirmation, ...payload } = v;
    this.auth.registerCandidat(payload).subscribe({
      next: (res) => {
        this.successMsg.set(res.message);
        this.submitting.set(false);
        this.form.reset();
      },
      error: (err) => {
        this.submitting.set(false);
        if (err.status === 0) {
          this.errorMsg.set('Service indisponible. Vérifiez votre connexion.');
          return;
        }
        const apiErr = err?.error;
        if (apiErr?.errors && Array.isArray(apiErr.errors)) {
          this.errorMsg.set(apiErr.errors.join(', '));
        } else {
          this.errorMsg.set(apiErr?.error || 'Cet e-mail est déjà utilisé ou invalide.');
        }
      }
    });
  }

  goToLogin(): void {
    this.auth.openLoginModal();
    this.router.navigate(['/']);
  }
}
