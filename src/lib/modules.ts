export interface SystemModuleDefinition {
  id: string;
  order: number;
  name: string;
  href: string;
  description: string;
  phase: string;
}

/**
 * Catálogo maestro de los 13 módulos del Sistema de Gestión Administrativa INDUSTRAC S.A.C.
 */
export const SYSTEM_MODULES: readonly SystemModuleDefinition[] = [
  {
    id: "dashboard",
    order: 1,
    name: "Dashboard",
    href: "/dashboard",
    description: "Indicadores de cotizaciones, servicios, documentación y cobranzas.",
    phase: "Fase 3",
  },
  {
    id: "cotizaciones",
    order: 2,
    name: "Cotizaciones",
    href: "/cotizaciones",
    description: "Carga de PDF desde Excel, extracción, revisión y versionado.",
    phase: "Fase 4",
  },
  {
    id: "seguimiento",
    order: 3,
    name: "Seguimiento administrativo",
    href: "/seguimiento",
    description: "Control de aprobaciones, órdenes de compra y pendientes.",
    phase: "Fase 6",
  },
  {
    id: "expedientes",
    order: 4,
    name: "Expedientes",
    href: "/expedientes",
    description: "Vista integral del ciclo completo y documentos en Google Drive.",
    phase: "Fase 5",
  },
  {
    id: "servicios",
    order: 5,
    name: "Servicios y programación",
    href: "/servicios",
    description: "Programación de técnicos, reprogramaciones y ejecución real.",
    phase: "Fase 6",
  },
  {
    id: "reportes-tecnicos",
    order: 6,
    name: "Reportes técnicos",
    href: "/reportes-tecnicos",
    description: "Recepción y validación de PDF del sistema actual de reportes.",
    phase: "Fase 7",
  },
  {
    id: "horometros",
    order: 7,
    name: "Horómetros",
    href: "/horometros",
    description: "Actualización única y trazable desde el reporte técnico.",
    phase: "Fase 7",
  },
  {
    id: "conformidades",
    order: 8,
    name: "Actas de conformidad / HES",
    href: "/conformidades",
    description: "Registro de actas, códigos HES y respaldo PDF.",
    phase: "Fase 10",
  },
  {
    id: "facturacion",
    order: 9,
    name: "Facturación",
    href: "/facturacion",
    description: "Emisión, importes, condiciones de pago y vencimientos.",
    phase: "Fase 10",
  },
  {
    id: "pagos",
    order: 10,
    name: "Pagos y cobranzas",
    href: "/pagos",
    description: "Pagos parciales, saldos pendientes y control de morosidad.",
    phase: "Fase 10",
  },
  {
    id: "calendario",
    order: 11,
    name: "Calendario",
    href: "/calendario",
    description: "Sincronización bidireccional controlada con Google Calendar.",
    phase: "Fase 9",
  },
  {
    id: "historial",
    order: 12,
    name: "Historial",
    href: "/historial",
    description: "Mantenimiento por equipo (serie) y bitácora de auditoría.",
    phase: "Fase 8",
  },
  {
    id: "configuracion",
    order: 13,
    name: "Configuración",
    href: "/configuracion",
    description: "Parámetros de alertas, reglas de mantenimiento y usuarios.",
    phase: "Fase 11",
  },
] as const;
