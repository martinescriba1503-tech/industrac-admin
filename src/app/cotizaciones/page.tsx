"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useApp } from "@/lib/app-context";
import { DatosCotizacionExtraidos, parsearEstructuraDocumento } from "@/lib/pdf-extractor";

type ModalPaso = "adjuntar" | "procesando" | "verificar";

export default function CotizacionesPage() {
  const { cotizaciones, clientes, agregarCotizacion, agregarCliente, eliminarCotizacion, mostrarNotificacion } = useApp();

  // Filtros de listado
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  // Estado para confirmación de eliminación
  const [cotizacionAEliminar, setCotizacionAEliminar] = useState<any>(null);
  const [eliminarExpedienteJunto, setEliminarExpedienteJunto] = useState(true);

  // Modal Nueva Cotización
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pasoModal, setPasoModal] = useState<ModalPaso>("adjuntar");
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
  const [descripcionDocumento, setDescripcionDocumento] = useState("");
  const [estaArrastrando, setEstaArrastrando] = useState(false);
  const [errorLectura, setErrorLectura] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulario de Verificación (Campos extraídos y editables)
  const [formNumero, setFormNumero] = useState("");
  const [formFecha, setFormFecha] = useState("");
  const [formClienteNombre, setFormClienteNombre] = useState("");
  const [formRuc, setFormRuc] = useState("");
  const [formClienteId, setFormClienteId] = useState("");
  const [modoNuevoCliente, setModoNuevoCliente] = useState(false);
  const [formEquipoModelo, setFormEquipoModelo] = useState("");
  const [formSerie, setFormSerie] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formMoneda, setFormMoneda] = useState<"USD" | "PEN">("USD");
  const [formSubtotal, setFormSubtotal] = useState<string>("");
  const [formIgv, setFormIgv] = useState<string>("");
  const [formTotal, setFormTotal] = useState<string>("");
  const [formCondicionPago, setFormCondicionPago] = useState("");
  const [formValidezOferta, setFormValidezOferta] = useState("");
  const [advertenciasExtraccion, setAdvertenciasExtraccion] = useState<string[]>([]);
  const [origenExtraccion, setOrigenExtraccion] = useState<{
    estructuraDetectada: boolean;
    descripcionUsada: string;
  }>({ estructuraDetectada: false, descripcionUsada: "" });

  // Expediente recién creado para acceso directo
  const [expedienteCreadoId, setExpedienteCreadoId] = useState<string | null>(null);

  // Visor PDF Modal
  const [pdfVisorNombre, setPdfVisorNombre] = useState<string | null>(null);
  const [pdfVisorUrl, setPdfVisorUrl] = useState<string | null>(null);

  // Reset del modal al estado inicial
  const resetearModal = () => {
    setModalAbierto(false);
    setPasoModal("adjuntar");
    setArchivoPdf(null);
    setDescripcionDocumento("");
    setErrorLectura(null);
    setFormNumero("");
    setFormFecha("");
    setFormClienteNombre("");
    setFormRuc("");
    setFormClienteId("");
    setModoNuevoCliente(false);
    setFormEquipoModelo("");
    setFormSerie("");
    setFormDescripcion("");
    setFormMoneda("USD");
    setFormSubtotal("");
    setFormIgv("");
    setFormTotal("");
    setFormCondicionPago("");
    setFormValidezOferta("");
    setAdvertenciasExtraccion([]);
    setOrigenExtraccion({ estructuraDetectada: false, descripcionUsada: "" });
    setExpedienteCreadoId(null);
  };

  // Abrir modal fresco
  const abrirModalNuevo = () => {
    resetearModal();
    setModalAbierto(true);
  };

  // Procesamiento del archivo PDF mediante la API
  const procesarArchivoPdf = async (archivo: File, descManual?: string) => {
    setErrorLectura(null);

    // Validación estricta: Solo PDF
    if (!archivo.name.toLowerCase().endsWith(".pdf")) {
      setErrorLectura("Formato no admitido. Debe adjuntar un documento PDF válido (.pdf).");
      return;
    }

    if (archivo.size === 0) {
      setErrorLectura("El archivo adjuntado está vacío (0 bytes).");
      return;
    }

    setArchivoPdf(archivo);
    setPasoModal("procesando");

    try {
      const formData = new FormData();
      formData.append("file", archivo);

      // Usar descripción manual si se ingresó o el nombre de archivo
      const descUsada = descManual || descripcionDocumento || archivo.name.replace(/\.pdf$/i, "");
      if (descUsada) {
        formData.append("descripcionDocumento", descUsada);
      }

      const resp = await fetch("/api/cotizaciones/extraer-pdf", {
        method: "POST",
        body: formData,
      });

      const respText = await resp.text();
      let data: any = null;
      try {
        data = respText ? JSON.parse(respText) : null;
      } catch {
        // Si no vino JSON, procesar con la estructura del documento localmente
        console.warn("Respuesta no JSON del servidor:", respText);
      }

      let d: DatosCotizacionExtraidos | null = data?.datos || null;

      if (!resp.ok && !d) {
        // Fallback resiliente: usar la estructura del documento oficial si el backend falló o demoró
        const fallbackEst = parsearEstructuraDocumento(descUsada);
        if (fallbackEst) {
          d = {
            numero: fallbackEst.numero || "",
            cliente: fallbackEst.cliente || "",
            descripcion: fallbackEst.descripcion || descUsada,
            fecha: fallbackEst.fecha || new Date().toISOString().split("T")[0],
            equipoModelo: fallbackEst.equipoModelo || "",
            serie: fallbackEst.serie || "",
            ruc: "",
            moneda: "USD",
            subtotal: null,
            igv: null,
            total: null,
            condicionPago: "",
            validezOferta: "",
            coherenciaMontos: true,
            advertencias: [
              "Datos principales extraídos de la nomenclatura oficial INDUSTRAC. Por favor complete los importes.",
            ],
          };
        } else {
          throw new Error(data?.error || `Error en el servidor (${resp.status}). Intente nuevamente.`);
        }
      }

      if (!d) {
        throw new Error("No se pudo obtener información de la cotización.");
      }

      // Verificar si coincidió con la estructura oficial
      const testEstructura = parsearEstructuraDocumento(descUsada);
      setOrigenExtraccion({
        estructuraDetectada: Boolean(testEstructura),
        descripcionUsada: descUsada,
      });

      // Asignar campos extraídos (sin inventar datos, respetando vacíos)
      setFormNumero(d.numero || "");
      setFormFecha(d.fecha || "");
      setFormRuc(d.ruc || "");
      setFormEquipoModelo(d.equipoModelo || "");
      setFormSerie(d.serie || "");
      setFormMoneda(d.moneda === "PEN" ? "PEN" : "USD");
      setFormSubtotal(d.subtotal !== null ? d.subtotal.toString() : "");
      setFormIgv(d.igv !== null ? d.igv.toString() : "");
      setFormTotal(d.total !== null ? d.total.toString() : "");
      setFormCondicionPago(d.condicionPago || "");
      setFormValidezOferta(d.validezOferta || "");
      setFormDescripcion(d.descripcion || "");
      setAdvertenciasExtraccion(d.advertencias || []);

      // Intentar vincular cliente automáticamente por RUC o por Razón Social
      let clienteEncontrado = null;
      if (d.ruc) {
        clienteEncontrado = clientes.find((c) => c.ruc === d.ruc);
      }
      if (!clienteEncontrado && d.cliente) {
        const busq = d.cliente.toLowerCase();
        clienteEncontrado = clientes.find(
          (c) =>
            c.razonSocial.toLowerCase().includes(busq) ||
            busq.includes(c.razonSocial.toLowerCase())
        );
      }

      if (clienteEncontrado) {
        setFormClienteId(clienteEncontrado.id);
        setFormClienteNombre(clienteEncontrado.razonSocial);
        if (!d.ruc && clienteEncontrado.ruc) {
          setFormRuc(clienteEncontrado.ruc);
        }
        setModoNuevoCliente(false);
      } else {
        setFormClienteNombre(d.cliente || "");
        if (clientes.length > 0) {
          setFormClienteId(clientes[0].id);
        }
        setModoNuevoCliente(Boolean(d.cliente));
      }

      // Pasar a la pantalla de verificación
      setPasoModal("verificar");
    } catch (err) {
      console.error(err);
      setErrorLectura(
        err instanceof Error
          ? err.message
          : "Error al procesar el PDF. Asegúrese de que sea legible o no esté protegido por contraseña."
      );
      setPasoModal("adjuntar");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const nombreSinExt = file.name.replace(/\.pdf$/i, "");
      setDescripcionDocumento(nombreSinExt);
      procesarArchivoPdf(file, nombreSinExt);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setEstaArrastrando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const nombreSinExt = file.name.replace(/\.pdf$/i, "");
      setDescripcionDocumento(nombreSinExt);
      procesarArchivoPdf(file, nombreSinExt);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setEstaArrastrando(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setEstaArrastrando(false);
  };

  // Validaciones del formulario de verificación
  const numeroNormalizado = formNumero.trim().toUpperCase();
  const esNumeroDuplicado = cotizaciones.some(
    (c) => c.numero.trim().toUpperCase() === numeroNormalizado
  );

  const subNum = parseFloat(formSubtotal) || 0;
  const igvNum = parseFloat(formIgv) || 0;
  const totNum = parseFloat(formTotal) || 0;
  const sumaEsperada = Math.round((subNum + igvNum) * 100) / 100;
  const montosCoherentes =
    subNum > 0 && totNum > 0 ? Math.abs(sumaEsperada - totNum) < 0.05 : true;

  // Confirmar y crear cotización + expediente
  const handleConfirmarYCrearExpediente = (e: React.FormEvent) => {
    e.preventDefault();

    if (!numeroNormalizado) {
      alert("Por favor ingrese o verifique el número de cotización.");
      return;
    }

    if (esNumeroDuplicado) {
      alert(
        `Ya existe una cotización registrada con el identificador "${numeroNormalizado}". Modifíquelo para evitar duplicar el expediente.`
      );
      return;
    }

    let finalClienteId = formClienteId;
    let finalClienteNombre = formClienteNombre;

    // Si se optó por registrar un nuevo cliente
    if (modoNuevoCliente) {
      if (!formClienteNombre.trim()) {
        alert("Ingrese la Razón Social del nuevo cliente.");
        return;
      }
      const nuevoCliente = agregarCliente({
        razonSocial: formClienteNombre.trim(),
        ruc: formRuc.trim(),
        contacto: "Contacto comercial",
        telefono: "",
      });
      finalClienteId = nuevoCliente.id;
      finalClienteNombre = nuevoCliente.razonSocial;
    } else {
      const cObj = clientes.find((c) => c.id === formClienteId);
      if (cObj) {
        finalClienteNombre = cObj.razonSocial;
      }
    }

    const sub = subNum;
    const igv = igvNum;
    const tot = totNum > 0 ? totNum : Math.round((sub + igv) * 100) / 100;

    const nombrePdfFinal = archivoPdf ? archivoPdf.name : `${numeroNormalizado}.pdf`;
    const driveFolderUrl = `https://drive.google.com/drive/folders/01_COTIZACION/${encodeURIComponent(
      nombrePdfFinal
    )}`;

    const { expedienteId } = agregarCotizacion({
      numero: numeroNormalizado,
      clienteId: finalClienteId,
      clienteNombre: finalClienteNombre,
      fecha: formFecha || new Date().toISOString().split("T")[0],
      equipoModelo: formEquipoModelo.trim() || "Compresor Industrial",
      serie: formSerie.trim(),
      descripcion: formDescripcion.trim() || "Servicio cotizado según documento PDF adjunto.",
      moneda: formMoneda,
      subtotal: sub,
      igv,
      total: tot,
      estado: "Pendiente",
      pdfNombre: nombrePdfFinal,
      pdfUrl: driveFolderUrl,
      condicionPago: formCondicionPago.trim(),
      validezOferta: formValidezOferta.trim(),
    });

    setExpedienteCreadoId(expedienteId);
    mostrarNotificacion(
      `✓ Cotización ${numeroNormalizado} confirmada. Expediente administrativo creado exitosamente.`
    );
  };

  // Filtrado de la tabla
  const cotizacionesFiltradas = cotizaciones.filter((c) => {
    const coincideTexto =
      c.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.fecha.includes(busqueda) ||
      c.equipoModelo.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado = filtroEstado === "TODOS" || c.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240]">
            Módulo de Cotizaciones
          </h1>
          <p className="text-xs text-gray-600">
            Registro automático por descripción de documento (ej: 00100 COT QROMA 8000 HRS GA55 26MAY26) y extracción de montos (TOTAL, IGV, TOTAL+IGV) desde el PDF.
          </p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="inline-flex items-center gap-1.5 bg-[#051A59] hover:bg-[#031240] text-white px-4 py-2 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <span className="text-sm font-bold">+</span> NUEVA COTIZACIÓN
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Buscar por número, cliente o equipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#F2F2F2] border border-gray-200 rounded px-3 py-1.5 pl-8 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
          />
          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-gray-600 font-medium">Estado:</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-[#F2F2F2] border border-gray-200 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
            <option value="Requiere modificación">Requiere modificación</option>
          </select>
        </div>
      </div>

      {/* Tabla de Cotizaciones */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Número</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Equipo / Serie</th>
                <th className="py-3 px-4">Importe</th>
                <th className="py-3 px-4">Documento</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cotizacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 text-xs">
                    No se encontraron cotizaciones con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                cotizacionesFiltradas.map((cot) => (
                  <tr key={cot.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#051A59]">
                      {cot.numero}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{cot.fecha}</td>
                    <td className="py-3 px-4 font-medium text-gray-900 max-w-[170px] truncate">
                      {cot.clienteNombre}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="font-medium text-gray-800">{cot.equipoModelo}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        S/N: {cot.serie || "N/A"}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <div>
                        {cot.moneda} {cot.total.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-400 font-normal">
                        Sub: {cot.subtotal.toFixed(2)} + IGV
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {cot.pdfNombre ? (
                        <button
                          onClick={() => {
                            setPdfVisorNombre(cot.pdfNombre || "Cotizacion.pdf");
                            setPdfVisorUrl(cot.pdfUrl || null);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-[#18A2D9] hover:text-[#051A59] hover:underline font-medium cursor-pointer"
                        >
                          <span>📄</span> <span className="max-w-[130px] truncate">{cot.pdfNombre}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400">Sin PDF</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                          cot.estado === "Aprobada"
                            ? "bg-emerald-100 text-emerald-800"
                            : cot.estado === "Pendiente"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {cot.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          href="/expedientes"
                          className="text-xs text-[#051A59] hover:text-[#18A2D9] font-semibold hover:underline"
                        >
                          Ver Expediente →
                        </Link>
                        <button
                          type="button"
                          onClick={() => setCotizacionAEliminar(cot)}
                          className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-semibold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title="Eliminar esta cotización"
                        >
                          <span>🗑️</span>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: REGISTRO DE COTIZACIÓN (3 MOMENTOS DIFERENCIADOS)       */}
      {/* ============================================================== */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* ETAPA 1: ADJUNTAR PDF (VENTANA SENCILLA) */}
            {pasoModal === "adjuntar" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-gray-200">
                  <h2 className="text-base font-bold text-[#031240] flex items-center gap-2">
                    <span className="text-[#18A2D9] text-lg">📄</span>
                    Registrar nueva cotización
                  </h2>
                  <button
                    onClick={resetearModal}
                    className="text-gray-400 hover:text-gray-700 text-base font-bold p-1 cursor-pointer"
                    title="Cerrar"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-gray-600 font-medium">
                  Adjunte el documento PDF de la cotización. Los datos se extraen de la descripción del documento y los importes (TOTAL, IGV, TOTAL+IGV) desde el interior del PDF.
                </p>

                {errorLectura && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                    <span className="text-sm">⚠️</span>
                    <div>
                      <div className="font-semibold">No se pudo procesar el archivo</div>
                      <div className="text-[11px] text-rose-700 mt-0.5">{errorLectura}</div>
                    </div>
                  </div>
                )}

                {/* Zona de Drop & Upload */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    estaArrastrando
                      ? "border-[#18A2D9] bg-sky-50/50 scale-[1.01]"
                      : "border-gray-300 hover:border-[#18A2D9] bg-[#F2F2F2] hover:bg-sky-50/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white shadow-xs flex items-center justify-center text-2xl text-[#051A59]">
                    📂
                  </div>
                  <div className="text-sm font-bold text-[#031240]">
                    Seleccione o arrastre el archivo PDF aquí
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Solo documentos en formato <strong className="text-gray-700">PDF</strong>
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-[#051A59] hover:bg-[#031240] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs">
                    <span>Examinar documento PDF</span>
                  </div>
                </div>

                {/* Guía y Campo Opcional de Estructura de Documento */}
                <div className="bg-[#F2F2F2] rounded-lg p-3 border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-gray-700 font-bold text-[11px]">
                      Descripción / Nombre del Documento:
                    </label>
                    <span className="text-[10px] text-[#18A2D9] font-semibold bg-white px-2 py-0.5 rounded border border-gray-200">
                      Estructura INDUSTRAC
                    </span>
                  </div>
                  <input
                    type="text"
                    value={descripcionDocumento}
                    onChange={(e) => setDescripcionDocumento(e.target.value)}
                    placeholder="Ej: 00100 COT QROMA 8000 HRS GA55 EQUIPO #1 26MAY26"
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] font-mono focus:outline-none focus:border-[#18A2D9]"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] text-gray-600 bg-white p-2 rounded border border-gray-200">
                    <div>
                      <span className="font-bold text-[#051A59]">00100:</span> N° Cotización
                    </div>
                    <div>
                      <span className="font-bold text-[#051A59]">QROMA:</span> Cliente
                    </div>
                    <div>
                      <span className="font-bold text-[#051A59]">8000 HRS GA55:</span> Descripción / Equipo
                    </div>
                    <div>
                      <span className="font-bold text-[#051A59]">26MAY26:</span> Fecha
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-800 font-medium flex items-center gap-1">
                    <span>✓</span>
                    <span>Los importes (TOTAL, IGV y TOTAL+IGV) se extraen automáticamente del contenido del PDF.</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetearModal}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA DE PROCESAMIENTO ACTIVO */}
            {pasoModal === "procesando" && (
              <div className="py-12 px-6 text-center space-y-4">
                <div className="inline-block animate-spin text-4xl text-[#18A2D9]">
                  🔄
                </div>
                <h3 className="text-base font-bold text-[#031240]">
                  Analizando cotización...
                </h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  Extrayendo datos de la descripción estructurada e importes (TOTAL, IGV, TOTAL+IGV) desde el PDF.
                </p>
                <div className="w-48 h-1.5 bg-gray-100 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#18A2D9] to-[#051A59] animate-pulse rounded-full w-full"></div>
                </div>
                {archivoPdf && (
                  <div className="text-[11px] text-gray-400 font-mono">
                    Archivo: {archivoPdf.name}
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 2: VERIFICAR INFORMACIÓN DE LA COTIZACIÓN */}
            {pasoModal === "verificar" && (
              <div className="space-y-4">
                {/* Pantalla de Éxito Post-Creación */}
                {expedienteCreadoId ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
                      ✓
                    </div>
                    <h3 className="text-base font-bold text-[#031240]">
                      ¡Cotización y Expediente Registrados con Éxito!
                    </h3>
                    <p className="text-xs text-gray-600 max-w-md mx-auto">
                      La cotización <strong className="text-[#051A59] font-mono">{formNumero}</strong> ha sido incorporada al sistema. Se generó su carpeta documental correspondiente en Google Drive (<code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">01_COTIZACION</code>).
                    </p>
                    <div className="flex justify-center gap-3 pt-3">
                      <button
                        onClick={resetearModal}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-xs font-semibold"
                      >
                        Cerrar
                      </button>
                      <Link
                        href="/expedientes"
                        className="bg-[#051A59] hover:bg-[#031240] text-white px-5 py-2 rounded text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
                      >
                        Ir a Ver Expedientes →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmarYCrearExpediente} className="space-y-4 text-xs">
                    {/* Encabezado */}
                    <div className="flex items-center justify-between border-b pb-3 border-gray-200">
                      <div>
                        <h2 className="text-base font-bold text-[#031240]">
                          Verificar información de la cotización
                        </h2>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Datos extraídos de la estructura del documento y montos contables del PDF.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetearModal}
                        className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Resumen de Estructura Detectada */}
                    {origenExtraccion.estructuraDetectada && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px] text-emerald-900 flex items-start gap-2">
                        <span className="text-base">✨</span>
                        <div>
                          <div className="font-bold">Estructura INDUSTRAC identificada con éxito:</div>
                          <div className="font-mono text-[10px] text-emerald-800 break-all">
                            {origenExtraccion.descripcionUsada}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resumen del PDF Adjuntado */}
                    <div className="bg-[#F2F2F2] rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-lg text-[#051A59]">📑</span>
                        <div className="truncate">
                          <div className="font-semibold text-[#031240] text-xs truncate">
                            {archivoPdf?.name || `${formNumero || "Cotizacion"}.pdf`}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {archivoPdf ? `${(archivoPdf.size / 1024).toFixed(1)} KB` : "Documento analizado"} • Carpeta Google Drive: <code className="text-[#051A59]">01_COTIZACION</code>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPasoModal("adjuntar");
                          setArchivoPdf(null);
                        }}
                        className="text-[11px] text-[#18A2D9] hover:text-[#051A59] font-medium hover:underline shrink-0 ml-2 cursor-pointer"
                      >
                        Cambiar archivo PDF
                      </button>
                    </div>

                    {/* Alerta de Cotización Duplicada */}
                    {esNumeroDuplicado && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                        <span className="text-base">⚠️</span>
                        <div>
                          <div className="font-bold">Número de cotización ya existente</div>
                          <div className="text-[11px] text-amber-800 mt-0.5">
                            Ya existe una cotización registrada con el código <strong>{numeroNormalizado}</strong> en el sistema. Para evitar duplicar el expediente, modifique el identificador o verifique el documento.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Alerta de Coherencia de Montos */}
                    {!montosCoherentes && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                        <span className="text-sm">⚠️</span>
                        <div>
                          <div className="font-semibold">Discrepancia en importes detectada</div>
                          <div className="text-[11px] text-rose-700">
                            TOTAL antes de IGV ({formSubtotal}) + IGV ({formIgv}) = {sumaEsperada.toFixed(2)}, pero TOTAL + IGV es {totNum.toFixed(2)}. Puede corregir los valores antes de confirmar.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Advertencias de extracción no bloqueantes */}
                    {advertenciasExtraccion.length > 0 && !esNumeroDuplicado && (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-[11px]">
                        <div className="font-semibold text-blue-950">Observaciones de extracción:</div>
                        <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-blue-800">
                          {advertenciasExtraccion.map((adv, idx) => (
                            <li key={idx}>{adv}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Formulario de Campos Extraídos Editables */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                      {/* Número de cotización */}
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Número de Cotización: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formNumero}
                          onChange={(e) => setFormNumero(e.target.value)}
                          placeholder="Ej: 00100"
                          className={`w-full border rounded px-2.5 py-1.5 text-xs text-[#031240] font-mono focus:outline-none ${
                            esNumeroDuplicado
                              ? "border-rose-400 bg-rose-50/30"
                              : "border-gray-300 focus:border-[#18A2D9]"
                          }`}
                        />
                      </div>

                      {/* Fecha de Emisión */}
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Fecha de Emisión:
                        </label>
                        <input
                          type="date"
                          value={formFecha}
                          onChange={(e) => setFormFecha(e.target.value)}
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
                        />
                      </div>

                      {/* Cliente y RUC */}
                      <div className="sm:col-span-2 bg-[#F2F2F2]/60 p-3 rounded-lg border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-gray-800 font-bold text-xs">
                            Identificación del Cliente
                          </label>
                          <button
                            type="button"
                            onClick={() => setModoNuevoCliente(!modoNuevoCliente)}
                            className="text-[11px] text-[#18A2D9] hover:underline font-medium cursor-pointer"
                          >
                            {modoNuevoCliente
                              ? "← Seleccionar cliente existente"
                              : "+ Registrar como nuevo cliente"}
                          </button>
                        </div>

                        {modoNuevoCliente ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-gray-600 text-[11px] mb-0.5">
                                Razón Social: <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={formClienteNombre}
                                onChange={(e) => setFormClienteNombre(e.target.value)}
                                placeholder="Ej: QROMA"
                                className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-600 text-[11px] mb-0.5">
                                RUC (11 dígitos):
                              </label>
                              <input
                                type="text"
                                maxLength={11}
                                value={formRuc}
                                onChange={(e) => setFormRuc(e.target.value)}
                                placeholder="Ej: 20501234567"
                                className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-gray-600 text-[11px] mb-0.5">
                                Cliente Seleccionado / Vinculado:
                              </label>
                              <select
                                value={formClienteId}
                                onChange={(e) => {
                                  setFormClienteId(e.target.value);
                                  const c = clientes.find((item) => item.id === e.target.value);
                                  if (c) {
                                    setFormClienteNombre(c.razonSocial);
                                    setFormRuc(c.ruc);
                                  }
                                }}
                                className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
                              >
                                {clientes.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.razonSocial} (RUC: {c.ruc})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-600 text-[11px] mb-0.5">
                                Nombre asignado a la Cotización:
                              </label>
                              <input
                                type="text"
                                value={formClienteNombre}
                                onChange={(e) => setFormClienteNombre(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Equipo / Modelo */}
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Equipo / Modelo:
                        </label>
                        <input
                          type="text"
                          value={formEquipoModelo}
                          onChange={(e) => setFormEquipoModelo(e.target.value)}
                          placeholder="Ej: GA55"
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
                        />
                      </div>

                      {/* Número de Serie */}
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Número de Serie / Identificador:
                        </label>
                        <input
                          type="text"
                          value={formSerie}
                          onChange={(e) => setFormSerie(e.target.value)}
                          placeholder="Ej: EQUIPO #1"
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
                        />
                      </div>

                      {/* SECCIÓN DE MONTOS EXTRAÍDOS DEL PDF */}
                      <div className="sm:col-span-2 bg-[#F2F2F2]/60 p-3 rounded-lg border border-gray-200">
                        <div className="font-bold text-[#031240] text-xs mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>💰</span>
                            <span>Montos Extraídos del PDF (TOTAL, IGV y TOTAL + IGV)</span>
                          </span>
                          <span className="text-[10px] font-normal">
                            {montosCoherentes && totNum > 0 ? (
                              <span className="text-emerald-700 font-semibold">✓ Coherencia verificada</span>
                            ) : null}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-gray-600 text-[11px] mb-0.5">Moneda:</label>
                            <select
                              value={formMoneda}
                              onChange={(e) => setFormMoneda(e.target.value as "USD" | "PEN")}
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-[#031240]"
                            >
                              <option value="USD">USD ($)</option>
                              <option value="PEN">PEN (S/)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-gray-600 text-[11px] mb-0.5 font-semibold text-[#031240]">
                              TOTAL (antes de IGV):
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formSubtotal}
                              onChange={(e) => setFormSubtotal(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-[#031240] font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 text-[11px] mb-0.5 font-semibold text-[#031240]">
                              IGV:
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formIgv}
                              onChange={(e) => setFormIgv(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-[#031240] font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 text-[11px] mb-0.5 font-bold text-[#051A59]">
                              TOTAL + IGV:
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formTotal}
                              onChange={(e) => setFormTotal(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-white border border-[#051A59] rounded px-2 py-1.5 text-xs text-[#051A59] font-bold font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Descripción del Servicio */}
                      <div className="sm:col-span-2">
                        <label className="block text-gray-700 font-semibold mb-1">
                          Descripción del Servicio Cotizado:
                        </label>
                        <textarea
                          rows={2}
                          value={formDescripcion}
                          onChange={(e) => setFormDescripcion(e.target.value)}
                          placeholder="Ej: 8000 HRS GA55 EQUIPO #1"
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
                        />
                      </div>

                      {/* Condición de Pago */}
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Condición de Pago (si figura):
                        </label>
                        <input
                          type="text"
                          value={formCondicionPago}
                          onChange={(e) => setFormCondicionPago(e.target.value)}
                          placeholder="Ej: 30 días factura / Contado"
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
                        />
                      </div>

                      {/* Validez de Oferta */}
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          Validez de Oferta (si figura):
                        </label>
                        <input
                          type="text"
                          value={formValidezOferta}
                          onChange={(e) => setFormValidezOferta(e.target.value)}
                          placeholder="Ej: 15 días calendario"
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
                        />
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={resetearModal}
                        className="px-4 py-2 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPasoModal("adjuntar");
                            setArchivoPdf(null);
                          }}
                          className="px-3 py-2 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                          Volver a subir PDF
                        </button>
                        <button
                          type="submit"
                          disabled={esNumeroDuplicado || !formNumero.trim()}
                          className={`px-5 py-2 rounded text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 ${
                            esNumeroDuplicado || !formNumero.trim()
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-[#051A59] hover:bg-[#031240] text-white cursor-pointer"
                          }`}
                        >
                          <span>Confirmar y crear expediente</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: VISOR DE DOCUMENTO PDF                                  */}
      {/* ============================================================== */}
      {pdfVisorNombre && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="font-bold text-sm text-[#031240] flex items-center gap-2 truncate">
                <span>📄</span> <span className="truncate">{pdfVisorNombre}</span>
              </div>
              <button
                onClick={() => {
                  setPdfVisorNombre(null);
                  setPdfVisorUrl(null);
                }}
                className="text-gray-500 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="bg-[#F2F2F2] rounded p-6 text-center border border-gray-200 space-y-3">
              <div className="text-3xl">📑</div>
              <div className="text-xs font-semibold text-[#031240]">
                Documento de Cotización Oficial INDUSTRAC
              </div>
              <p className="text-[11px] text-gray-600 max-w-md mx-auto">
                Este archivo corresponde a la cotización registrada. Se encuentra resguardado en la estructura documental de Google Drive:
              </p>
              <div className="bg-white p-2 rounded border border-gray-200 font-mono text-[10px] text-[#051A59] max-w-sm mx-auto truncate">
                {pdfVisorUrl || `Google Drive / Expedientes / 01_COTIZACION / ${pdfVisorNombre}`}
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => {
                    setPdfVisorNombre(null);
                    setPdfVisorUrl(null);
                  }}
                  className="bg-[#051A59] text-white px-4 py-1.5 rounded text-xs font-medium cursor-pointer"
                >
                  Cerrar
                </button>
                {cotizaciones.find(c => c.pdfNombre === pdfVisorNombre) && (
                  <button
                    onClick={() => {
                      const c = cotizaciones.find(item => item.pdfNombre === pdfVisorNombre);
                      if (c) {
                        setCotizacionAEliminar(c);
                      }
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded text-xs font-medium cursor-pointer flex items-center gap-1"
                  >
                    <span>🗑️</span>
                    <span>Eliminar cotización</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE COTIZACIÓN                     */}
      {/* ============================================================== */}
      {cotizacionAEliminar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-xl shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#031240]">¿Eliminar cotización?</h3>
                <p className="text-[11px] text-gray-500">
                  Esta acción retirará la cotización del sistema.
                </p>
              </div>
            </div>

            <div className="bg-[#F2F2F2] p-3 rounded-lg border border-gray-200 text-xs text-gray-700 space-y-1">
              <div>
                <span className="text-gray-500">N° Cotización:</span>{" "}
                <strong className="text-[#051A59] font-mono">{cotizacionAEliminar.numero}</strong>
              </div>
              <div>
                <span className="text-gray-500">Cliente:</span>{" "}
                <strong>{cotizacionAEliminar.clienteNombre}</strong>
              </div>
              <div>
                <span className="text-gray-500">Equipo:</span>{" "}
                <span>{cotizacionAEliminar.equipoModelo}</span>
              </div>
              <div>
                <span className="text-gray-500">Importe Total:</span>{" "}
                <strong className="text-emerald-700">
                  {cotizacionAEliminar.moneda} {cotizacionAEliminar.total.toFixed(2)}
                </strong>
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer pt-1 bg-rose-50/50 p-2.5 rounded border border-rose-200">
              <input
                type="checkbox"
                checked={eliminarExpedienteJunto}
                onChange={(e) => setEliminarExpedienteJunto(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span>
                Eliminar también el <strong>expediente administrativo</strong> asociado generado por esta cotización.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCotizacionAEliminar(null)}
                className="px-4 py-2 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  eliminarCotizacion(cotizacionAEliminar.id, eliminarExpedienteJunto);
                  if (pdfVisorNombre === cotizacionAEliminar.pdfNombre) {
                    setPdfVisorNombre(null);
                  }
                  setCotizacionAEliminar(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Sí, eliminar documento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
