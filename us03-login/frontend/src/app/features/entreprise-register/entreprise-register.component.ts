import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterEntreprisePayload } from '../../core/services/auth.service';

@Component({
  selector: 'app-entreprise-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './entreprise-register.component.html',
  styleUrl: './entreprise-register.component.css'
})
export class EntrepriseRegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  
  
  secteurs = [
    'Technologies de l\'Information (IT)',
    'Finance / Banque',
    'Santé / Pharmacie',
    'Commerce / Retail',
    'Industrie / Manufacturing'
  ];

  form: FormGroup = this.fb.group({
    nomEntreprise: ['', Validators.required],
    secteur: ['', Validators.required],
    nom: ['', Validators.required],   
    email: ['', [Validators.required, Validators.email]],
    mdp: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    mdpConfirmation: ['', [Validators.required]]
  });

  submitting = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  submit(): void {
    this.errorMsg.set(null);
    this.successMsg.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value as RegisterEntreprisePayload & { mdpConfirmation: string };
    if (v.mdp !== v.mdpConfirmation) {
      this.errorMsg.set('Les deux mots de passe ne correspondent pas.');
      return;
    }
    this.submitting.set(true);
    const { mdpConfirmation, ...payload } = v;
    this.auth.registerEntreprise(payload).subscribe({
      next: (res) => {
        this.successMsg.set(res.message);
        this.submitting.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.submitting.set(false);
        const apiErr = err?.error;
        if (apiErr?.details && Array.isArray(apiErr.details)) {
          this.errorMsg.set(apiErr.details.join(', '));
        } else {
          this.errorMsg.set(apiErr?.error || 'Cet e-mail est déjà utilisé ou invalide.');
        }
      }
    });
  }
}
