import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  private http = inject(HttpClient);



  private readonly API_URL =
  
    `${environment.apiBaseUrl}/onboarding/solicitud-inicial`;

  crearSolicitud(payload: any): Observable<any> {
    

    return this.http.post(
      this.API_URL,
      payload
    );
  }
}