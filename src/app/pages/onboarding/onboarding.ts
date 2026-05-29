import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OnboardingService } from '../../services/onboarding.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class Onboarding implements OnInit {

  token = '';

  solicitud: any = null;

  loading = true;

  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private onboardingService: OnboardingService
  ) {}

  ngOnInit(): void {

    this.token =
      this.route.snapshot.paramMap.get('token') || '';

    console.log('TOKEN RECIBIDO:', this.token);

    if (!this.token) {

      this.errorMessage =
        'No se recibió ningún token';

      this.loading = false;

      return;
    }

    this.onboardingService
      .obtenerSolicitud(this.token)
      .subscribe({

        next: (response: any) => {

          console.log(
            'SOLICITUD RECIBIDA:',
            response
          );

          this.solicitud = response;

          this.loading = false;
        },

        error: (error) => {

          console.error(
            'ERROR ONBOARDING:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'No se pudo cargar la solicitud';

          this.loading = false;
        }
      });
  }
}