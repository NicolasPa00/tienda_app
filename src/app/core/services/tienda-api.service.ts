import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiResponse, Paginated, Categoria, Proveedor, Producto, Movimiento,
  Cliente, Venta, DashboardResumen,
} from '../models';

/**
 * Wrapper único para todos los endpoints de /tienda.
 * Cada método devuelve Observable<ApiResponse<T>>.
 */
@Injectable({ providedIn: 'root' })
export class TiendaApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ── Dashboard ──
  getDashboard(idNegocio: number): Observable<ApiResponse<DashboardResumen>> {
    return this.http.get<ApiResponse<DashboardResumen>>(
      `${this.base}/dashboard/resumen?id_negocio=${idNegocio}`,
    );
  }

  // ── Categorías ──
  listarCategorias(idNegocio: number, opts?: { soloActivas?: boolean }) {
    let p = new HttpParams().set('id_negocio', String(idNegocio));
    if (opts?.soloActivas) p = p.set('solo_activas', 'true');
    return this.http.get<ApiResponse<Categoria[]>>(`${this.base}/categorias`, { params: p });
  }

  crearCategoria(data: Partial<Categoria>): Observable<ApiResponse<Categoria>> {
    return this.http.post<ApiResponse<Categoria>>(`${this.base}/categorias`, data);
  }

  actualizarCategoria(id: number, data: Partial<Categoria>): Observable<ApiResponse<Categoria>> {
    return this.http.put<ApiResponse<Categoria>>(`${this.base}/categorias/${id}`, data);
  }

  inactivarCategoria(id: number, idNegocio: number): Observable<ApiResponse<Categoria>> {
    return this.http.patch<ApiResponse<Categoria>>(
      `${this.base}/categorias/${id}/inactivar?id_negocio=${idNegocio}`, {},
    );
  }

  // ── Proveedores ──
  listarProveedores(idNegocio: number, opts?: { q?: string }) {
    let p = new HttpParams().set('id_negocio', String(idNegocio));
    if (opts?.q) p = p.set('q', opts.q);
    return this.http.get<ApiResponse<Proveedor[]>>(`${this.base}/proveedores`, { params: p });
  }

  crearProveedor(data: Partial<Proveedor>): Observable<ApiResponse<Proveedor>> {
    return this.http.post<ApiResponse<Proveedor>>(`${this.base}/proveedores`, data);
  }

  actualizarProveedor(id: number, data: Partial<Proveedor>): Observable<ApiResponse<Proveedor>> {
    return this.http.put<ApiResponse<Proveedor>>(`${this.base}/proveedores/${id}`, data);
  }

  inactivarProveedor(id: number, idNegocio: number): Observable<ApiResponse<Proveedor>> {
    return this.http.patch<ApiResponse<Proveedor>>(
      `${this.base}/proveedores/${id}/inactivar?id_negocio=${idNegocio}`, {},
    );
  }

  // ── Productos ──
  listarProductos(opts: {
    idNegocio: number;
    q?: string;
    idCategoria?: number;
    idProveedor?: number;
    soloActivos?: boolean;
    stockBajo?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    let p = new HttpParams().set('id_negocio', String(opts.idNegocio));
    if (opts.q)           p = p.set('q', opts.q);
    if (opts.idCategoria) p = p.set('id_categoria', String(opts.idCategoria));
    if (opts.idProveedor) p = p.set('id_proveedor', String(opts.idProveedor));
    if (opts.soloActivos) p = p.set('solo_activos', 'true');
    if (opts.stockBajo)   p = p.set('stock_bajo', 'true');
    if (opts.page)        p = p.set('page', String(opts.page));
    if (opts.pageSize)    p = p.set('page_size', String(opts.pageSize));
    return this.http.get<ApiResponse<Paginated<Producto>>>(`${this.base}/productos`, { params: p });
  }

  crearProducto(data: Partial<Producto>): Observable<ApiResponse<Producto>> {
    return this.http.post<ApiResponse<Producto>>(`${this.base}/productos`, data);
  }

  actualizarProducto(id: number, data: Partial<Producto>): Observable<ApiResponse<Producto>> {
    return this.http.put<ApiResponse<Producto>>(`${this.base}/productos/${id}`, data);
  }

  inactivarProducto(id: number, idNegocio: number): Observable<ApiResponse<Producto>> {
    return this.http.patch<ApiResponse<Producto>>(
      `${this.base}/productos/${id}/inactivar?id_negocio=${idNegocio}`, {},
    );
  }

  ajustarStock(id: number, idNegocio: number, delta: number): Observable<ApiResponse<Producto>> {
    return this.http.patch<ApiResponse<Producto>>(
      `${this.base}/productos/${id}/stock`, { id_negocio: idNegocio, delta },
    );
  }

  // ── Movimientos ──
  listarMovimientos(opts: {
    idNegocio: number;
    tipo?: string;
    page?: number;
    pageSize?: number;
  }) {
    let p = new HttpParams().set('id_negocio', String(opts.idNegocio));
    if (opts.tipo)     p = p.set('tipo', opts.tipo);
    if (opts.page)     p = p.set('page', String(opts.page));
    if (opts.pageSize) p = p.set('page_size', String(opts.pageSize));
    return this.http.get<ApiResponse<Paginated<Movimiento>>>(`${this.base}/movimientos`, { params: p });
  }

  crearMovimiento(data: Record<string, unknown>): Observable<ApiResponse<Movimiento>> {
    return this.http.post<ApiResponse<Movimiento>>(`${this.base}/movimientos`, data);
  }

  confirmarMovimiento(id: number, idNegocio: number): Observable<ApiResponse<Movimiento>> {
    return this.http.patch<ApiResponse<Movimiento>>(
      `${this.base}/movimientos/${id}/confirmar`, { id_negocio: idNegocio },
    );
  }

  anularMovimiento(id: number, idNegocio: number): Observable<ApiResponse<Movimiento>> {
    return this.http.patch<ApiResponse<Movimiento>>(
      `${this.base}/movimientos/${id}/anular`, { id_negocio: idNegocio },
    );
  }

  // ── Clientes ──
  listarClientes(idNegocio: number, q?: string) {
    let p = new HttpParams().set('id_negocio', String(idNegocio));
    if (q) p = p.set('q', q);
    return this.http.get<ApiResponse<Cliente[]>>(`${this.base}/clientes`, { params: p });
  }

  crearCliente(data: Partial<Cliente>): Observable<ApiResponse<Cliente>> {
    return this.http.post<ApiResponse<Cliente>>(`${this.base}/clientes`, data);
  }

  actualizarCliente(id: number, data: Partial<Cliente>): Observable<ApiResponse<Cliente>> {
    return this.http.put<ApiResponse<Cliente>>(`${this.base}/clientes/${id}`, data);
  }

  // ── Ventas ──
  listarVentas(opts: { idNegocio: number; page?: number; pageSize?: number }) {
    let p = new HttpParams().set('id_negocio', String(opts.idNegocio));
    if (opts.page)     p = p.set('page', String(opts.page));
    if (opts.pageSize) p = p.set('page_size', String(opts.pageSize));
    return this.http.get<ApiResponse<Paginated<Venta>>>(`${this.base}/ventas`, { params: p });
  }

  crearVenta(data: {
    id_negocio: number;
    id_cliente?: number | null;
    metodo_pago: Venta['metodo_pago'];
    notas?: string | null;
    detalles: Array<{ id_producto: number; cantidad: number; precio_unitario: number; descuento?: number }>;
  }): Observable<ApiResponse<Venta>> {
    return this.http.post<ApiResponse<Venta>>(`${this.base}/ventas`, data);
  }

  anularVenta(id: number, idNegocio: number): Observable<ApiResponse<Venta>> {
    return this.http.patch<ApiResponse<Venta>>(
      `${this.base}/ventas/${id}/anular`, { id_negocio: idNegocio },
    );
  }
}
