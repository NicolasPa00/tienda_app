import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'tienda-sin-acceso',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <h1>Sin acceso</h1>
      <p>Tu rol actual no tiene permisos para abrir esta sección de la tienda.</p>
      <div class="actions">
        <a routerLink="/dashboard" class="btn btn-primary">Ir al Dashboard</a>
        <button class="btn btn-outline" type="button" (click)="auth.logout()">Volver al admin</button>
      </div>
    </section>
  `,
  styles: [`
    .page { max-width: 480px; margin: 4rem auto; padding: 2rem; text-align: center;
      background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
    h1 { margin: 0 0 .5rem; }
    p { color: var(--color-text-muted); margin: 0 0 1.5rem; }
    .actions { display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SinAccesoComponent {
  readonly auth = inject(AuthService);
}
