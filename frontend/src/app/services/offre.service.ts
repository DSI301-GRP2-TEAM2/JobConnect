import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Offre } from '../models/offre.model';

@Injectable({
  providedIn: 'root'
})
export class OffreService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOffresPubliees(): Observable<Offre[]> {
    const token = localStorage.getItem('jobconnect_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<Offre[]>(`${this.apiUrl}/api/offres`, { headers });
  }

  getOffreById(id: string): Observable<Offre> {
    const token = localStorage.getItem('jobconnect_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<Offre>(`${this.apiUrl}/api/offres/${id}`, { headers });
  }
}
