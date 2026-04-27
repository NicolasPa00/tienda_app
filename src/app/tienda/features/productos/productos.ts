import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { TiendaApiService } from '../../../core/services/tienda-api.service';
import { Producto, Categoria, Proveedor } from '../../../core/models';

const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

@Component({
  selector: 'tienda-productos',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './productos.html',
  styleUrl: './productos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(TiendaApiService);

  readonly productos = signal<Producto[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  readonly proveedores = signal<Proveedor[]>([]);
  readonly cargando = signal(false);
  readonly busqueda = signal('');
  readonly total = signal(0);

  readonly modalAbierto = signal(false);
  readonly enviando = signal(false);
  readonly errorForm = signal<string | null>(null);
  readonly form = signal<Partial<Producto>>(this.formVacio());
  readonly editandoId = signal<number | null>(null);

  readonly negocio = computed(() => this.auth.negocio());
  private debounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.cargar();
    this.cargarCategorias();
    this.cargarProveedores();
  }

  private formVacio(): Partial<Producto> {
    return {
      nombre: '', sku: '', descripcion: '', ubicacion: '',
      precio_venta: 0, precio_costo: 0,
      stock_actual: 0, stock_minimo: 0,
      unidad_medida: 'UND',
      id_categoria: null, id_proveedor: null,
      es_servicio: false, estado: 'A',
    };
  }

  cargar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.cargando.set(true);
    this.api.listarProductos({ idNegocio: id, q: this.busqueda() || undefined, pageSize: 100 }).subscribe({
      next: (res) => {
        this.productos.set(res?.data?.rows ?? []);
        this.total.set(res?.data?.total ?? 0);
        this.cargando.set(false);
      },
      error: () => { this.cargando.set(false); this.productos.set([]); },
    });
  }

  cargarCategorias(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.api.listarCategorias(id, { soloActivas: true }).subscribe({
      next: (res) => this.categorias.set(res?.data ?? []),
    });
  }

  cargarProveedores(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.api.listarProveedores(id).subscribe({
      next: (res) => this.proveedores.set(res?.data ?? []),
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

  abrirEditar(p: Producto): void {
    this.form.set({ ...p });
    this.editandoId.set(p.id_producto);
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  cerrar(): void { if (!this.enviando()) this.modalAbierto.set(false); }

  actualizarCampo<K extends keyof Producto>(key: K, value: Producto[K] | null): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  guardar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    const f = this.form();
    if (!f.nombre?.trim()) { this.errorForm.set('El nombre es obligatorio.'); return; }
    if (Number(f.precio_venta) < 0) { this.errorForm.set('Precio de venta inválido.'); return; }

    const payload: Partial<Producto> = {
      ...f,
      id_negocio: id,
      nombre: f.nombre.trim(),
      sku: f.sku?.trim() || null,
      descripcion: f.descripcion?.trim() || null,
      ubicacion: f.ubicacion?.trim() || null,
      precio_venta: Number(f.precio_venta) || 0,
      precio_costo: f.precio_costo != null ? Number(f.precio_costo) : null,
      stock_actual: Number(f.stock_actual) || 0,
      stock_minimo: Number(f.stock_minimo) || 0,
      id_categoria: f.id_categoria ? Number(f.id_categoria) : null,
      id_proveedor: f.id_proveedor ? Number(f.id_proveedor) : null,
    };

    this.enviando.set(true);
    this.errorForm.set(null);
    const editando = this.editandoId();
    const obs$ = editando
      ? this.api.actualizarProducto(editando, payload)
      : this.api.crearProducto(payload);

    obs$.subscribe({
      next: () => { this.enviando.set(false); this.modalAbierto.set(false); this.cargar(); },
      error: (e) => { this.enviando.set(false); this.errorForm.set(e?.error?.message || 'No se pudo guardar.'); },
    });
  }

  cambiarEstado(p: Producto): void {
    const id = this.negocio()?.id_negocio;
    if (!id || !confirm(`¿Inactivar "${p.nombre}"?`)) return;
    this.api.inactivarProducto(p.id_producto, id).subscribe({ next: () => this.cargar() });
  }

  ajustarStock(p: Producto, delta: number): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.api.ajustarStock(p.id_producto, id, delta).subscribe({
      next: () => this.cargar(),
      error: (e) => alert(e?.error?.message || 'No se pudo ajustar el stock.'),
    });
  }

  formatPrice(v: number): string { return fmt.format(v); }

  nombreCategoria(idCat: number | null | undefined): string {
    if (!idCat) return '—';
    return this.categorias().find(c => c.id_categoria === idCat)?.nombre ?? '—';
  }
}
