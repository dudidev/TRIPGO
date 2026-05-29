import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(
    private http: HttpClient
  ) {}

  // ─── Obtener solicitudes ───────────────────────────

  getSolicitudes() {

    return this.http.get(
      `${environment.apiBaseUrl}/admin/solicitudes`,
      {
        withCredentials: true
      }
    );
  }

  // ─── Aprobar solicitud ─────────────────────────────

  aprobarSolicitud(id: number) {

    return this.http.post(
      `${environment.apiBaseUrl}/admin/solicitudes/${id}/aprobar`,
      {},
      {
        withCredentials: true
      }
    );
  }

  // ─── Rechazar solicitud ────────────────────────────

  rechazarSolicitud(
    id: number,
    motivo?: string
  ) {

    return this.http.patch(
      `${environment.apiBaseUrl}/onboarding/${id}/rechazar`,
      {
        motivo
      },
      {
        withCredentials: true
      }
    );
  }
}