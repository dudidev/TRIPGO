
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private api = `${environment.apiBaseUrl}/usuarios`;

  constructor(
    private http: HttpClient
  ) {}

  obtenerUsuario(id: number): Observable<any> {

    return this.http.get(
      `${this.api}/${id}`,
      {
        withCredentials: true
      }
    );
  }

  actualizarUsuario(id: number, data: any): Observable<any> {

    return this.http.put(
      `${this.api}/${id}`,
      data,
      {
        withCredentials: true
      }
    );
  }

  actualizarFotoPerfil(id: number, data: FormData) {

    return this.http.put(
      `${this.api}/${id}/foto`,
      data,
      {
        withCredentials: true
      }
    );
  }

  cambiarPassword(
    id: number,
    data: {
      password_actual: string;
      password_nueva: string;
    }
  ): Observable<any> {

    return this.http.put(
      `${this.api}/${id}/password`,
      data,
      {
        withCredentials: true
      }
    );
  }
}
