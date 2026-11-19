import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    mdp: ['', [Validators.required]]
  });

  submitting = signal(false);
  errorMsg = signal<string | null>(null);

  submit(): void {
    this.errorMsg.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { email, mdp } = this.form.value as { email: string; mdp: string };
    this.auth.login(email, mdp).subscribe({
      next: () => {
        this.submitting.set(false);
        
        
        
        this.router.navigate(['/me']);
      },
      error: (err) => {
        this.submitting.set(false);
        const apiErr = err?.error;
        this.errorMsg.set(apiErr?.error || 'Email ou mot de passe incorrect.');
      }
    });
  }
}
