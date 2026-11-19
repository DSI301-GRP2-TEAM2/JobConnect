import { Injectable, inject } from '@angular/core';
import { Observable, tap, finalize } from 'rxjs';
import { ApiService } from './api.service';

export interface RegisterCandidatPayload {
  nom: string; prenom: string; email: string; mdp: string;
}
export interface RegisterEntreprisePayload {
  nom: string; nomEntreprise: string; secteur: string; email: string; mdp: string;
  siteWeb?: string; description?: string;
}
export interface RegisterResponse {
  message: string;
  user: { id: string; nom: string; prenom?: string; email: string; role: string; nomEntreprise?: string; secteur?: string };
}
export interface LoginResponse {
  message: string;
  token: string;
  user: { id: string; nom: string; email: string; role: string };
}
export interface LogoutResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);

  private tokenKey = 'jobconnect_token';
  private userKey = 'jobconnect_user';

  
  registerCandidat(payload: RegisterCandidatPayload): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/auth/register/candidat', payload);
  }

  
  registerEntreprise(payload: RegisterEntreprisePayload): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/auth/register/entreprise', payload);
  }

  
  login(email: string, mdp: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', { email, mdp }).pipe(
      tap((res) => this.storeSession(res.token, res.user))
    );
  }

  
  
  
  logout(): Observable<LogoutResponse> {
    return this.api.post<LogoutResponse>('/auth/logout', {}).pipe(
      finalize(() => this.clearSession())
    );
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
