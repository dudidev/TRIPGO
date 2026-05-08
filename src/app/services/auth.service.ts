import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, finalize, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<any>(null);
  private authChecked = signal(false);

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession().subscribe();
  }

  login(correo_usuario: string, password_u: string): Observable<any> {
    return this.http.post(
      `${environment.apiBaseUrl}/auth/login`,
      { correo_usuario, password_u },
      { withCredentials: true }
    ).pipe(
      tap((res: any) => {
        this.currentUser.set(res.user);
        this.authChecked.set(true);
      })
    );
  }
  getAuthChecked() {
  return this.authChecked;  // retorna el signal directamente
}

  googleLogin(token: string): Observable<any> {
  return this.http.post(
    `${environment.apiBaseUrl}/auth/google`,
    { token },
    {withCredentials: true}
  ).pipe(
    tap((res: any) => {
      this.currentUser.set(res.usuario);
      this.authChecked.set(true);
    })
  );
}

  logout(): void {
    this.http.post(
      `${environment.apiBaseUrl}/auth/logout`,
      {}, 
      { withCredentials: true }
    ).subscribe({
      next: () => {
        this.currentUser.set(null);
        this.authChecked.set(true);
        localStorage.removeItem('tripgo_itinerario_v1');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.currentUser.set(null);
        this.authChecked.set(true);
        this.router.navigate(['/login']);
      }
    });
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  getCurrentUser(): any {
    return this.currentUser();
  }

  hasCheckedAuth(): boolean {
    return this.authChecked();
  }

  restoreSession(): Observable<any> {
    return this.http.get(
      `${environment.apiBaseUrl}/auth/me`,
      { withCredentials: true }
    ).pipe(
      tap((res: any) => {
        this.currentUser.set(res.user ?? null);
      }),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      }),
      finalize(() => {
        this.authChecked.set(true);
      })
    );
  }
}