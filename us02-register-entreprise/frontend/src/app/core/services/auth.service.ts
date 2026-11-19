import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RegisterCandidatPayload {
  nom: string;
  prenom: string;
  email: string;
  mdp: string;
}

export interface RegisterEntreprisePayload {
  nom: string;
  nomEntreprise: string;
  secteur: string;
  email: string;
  mdp: string;
  siteWeb?: string;
  description?: string;
}

export interface RegisterResponse {
  message: string;
  user: { id: string; nom: string; prenom?: string; email: string; role: string; nomEntreprise?: string; secteur?: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);

  private tokenKey = 'jobconnect_token';
  private userKey = 'jobconnect_user';

  
  registerCandidat(payload: RegisterCandidatPayload): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/auth/register/candidat', payload);
  }

  
  registerEntreprise(payload: Omit<RegisterEntreprisePayload, never>): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/auth/register/entreprise', payload);
  }

  
  storeSession(token: string, user: unknown): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): { id: string; nom: string; email: string; role: string } | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
