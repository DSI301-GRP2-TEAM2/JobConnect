import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  _id: string;
  nom: string;
  prenom?: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  currentUser: User | null = null;
  currentToken: string | null = null;
  showModal = false;

  constructor(private http: HttpClient) {
    this.loadToken();
  }

  loadToken(): void {
    this.currentToken = localStorage.getItem('jobconnect_token');
    const u = localStorage.getItem('jobconnect_user');
    if (this.currentToken && u) {
      try {
        this.currentUser = JSON.parse(u);
      } catch {
        this.logout();
      }
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentToken && this.currentUser?.role === 'candidat';
  }

  login(email: string, mdp: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/login`, { email, mdp }).pipe(
      tap((res) => {
        this.currentToken = res.token;
        this.currentUser = res.user;
        localStorage.setItem('jobconnect_token', res.token);
        localStorage.setItem('jobconnect_user', JSON.stringify(res.user));
        this.showModal = false;
      })
    );
  }

  logout(): void {
    this.currentToken = null;
    this.currentUser = null;
    localStorage.removeItem('jobconnect_token');
    localStorage.removeItem('jobconnect_user');
  }

  openLoginModal(): void {
    this.showModal = true;
  }

  closeLoginModal(): void {
    this.showModal = false;
  }
}