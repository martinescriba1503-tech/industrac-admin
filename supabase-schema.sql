-- ====================================================================
-- INDUSTRAC S.A.C. - ESQUEMA DE BASE DE DATOS EN SUPABASE (POSTGRESQL)
-- ====================================================================

-- 1. TABLA: Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social TEXT NOT NULL,
    ruc VARCHAR(11) UNIQUE,
    contacto TEXT,
    telefono TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: Equipos (Compresores)
CREATE TABLE IF NOT EXISTS equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    equipo TEXT NOT NULL,
    modelo TEXT NOT NULL,
    serie TEXT UNIQUE NOT NULL,
    horometro_actual NUMERIC(10, 2) DEFAULT 0,
    ultimo_mantenimiento_tipo TEXT,
    ultimo_mantenimiento_fecha DATE,
    proximo_mantenimiento_estimado TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: Expedientes Administrativos
CREATE TABLE IF NOT EXISTS expedientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL, -- ej: 0168-2026 – EMUSA PERU SAC – GA22
    cotizacion_numero TEXT NOT NULL,
    cliente_id UUID REFERENCES clientes(id),
    cliente_nombre TEXT NOT NULL,
    equipo_modelo TEXT NOT NULL,
    serie TEXT NOT NULL,
    descripcion TEXT,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD',
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    estado_general TEXT NOT NULL DEFAULT 'Cotización', -- Cotización | Aprobado | En Servicio | Por Facturar | Facturado | Cerrado
    aprobacion_estado TEXT DEFAULT 'Pendiente',
    aprobacion_fecha DATE,
    orden_compra_situacion TEXT DEFAULT 'pendiente',
    orden_compra_numero TEXT,
    orden_compra_pdf TEXT,
    servicio_estado TEXT DEFAULT 'Pendiente',
    servicio_fecha_programada DATE,
    servicio_tecnico TEXT,
    reporte_tecnico_numero TEXT,
    reporte_tecnico_fecha DATE,
    reporte_tecnico_pdf TEXT,
    horometro_registrado NUMERIC(10, 2),
    acta_numero TEXT,
    hes_numero TEXT,
    acta_doc_nombre TEXT,
    acta_doc_tipo TEXT,
    acta_doc_url TEXT,
    acta_doc_fecha DATE,
    factura_numero TEXT,
    factura_monto NUMERIC(12, 2),
    factura_fecha DATE,
    factura_doc_nombre TEXT,
    factura_doc_tipo TEXT,
    factura_doc_url TEXT,
    factura_doc_fecha DATE,
    comprobante_pago_doc TEXT,
    comprobante_pago_tipo TEXT,
    comprobante_pago_url TEXT,
    comprobante_pago_fecha DATE,
    pagos_total NUMERIC(12, 2) DEFAULT 0,
    saldo_pendiente NUMERIC(12, 2) DEFAULT 0,
    cierre_financiero BOOLEAN DEFAULT FALSE,
    drive_folder_id TEXT, -- ID de la carpeta en Google Drive del expediente
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: Cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT NOT NULL,
    cliente_id UUID REFERENCES clientes(id),
    cliente_nombre TEXT NOT NULL,
    fecha DATE NOT NULL,
    equipo_modelo TEXT NOT NULL,
    serie TEXT,
    descripcion TEXT,
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    igv NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    condicion_pago TEXT,
    validez_oferta TEXT,
    pdf_nombre TEXT,
    pdf_url TEXT,
    drive_file_id TEXT,
    expediente_id UUID REFERENCES expedientes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: Documentos Digitalizados (Drive)
CREATE TABLE IF NOT EXISTS documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id UUID REFERENCES expedientes(id) ON DELETE CASCADE,
    carpeta_subtipo TEXT NOT NULL, -- 01_COTIZACION, 04_REPORTE_TECNICO, 05_ACTA_HES, 06_FACTURACION, 07_PAGOS
    nombre_archivo TEXT NOT NULL,
    tipo_archivo TEXT NOT NULL, -- pdf | image
    drive_file_id TEXT,
    drive_url TEXT,
    sha256 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: Pagos y Abonos
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id UUID REFERENCES expedientes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    monto NUMERIC(12, 2) NOT NULL,
    comprobante TEXT NOT NULL,
    doc_nombre TEXT,
    doc_tipo TEXT,
    doc_url TEXT,
    drive_file_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: Historial de Auditoría
CREATE TABLE IF NOT EXISTS historial_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_codigo TEXT NOT NULL,
    fecha_hora TEXT NOT NULL,
    usuario TEXT NOT NULL,
    tipo TEXT NOT NULL,
    detalle TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_equipos_serie ON equipos(serie);
CREATE INDEX IF NOT EXISTS idx_expedientes_codigo ON expedientes(codigo);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_numero ON cotizaciones(numero);
