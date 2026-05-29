import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  constructor(
    private http: HttpClient
  ) {}

  obtenerSolicitud(token: string) {

    return this.http.get(
      `${environment.apiBaseUrl}/onboarding/${token}`
    );
  }

  completarSolicitud(
    token: string,
    payload: any
  ) {

    return this.http.post(
      `${environment.apiBaseUrl}/onboarding/${token}/completar`,
      payload
    );
  }
}