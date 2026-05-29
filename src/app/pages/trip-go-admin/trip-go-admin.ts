import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trip-go-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trip-go-admin.html',
  styleUrl: './trip-go-admin.css',
})
export class TripGoAdmin implements OnInit {
  solicitudes: any[] = [];

  solicitudesFiltradas: any[] = [];

  filtroActivo = 'todos';

  isLoading = false;

  errorMessage = '';
  textoBusqueda = '';
  menuActivo = 'solicitudes';

  solicitudSeleccionada: any = null;

  mostrarModal = false;
  constructor(
    private adminService: AdminService,
    public authService: AuthService,
  ) {}

  get totalSolicitudes(): number {
    return this.solicitudes.length;
  }

  get totalPendientes(): number {
    return this.solicitudes.filter((s) => s.estado === 'pendiente').length;
  }

  get totalRevision(): number {
    return this.solicitudes.filter((s) => s.estado === 'en_revision').length;
  }

  get totalAprobadas(): number {
    return this.solicitudes.filter((s) => s.estado === 'aprobado').length;
  }
  // ─── INIT ───────────────────────────────────────────

  ngOnInit(): void {

  this.authService.restoreSession().subscribe({

    next: () => {

      const user =
        this.authService.getCurrentUser();

      console.log('USER ADMIN:', user);

      if (!user) {

        this.errorMessage =
          'No hay sesión activa';

        return;
      }

      if (user.rol !== 'admin') {

        this.errorMessage =
          'No tienes permisos de administrador';

        return;
      }

      this.obtenerSolicitudes();
    },

    error: () => {

      this.errorMessage =
        'No se pudo validar la sesión';
    }
  });
}
  // ─── Obtener solicitudes ────────────────────────────

  puedeAprobar(solicitud: any): boolean {
    return solicitud.estado === 'en_revision';
  }

  puedeRechazar(solicitud: any): boolean {
    return solicitud.estado === 'en_revision';
  }

  esPendiente(solicitud: any): boolean {
    return solicitud.estado === 'pendiente';
  }
  obtenerSolicitudes(): void {
    this.isLoading = true;

    this.adminService.getSolicitudes().subscribe({
      next: (response: any) => {
        console.log('SOLICITUDES:', response);

        this.solicitudes = response.solicitudes.map((s: any) => ({
          id: s.id_solicitud,

          nombre: s.nombre_establecimiento,

          categoria: 'Establecimiento TripGO',

          ubicacion: s.datos_completos?.ubicacion || 'Ubicación no definida',

          descripcion: s.descripcion,

          estado: s.estado,

          prioridad: s.estado === 'pendiente' ? 'Pendiente revisión' : 'En revisión',

          imagen:
            s.fotos?.[0] ||
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',

          rating: 'Nuevo',

          fotos: s.fotos?.length || 0,

          tiempo: 'Reciente',

          correoContacto: s.correo_contacto,

          nombreContacto: s.nombre_contacto,

          datosCompletos: s.datos_completos,

          servicios: s.servicios || [],

          fotosArray: s.fotos || [],
        }));

        this.aplicarFiltro();

        this.isLoading = false;
      },

      error: (error) => {
        console.error(error);

        this.errorMessage = 'No se pudieron cargar las solicitudes';

        this.isLoading = false;
      },
    });
  }

  // ─── Cambiar filtro ─────────────────────────────────

  cambiarFiltro(filtro: string): void {
    this.filtroActivo = filtro;

    this.aplicarFiltro();
  }

  // ─── Aplicar filtro ─────────────────────────────────

  aplicarFiltro(): void {
    let resultado = [...this.solicitudes];

    if (this.filtroActivo !== 'todos') {
      resultado = resultado.filter((s) => s.estado === this.filtroActivo);
    }

    if (this.textoBusqueda.trim()) {
      resultado = resultado.filter((s) =>
        s.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()),
      );
    }

    this.solicitudesFiltradas = resultado;
  }

  abrirDetalle(solicitud: any): void {
    this.solicitudSeleccionada = solicitud;

    this.mostrarModal = true;
  }

  cerrarDetalle(): void {
    this.solicitudSeleccionada = null;

    this.mostrarModal = false;
  }

  cambiarMenu(menu: string): void {
    this.menuActivo = menu;
  }

  // ─── Aprobar solicitud ──────────────────────────────
  aprobarSolicitud(id: number): void {
    const solicitud = this.solicitudes.find((s) => s.id === id);

    if (!solicitud) return;

    if (solicitud.estado !== 'en_revision') {
      alert('Esta solicitud aún no ha completado el onboarding.');

      return;
    }

    const confirmar = confirm('¿Deseas aprobar esta solicitud?');

    if (!confirmar) return;

    this.adminService.aprobarSolicitud(id).subscribe({
      next: () => {
        alert('Solicitud aprobada correctamente');

        this.obtenerSolicitudes();
      },

      error: (error) => {
        console.error(error);

        alert(error?.error?.message || 'Error al aprobar solicitud');
      },
    });
  }

  // ─── Rechazar solicitud ─────────────────────────────

  rechazarSolicitud(id: number): void {
    const solicitud = this.solicitudes.find((s) => s.id === id);

    if (!solicitud) return;

    if (solicitud.estado !== 'en_revision') {
      alert('La solicitud aún no está lista para revisión.');

      return;
    }

    const confirmar = confirm('¿Deseas rechazar esta solicitud?');

    if (!confirmar) return;

    this.adminService.rechazarSolicitud(id).subscribe({
      next: () => {
        alert('Solicitud rechazada correctamente');

        this.obtenerSolicitudes();
      },

      error: (error) => {
        console.error(error);

        alert(error?.error?.message || 'Error al rechazar solicitud');
      },
    });
  }
}
