export interface ArchitectureLayer {
  layer: string;
  technology: string;
  responsibility: string;
  securityBoundary: string;
}

export interface DatabaseTableSpec {
  table: string;
  purpose: string;
  keyRelations: string;
}

export interface PhasePlanItem {
  phase: string;
  title: string;
  status: "Completada" | "Siguiente" | "Pendiente";
}

export const ARCHITECTURE_LAYERS: readonly ArchitectureLayer[] = [
  {
    layer: "Presentación (Cliente)",
    technology: "Next.js 16 App Router + React 19 + Tailwind CSS v4",
    responsibility:
      "Menú lateral responsivo, tablas ordenadas, pantallas de revisión PDF y formularios.",
    securityBoundary:
      "Sin secretos ni llaves privadas; solo URL y Anon Key públicas de Supabase.",
  },
  {
    layer: "Servidor / BFF (Vercel)",
    technology: "Server Actions, Route Handlers (/api/*) y src/proxy.ts",
    responsibility:
      "Validación de sesión, lectura de PDFs, sincronización con Drive y Calendar, auditoría.",
    securityBoundary:
      "Usa SUPABASE_SERVICE_ROLE_KEY y credenciales de Google únicamente en servidor.",
  },
  {
    layer: "Datos y Autenticación",
    technology: "Supabase (PostgreSQL + Auth + RLS)",
    responsibility:
      "16 tablas relacionales, fuente única de horómetros, cálculo de saldos y trazabilidad.",
    securityBoundary:
      "Políticas RLS activas para usuarios autenticados; historial append-only.",
  },
  {
    layer: "Almacenamiento y Agenda",
    technology: "Google Drive API + Google Calendar API",
    responsibility:
      "Carpetas automáticas por expediente (01 a 07) y eventos/recordatorios de servicio.",
    securityBoundary:
      "Acceso mediante Service Account / OAuth de servidor; IDs guardados en Supabase.",
  },
] as const;

export const DRIVE_SUBFOLDERS: readonly string[] = [
  "01_COTIZACION",
  "02_APROBACION",
  "03_ORDEN_COMPRA",
  "04_REPORTE_TECNICO",
  "05_ACTA_HES",
  "06_FACTURACION",
  "07_PAGOS",
] as const;

export const DATABASE_TABLES: readonly DatabaseTableSpec[] = [
  {
    table: "usuarios",
    purpose: "Usuarios autorizados vinculados a Supabase Auth",
    keyRelations: "auth.users (PK id)",
  },
  {
    table: "clientes",
    purpose: "Razón social y RUC cuando figure",
    keyRelations: "1:N con equipos y expedientes",
  },
  {
    table: "equipos",
    purpose: "Compresores identificados de forma única por número de serie",
    keyRelations: "cliente_id, horometro_actual",
  },
  {
    table: "expedientes",
    purpose: "Eje central (ej. 0168-2026 – EMUSA PERU SAC – GA22)",
    keyRelations: "cliente_id, equipo_id, drive_folder_id",
  },
  {
    table: "cotizaciones",
    purpose: "Versiones de cotizaciones PDF sin eliminar historial",
    keyRelations: "expediente_id, UNIQUE(numero_cotizacion, version)",
  },
  {
    table: "aprobaciones",
    purpose: "Estado de aprobación, observaciones y respaldo",
    keyRelations: "expediente_id, cotizacion_id",
  },
  {
    table: "ordenes_compra",
    purpose: "OC recibida, OC pendiente (no bloqueante) o No aplica",
    keyRelations: "expediente_id",
  },
  {
    table: "servicios",
    purpose: "Programación, reprogramación y ejecución real",
    keyRelations: "expediente_id, equipo_id",
  },
  {
    table: "documentos",
    purpose: "Referencias a Google Drive y control anti-duplicados (SHA-256)",
    keyRelations: "expediente_id, drive_file_id",
  },
  {
    table: "reportes_tecnicos",
    purpose: "PDFs recibidos del sistema actual de reportes",
    keyRelations: "expediente_id, servicio_id, numero_reporte",
  },
  {
    table: "historial_horometros",
    purpose: "Fuente única confirmada por equipo con alerta de regresión",
    keyRelations: "equipo_id, reporte_tecnico_id",
  },
  {
    table: "conformidades",
    purpose: "Actas de conformidad, códigos HES y PDFs asociados",
    keyRelations: "expediente_id, documento_acta_id, documento_hes_id",
  },
  {
    table: "facturas",
    purpose: "Facturación ligada a expediente, cotización y servicio",
    keyRelations: "expediente_id, cotizacion_id, servicio_id",
  },
  {
    table: "pagos",
    purpose: "Pagos totales o parciales y cálculo de saldo pendiente",
    keyRelations: "factura_id, expediente_id",
  },
  {
    table: "eventos_calendario",
    purpose: "Eventos y recordatorios sincronizados con Google Calendar",
    keyRelations: "expediente_id, servicio_id, google_event_id",
  },
  {
    table: "historial_movimientos",
    purpose: "Bitácora automática de auditoría por usuario, fecha y estado",
    keyRelations: "expediente_id, usuario_id",
  },
] as const;

export const IMPLEMENTATION_PHASES: readonly PhasePlanItem[] = [
  { phase: "Fase 1", title: "Análisis, arquitectura y configuración inicial", status: "Completada" },
  { phase: "Fase 2", title: "Configuración de Supabase y estructura de base de datos", status: "Siguiente" },
  { phase: "Fase 3", title: "Diseño del sistema web y Dashboard", status: "Pendiente" },
  { phase: "Fase 4", title: "Registro y seguimiento de cotizaciones PDF", status: "Pendiente" },
  { phase: "Fase 5", title: "Creación de expedientes y organización automática en Drive", status: "Pendiente" },
  { phase: "Fase 6", title: "Gestión de aprobaciones, OC y programación de servicios", status: "Pendiente" },
  { phase: "Fase 7", title: "Integración de reportes técnicos y horómetro único", status: "Pendiente" },
  { phase: "Fase 8", title: "Historial de mantenimiento (A/B/C y trimestral)", status: "Pendiente" },
  { phase: "Fase 9", title: "Integración de Google Calendar y recordatorios", status: "Pendiente" },
  { phase: "Fase 10", title: "HES, facturación y pagos/cobranzas", status: "Pendiente" },
  { phase: "Fase 11", title: "Automatizaciones, alertas y configuración", status: "Pendiente" },
  { phase: "Fase 12", title: "Pruebas generales y publicación en Vercel", status: "Pendiente" },
] as const;
