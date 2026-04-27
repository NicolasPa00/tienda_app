import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { TiendaApiService } from '../../../core/services/tienda-api.service';
import { DashboardResumen } from '../../../core/models';

const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

@Component({
  selector: 'tienda-dashboard',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(TiendaApiService);

  readonly resumen = signal<DashboardResumen | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly negocio = computed(() => this.auth.negocio());

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    const id = this.negocio()?.id_negocio;
    if (!id) return;
    this.cargando.set(true);
    this.error.set(null);
    this.api.getDashboard(id).subscribe({
      next: (res) => { this.resumen.set(res?.data ?? null); this.cargando.set(false); },
      error: (e) => { this.error.set(e?.error?.message || 'Error al cargar el dashboard.'); this.cargando.set(false); },
    });
  }

  formatCurrency(value: number): string {
    return fmt.format(value);
  }
}
