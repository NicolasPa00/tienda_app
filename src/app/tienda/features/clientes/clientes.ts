import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { TiendaApiService } from '../../../core/services/tienda-api.service';
import { Cliente } from '../../../core/models';

@Component({
  selector: 'tienda-clientes',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(TiendaApiService);

  readonly clientes = signal<Cliente[]>([]);
  readonly cargando = signal(false);
  readonly busqueda = signal('');
  readonly modalAbierto = signal(false);
  readonly enviando = signal(false);
  readonly errorForm = signal<string | null>(null);
  readonly form = signal<Partial<Cliente>>(this.formVacio());
  readonly editandoId = signal<number | null>(null);

  readonly negocio = computed(() => this.auth.negocio());
  private debounce?: ReturnType<typeof setTimeout>;

  readonly tiposDoc = ['CC', 'CE', 'NIT', 'PASAPORTE', 'OTRO'];

  ngOnInit(): void { this.cargar(); }

  private formVacio(): Partial<Cliente> {
    return { nombre: '', tipo_doc: 'CC', num_doc: '', email: '', telefono: '', direccion: '', estado: 'A' };
  }

  cargar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.cargando.set(true);
    this.api.listarClientes(id, this.busqueda() || undefined).subscribe({
      next: (res) => { this.clientes.set(res?.data ?? []); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.clientes.set([]); },
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

  abrirEditar(c: Cliente): void {
    this.form.set({ ...c });
    this.editandoId.set(c.id_cliente);
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  cerrar(): void { if (!this.enviando()) this.modalAbierto.set(false); }

  actualizarCampo<K extends keyof Cliente>(key: K, value: Cliente[K] | null): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  guardar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    const f = this.form();
    if (!f.nombre?.trim()) { this.errorForm.set('El nombre es obligatorio.'); return; }

    const payload: Partial<Cliente> = {
      ...f,
      id_negocio: id,
      nombre: f.nombre.trim(),
      num_doc: f.num_doc?.trim() || null,
      email: f.email?.trim() || null,
      telefono: f.telefono?.trim() || null,
      direccion: f.direccion?.trim() || null,
    };

    this.enviando.set(true);
    this.errorForm.set(null);
    const editando = this.editandoId();
    const obs$ = editando
      ? this.api.actualizarCliente(editando, payload)
      : this.api.crearCliente(payload);

    obs$.subscribe({
      next: () => { this.enviando.set(false); this.modalAbierto.set(false); this.cargar(); },
      error: (e) => { this.enviando.set(false); this.errorForm.set(e?.error?.message || 'No se pudo guardar.'); },
    });
  }
}
