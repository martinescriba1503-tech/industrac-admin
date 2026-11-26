"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { Expediente } from "@/lib/demo-store";
import DocumentModal from "@/components/DocumentModal";

export default function ExpedientesPage() {
  const { expedientes, actualizarExpediente, registrarPago } = useApp();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  // Expediente Seleccionado para Ver Detalle
  const [expSeleccionado, setExpSeleccionado] = useState<Expediente | null>(null);
  const [tabActiva, setTabActiva] = useState<
    "resumen" | "cotizacion" | "aprobacion" | "orden_compra" | "servicio" | "reporte_tecnico" | "horometro" | "acta_hes" | "facturacion" | "pagos" | "historial"
  >("resumen");

  // Formularios rápidos dentro del expediente
  const [montoPago, setMontoPago] = useState<number>(500);
  const [comprobantePago, setComprobantePago] = useState<string>("TRANSF-BCP-9901");
  const [nuevoNumOc, setNuevoNumOc] = useState("");
  const [nuevoNumFactura, setNuevoNumFactura] = useState("");
  const [nuevoNumActa, setNuevoNumActa] = useState("");
  const [nuevoNumHes, setNuevoNumHes] = useState("");

  // Visor de documentos dentro del expediente
  const [visorDoc, setVisorDoc] = useState<{
    abierto: boolean;
    titulo: string;
    nombre: string;
    tipo: "pdf" | "image";
    url?: string;
    carpeta: string;
  }>({
    abierto: false,
    titulo: "",
    nombre: "",
    tipo: "pdf",
    carpeta: "01_COTIZACION",
  });

  // Archivo temporal para pestañas
  const [archivoTab, setArchivoTab] = useState<File | null>(null);
  const [archivoTabUrl, setArchivoTabUrl] = useState<string | null>(null);
  const [archivoTabTipo, setArchivoTabTipo] = useState<"pdf" | "image">("pdf");

  const procesarArchivoTab = (file: File) => {
    const esImg = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    setArchivoTab(file);
    setArchivoTabTipo(esImg ? "image" : "pdf");
    const reader = new FileReader();
    reader.onload = () => setArchivoTabUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const expedientesFiltrados = expedientes.filter((e) => {
    const coincideTexto =
      e.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.cotizacionNumero.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.equipoModelo.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado = filtroEstado === "TODOS" || e.estadoGeneral === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  const handleGuardarOC = () => {
    if (!expSeleccionado) return;
    actualizarExpediente(expSeleccionado.id, {
      ordenCompraSituacion: "recibida",
      ordenCompraNumero: nuevoNumOc || "OC-INGRESADA",
      ordenCompraPdf: `${nuevoNumOc || "OC"}.pdf`,
    });
    setExpSeleccionado({
      ...expSeleccionado,
      ordenCompraSituacion: "recibida",
      ordenCompraNumero: nuevoNumOc || "OC-INGRESADA",
    });
    setNuevoNumOc("");
  };

  const handleGuardarFactura = () => {
    if (!expSeleccionado) return;
    const fechaHoy = new Date().toISOString().split("T")[0];
    const updates: Partial<Expediente> = {
      facturaNumero: nuevoNumFactura || expSeleccionado.facturaNumero || "F001-0000001",
      facturaFecha: fechaHoy,
      facturaMonto: expSeleccionado.total,
      estadoGeneral: "Facturado",
    };
    if (archivoTab) {
      updates.facturaDocNombre = archivoTab.name;
      updates.facturaDocTipo = archivoTabTipo;
      updates.facturaDocUrl = archivoTabUrl || undefined;
      updates.facturaDocFecha = fechaHoy;
    }
    actualizarExpediente(expSeleccionado.id, updates);
    setExpSeleccionado({
      ...expSeleccionado,
      ...updates,
    });
    setNuevoNumFactura("");
    setArchivoTab(null);
    setArchivoTabUrl(null);
  };

  const handleGuardarActaHes = () => {
    if (!expSeleccionado) return;
    const fechaHoy = new Date().toISOString().split("T")[0];
    const updates: Partial<Expediente> = {
      actaNumero: nuevoNumActa || expSeleccionado.actaNumero,
      hesNumero: nuevoNumHes || expSeleccionado.hesNumero,
    };
    if (archivoTab) {
      updates.actaDocNombre = archivoTab.name;
      updates.actaDocTipo = archivoTabTipo;
      updates.actaDocUrl = archivoTabUrl || undefined;
      updates.actaDocFecha = fechaHoy;
    }
    actualizarExpediente(expSeleccionado.id, updates);
    setExpSeleccionado({
      ...expSeleccionado,
      ...updates,
    });
    setNuevoNumActa("");
    setNuevoNumHes("");
    setArchivoTab(null);
    setArchivoTabUrl(null);
  };

  const handleRegistrarPagoModal = () => {
    if (!expSeleccionado || montoPago <= 0) return;
    const docInfo = archivoTab
      ? {
          nombre: archivoTab.name,
          tipo: archivoTabTipo,
          url: archivoTabUrl || undefined,
        }
      : undefined;

    registrarPago(expSeleccionado.id, montoPago, comprobantePago, docInfo);
    const nuevoTotal = expSeleccionado.pagosTotal + montoPago;
    const nuevoSaldo = Math.max(0, expSeleccionado.total - nuevoTotal);
    setExpSeleccionado({
      ...expSeleccionado,
      pagosTotal: nuevoTotal,
      saldoPendiente: nuevoSaldo,
      cierreFinanciero: nuevoSaldo === 0,
      estadoGeneral: nuevoSaldo === 0 ? "Cerrado" : "Facturado",
      comprobantePagoDoc: docInfo?.nombre || expSeleccionado.comprobantePagoDoc,
      comprobantePagoTipo: docInfo?.tipo || expSeleccionado.comprobantePagoTipo,
      comprobantePagoUrl: docInfo?.url || expSeleccionado.comprobantePagoUrl,
    });
    setArchivoTab(null);
    setArchivoTabUrl(null);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240]">
            Expedientes Administrativos
          </h1>
          <p className="text-xs text-gray-600">
            Eje central de gestión: relaciona cotización, aprobación, OC, servicio, reporte técnico, horómetro, actas, facturas y pagos.
          </p>
        </div>
      </div>

      {/* Buscador y Filtro */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-96 relative">
          <input
            type="text"
            placeholder="Buscar por código (ej. 0168-2026), cliente o equipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#F2F2F2] border border-gray-200 rounded px-3 py-1.5 pl-8 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
          />
          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-gray-600 font-medium">Estado General:</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-[#F2F2F2] border border-gray-200 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="Cotización">Cotización</option>
            <option value="Aprobado">Aprobado</option>
            <option value="En Servicio">En Servicio</option>
            <option value="Por Facturar">Por Facturar</option>
            <option value="Facturado">Facturado</option>
            <option value="Cerrado">Cerrado</option>
          </select>
        </div>
      </div>

      {/* Tabla de Expedientes */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Código de Expediente</th>
                <th className="py-3 px-4">Cotización</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Equipo / Serie</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Saldo Pendiente</th>
                <th className="py-3 px-4">Estado General</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expedientesFiltrados.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-[#051A59]">
                    {exp.codigo}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-700">
                    {exp.cotizacionNumero}
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium">
                    {exp.clienteNombre}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <div>{exp.equipoModelo}</div>
                    <div className="text-[10px] text-gray-400 font-mono">S/N: {exp.serie || "N/A"}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {exp.moneda} {exp.total.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    <span className={exp.saldoPendiente > 0 ? "text-amber-700" : "text-emerald-700"}>
                      {exp.moneda} {exp.saldoPendiente.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                        exp.estadoGeneral === "Cerrado"
                          ? "bg-emerald-100 text-emerald-800"
                          : exp.estadoGeneral === "Por Facturar"
                          ? "bg-purple-100 text-purple-800"
                          : exp.estadoGeneral === "En Servicio"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {exp.estadoGeneral}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setExpSeleccionado(exp);
                        setTabActiva("resumen");
                      }}
                      className="bg-[#051A59] hover:bg-[#031240] text-white px-3 py-1 rounded text-[11px] font-semibold"
                    >
                      Abrir Expediente 360°
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLADO CON PESTAÑAS (360° DEL EXPEDIENTE) */}
      {expSeleccionado && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-6 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header del Expediente */}
            <div className="p-4 bg-[#031240] text-white flex items-center justify-between border-b border-[#051A59]">
              <div>
                <span className="text-[10px] text-[#14B5D9] uppercase font-bold tracking-widest block">
                  EXPEDIENTE ADMINISTRATIVO ÚNICO
                </span>
                <h2 className="text-base font-bold text-white">
                  {expSeleccionado.codigo}
                </h2>
              </div>
              <button
                onClick={() => setExpSeleccionado(null)}
                className="text-gray-300 hover:text-white text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            {/* Pestañas de Navegación */}
            <div className="bg-[#051A59] text-white flex overflow-x-auto text-xs border-b border-[#031240] scrollbar-none">
              {[
                { id: "resumen", label: "Resumen 360°" },
                { id: "cotizacion", label: "Cotización" },
                { id: "aprobacion", label: "Aprobación" },
                { id: "orden_compra", label: "Orden de Compra" },
                { id: "servicio", label: "Servicio" },
                { id: "reporte_tecnico", label: "Reporte Técnico" },
                { id: "horometro", label: "Horómetro" },
                { id: "acta_hes", label: "Acta / HES" },
                { id: "facturacion", label: "Facturación" },
                { id: "pagos", label: "Pagos y Cobranzas" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id as typeof tabActiva)}
                  className={`px-3.5 py-2.5 font-medium whitespace-nowrap transition-colors ${
                    tabActiva === tab.id
                      ? "bg-white text-[#031240] font-bold"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenido de la Pestaña Activa */}
            <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
              {/* TAB 1: RESUMEN */}
              {tabActiva === "resumen" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F2F2F2] p-4 rounded border border-gray-200">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Cliente</span>
                      <span className="font-bold text-gray-900">{expSeleccionado.clienteNombre}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Equipo y Serie</span>
                      <span className="font-semibold text-gray-900">{expSeleccionado.equipoModelo}</span>
                      <span className="text-[10px] text-gray-500 block">S/N: {expSeleccionado.serie}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Importe Total</span>
                      <span className="font-bold text-[#051A59]">
                        {expSeleccionado.moneda} {expSeleccionado.total.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Saldo Pendiente</span>
                      <span className={`font-bold ${expSeleccionado.saldoPendiente > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                        {expSeleccionado.moneda} {expSeleccionado.saldoPendiente.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded p-4 space-y-2">
                    <h3 className="font-bold text-sm text-[#031240]">Estado del Flujo Administrativo:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <div className="p-2 rounded bg-gray-50 border">
                        <span className="text-[10px] text-gray-500 block">1. Aprobación</span>
                        <span className="font-semibold text-emerald-700">{expSeleccionado.aprobacionEstado}</span>
                      </div>
                      <div className="p-2 rounded bg-gray-50 border">
                        <span className="text-[10px] text-gray-500 block">2. Orden de Compra</span>
                        <span className="font-semibold">
                          {expSeleccionado.ordenCompraSituacion === "recibida"
                            ? `Recibida (${expSeleccionado.ordenCompraNumero})`
                            : expSeleccionado.ordenCompraSituacion === "pendiente"
                            ? "Pendiente (No bloquea servicio)"
                            : "No Aplica"}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-gray-50 border">
                        <span className="text-[10px] text-gray-500 block">3. Servicio Técnico</span>
                        <span className="font-semibold text-blue-700">{expSeleccionado.servicioEstado}</span>
                      </div>
                      <div className="p-2 rounded bg-gray-50 border">
                        <span className="text-[10px] text-gray-500 block">4. Reporte Técnico</span>
                        <span className="font-semibold">
                          {expSeleccionado.reporteTecnicoNumero || "Pendiente de adjuntar"}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-gray-50 border">
                        <span className="text-[10px] text-gray-500 block">5. Horómetro Registrado</span>
                        <span className="font-semibold text-[#18A2D9]">
                          {expSeleccionado.horometroRegistrado ? `${expSeleccionado.horometroRegistrado} h` : "Por confirmar"}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-gray-50 border">
                        <span className="text-[10px] text-gray-500 block">6. Factura y Cierre</span>
                        <span className="font-semibold">
                          {expSeleccionado.cierreFinanciero ? "Cerrado (Pagado al 100%)" : "Pendiente de Cobro"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border-l-4 border-[#18A2D9] text-blue-900 text-xs">
                    📁 <strong>Estructura en Google Drive:</strong> Este expediente está sincronizado con la carpeta <code className="bg-white px-1.5 py-0.5 rounded font-mono">INDUSTRAC - GESTIÓN ADMINISTRATIVA / {expSeleccionado.fechaCreacion.slice(0, 4)} / {expSeleccionado.clienteNombre} / {expSeleccionado.codigo}</code>
                  </div>
                </div>
              )}

              {/* TAB 2: COTIZACION */}
              {tabActiva === "cotizacion" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-[#031240]">Datos de la Cotización Original</h3>
                  <div className="bg-[#F2F2F2] p-4 rounded space-y-2 border">
                    <div><strong>Número:</strong> {expSeleccionado.cotizacionNumero}</div>
                    <div><strong>Fecha:</strong> {expSeleccionado.fechaCreacion}</div>
                    <div><strong>Descripción del Servicio:</strong> {expSeleccionado.descripcion}</div>
                    <div><strong>Monto Total:</strong> {expSeleccionado.moneda} {expSeleccionado.total.toFixed(2)}</div>
                  </div>
                </div>
              )}

              {/* TAB 3: APROBACION */}
              {tabActiva === "aprobacion" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-[#031240]">Seguimiento de Aprobación</h3>
                  <div className="p-4 bg-gray-50 rounded border space-y-2">
                    <div><strong>Estado actual:</strong> {expSeleccionado.aprobacionEstado}</div>
                    <div><strong>Fecha de Aprobación:</strong> {expSeleccionado.aprobacionFecha || "Pendiente"}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        actualizarExpediente(expSeleccionado.id, {
                          aprobacionEstado: "Aprobada",
                          aprobacionFecha: new Date().toISOString().split("T")[0],
                          estadoGeneral: "Aprobado",
                        });
                        setExpSeleccionado({
                          ...expSeleccionado,
                          aprobacionEstado: "Aprobada",
                          estadoGeneral: "Aprobado",
                        });
                      }}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded font-semibold text-xs"
                    >
                      Marcar Aprobada
                    </button>
                    <button
                      onClick={() => {
                        actualizarExpediente(expSeleccionado.id, {
                          aprobacionEstado: "Rechazada",
                          estadoGeneral: "Cotización",
                        });
                        setExpSeleccionado({
                          ...expSeleccionado,
                          aprobacionEstado: "Rechazada",
                        });
                      }}
                      className="bg-rose-600 text-white px-3 py-1.5 rounded font-semibold text-xs"
                    >
                      Marcar Rechazada
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: ORDEN DE COMPRA */}
              {tabActiva === "orden_compra" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-[#031240]">Gestión de Orden de Compra (OC)</h3>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                    <strong>Regla de negocio:</strong> Una OC pendiente NO bloquea la ejecución del servicio ni la facturación.
                  </div>
                  <div className="p-4 bg-gray-50 rounded border space-y-3">
                    <div>
                      <strong>Situación de OC:</strong>{" "}
                      <span className="font-bold uppercase text-[#051A59]">
                        {expSeleccionado.ordenCompraSituacion}
                      </span>
                    </div>
                    {expSeleccionado.ordenCompraNumero && (
                      <div><strong>Número de OC:</strong> {expSeleccionado.ordenCompraNumero}</div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <label className="block font-medium mb-1">Registrar / Adjuntar OC posterior:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Número de OC (Ej: OC-998822)"
                          value={nuevoNumOc}
                          onChange={(e) => setNuevoNumOc(e.target.value)}
                          className="border border-gray-300 rounded px-2.5 py-1 text-xs"
                        />
                        <button
                          onClick={handleGuardarOC}
                          className="bg-[#051A59] text-white px-3 py-1 rounded font-semibold text-xs"
                        >
                          Guardar OC
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SERVICIO */}
              {tabActiva === "servicio" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-[#031240]">Programación y Ejecución de Servicio</h3>
                  <div className="p-4 bg-gray-50 rounded border space-y-2">
                    <div><strong>Estado:</strong> {expSeleccionado.servicioEstado}</div>
                    <div><strong>Fecha Programada:</strong> {expSeleccionado.servicioFechaProgramada || "Sin programar"}</div>
                    <div><strong>Técnico Asignado:</strong> {expSeleccionado.servicioTecnico || "Sin asignar"}</div>
                  </div>
                </div>
              )}

              {/* TAB 6: REPORTE TECNICO */}
              {tabActiva === "reporte_tecnico" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-[#031240]">Reporte Técnico</h3>
                  <div className="p-4 bg-gray-50 rounded border space-y-2">
                    <div>
                      <strong>Número de Reporte:</strong>{" "}
                      {expSeleccionado.reporteTecnicoNumero || "Aún no adjuntado"}
                    </div>
                    <div>
                      <strong>Documento PDF:</strong>{" "}
                      {expSeleccionado.reporteTecnicoPdf || "Pendiente de cargar en módulo Reportes Técnicos"}
                    </div>
                  </div>
                  <a
                    href="/reportes-tecnicos"
                    className="inline-block bg-[#18A2D9] text-[#031240] px-3 py-1.5 rounded font-semibold text-xs"
                  >
                    Ir a Adjuntar Reporte Técnico →
                  </a>
                </div>
              )}

              {/* TAB 7: HOROMETRO */}
              {tabActiva === "horometro" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-[#031240]">Horómetro Registrado para el Equipo</h3>
                  <div className="p-4 bg-blue-50 rounded border border-blue-200 space-y-2 text-blue-900">
                    <div className="text-xl font-bold">
                      {expSeleccionado.horometroRegistrado
                        ? `${expSeleccionado.horometroRegistrado} horas`
                        : "Sin lectura confirmada"}
                    </div>
                    <div className="text-[11px]">
                      Fuente única de registro: extraído y validado directamente desde el Reporte Técnico oficial de INDUSTRAC.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: ACTAS Y HES */}
              {tabActiva === "acta_hes" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-[#031240]">Actas de Conformidad y HES</h3>
                  <div className="p-4 bg-gray-50 rounded border space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div><strong>Acta N°:</strong> {expSeleccionado.actaNumero || "Pendiente"}</div>
                        <div><strong>HES N°:</strong> {expSeleccionado.hesNumero || "Pendiente"}</div>
                      </div>
                      {expSeleccionado.actaDocNombre && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-blue-200 shadow-xs">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            expSeleccionado.actaDocTipo === "image" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {expSeleccionado.actaDocTipo === "image" ? "📸 FOTO" : "📄 PDF"}
                          </span>
                          <span className="font-mono text-xs text-gray-700 truncate max-w-[150px]">
                            {expSeleccionado.actaDocNombre}
                          </span>
                          <button
                            onClick={() => setVisorDoc({
                              abierto: true,
                              titulo: `Acta de Conformidad - ${expSeleccionado.clienteNombre}`,
                              nombre: expSeleccionado.actaDocNombre || "ACTA.pdf",
                              tipo: expSeleccionado.actaDocTipo || "pdf",
                              url: expSeleccionado.actaDocUrl,
                              carpeta: "05_ACTA_HES",
                            })}
                            className="bg-[#051A59] text-white px-2 py-0.5 rounded text-[11px] font-semibold hover:bg-[#031240]"
                          >
                            👁 Ver
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <input
                        type="text"
                        placeholder="N° de Acta"
                        value={nuevoNumActa}
                        onChange={(e) => setNuevoNumActa(e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="N° de HES"
                        value={nuevoNumHes}
                        onChange={(e) => setNuevoNumHes(e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                      />
                    </div>

                    <div className="pt-2">
                      <label className="block text-gray-600 font-semibold mb-1 text-[11px]">
                        Adjuntar documento (PDF o Foto del Acta):
                      </label>
                      <input
                        type="file"
                        accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) procesarArchivoTab(f);
                        }}
                        className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-[#051A59]"
                      />
                      {archivoTab && (
                        <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                          ✓ Archivo seleccionado: {archivoTab.name} ({archivoTabTipo === "image" ? "Foto" : "PDF"})
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleGuardarActaHes}
                      className="bg-[#051A59] hover:bg-[#031240] text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer"
                    >
                      Actualizar Acta / HES y Guardar en Drive
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 9: FACTURACION */}
              {tabActiva === "facturacion" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-[#031240]">Facturación Emitida</h3>
                  <div className="p-4 bg-gray-50 rounded border space-y-3">
                    {expSeleccionado.facturaNumero ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div><strong>Factura N°:</strong> {expSeleccionado.facturaNumero}</div>
                            <div><strong>Fecha:</strong> {expSeleccionado.facturaFecha}</div>
                            <div><strong>Monto:</strong> {expSeleccionado.moneda} {expSeleccionado.facturaMonto?.toFixed(2)}</div>
                          </div>
                          {expSeleccionado.facturaDocNombre && (
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-blue-200 shadow-xs">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                expSeleccionado.facturaDocTipo === "image" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                              }`}>
                                {expSeleccionado.facturaDocTipo === "image" ? "📸 FOTO" : "📄 PDF"}
                              </span>
                              <span className="font-mono text-xs text-gray-700 truncate max-w-[150px]">
                                {expSeleccionado.facturaDocNombre}
                              </span>
                              <button
                                onClick={() => setVisorDoc({
                                  abierto: true,
                                  titulo: `Factura ${expSeleccionado.facturaNumero} - ${expSeleccionado.clienteNombre}`,
                                  nombre: expSeleccionado.facturaDocNombre || "FACTURA.pdf",
                                  tipo: expSeleccionado.facturaDocTipo || "pdf",
                                  url: expSeleccionado.facturaDocUrl,
                                  carpeta: "06_FACTURACION",
                                })}
                                className="bg-[#051A59] text-white px-2 py-0.5 rounded text-[11px] font-semibold hover:bg-[#031240]"
                              >
                                👁 Ver
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Cambiar o adjuntar factura */}
                        <div className="pt-2 border-t">
                          <label className="block text-gray-600 font-semibold mb-1 text-[11px]">
                            Actualizar documento (PDF o Foto de Factura):
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="file"
                              accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) procesarArchivoTab(f);
                              }}
                              className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-[#051A59]"
                            />
                            {archivoTab && (
                              <button
                                onClick={handleGuardarFactura}
                                className="bg-[#051A59] text-white px-3 py-1 rounded text-xs font-semibold"
                              >
                                Guardar Documento
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-gray-500">No se ha emitido factura aún.</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Ej: F001-0004925"
                            value={nuevoNumFactura}
                            onChange={(e) => setNuevoNumFactura(e.target.value)}
                            className="border rounded px-2.5 py-1 text-xs"
                          />
                          <input
                            type="file"
                            accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) procesarArchivoTab(f);
                            }}
                            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-[#051A59]"
                          />
                        </div>
                        <button
                          onClick={handleGuardarFactura}
                          className="bg-[#051A59] text-white px-3 py-1 rounded font-semibold text-xs"
                        >
                          Registrar Factura y Subir a Drive
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 10: PAGOS */}
              {tabActiva === "pagos" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-[#031240]">Pagos y Cobranzas</h3>
                  <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded border">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Total Facturado</span>
                      <span className="font-bold">{expSeleccionado.moneda} {expSeleccionado.total.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Total Pagado</span>
                      <span className="font-bold text-emerald-700">{expSeleccionado.moneda} {expSeleccionado.pagosTotal.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Saldo Pendiente</span>
                      <span className="font-bold text-amber-700">{expSeleccionado.moneda} {expSeleccionado.saldoPendiente.toFixed(2)}</span>
                    </div>
                  </div>

                  {expSeleccionado.comprobantePagoDoc && (
                    <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🧾</span>
                        <div>
                          <div className="font-semibold text-emerald-900">Voucher / Comprobante de Pago</div>
                          <div className="text-[11px] font-mono text-emerald-700">07_PAGOS/{expSeleccionado.comprobantePagoDoc}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setVisorDoc({
                          abierto: true,
                          titulo: `Comprobante de Pago - ${expSeleccionado.clienteNombre}`,
                          nombre: expSeleccionado.comprobantePagoDoc || "VOUCHER.jpg",
                          tipo: expSeleccionado.comprobantePagoTipo || "image",
                          url: expSeleccionado.comprobantePagoUrl,
                          carpeta: "07_PAGOS",
                        })}
                        className="bg-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-emerald-800"
                      >
                        👁 Ver Voucher
                      </button>
                    </div>
                  )}

                  {expSeleccionado.saldoPendiente > 0 ? (
                    <div className="p-4 bg-white border border-gray-200 rounded space-y-3">
                      <h4 className="font-semibold text-gray-800">Registrar Nuevo Abono / Pago Parcial:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-600 mb-1">Monto a abonar ({expSeleccionado.moneda}):</label>
                          <input
                            type="number"
                            step="0.01"
                            max={expSeleccionado.saldoPendiente}
                            value={montoPago}
                            onChange={(e) => setMontoPago(Number(e.target.value))}
                            className="w-full border rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1">Comprobante / N° Operación:</label>
                          <input
                            type="text"
                            value={comprobantePago}
                            onChange={(e) => setComprobantePago(e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-600 mb-1 font-semibold text-[11px]">
                          Adjuntar Voucher (Foto o PDF de transferencia):
                        </label>
                        <input
                          type="file"
                          accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) procesarArchivoTab(f);
                          }}
                          className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800"
                        />
                        {archivoTab && (
                          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                            ✓ Voucher adjunto: {archivoTab.name}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleRegistrarPagoModal}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded font-semibold text-xs cursor-pointer"
                      >
                        Confirmar Pago y Guardar Voucher en Drive
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded font-semibold text-xs">
                      ✓ Expediente cancelado en su totalidad. Saldo pendiente: 0.00.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-3 bg-gray-100 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setExpSeleccionado(null)}
                className="bg-gray-700 text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-gray-800 cursor-pointer"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISOR MODAL DENTRO DE EXPEDIENTE */}
      <DocumentModal
        isOpen={visorDoc.abierto}
        onClose={() => setVisorDoc({ abierto: false, titulo: "", nombre: "", tipo: "pdf", carpeta: "01_COTIZACION" })}
        titulo={visorDoc.titulo}
        nombreArchivo={visorDoc.nombre}
        tipoArchivo={visorDoc.tipo}
        url={visorDoc.url}
        carpetaDrive={visorDoc.carpeta}
        detalles={
          expSeleccionado
            ? [
                { etiqueta: "Expediente", valor: expSeleccionado.codigo },
                { etiqueta: "Cliente", valor: expSeleccionado.clienteNombre },
                { etiqueta: "Monto Total", valor: `${expSeleccionado.moneda} ${expSeleccionado.total.toFixed(2)}` },
              ]
            : []
        }
      />
    </div>
  );
}
