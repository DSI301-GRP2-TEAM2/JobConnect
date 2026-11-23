import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProfilCandidat, UpdateProfilResponse } from '../models/profil.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfilService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (this.authService.currentToken) {
      headers = headers.set('Authorization', `Bearer ${this.authService.currentToken}`);
    }
    return headers;
  }

  getProfil(): Observable<ProfilCandidat> {
    return this.http.get<ProfilCandidat>(`${this.apiUrl}/api/candidats/me`, {
      headers: this.getHeaders()
    });
  }

  updateProfil(data: Partial<ProfilCandidat>): Observable<UpdateProfilResponse> {
    return this.http.put<UpdateProfilResponse>(`${this.apiUrl}/api/candidats/me`, data, {
      headers: this.getHeaders()
    });
  }

  uploadCv(file: File): Observable<{ message: string; cv: string; user: ProfilCandidat }> {
    const formData = new FormData();
    formData.append('cv', file);
    return this.http.post<{ message: string; cv: string; user: ProfilCandidat }>(
      `${this.apiUrl}/api/candidats/me/cv`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  deleteCv(): Observable<{ message: string; user: ProfilCandidat }> {
    return this.http.delete<{ message: string; user: ProfilCandidat }>(
      `${this.apiUrl}/api/candidats/me/cv`,
      { headers: this.getHeaders() }
    );
  }
}
