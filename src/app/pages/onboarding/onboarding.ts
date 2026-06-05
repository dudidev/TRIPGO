import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';

interface PhotoPreview {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class Onboarding implements OnInit {

  token = '';
  solicitud: any = null;
  loading = true;
  errorMessage = '';
  submitError = '';
  submitSuccess = false;
  submitting = false;

  form!: FormGroup;

  selectedServices: string[] = [];

  services = [
    'wifi',
    'parqueadero',
    'piscina',
    'restaurante',
    'bar',
    'mascotas',
    'camping',
    'senderismo',
    'cabalgatas',
    'tour_guiado'
  ];

  // Fotos seleccionadas localmente (para previsualización)
  photoPreviews: PhotoPreview[] = [];
  // URLs finales devueltas por Cloudinary tras subir
  uploadedPhotoUrls: string[] = [];

  readonly MIN_PHOTOS = 3;
  readonly MAX_PHOTOS = 8;

  constructor(
    private route: ActivatedRoute,
    private onboardingService: OnboardingService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.createForm();

    this.token = this.route.snapshot.paramMap.get('token') || '';

    if (!this.token) {
      this.errorMessage = 'No se recibió ningún token';
      this.loading = false;
      return;
    }

    this.onboardingService.obtenerSolicitud(this.token).subscribe({
      next: (response: any) => {
        this.solicitud = response;

        if (response.servicios) {
          this.selectedServices = [...response.servicios];
        }

        if (response.datos_completos) {
          this.form.patchValue({
            categoria:              response.datos_completos.categoria,
            departamento:          response.datos_completos.ubicacion?.departamento,
            municipio:             response.datos_completos.ubicacion?.municipio,
            direccion:             response.datos_completos.ubicacion?.direccion,
            googleMaps:            response.datos_completos.ubicacion?.googleMaps,
            representante:         response.datos_completos.contacto?.representante,
            telefono:              response.datos_completos.contacto?.telefono,
            whatsapp:              response.datos_completos.contacto?.whatsapp,
            descripcionCompleta:   response.datos_completos.experiencia?.descripcionCompleta,
            queHaceUnico:          response.datos_completos.experiencia?.queHaceUnico,
          });
        }

        this.loading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'No se pudo cargar la solicitud';
        this.loading = false;
      }
    });
  }

  private createForm(): void {
    this.form = this.fb.group({
      categoria:           ['', Validators.required],
      departamento:        ['', Validators.required],
      municipio:           ['', Validators.required],
      direccion:           ['', Validators.required],
      googleMaps:          [''],
      representante:       ['', Validators.required],
      telefono:            ['', Validators.required],
      whatsapp:            [''],
      descripcionCompleta: ['', [Validators.required, Validators.minLength(50)]],
      queHaceUnico:        ['', [Validators.required, Validators.minLength(20)]],
    });
  }

  // ── Servicios ──────────────────────────────────────────────────────────────

  toggleService(service: string): void {
    const index = this.selectedServices.indexOf(service);
    if (index === -1) {
      this.selectedServices.push(service);
    } else {
      this.selectedServices.splice(index, 1);
    }
  }

  isServiceSelected(service: string): boolean {
    return this.selectedServices.includes(service);
  }

  // ── Fotos ──────────────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const incoming = Array.from(input.files);
    const available = this.MAX_PHOTOS - this.photoPreviews.length;
    const toAdd = incoming.slice(0, available);

    for (const file of toAdd) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreviews.push({
          file,
          previewUrl: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }

    // Limpia el input para permitir volver a seleccionar el mismo archivo
    input.value = '';
  }

  removePhoto(index: number): void {
    this.photoPreviews.splice(index, 1);
  }

  get photoCount(): number {
    return this.photoPreviews.length;
  }

  get photosValid(): boolean {
    return this.photoPreviews.length >= this.MIN_PHOTOS &&
           this.photoPreviews.length <= this.MAX_PHOTOS;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async submit(): Promise<void> {
    this.submitError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.photosValid) {
      this.submitError = `Debes subir entre ${this.MIN_PHOTOS} y ${this.MAX_PHOTOS} fotos.`;
      return;
    }

    this.submitting = true;

    try {
      // Paso 1: subir fotos a Cloudinary vía backend
      const files = this.photoPreviews.map(p => p.file);

      const fotosResponse: any = await this.onboardingService
        .subirFotos(this.token, files)
        .toPromise();

      // El backend devuelve { fotos: [{ url, public_id }] }
      // El endpoint /completar espera solo URLs (validadas con isURL())
      const photoUrls: string[] = fotosResponse.fotos.map(
        (f: { url: string; public_id: string }) => f.url
      );

      // Paso 2: enviar formulario completo
      const payload = {
        datos_completos: {
          categoria: this.form.value.categoria,
          ubicacion: {
            departamento: this.form.value.departamento,
            municipio:    this.form.value.municipio,
            direccion:    this.form.value.direccion,
            googleMaps:   this.form.value.googleMaps,
          },
          contacto: {
            representante: this.form.value.representante,
            telefono:      this.form.value.telefono,
            whatsapp:      this.form.value.whatsapp,
          },
          experiencia: {
            descripcionCompleta: this.form.value.descripcionCompleta,
            queHaceUnico:        this.form.value.queHaceUnico,
          },
        },
        servicios: this.selectedServices,
        fotos:     photoUrls,
      };

      await this.onboardingService
        .completarSolicitud(this.token, payload)
        .toPromise();

      this.submitSuccess = true;

    } catch (error: any) {
      this.submitError =
        error?.error?.message ||
        'Ocurrió un error al enviar. Intenta de nuevo.';
    } finally {
      this.submitting = false;
    }
  }
}