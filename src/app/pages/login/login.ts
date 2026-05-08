import { Component } from '@angular/core';
import { Nav } from '../../shared/nav/nav';
import { Footer } from '../../shared/footer/footer';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ItinerarioService } from '../../service/itinerario.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

declare const google: any;
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [Nav, Footer, FormsModule, RouterLink, TranslateModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  isLoading = false;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private itinerarioService: ItinerarioService,
  ) { }

  showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submited = false;
  onSubmit(form: NgForm) {
    this.submited = true;

    if (form.invalid) {
      this.errorMessage = 'Completa todos los campos.';
      return;
    }

    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.authService.restoreSession().subscribe(() => {
          this.isLoading = false;

          this.itinerarioService.reload();
          this.showSuccess('Inicio de sesión exitoso');

          const user = this.authService.getCurrentUser();

          setTimeout(() => {
            if (user?.rol === 'empresa') {
              this.router.navigate(['/empresa']);
            } else {
              const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/principal';
              this.router.navigateByUrl(returnUrl);
            }
          }, 800);
        });
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Usuario o contraseña inválidos';
      }
    });
  }

  ngOnInit(): void {
    if (typeof google === 'undefined') return;

    if (!(window as any)._googleInitialized) {
      google.accounts.id.initialize({
        client_id: '585014594863-f3lr3fu2h5j5u53ehr50rn13tjv8hmg7.apps.googleusercontent.com',
        callback: this.handleGoogleLogin.bind(this)
      });

      (window as any)._googleInitialized = true;
    }

    setTimeout(() => {
      const btn = document.getElementById('googleBtn');

      if (btn) {
        btn.innerHTML = ''; // limpia si había algo roto

        google.accounts.id.renderButton(btn, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: btn.offsetWidth || 320
      });
      }
    });
  }

  handleGoogleLogin(response: any) {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.googleLogin(response.credential).subscribe({
      next: () => {
        this.authService.restoreSession().subscribe(() => {
          this.itinerarioService.reload();
          this.showSuccess('Inicio de sesión con Google exitoso');

          setTimeout(() => {
            const user = this.authService.getCurrentUser();
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/principal';

            if (user?.rol === 'empresa') {
              this.router.navigate(['/empresa']);
            } else {
              this.router.navigateByUrl(returnUrl);
            }
          }, 800);
        });
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Error al iniciar con Google';
      }
    });
  }
}