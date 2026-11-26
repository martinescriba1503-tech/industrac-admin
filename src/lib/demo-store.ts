export interface Cliente {
  id: string;
  razonSocial: string;
  ruc: string;
  contacto: string;
  telefono: string;
}

export interface Equipo {
  id: string;
  clienteId: string;
  equipo: string;
  modelo: string;
  serie: string;
  horometroActual: number;
  ultimoMantenimientoTipo?: string;
  ultimoMantenimientoFecha?: string;
  proximoMantenimientoEstimado?: string;
}

export interface Cotizacion {
  id: string;
  numero: string;
  clienteId: string;
  clienteNombre: string;
  fecha: string;
  equipoModelo: string;
  serie: string;
  descripcion: string;
  moneda: "USD" | "PEN";
  subtotal: number;
  igv: number;
  total: number;
  estado: "Pendiente" | "Aprobada" | "Rechazada" | "Requiere modificación";
  pdfUrl?: string;
  pdfNombre?: string;
  condicionPago?: string;
  validezOferta?: string;
  expedienteId?: string;
}

export interface PagoItem {
  id: string;
  fecha: string;
  monto: number;
  comprobante: string;
  docNombre?: string;
  docTipo?: "pdf" | "image";
  docUrl?: string;
}

export interface Expediente {
  id: string;
  codigo: string; // ej: 0168-2026 – EMUSA PERU SAC – GA22
  cotizacionNumero: string;
  clienteId: string;
  clienteNombre: string;
  equipoModelo: string;
  serie: string;
  descripcion: string;
  total: number;
  moneda: "USD" | "PEN";
  fechaCreacion: string;
  estadoGeneral: "Cotización" | "Aprobado" | "En Servicio" | "Por Facturar" | "Facturado" | "Cerrado";
  // Sub-estados
  aprobacionEstado: "Pendiente" | "Aprobada" | "Rechazada" | "Modificación";
  aprobacionFecha?: string;
  ordenCompraSituacion: "recibida" | "pendiente" | "no_aplica";
  ordenCompraNumero?: string;
  ordenCompraPdf?: string;
  servicioEstado: "Pendiente" | "Programado" | "Reprogramado" | "Ejecutado" | "Cancelado";
  servicioFechaProgramada?: string;
  servicioTecnico?: string;
  reporteTecnicoNumero?: string;
  reporteTecnicoFecha?: string;
  reporteTecnicoPdf?: string;
  reporteTecnicoPdfUrl?: string;
  reporteTecnicoDriveUrl?: string;
  horometroRegistrado?: number;
  // Actas y HES
  actaNumero?: string;
  hesNumero?: string;
  actaDocNombre?: string;
  actaDocTipo?: "pdf" | "image";
  actaDocUrl?: string;
  actaDocFecha?: string;
  // Facturación
  facturaNumero?: string;
  facturaMonto?: number;
  facturaFecha?: string;
  facturaDocNombre?: string;
  facturaDocTipo?: "pdf" | "image";
  facturaDocUrl?: string;
  facturaDocFecha?: string;
  // Pagos y Cobranzas
  comprobantePagoDoc?: string;
  comprobantePagoTipo?: "pdf" | "image";
  comprobantePagoUrl?: string;
  comprobantePagoFecha?: string;
  pagosHistorial?: PagoItem[];
  pagosTotal: number;
  saldoPendiente: number;
  cierreFinanciero: boolean;
}

export interface ReporteTecnicoRaw {
  id: string;
  numeroReporte: string;
  expedienteId: string;
  clienteNombre: string;
  equipoModelo: string;
  serie: string;
  fechaServicio: string;
  tipoMantenimiento: string;
  horometroActual: number;
  actividades: string;
  observaciones: string;
  pdfNombre: string;
  confirmado: boolean;
}

export interface MovimientoHistorial {
  id: string;
  expedienteCodigo: string;
  fechaHora: string;
  usuario: string;
  tipo: string;
  detalle: string;
}

export const CLIENTES_DEMO: Cliente[] = [
  { id: "c1", razonSocial: "EMUSA PERU S.A.C.", ruc: "20501234567", contacto: "Ing. Carlos Mendoza", telefono: "+51 987 654 321" },
  { id: "c2", razonSocial: "TEXTILES CAMONES S.A.", ruc: "20109876543", contacto: "Lic. Andrea Vega", telefono: "+51 976 543 210" },
  { id: "c3", razonSocial: "CORPORACION ACEROS AREQUIPA S.A.", ruc: "20100070970", contacto: "Ing. Roberto Solis", telefono: "+51 965 432 109" },
  { id: "c4", razonSocial: "ALICORP S.A.A.", ruc: "20100055237", contacto: "Ing. Mario Ramos", telefono: "+51 954 321 098" },
];

export const EQUIPOS_DEMO: Equipo[] = [
  {
    id: "eq1",
    clienteId: "c1",
    equipo: "Compresor de Tornillo Rotativo",
    modelo: "Atlas Copco GA22",
    serie: "APN-784512",
    horometroActual: 0,
    ultimoMantenimientoTipo: undefined,
    ultimoMantenimientoFecha: undefined,
    proximoMantenimientoEstimado: undefined,
  },
  {
    id: "eq2",
    clienteId: "c2",
    equipo: "Compresor de Tornillo",
    modelo: "Sullair S-Energy 3700",
    serie: "SUL-992301",
    horometroActual: 0,
    ultimoMantenimientoTipo: undefined,
    ultimoMantenimientoFecha: undefined,
    proximoMantenimientoEstimado: undefined,
  },
  {
    id: "eq3",
    clienteId: "c3",
    equipo: "Compresor Libre de Aceite",
    modelo: "Ingersoll Rand Nirvana 55",
    serie: "IRN-451200",
    horometroActual: 0,
    ultimoMantenimientoTipo: undefined,
    ultimoMantenimientoFecha: undefined,
    proximoMantenimientoEstimado: undefined,
  },
];

export const COTIZACIONES_DEMO: Cotizacion[] = [
  {
    id: "cot-1",
    numero: "COT-0168-2026",
    clienteId: "c1",
    clienteNombre: "EMUSA PERU S.A.C.",
    fecha: "2026-11-10",
    equipoModelo: "Atlas Copco GA22",
    serie: "APN-784512",
    descripcion: "Mantenimiento preventivo integral 8,000 h, cambio de kit de filtros y aceite sintético Roto-Inject.",
    moneda: "USD",
    subtotal: 2450.00,
    igv: 441.00,
    total: 2891.00,
    estado: "Aprobada",
    pdfNombre: "COT-0168-2026_EMUSA_GA22.pdf",
    condicionPago: "30 días de crédito",
    validezOferta: "15 días",
    expedienteId: "exp-1",
  },
  {
    id: "cot-2",
    numero: "COT-0169-2026",
    clienteId: "c2",
    clienteNombre: "TEXTILES CAMONES S.A.",
    fecha: "2026-11-18",
    equipoModelo: "Sullair S-Energy 3700",
    serie: "SUL-992301",
    descripcion: "Mantenimiento de 4,000 h con cambio de separador aire/aceite y calibración de válvula de admisión.",
    moneda: "USD",
    subtotal: 1820.00,
    igv: 327.60,
    total: 2147.60,
    estado: "Pendiente",
    pdfNombre: "COT-0169-2026_CAMONES.pdf",
    condicionPago: "Contado contra entrega",
    validezOferta: "30 días",
    expedienteId: "exp-2",
  },
  {
    id: "cot-3",
    numero: "COT-0170-2026",
    clienteId: "c3",
    clienteNombre: "CORPORACION ACEROS AREQUIPA S.A.",
    fecha: "2026-11-20",
    equipoModelo: "Ingersoll Rand Nirvana 55",
    serie: "IRN-451200",
    descripcion: "Inspección técnica diagnóstica por vibración anómala en etapa de compresión y revisión de rodamientos.",
    moneda: "PEN",
    subtotal: 3500.00,
    igv: 630.00,
    total: 4130.00,
    estado: "Pendiente",
    pdfNombre: "COT-0170-2026_ACEROS.pdf",
    condicionPago: "45 días factura",
    validezOferta: "15 días",
    expedienteId: "exp-3",
  },
];

export const EXPEDIENTES_DEMO: Expediente[] = [
  {
    id: "exp-1",
    codigo: "0168-2026 – EMUSA PERU SAC – GA22",
    cotizacionNumero: "COT-0168-2026",
    clienteId: "c1",
    clienteNombre: "EMUSA PERU S.A.C.",
    equipoModelo: "Atlas Copco GA22",
    serie: "APN-784512",
    descripcion: "Mantenimiento preventivo integral 8,000 h, cambio de kit de filtros y aceite sintético.",
    total: 2891.00,
    moneda: "USD",
    fechaCreacion: "2026-11-10",
    estadoGeneral: "Por Facturar",
    aprobacionEstado: "Aprobada",
    aprobacionFecha: "2026-11-12",
    ordenCompraSituacion: "recibida",
    ordenCompraNumero: "OC-EMUSA-88412",
    ordenCompraPdf: "OC-88412.pdf",
    servicioEstado: "Ejecutado",
    servicioFechaProgramada: "2026-11-15",
    servicioTecnico: undefined,
    reporteTecnicoNumero: undefined,
    reporteTecnicoFecha: undefined,
    reporteTecnicoPdf: undefined,
    horometroRegistrado: undefined,
    actaNumero: "ACTA-2026-088",
    hesNumero: "HES-4500129",
    actaDocNombre: "ACTA-2026-088_EMUSA_FIRMADA.pdf",
    actaDocTipo: "pdf",
    actaDocFecha: "2026-11-18",
    facturaNumero: "F001-0004921",
    facturaMonto: 2891.00,
    facturaFecha: "2026-11-20",
    facturaDocNombre: "F001-0004921_EMUSA_GA22.pdf",
    facturaDocTipo: "pdf",
    facturaDocFecha: "2026-11-20",
    comprobantePagoDoc: "VOUCHER_BCP_ABONO_USD1500.jpg",
    comprobantePagoTipo: "image",
    comprobantePagoFecha: "2026-11-20",
    pagosHistorial: [
      {
        id: "pago-1",
        fecha: "2026-11-20",
        monto: 1500.00,
        comprobante: "TRANSF-BCP-881290",
        docNombre: "VOUCHER_BCP_ABONO_USD1500.jpg",
        docTipo: "image",
      },
    ],
    pagosTotal: 1500.00,
    saldoPendiente: 1391.00,
    cierreFinanciero: false,
  },
  {
    id: "exp-2",
    codigo: "0169-2026 – TEXTILES CAMONES – S3700",
    cotizacionNumero: "COT-0169-2026",
    clienteId: "c2",
    clienteNombre: "TEXTILES CAMONES S.A.",
    equipoModelo: "Sullair S-Energy 3700",
    serie: "SUL-992301",
    descripcion: "Mantenimiento de 4,000 h con cambio de separador aire/aceite.",
    total: 2147.60,
    moneda: "USD",
    fechaCreacion: "2026-11-18",
    estadoGeneral: "Cotización",
    aprobacionEstado: "Pendiente",
    ordenCompraSituacion: "pendiente",
    servicioEstado: "Pendiente",
    pagosTotal: 0,
    saldoPendiente: 2147.60,
    cierreFinanciero: false,
  },
  {
    id: "exp-3",
    codigo: "0170-2026 – ACEROS AREQUIPA – NIRVANA55",
    cotizacionNumero: "COT-0170-2026",
    clienteId: "c3",
    clienteNombre: "CORPORACION ACEROS AREQUIPA S.A.",
    equipoModelo: "Ingersoll Rand Nirvana 55",
    serie: "IRN-451200",
    descripcion: "Inspección técnica diagnóstica por vibración anómala.",
    total: 4130.00,
    moneda: "PEN",
    fechaCreacion: "2026-11-20",
    estadoGeneral: "En Servicio",
    aprobacionEstado: "Aprobada",
    aprobacionFecha: "2026-11-21",
    ordenCompraSituacion: "no_aplica",
    servicioEstado: "Programado",
    servicioFechaProgramada: "2026-11-28",
    servicioTecnico: "Ing. Marco Alvarado",
    pagosTotal: 0,
    saldoPendiente: 4130.00,
    cierreFinanciero: false,
  },
];

export const HISTORIAL_MOVIMIENTOS_DEMO: MovimientoHistorial[] = [
  {
    id: "m1",
    expedienteCodigo: "0168-2026 – EMUSA PERU SAC – GA22",
    fechaHora: "2026-11-20 16:30",
    usuario: "admin@industrac.com.pe",
    tipo: "Facturación y Cobranza",
    detalle: "Se emitió Factura F001-0004921 y se registró abono inicial de USD 1,500.00. Saldo restante: USD 1,391.00.",
  },
  {
    id: "m2",
    expedienteCodigo: "0168-2026 – EMUSA PERU SAC – GA22",
    fechaHora: "2026-11-16 11:20",
    usuario: "operaciones@industrac.com.pe",
    tipo: "Servicio Técnico Ejecutado",
    detalle: "Servicio preventivo ejecutado en planta. Pendiente de adjuntar Reporte Técnico oficial para lectura de horómetro.",
  },
  {
    id: "m3",
    expedienteCodigo: "0170-2026 – ACEROS AREQUIPA – NIRVANA55",
    fechaHora: "2026-11-21 09:15",
    usuario: "comercial@industrac.com.pe",
    tipo: "Programación de Servicio",
    detalle: "Aprobación confirmada con autorización comercial (Sin OC). Programado para 2026-11-28.",
  },
];
