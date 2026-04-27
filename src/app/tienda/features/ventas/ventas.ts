import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { TiendaApiService } from '../../../core/services/tienda-api.service';
import { Venta, Producto, Cliente } from '../../../core/models';

interface LineaVenta {
  id_producto: number | null;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
}

const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

@Component({
  selector: 'tienda-ventas',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DatePipe],
  templateUrl: './ventas.html',
  styleUrl: './ventas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VentasComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(TiendaApiService);

  readonly negocio = computed(() => this.auth.negocio());

  // Lista
  readonly ventas = signal<Venta[]>([]);
  readonly cargando = signal(false);
  readonly total = signal(0);

  // Modal nueva venta
  readonly modalAbierto = signal(false);
  readonly enviando = signal(false);
  readonly errorForm = signal<string | null>(null);
  readonly productos = signal<Producto[]>([]);
  readonly clientes = signal<Cliente[]>([]);

  readonly formClienteId = signal<number | null>(null);
  readonly formMetodoPago = signal<Venta['metodo_pago']>('EFECTIVO');
  readonly formNotas = signal('');
  readonly lineas = signal<LineaVenta[]>([this.lineaVacia()]);

  readonly totalVenta = computed(() =>
    this.lineas().reduce((sum, l) => {
      const sub = l.cantidad * l.precio_unitario;
      return sum + sub - (sub * l.descuento / 100);
    }, 0)
  );

  readonly metodosPago: Array<{ value: Venta['metodo_pago']; label: string }> = [
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TARJETA', label: 'Tarjeta' },
    { value: 'TRANSFERENCIA', label: 'Transferencia' },
    { value: 'OTRO', label: 'Otro' },
  ];

  ngOnInit(): void {
    this.cargar();
  }

  private lineaVacia(): LineaVenta {
    return { id_producto: null, cantidad: 1, precio_unitario: 0, descuento: 0 };
  }

  cargar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.cargando.set(true);
    this.api.listarVentas({ idNegocio: id, pageSize: 80 }).subscribe({
      next: (res) => {
        this.ventas.set(res?.data?.rows ?? []);
        this.total.set(res?.data?.total ?? 0);
        this.cargando.set(false);
      },
      error: () => { this.cargando.set(false); this.ventas.set([]); },
    });
  }

  abrirNuevo(): void {
    this.formClienteId.set(null);
    this.formMetodoPago.set('EFECTIVO');
    this.formNotas.set('');
    this.lineas.set([this.lineaVacia()]);
    this.errorForm.set(null);
    this.modalAbierto.set(true);
    this.cargarProductos();
    this.cargarClientes();
  }

  cargarProductos(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.api.listarProductos({ idNegocio: id, soloActivos: true, pageSize: 200 }).subscribe({
      next: (res) => this.productos.set(res?.data?.rows ?? []),
    });
  }

  cargarClientes(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.api.listarClientes(id).subscribe({
      next: (res) => this.clientes.set(res?.data ?? []),
    });
  }

  cerrar(): void { if (!this.enviando()) this.modalAbierto.set(false); }

  agregarLinea(): void {
    this.lineas.update(l => [...l, this.lineaVacia()]);
  }

  quitarLinea(i: number): void {
    this.lineas.update(l => l.filter((_, idx) => idx !== i));
  }

  actualizarLinea(i: number, campo: keyof LineaVenta, value: LineaVenta[typeof campo]): void {
    this.lineas.update(l => {
      const next = [...l];
      next[i] = { ...next[i], [campo]: value };
      // Auto-fill precio when product selected
      if (campo === 'id_producto' && value) {
        const prod = this.productos().find(p => p.id_producto === Number(value));
        if (prod) next[i].precio_unitario = prod.precio_venta;
      }
      return next;
    });
  }

  guardar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    const lineas = this.lineas();
    if (lineas.some(l => !l.id_producto || l.cantidad <= 0)) {
      this.errorForm.set('Completa todas las líneas (producto y cantidad > 0).'); return;
    }

    const payload = {
      id_negocio: id,
      id_cliente: this.formClienteId() || null,
      metodo_pago: this.formMetodoPago(),
      notas: this.formNotas().trim() || null,
      detalles: lineas.map(l => ({
        id_producto: l.id_producto!,
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
        descuento: Number(l.descuento) || 0,
      })),
    };

    this.enviando.set(true);
    this.errorForm.set(null);
    this.api.crearVenta(payload).subscribe({
      next: () => { this.enviando.set(false); this.modalAbierto.set(false); this.cargar(); },
      error: (e) => { this.enviando.set(false); this.errorForm.set(e?.error?.message || 'No se pudo registrar la venta.'); },
    });
  }

  anular(v: Venta): void {
    const id = this.negocio()?.id_negocio;
    if (!id || !confirm('¿Anular esta venta?')) return;
    this.api.anularVenta(v.id_venta, id).subscribe({ next: () => this.cargar() });
  }

  formatPrice(v: number): string { return fmt.format(v); }
  nombreProducto(id: number | null): string {
    if (!id) return '—';
    return this.productos().find(p => p.id_producto === id)?.nombre ?? '—';
  }
}
