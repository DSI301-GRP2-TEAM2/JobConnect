import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Offre, OffreCreee, OffreDraft } from '../models/offre.model';
import { AuthService } from './auth.service';

export interface CategorieOption { id: string; libelle: string; description?: string; }

@Injectable({
  providedIn: 'root'
})
export class OffreService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.currentToken || ''}` });
  }

  getCategoriesEntreprise(): Observable<{ categories: CategorieOption[] }> {
    return this.http.get<{ categories: CategorieOption[] }>(`${this.apiUrl}/api/offres/categories`, { headers: this.authHeaders() });
  }

  createOffre(draft: OffreDraft): Observable<{ message: string; offre: OffreCreee }> {
    return this.http.post<{ message: string; offre: OffreCreee }>(`${this.apiUrl}/api/offres`, draft, { headers: this.authHeaders() });
  }

  getMesOffres(): Observable<{ offres: Offre[] }> {
    return this.http.get<{ offres: Offre[] }>(`${this.apiUrl}/api/offres/mes-offres`, { headers: this.authHeaders() });
  }

  getMonOffre(id: string): Observable<{ offre: Offre }> {
    return this.http.get<{ offre: Offre }>(`${this.apiUrl}/api/entreprise/offres/${encodeURIComponent(id)}`, { headers: this.authHeaders() });
  }

  updateOffre(id: string, draft: OffreDraft): Observable<{ offre: Offre }> {
    return this.http.patch<{ offre: Offre }>(`${this.apiUrl}/api/entreprise/offres/${encodeURIComponent(id)}`, draft, { headers: this.authHeaders() });
  }

  submitOffre(id: string): Observable<{ message: string; offre: OffreCreee }> {
    return this.http.patch<{ message: string; offre: OffreCreee }>(`${this.apiUrl}/api/offres/${encodeURIComponent(id)}/submit`, {}, { headers: this.authHeaders() });
  }

  getOffresPubliees(): Observable<Offre[]> {
    return this.http.get<Offre[]>(`${this.apiUrl}/api/offres`, { headers: this.authHeaders() });
  }
}
