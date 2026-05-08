import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Nav } from '../../shared/nav/nav';
import { Footer } from '../../shared/footer/footer';
import { ContactService } from '../../services/contact.service';
import { TranslateModule } from '@ngx-translate/core';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [Nav, Footer, ReactiveFormsModule, TranslateModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class Contact {

  private fb = inject(FormBuilder);
  private contactSvc = inject(ContactService);

  status = signal<FormStatus>('idle');

  // ── Selector de tipo de negocio ──────────────────────────────────────────
  selectedType = '';
  otrosOpen = false;
  typeInvalid = false;

  readonly mainCategories = ['Restaurante', 'Hotel', 'Café', 'Tour operador', 'Camping'];

  readonly allCategories = [
  { val: 'Hotel',               label: 'Hotel',               icon: 'fa-solid fa-hotel' },
  { val: 'Hostal',              label: 'Hostal',               icon: 'fa-solid fa-bed' },
  { val: 'Glamping',            label: 'Glamping',             icon: 'fa-solid fa-campground' },
  { val: 'Cabaña',              label: 'Cabaña',               icon: 'fa-solid fa-home' },
  { val: 'Apartahotel',         label: 'Apartahotel',          icon: 'fa-solid fa-building' },
  { val: 'Ecohotel',            label: 'Ecohotel',             icon: 'fa-solid fa-leaf' },
  { val: 'Restaurante',         label: 'Restaurante',          icon: 'fa-solid fa-utensils' },
  { val: 'Bar',                 label: 'Bar',                  icon: 'fa-solid fa-glass-martini' },
  { val: 'Café',                label: 'Café',                 icon: 'fa-solid fa-coffee' },
  { val: 'Discoteca',           label: 'Discoteca',            icon: 'fa-solid fa-music' },
  { val: 'Parque temático',     label: 'Parque temático',      icon: 'fa-solid fa-star' },
  { val: 'Centro recreacional', label: 'C. recreacional',      icon: 'fa-solid fa-swimmer' },
  { val: 'Museo',               label: 'Museo',                icon: 'fa-solid fa-landmark' },
  { val: 'Actividad',           label: 'Actividad',            icon: 'fa-solid fa-running' },
  { val: 'Tour operador',       label: 'Tour operador',        icon: 'fa-solid fa-compass' },
  { val: 'Finca turística',     label: 'Finca turística',      icon: 'fa-solid fa-tree' },
  { val: 'Camping',             label: 'Camping',              icon: 'fa-solid fa-campground' },
  { val: 'Senderismo',          label: 'Senderismo',           icon: 'fa-solid fa-hiking' },
  { val: 'Cabalgatas',          label: 'Cabalgatas',           icon: 'fa-solid fa-horse' },
];

  pickMain(val: string): void {
    this.selectedType = val;
    this.otrosOpen = false;
    this.typeInvalid = false;
  }

  toggleOtros(): void {
    this.otrosOpen = !this.otrosOpen;
  }

  pickOtro(val: string): void {
    this.selectedType = val;
    this.otrosOpen = false;
    this.typeInvalid = false;
  }

  isOtroSelected(): boolean {
    return !!this.selectedType && !this.mainCategories.includes(this.selectedType);
  }

  // ── Formulario reactivo ──────────────────────────────────────────────────
  contactForm = this.fb.group({
    name:    ['', [Validators.required, Validators.minLength(2)]],
    email:   ['', [Validators.required, Validators.email]],
    phone:   ['', [Validators.required, Validators.minLength(7)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  get name()    { return this.contactForm.get('name')!; }
  get email()   { return this.contactForm.get('email')!; }
  get phone()   { return this.contactForm.get('phone')!; }
  get message() { return this.contactForm.get('message')!; }

  onSubmit(): void {
    // Validar tipo de negocio manualmente (fuera del FormGroup)
    if (!this.selectedType) {
      this.typeInvalid = true;
      return;
    }

    if (this.contactForm.invalid || this.status() === 'loading') return;

    this.status.set('loading');

    const payload = {
      name:    this.name.value!.trim(),
      email:   this.email.value!.trim(),
      phone:   this.phone.value!.trim(),
      type:    this.selectedType,
      message: this.message.value!.trim(),
    };

    // TODO: cambiar endpoint a /onboarding cuando el backend lo cree
    this.contactSvc.sendContactEmail(payload).subscribe({
      next: () => {
        this.status.set('success');
        this.contactForm.reset();
        this.selectedType = '';
        this.otrosOpen = false;
      },
      error: () => {
        this.status.set('error');
      }
    });
  }

  resetStatus(): void {
    this.status.set('idle');
    this.typeInvalid = false;
  }
}