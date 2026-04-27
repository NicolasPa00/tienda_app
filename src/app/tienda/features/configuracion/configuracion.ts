import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'tienda-configuracion',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly negocio = computed(() => this.auth.negocio());
  readonly usuario = computed(() => this.auth.usuario());
  readonly roles = computed(() => {
    const n = this.auth.negocio();
    const globales = this.auth.session()?.roles_globales ?? [];
    const locales = n?.roles ?? [];
    return [...globales, ...locales];
  });
}
