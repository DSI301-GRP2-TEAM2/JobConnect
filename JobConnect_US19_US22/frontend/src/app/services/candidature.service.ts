import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // US-19
  getCandidaturesByOffre(offreId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/offres/${offreId}/candidatures`);
  }

  // US-20
  getDossierCandidat(candidatureId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidatures/${candidatureId}`);
  }

  // US-21
  updateStatut(candidatureId: string, statut: 'ACCEPTEE' | 'REFUSEE'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/candidatures/${candidatureId}/statut`, { statut });
  }

  // US-22
  getMesCandidatures(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/candidatures/mes-candidatures`);
  }
}
