export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: { code?: string; [k: string]: unknown } | unknown[];
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface UsuarioTienda {
  id_usuario: number;
  nombre_completo: string;
  primer_nombre: string;
  primer_apellido: string;
  email: string;
}

export interface PermisoVista {
  id_nivel: number;
  vista: string;
  url: string;
  roles: string[];
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

export interface NegocioTienda {
  id_negocio: number;
  nombre: string;
  tipo_negocio: string | null;
  paleta: { id_paleta: number; nombre: string; colores: Record<string, string> } | null;
  roles: { id_rol: number; descripcion: string }[];
  permisos_vista: PermisoVista[];
  permisos_subnivel: unknown[];
}

export interface SesionTienda {
  usuario: UsuarioTienda;
  permisos_cargados: boolean;
  negocios: NegocioTienda[];
  negocio: NegocioTienda | null;
  roles: { id_rol: number; descripcion: string }[];
  permisos_vista?: PermisoVista[];
  roles_globales: { id_rol: number; descripcion: string }[];
}

// ── Entidades del dominio tienda ──

export interface Categoria {
  id_categoria: number;
  id_negocio: number;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  estado: 'A' | 'I';
  fecha_creacion: string;
}

export interface Proveedor {
  id_proveedor: number;
  id_negocio: number;
  nombre: string;
  nit_rut: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  contacto: string | null;
  notas: string | null;
  estado: 'A' | 'I';
}

export interface Producto {
  id_producto: number;
  id_negocio: number;
  id_categoria: number | null;
  id_proveedor: number | null;
  nombre: string;
  descripcion: string | null;
  sku: string | null;
  precio_venta: number;
  precio_costo: number | null;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string | null;
  imagen_url: string | null;
  ubicacion: string | null;
  es_servicio: boolean;
  estado: 'A' | 'I';
  fecha_creacion: string;
  categoria?: Categoria | null;
}

export interface MovDetalle {
  id_detalle: number;
  id_movimiento: number;
  id_producto: number;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
  producto?: Producto | null;
}

export interface Movimiento {
  id_movimiento: number;
  id_negocio: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'DEVOLUCION';
  referencia: string | null;
  observacion: string | null;
  total_items: number;
  estado: 'BORRADOR' | 'CONFIRMADO' | 'ANULADO';
  fecha_movimiento: string;
  detalles?: MovDetalle[];
}

export interface Cliente {
  id_cliente: number;
  id_negocio: number;
  nombre: string;
  tipo_doc: string | null;
  num_doc: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  estado: 'A' | 'I';
}

export interface VentaDetalle {
  id_detalle: number;
  id_venta: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  producto?: Producto | null;
}

export interface Venta {
  id_venta: number;
  id_negocio: number;
  id_cliente: number | null;
  subtotal: number;
  descuento: number;
  total: number;
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO';
  estado: 'PAGADA' | 'ANULADA';
  notas: string | null;
  fecha_venta: string;
  detalles?: VentaDetalle[];
  cliente?: Cliente | null;
}

export interface DashboardResumen {
  total_productos: number;
  total_categorias: number;
  ventas_hoy: number;
  ingresos_hoy: number;
  productos_stock_bajo: number;
  movimientos_hoy: number;
}
