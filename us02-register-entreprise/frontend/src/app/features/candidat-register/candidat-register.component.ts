import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterCandidatPayload } from '../../core/services/auth.service';

@Component({
  selector: 'app-candidat-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './candidat-register.component.html',
  styleUrl: './candidat-register.component.css'
})
export class CandidatRegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  
  form: FormGroup = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
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
