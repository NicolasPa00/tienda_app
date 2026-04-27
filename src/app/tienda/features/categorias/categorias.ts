import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { TiendaApiService } from '../../../core/services/tienda-api.service';
import { Categoria } from '../../../core/models';

@Component({
  selector: 'tienda-categorias',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriasComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(TiendaApiService);

  readonly categorias = signal<Categoria[]>([]);
  readonly cargando = signal(false);
  readonly modalAbierto = signal(false);
  readonly enviando = signal(false);
  readonly errorForm = signal<string | null>(null);
  readonly form = signal<Partial<Categoria>>(this.formVacio());
  readonly editandoId = signal<number | null>(null);

  readonly negocio = computed(() => this.auth.negocio());

  ngOnInit(): void { this.cargar(); }

  private formVacio(): Partial<Categoria> {
    return { nombre: '', descripcion: '', icono: '', orden: 0, estado: 'A' };
  }

  cargar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.cargando.set(true);
    this.api.listarCategorias(id).subscribe({
      next: (res) => { this.categorias.set(res?.data ?? []); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.categorias.set([]); },
    });
  }

  abrirNuevo(): void {
    this.form.set(this.formVacio());
    this.editandoId.set(null);
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  abrirEditar(c: Categoria): void {
    this.form.set({ ...c });
    this.editandoId.set(c.id_categoria);
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  cerrar(): void { if (!this.enviando()) this.modalAbierto.set(false); }

  actualizarCampo<K extends keyof Categoria>(key: K, value: Categoria[K] | null): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  guardar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    const f = this.form();
    if (!f.nombre?.trim()) { this.errorForm.set('El nombre es obligatorio.'); return; }

    const payload: Partial<Categoria> = {
      ...f,
      id_negocio: id,
      nombre: f.nombre.trim(),
      descripcion: f.descripcion?.trim() || null,
      icono: f.icono?.trim() || null,
      orden: Number(f.orden) || 0,
    };

    this.enviando.set(true);
    this.errorForm.set(null);
    const editando = this.editandoId();
    const obs$ = editando
      ? this.api.actualizarCategoria(editando, payload)
      : this.api.crearCategoria(payload);

    obs$.subscribe({
      next: () => { this.enviando.set(false); this.modalAbierto.set(false); this.cargar(); },
      error: (e) => { this.enviando.set(false); this.errorForm.set(e?.error?.message || 'No se pudo guardar.'); },
    });
  }

  inactivar(c: Categoria): void {
    const id = this.negocio()?.id_negocio;
    if (!id || !confirm(`¿Inactivar la categoría "${c.nombre}"?`)) return;
    this.api.inactivarCategoria(c.id_categoria, id).subscribe({ next: () => this.cargar() });
  }
}
