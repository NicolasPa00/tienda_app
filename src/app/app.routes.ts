import { Routes } from '@angular/router';
import { authGuard, permissionGuard, planGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/callback',
    title: 'Acceso',
    loadComponent: () =>
      import('./auth/auth-callback/auth-callback').then(m => m.AuthCallbackComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    canActivateChild: [permissionGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./tienda/features/dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'productos',
        title: 'Productos',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./tienda/features/productos/productos').then(m => m.ProductosComponent),
      },
      {
        path: 'categorias',
        title: 'Categorías',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./tienda/features/categorias/categorias').then(m => m.CategoriasComponent),
      },
      {
        path: 'movimientos',
        title: 'Movimientos',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./tienda/features/movimientos/movimientos').then(m => m.MovimientosComponent),
      },
      {
        path: 'proveedores',
        title: 'Proveedores',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./tienda/features/proveedores/proveedores').then(m => m.ProveedoresComponent),
      },
      {
        path: 'ventas',
        title: 'Ventas',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./tienda/features/ventas/ventas').then(m => m.VentasComponent),
      },
      {
        path: 'clientes',
        title: 'Clientes',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./tienda/features/clientes/clientes').then(m => m.ClientesComponent),
      },
      {
        path: 'configuracion',
        title: 'Configuración',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./tienda/features/configuracion/configuracion').then(
            m => m.ConfiguracionComponent,
          ),
      },
      {
        path: 'sin-acceso',
        title: 'Sin Acceso',
        loadComponent: () =>
          import('./tienda/features/sin-acceso/sin-acceso').then(m => m.SinAccesoComponent),
      },
      {
        path: 'sin-plan',
        title: 'Plan Requerido',
        loadComponent: () =>
          import('./tienda/features/sin-plan/sin-plan').then(m => m.SinPlanComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
