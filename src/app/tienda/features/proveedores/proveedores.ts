import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { TiendaApiService } from '../../../core/services/tienda-api.service';
import { Proveedor } from '../../../core/models';

@Component({
  selector: 'tienda-proveedores',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedoresComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(TiendaApiService);

  readonly proveedores = signal<Proveedor[]>([]);
  readonly cargando = signal(false);
  readonly busqueda = signal('');
  readonly modalAbierto = signal(false);
  readonly enviando = signal(false);
  readonly errorForm = signal<string | null>(null);
  readonly form = signal<Partial<Proveedor>>(this.formVacio());
  readonly editandoId = signal<number | null>(null);

  readonly negocio = computed(() => this.auth.negocio());
  private debounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void { this.cargar(); }

  private formVacio(): Partial<Proveedor> {
    return { nombre: '', nit_rut: '', email: '', telefono: '', direccion: '', contacto: '', notas: '' };
  }

  cargar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.cargando.set(true);
    this.api.listarProveedores(id, { q: this.busqueda() || undefined }).subscribe({
      next: (res) => { this.proveedores.set(res?.data ?? []); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.proveedores.set([]); },
    });
  }

  onBusquedaChange(v: string): void {
    this.busqueda.set(v);
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.cargar(), 300);
  }

  abrirNuevo(): void {
    this.form.set(this.formVacio());
    this.editandoId.set(null);
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  abrirEditar(p: Proveedor): void {
    this.form.set({ ...p });
    this.editandoId.set(p.id_proveedor);
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  cerrar(): void { if (!this.enviando()) this.modalAbierto.set(false); }

  actualizarCampo<K extends keyof Proveedor>(key: K, value: Proveedor[K] | null): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  guardar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    const f = this.form();
    if (!f.nombre?.trim()) { this.errorForm.set('El nombre es obligatorio.'); return; }

    const payload: Partial<Proveedor> = {
      ...f,
      id_negocio: id,
      nombre: f.nombre.trim(),
      nit_rut: f.nit_rut?.trim() || null,
      email: f.email?.trim() || null,
      telefono: f.telefono?.trim() || null,
      direccion: f.direccion?.trim() || null,
      contacto: f.contacto?.trim() || null,
      notas: f.notas?.trim() || null,
    };

    this.enviando.set(true);
    this.errorForm.set(null);
    const editando = this.editandoId();
    const obs$ = editando
      ? this.api.actualizarProveedor(editando, payload)
      : this.api.crearProveedor(payload);

    obs$.subscribe({
      next: () => { this.enviando.set(false); this.modalAbierto.set(false); this.cargar(); },
      error: (e) => { this.enviando.set(false); this.errorForm.set(e?.error?.message || 'No se pudo guardar.'); },
    });
  }

  inactivar(p: Proveedor): void {
    const id = this.negocio()?.id_negocio;
    if (!id || !confirm(`¿Inactivar al proveedor "${p.nombre}"?`)) return;
    this.api.inactivarProveedor(p.id_proveedor, id).subscribe({ next: () => this.cargar() });
  }
}
