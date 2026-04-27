import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/theme/theme.service';

interface NavItem {
  icon: string; label: string; route: string;
}

@Component({
  selector: 'tienda-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly items: NavItem[] = [
    { icon: 'layout-dashboard', label: 'Dashboard',     route: '/dashboard' },
    { icon: 'package',          label: 'Productos',     route: '/productos' },
    { icon: 'folder-open',      label: 'Categorías',    route: '/categorias' },
    { icon: 'arrow-left-right', label: 'Movimientos',   route: '/movimientos' },
    { icon: 'truck',            label: 'Proveedores',   route: '/proveedores' },
    { icon: 'shopping-cart',    label: 'Ventas',        route: '/ventas' },
    { icon: 'users',            label: 'Clientes',      route: '/clientes' },
    { icon: 'settings',         label: 'Configuración', route: '/configuracion' },
  ];

  readonly itemsPermitidos = computed(() =>
    this.items.filter(i => this.auth.canAccessRoute(i.route))
  );

  logout(): void { this.auth.logout(); }
  toggleTheme(): void { this.theme.toggle(); }
}
