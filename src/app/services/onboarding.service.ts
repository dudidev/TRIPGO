import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  constructor(private http: HttpClient) {}

  obtenerSolicitud(token: string): Observable<any> {
    return this.http.get(
      `${environment.apiBaseUrl}/onboarding/${token}`
    );
  }

  subirFotos(token: string, files: File[]): Observable<any> {
    const formData = new FormData();

    for (const file of files) {
      formData.append('imagenes', file);
    }

    return this.http.post(
      `${environment.apiBaseUrl}/onboarding/${token}/fotos`,
      formData
    );
  }

  completarSolicitud(token: string, payload: any): Observable<any> {
    return this.http.post(
      `${environment.apiBaseUrl}/onboarding/${token}/completar`,
      payload
    );
  }
}