import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CandidatProfil, UpdateProfilDto, UpdateProfilResponse } from '../models/profil.model';

@Injectable({
  providedIn: 'root'
})
export class ProfilService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfil(): Observable<CandidatProfil> {
    const token = localStorage.getItem('jobconnect_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<CandidatProfil>(`${this.apiUrl}/api/candidats/me`, { headers });
  }

  updateProfil(data: UpdateProfilDto): Observable<UpdateProfilResponse> {
    const token = localStorage.getItem('jobconnect_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.put<UpdateProfilResponse>(`${this.apiUrl}/api/candidats/me`, data, { headers });
  }
}
