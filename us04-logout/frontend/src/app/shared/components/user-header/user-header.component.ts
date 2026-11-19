import { Component, inject, signal, computed, Output, EventEmitter, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-header.component.html',
  styleUrl: './user-header.component.css'
})

export class UserHeaderComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  
  links = input<{ label: string; path: string; active?: boolean }[]>([]);

  
  @Output() loggedOut = new EventEmitter<void>();

  menuOpen = signal(false);
  modalOpen = signal(false);
  loggingOut = signal(false);

  user = computed(() => this.auth.getUser());

  initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    return (u.email || '?').charAt(0).toUpperCase();
  });

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  openLogoutModal(): void {
    this.modalOpen.set(true);
    this.menuOpen.set(false);
  }

  cancelLogout(): void {
    this.modalOpen.set(false);
  }

  confirmLogout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      next: () => {
        this.loggingOut.set(false);
        this.modalOpen.set(false);
        this.loggedOut.emit();
        this.router.navigate(['/login']);
      },
      error: () => {
        
        this.auth.clearSession();
        this.loggingOut.set(false);
        this.modalOpen.set(false);
        this.loggedOut.emit();
        this.router.navigate(['/login']);
      }
    });
  }
}
