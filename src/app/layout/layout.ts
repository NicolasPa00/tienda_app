import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar';

@Component({
  selector: 'tienda-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="layout">
      <tienda-sidebar />
      <main class="layout__content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; background: var(--color-bg); }
    .layout__content { flex: 1; min-width: 0; overflow-y: auto; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {}
