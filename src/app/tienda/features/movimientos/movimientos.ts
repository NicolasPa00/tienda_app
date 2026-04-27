import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { TiendaApiService } from '../../../core/services/tienda-api.service';
import { Movimiento, Producto } from '../../../core/models';

interface DetalleForm {
  id_producto: number | null;
  cantidad: number;
  costo_unitario: number;
}

@Component({
  selector: 'tienda-movimientos',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DatePipe],
  templateUrl: './movimientos.html',
  styleUrl: './movimientos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovimientosComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(TiendaApiService);

  readonly movimientos = signal<Movimiento[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(false);
  readonly tipoFiltro = signal('');
  readonly total = signal(0);

  readonly modalAbierto = signal(false);
  readonly enviando = signal(false);
  readonly errorForm = signal<string | null>(null);

  readonly formTipo = signal<Movimiento['tipo']>('ENTRADA');
  readonly formReferencia = signal('');
  readonly formObservacion = signal('');
  readonly detalles = signal<DetalleForm[]>([this.detalleVacio()]);

  readonly negocio = computed(() => this.auth.negocio());

  readonly tiposMovimiento: Array<{ value: Movimiento['tipo']; label: string }> = [
    { value: 'ENTRADA', label: 'Entrada' },
    { value: 'SALIDA', label: 'Salida' },
    { value: 'AJUSTE', label: 'Ajuste' },
    { value: 'DEVOLUCION', label: 'Devolución' },
  ];

  ngOnInit(): void {
    this.cargar();
    this.cargarProductos();
  }

  private detalleVacio(): DetalleForm {
    return { id_producto: null, cantidad: 1, costo_unitario: 0 };
  }

  cargar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.cargando.set(true);
    this.api.listarMovimientos({
      idNegocio: id,
      tipo: this.tipoFiltro() || undefined,
      pageSize: 80,
    }).subscribe({
      next: (res) => {
        this.movimientos.set(res?.data?.rows ?? []);
        this.total.set(res?.data?.total ?? 0);
        this.cargando.set(false);
      },
      error: () => { this.cargando.set(false); this.movimientos.set([]); },
    });
  }

  cargarProductos(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.api.listarProductos({ idNegocio: id, soloActivos: true, pageSize: 200 }).subscribe({
      next: (res) => this.productos.set(res?.data?.rows ?? []),
    });
  }

  abrirNuevo(): void {
    this.formTipo.set('ENTRADA');
    this.formReferencia.set('');
    this.formObservacion.set('');
    this.detalles.set([this.detalleVacio()]);
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  cerrar(): void { if (!this.enviando()) this.modalAbierto.set(false); }

  agregarDetalle(): void {
    this.detalles.update(d => [...d, this.detalleVacio()]);
  }

  quitarDetalle(i: number): void {
    this.detalles.update(d => d.filter((_, idx) => idx !== i));
  }

  actualizarDetalle(i: number, campo: keyof DetalleForm, value: DetalleForm[typeof campo]): void {
    this.detalles.update(d => {
      const next = [...d];
      next[i] = { ...next[i], [campo]: value };
      return next;
    });
  }

  nombreProducto(id: number | null): string {
    if (!id) return '—';
    return this.productos().find(p => p.id_producto === id)?.nombre ?? '—';
  }

  guardar(): void {
    const negId = this.negocio()?.id_negocio;
    if (!negId) return;
    const detalles = this.detalles();
    if (detalles.some(d => !d.id_producto || d.cantidad <= 0)) {
      this.errorForm.set('Completa todos los detalles (producto y cantidad > 0).'); return;
    }

    const payload = {
      id_negocio: negId,
      tipo: this.formTipo(),
      referencia: this.formReferencia().trim() || null,
      observacion: this.formObservacion().trim() || null,
      detalles: detalles.map(d => ({
        id_producto: d.id_producto!,
        cantidad: Number(d.cantidad),
        costo_unitario: Number(d.costo_unitario),
      })) as unknown[],
    };

    this.enviando.set(true);
    this.errorForm.set(null);
    this.api.crearMovimiento(payload).subscribe({
      next: () => { this.enviando.set(false); this.modalAbierto.set(false); this.cargar(); },
      error: (e) => { this.enviando.set(false); this.errorForm.set(e?.error?.message || 'No se pudo crear el movimiento.'); },
    });
  }

  confirmar(m: Movimiento): void {
    const id = this.negocio()?.id_negocio;
    if (!id || !confirm('¿Confirmar este movimiento? Afectará el stock.')) return;
    this.api.confirmarMovimiento(m.id_movimiento, id).subscribe({ next: () => this.cargar() });
  }

  anular(m: Movimiento): void {
    const id = this.negocio()?.id_negocio;
    if (!id || !confirm('¿Anular este movimiento?')) return;
    this.api.anularMovimiento(m.id_movimiento, id).subscribe({ next: () => this.cargar() });
  }

  estadoClass(estado: string): string {
    if (estado === 'CONFIRMADO') return 'b-ok';
    if (estado === 'BORRADOR') return 'b-warn';
    return 'b-off';
  }
}
