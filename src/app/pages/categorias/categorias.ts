import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Nav } from '../../shared/nav/nav';
import { Footer } from '../../shared/footer/footer';
import { SearchService, SearchResult } from '../../service/search.service';
import { CATEGORIAS_DATA, CategoriaData } from '../../data/categorias.data';
import { Api } from '../../api';
import { portadaTipo } from '../../shared/tipos-portada';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader/skeleton-loader';
import { SharedElementDirective } from '../../shared/shared-element.directive';
import { StaggerDirective } from '../../shared/stagger.directive';
import { HapticService } from '../../shared/haptic.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';

type TipoItem    = { id_tipo: number; nombre_tipo: string; };
type ChatMessage = { role: 'user' | 'ai'; text: string; };

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,
     Nav, Footer, SkeletonLoaderComponent,
      SharedElementDirective, StaggerDirective , EmptyStateComponent],
  templateUrl: './categorias.html',
  styleUrls: ['./categorias.css']
})
export class Categorias implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('chatBoxMobile') chatBox!: ElementRef;

  portadaTipo = portadaTipo;

  townSlug = '';
  query    = '';
  results  : SearchResult[] = [];
  showPanel = false;

  data?: CategoriaData;
  tipos        : TipoItem[] = [];
  loadingTipos = false;

  // ── Hero slider ───────────────────────────────
  private timerId  : any = null;
  private slideIndex = 0;
  showA  = true;
  leftA  = '';
  leftB  = '';

  // ── AI Chat ───────────────────────────────────
  aiQuery   = '';
  aiLoading = false;
  showProModal = false;
  chatOpen = false;
  isDesktop = window.innerWidth > 1020;
  isLoading = true;

  chatMessages: ChatMessage[] = [
    { role: 'ai', text: '¡Hola! Soy tu asistente de viaje. ¿Qué tipo de experiencia buscas hoy? 🌿' }
  ];
  private shouldScrollChat = false;

  constructor(
    private route  : ActivatedRoute,
    private router : Router,
    private search : SearchService,
    private api    : Api,
    public haptic  : HapticService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.townSlug = params.get('townSlug') || '';

      this.data = CATEGORIAS_DATA[this.townSlug] ?? {
        nombre      : this.townSlug || 'Destino',
        sliderImgs  : [],
        categorias  : [],
        itinerarios : []
      };

      this.ensureFallbacks();
      this.startAutoSlider();
      this.cargarTipos();
    });
  }

  ngOnDestroy(): void {
    this.stopAutoSlider();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollChat) {
      this.scrollChatToBottom();
      this.shouldScrollChat = false;
    }
  }

  // ── Tipos ─────────────────────────────────────
  private cargarTipos(): void {
    if (!this.townSlug) { this.tipos = []; return; }
    this.loadingTipos = true;
    this.api.getTiposByTown(this.townSlug).subscribe({
      next : (data: any[]) => {
        this.tipos = (data ?? []).map(x => ({
          id_tipo     : Number(x.id_tipo),
          nombre_tipo : String(x.nombre_tipo ?? '')
        }));
        this.loadingTipos = false;
      },
      error: () => { this.tipos = []; this.loadingTipos = false; }
    });
  }

  // ── Search ────────────────────────────────────
  onSearch(): void {
    const q = this.query.trim();
    if (!q) { this.results = []; this.showPanel = false; return; }
    this.results   = this.search.search(q, 12, { townSlug: this.townSlug });
    this.showPanel = true;
    document.body.style.overflow = 'hidden';
  }

  goResult(r: SearchResult): void {
    this.showPanel = false;
    document.body.style.overflow = '';
    this.query = '';
    if (r.kind === 'lugar') { this.router.navigate(['/detalles', r.route[1] ?? r.route]); return; }
    this.router.navigate(r.route);
  }

  closePanel(): void {
    this.showPanel = false;
    document.body.style.overflow = '';
  }

  // ── Navigation ────────────────────────────────
  goTipo(idTipo: number): void {
    this.router.navigate(['/lugares', this.townSlug, 'tipo', idTipo]);
  }

  goItinerary(index: number): void {
    const it = this.data?.itinerarios?.[index];
    if (it) this.askAI(`${it.titulo} en ${this.townSlug}`);
  }

  // ── AI Chat ───────────────────────────────────
  askAI(prompt: string): void {
    this.aiQuery = prompt;
    this.sendAIMessage();
  }

  onAiInputFocus(): void {
    const isProUser = false;
    if (!isProUser) {
      this.showProModal = true;
      document.body.style.width = '100%';
    }
  }

  closeProModal(): void {
    this.showProModal = false;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }

  toggleChatMobile(): void {
    this.chatOpen = !this.chatOpen;
    document.body.style.overflow = this.chatOpen ? 'hidden' : '';
  }

  closeChatMobile(): void {
    this.chatOpen = false;
    document.body.style.overflow = '';
  }

  isMobile(): boolean {
    return !this.isDesktop;
  }

  // logica de llamado de backend para chatbot
  async sendAIMessage(): Promise<void> {
    const text = this.aiQuery.trim();
    if (!text || this.aiLoading) return;

    this.chatMessages.push({ role: 'user', text });
    this.aiQuery = '';
    this.aiLoading = true;
    this.shouldScrollChat = true;

    try {
      const response = await fetch('https://api.tripgoapp.com/ia/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: text })
      });

      const lugares = await response.json();
      let aiText = '';

      if (!lugares || lugares.length === 0) {
        aiText = "No encontré lugares con esa búsqueda";
      } else {
        aiText = "Te recomiendo estos lugares:\n\n";
        lugares.forEach((l: any) => {
          aiText += `• ${l.nombre_establecimiento} (${l.nombre_tipo})\n`;
        });
      }

      this.chatMessages.push({ role: 'ai', text: aiText });

    } catch {
      this.chatMessages.push({ role: 'ai', text: 'Hubo un error conectando con la IA.' });
    }

    this.aiLoading = false;
    this.shouldScrollChat = true;
  }

  private scrollChatToBottom(): void {
    try {
      if (this.chatBox?.nativeElement)
        this.chatBox.nativeElement.scrollTop = this.chatBox.nativeElement.scrollHeight;
    } catch {}
  }

  // ── Hero slider (carrusel una imagen) ─────────
  private ensureFallbacks(): void {
    const imgs     = this.data?.sliderImgs ?? [];
    const fallback = 'https://via.placeholder.com/900x500?text=TRIPGO';

    if (!imgs.length) {
      this.leftA = fallback;
      this.leftB = fallback;
      return;
    }

    this.slideIndex = 0;
    this.showA  = true;
    this.leftA  = imgs[0] ?? fallback;
    this.leftB  = imgs[1] ?? imgs[0] ?? fallback;
  }

  private startAutoSlider(): void {
    this.stopAutoSlider();
    const imgs = this.data?.sliderImgs ?? [];
    if (imgs.length <= 1) return;

    this.timerId = setInterval(() => {
      this.slideIndex = (this.slideIndex + 1) % imgs.length;
      const next = imgs[this.slideIndex] ?? imgs[0];

      if (this.showA) { this.leftB = next; }
      else            { this.leftA = next; }

      this.showA = !this.showA;
    }, 3000);
  }

  private stopAutoSlider(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
  }
}