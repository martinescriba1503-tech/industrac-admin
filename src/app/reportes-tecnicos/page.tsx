"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import Link from "next/link";

export default function ReportesTecnicosPage() {
  const { expedientes, adjuntarReporteTecnico, eliminarReporteTecnico } = useApp();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [expedienteId, setExpedienteId] = useState(expedientes[0]?.id || "NUEVO");
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
  const [reporteAEliminar, setReporteAEliminar] = useState<any>(null);

  // Estados de extracción y guardado
  const [cargandoExtraccion, setCargandoExtraccion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [datosDoc, setDatosDoc] = useState<{
    cliente?: string;
    modelo?: string;
    serie?: string;
  }>({});

  // Datos del formulario
  const [numeroReporte, setNumeroReporte] = useState("");
  const [fechaServicio, setFechaServicio] = useState("");
  const [horometro, setHorometro] = useState<number | "">("");
  const [tecnico, setTecnico] = useState("");
  const [actividades, setActividades] = useState("");
  const [alertaAlGuardar, setAlertaAlGuardar] = useState<string | null>(null);

  // Lista de expedientes que tienen reporte técnico confirmado
  const expedientesConReporte = expedientes.filter((e) => e.reporteTecnicoNumero);

  const procesarPdf = async (file: File) => {
    setArchivoPdf(file);
    setCargandoExtraccion(true);
    setAlertaAlGuardar(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const resp = await fetch("/api/reportes-tecnicos/extraer-pdf", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        throw new Error("No se pudo extraer información del archivo PDF.");
      }

      const res = await resp.json();
      const datos = res?.datos;

      if (datos) {
        if (datos.numeroReporte) setNumeroReporte(datos.numeroReporte);
        if (datos.fechaServicio) setFechaServicio(datos.fechaServicio);
        if (datos.horometro !== null && datos.horometro !== undefined) {
          setHorometro(Number(datos.horometro));
        }
        if (datos.tecnico) setTecnico(datos.tecnico);
        if (datos.actividades) setActividades(datos.actividades);

        setDatosDoc({
          cliente: datos.cliente || "",
          modelo: datos.modelo || "",
          serie: datos.serie || "",
        });

        // Intentar autovinculación con expediente existente
        if (datos.cliente || datos.serie || datos.modelo) {
          const cliLower = (datos.cliente || "").toLowerCase();
          const serieLower = (datos.serie || "").toLowerCase();
          const modLower = (datos.modelo || "").toLowerCase();

          const coincidencia = expedientes.find((e) => {
            const expCli = e.clienteNombre.toLowerCase();
            const expSerie = e.serie.toLowerCase();
            const expMod = e.equipoModelo.toLowerCase();

            if (cliLower && expCli.includes(cliLower)) return true;
            if (serieLower && expSerie === serieLower) return true;
            if (modLower && expMod.includes(modLower)) return true;
            return false;
          });

          if (coincidencia) {
            setExpedienteId(coincidencia.id);
          } else {
            setExpedienteId("NUEVO");
          }
        }
      }
    } catch (err: any) {
      console.warn("Extracción asistida falló, ingresando manualmente:", err);
      // Fallback básico por nombre de archivo
      const matchReporte = file.name.match(/RT[-_ ]?(\d+)/i) || file.name.match(/(\d{4})/);
      if (matchReporte) {
        setNumeroReporte(`RT-2026-${matchReporte[1]}`);
      }
      if (!fechaServicio) {
        setFechaServicio(new Date().toISOString().split("T")[0]);
      }
    } finally {
      setCargandoExtraccion(false);
    }
  };

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      procesarPdf(file);
    }
  };

  const handleConfirmarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (horometro === "" || Number(horometro) <= 0) {
      setAlertaAlGuardar("Debe ingresar la lectura real del horómetro indicada en el reporte técnico.");
      return;
    }

    setGuardando(true);
    let pdfUrl: string | undefined = undefined;
    let driveUrl: string | undefined = undefined;

    // Subir documento a la nube (Supabase Storage y Google Drive)
    if (archivoPdf) {
      try {
        const targetExp = expedientes.find((exp) => exp.id === expedienteId);
        const expCodigo = targetExp
          ? targetExp.codigo
          : `0171-2026 – ${datosDoc.cliente || "FORSAC S.A.C"} – ${datosDoc.modelo || "GA30VSD"}`;

        const upData = new FormData();
        upData.append("file", archivoPdf);
        upData.append("subcarpeta", "04_REPORTE_TECNICO");
        upData.append("expedienteCodigo", expCodigo);
        upData.append("nombreArchivo", archivoPdf.name);

        const upResp = await fetch("/api/documentos/upload", {
          method: "POST",
          body: upData,
        });

        if (upResp.ok) {
          const upRes = await upResp.json();
          pdfUrl = upRes.url || undefined;
          driveUrl = upRes.driveUrl || undefined;
        }
      } catch (uploadErr) {
        console.warn("Aviso al subir PDF de reporte:", uploadErr);
      }
    }

    const resultado = adjuntarReporteTecnico(expedienteId, {
      numeroReporte: numeroReporte.trim() || `RT-2026-${Date.now().toString().slice(-4)}`,
      fechaServicio: fechaServicio || new Date().toISOString().split("T")[0],
      horometro: Number(horometro),
      pdfNombre: archivoPdf ? archivoPdf.name : `${numeroReporte || "REPORTE"}.pdf`,
      pdfUrl,
      driveUrl,
      tecnico: tecnico.trim() || "Área Técnica INDUSTRAC",
      actividades: actividades.trim() || "Servicio técnico preventivo ejecutado",
      clienteNombre: datosDoc.cliente,
      equipoModelo: datosDoc.modelo,
      serie: datosDoc.serie,
    });

    setGuardando(false);

    if (resultado.alertaHorometro) {
      setAlertaAlGuardar(resultado.alertaHorometro);
    } else {
      setModalAbierto(false);
      setArchivoPdf(null);
      setAlertaAlGuardar(null);
      setNumeroReporte("");
      setFechaServicio("");
      setHorometro("");
      setTecnico("");
      setActividades("");
      setDatosDoc({});
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240]">
            Módulo de Reportes Técnicos
          </h1>
          <p className="text-xs text-gray-600">
            Recepción y validación de PDFs generados por el sistema de reportes. Extrae y actualiza automáticamente el horómetro en el sistema y archiva los documentos por carpetas en la nube y Drive.
          </p>
        </div>
        <button
          onClick={() => {
            setModalAbierto(true);
            setAlertaAlGuardar(null);
            if (expedientes.length > 0) setExpedienteId(expedientes[0].id);
          }}
          className="inline-flex items-center gap-1.5 bg-[#18A2D9] hover:bg-[#14B5D9] text-[#031240] px-4 py-2 rounded text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <span>📄</span> ADJUNTAR REPORTE TÉCNICO
        </button>
      </div>

      {/* Nota de Integración */}
      <div className="bg-blue-50 border-l-4 border-[#18A2D9] p-3 text-xs text-blue-900 rounded flex items-center justify-between">
        <div>
          <strong>Integración Inteligente:</strong> Al adjuntar el PDF de reporte de INDUSTRAC, el sistema lee automáticamente el <strong>Cliente</strong>, <strong>Equipo</strong>, <strong>Fecha</strong> y <strong>Horómetro Acumulado</strong>, archivando el archivo directamente en la carpeta <code>04_REPORTE_TECNICO</code> del expediente.
        </div>
      </div>

      {/* Tabla de Reportes Técnicos Confirmados */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#031240]">
            Reportes Técnicos Vinculados a Expedientes
          </h2>
          <span className="text-xs text-gray-500">
            Total confirmados: {expedientesConReporte.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">N° Reporte</th>
                <th className="py-3 px-4">Expediente</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Equipo / Serie</th>
                <th className="py-3 px-4">Fecha Servicio</th>
                <th className="py-3 px-4">Horómetro Extraído</th>
                <th className="py-3 px-4">Documento en Nube</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expedientesConReporte.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                    No hay reportes técnicos vinculados actualmente. Haga clic en "Adjuntar Reporte Técnico" para comenzar.
                  </td>
                </tr>
              ) : (
                expedientesConReporte.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-[#051A59]">
                      {exp.reporteTecnicoNumero}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700 max-w-[150px] truncate">
                      {exp.codigo}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {exp.clienteNombre}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div>{exp.equipoModelo}</div>
                      <div className="text-[10px] text-gray-400 font-mono">S/N: {exp.serie}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{exp.reporteTecnicoFecha}</td>
                    <td className="py-3 px-4 font-bold text-[#18A2D9]">
                      ⏱️ {exp.horometroRegistrado} hrs
                    </td>
                    <td className="py-3 px-4">
                      {exp.reporteTecnicoPdfUrl ? (
                        <a
                          href={exp.reporteTecnicoPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#18A2D9] hover:text-[#051A59] font-medium hover:underline"
                        >
                          <span>📄</span>
                          <span className="max-w-[120px] truncate">{exp.reporteTecnicoPdf || "Ver Reporte"}</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded font-semibold">Nube</span>
                        </a>
                      ) : exp.reporteTecnicoPdf ? (
                        <span className="text-gray-500 font-mono text-[11px] truncate max-w-[120px] block">
                          📁 {exp.reporteTecnicoPdf}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">Sin archivo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          href="/expedientes"
                          className="text-xs text-[#051A59] hover:underline font-semibold"
                        >
                          Ver Expediente →
                        </Link>
                        <button
                          type="button"
                          onClick={() => setReporteAEliminar(exp)}
                          className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-semibold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title="Eliminar reporte técnico de este expediente"
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

      {/* MODAL: Adjuntar Reporte Técnico */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <h2 className="text-base font-bold text-[#031240]">
                Adjuntar y Validar Reporte Técnico (PDF)
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {alertaAlGuardar && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs">
                <strong>Alerta:</strong> {alertaAlGuardar}
              </div>
            )}

            <form onSubmit={handleConfirmarReporte} className="space-y-4 text-xs">
              {/* Carga del PDF */}
              <div className="p-4 bg-[#F2F2F2] rounded-lg border-2 border-dashed border-gray-300 text-center">
                <label className="block font-semibold text-[#031240] mb-1">
                  1. Seleccione el PDF del Reporte Técnico:
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleArchivoChange}
                  className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#051A59] file:text-white cursor-pointer"
                />
                {cargandoExtraccion && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-blue-700 font-semibold animate-pulse text-xs">
                    <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    Extrayendo Cliente, Horómetro y datos técnicos del PDF...
                  </div>
                )}
                {archivoPdf && !cargandoExtraccion && (
                  <div className="mt-2 text-emerald-700 font-medium text-[11px] bg-emerald-50 border border-emerald-200 p-2 rounded">
                    ✓ Documento cargado: <strong>{archivoPdf.name}</strong> (Se organizará en carpeta <code>04_REPORTE_TECNICO</code>)
                  </div>
                )}
              </div>

              {/* Selección de Expediente */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  2. Vincular a Expediente Administrativo:
                </label>
                <select
                  value={expedienteId}
                  onChange={(e) => setExpedienteId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240] bg-white"
                >
                  {datosDoc.cliente && (
                    <option value="NUEVO">
                      ✨ Auto-crear expediente para {datosDoc.cliente} ({datosDoc.modelo || "Compresor"})
                    </option>
                  )}
                  {expedientes.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.codigo} — ({exp.clienteNombre})
                    </option>
                  ))}
                  {!datosDoc.cliente && (
                    <option value="NUEVO">
                      ✨ Crear nuevo expediente administrativo
                    </option>
                  )}
                </select>
              </div>

              {/* Pantalla de Validación de Datos Extraídos */}
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3">
                <div className="font-semibold text-[#031240] flex items-center justify-between">
                  <span>3. Datos Extraídos del Reporte Técnico:</span>
                  <span className="text-[10px] text-emerald-700 font-normal">Verifique o ajuste los valores extraídos</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">N° de Reporte:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: RT-2026-430927"
                      value={numeroReporte}
                      onChange={(e) => setNumeroReporte(e.target.value)}
                      className="w-full border rounded px-2.5 py-1.5 text-xs bg-white text-[#051A59] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Fecha del Servicio:</label>
                    <input
                      type="date"
                      required
                      value={fechaServicio}
                      onChange={(e) => setFechaServicio(e.target.value)}
                      className="w-full border rounded px-2.5 py-1.5 text-xs bg-white"
                    />
                  </div>

                  {/* CAMPO HORÓMETRO ACTUAL PRIORITARIO */}
                  <div className="sm:col-span-2 bg-blue-50/90 p-3 rounded-lg border border-[#18A2D9]/60">
                    <label className="block text-[#031240] font-bold mb-1">
                      ⏱️ HORÓMETRO ACTUAL (Horas acumuladas del equipo):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        required
                        placeholder="Ej: 88245"
                        value={horometro}
                        onChange={(e) => setHorometro(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-48 font-bold text-lg text-[#051A59] border border-blue-400 rounded px-2.5 py-1 bg-white shadow-xs"
                      />
                      <span className="text-xs font-semibold text-gray-800">horas acumuladas registradas</span>
                    </div>
                    <span className="text-[10px] text-gray-500 block mt-1.5">
                      Al confirmar el reporte, este horómetro actualiza de forma automática e irreversible el historial del compresor y el expediente.
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-gray-600 mb-1 font-medium">Técnico que ejecutó el servicio:</label>
                    <input
                      type="text"
                      placeholder="Nombre del técnico responsable"
                      value={tecnico}
                      onChange={(e) => setTecnico(e.target.value)}
                      className="w-full border rounded px-2.5 py-1.5 text-xs bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-gray-600 mb-1 font-medium">Actividades / Tipo de Mantenimiento:</label>
                    <textarea
                      rows={2}
                      placeholder="Detalle de actividades técnicas..."
                      value={actividades}
                      onChange={(e) => setActividades(e.target.value)}
                      className="w-full border rounded px-2.5 py-1.5 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  disabled={guardando}
                  className="px-4 py-2 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-[#051A59] hover:bg-[#031240] text-white px-5 py-2 rounded text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {guardando && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  <span>Confirmar Reporte y Guardar en Nube</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN DE REPORTE TÉCNICO */}
      {reporteAEliminar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-xl shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#031240]">¿Eliminar reporte técnico?</h3>
                <p className="text-[11px] text-gray-500">
                  Esta acción desvinculará el PDF del expediente.
                </p>
              </div>
            </div>

            <div className="bg-[#F2F2F2] p-3 rounded-lg border border-gray-200 text-xs text-gray-700 space-y-1">
              <div>
                <span className="text-gray-500">N° Reporte:</span>{" "}
                <strong className="text-[#051A59] font-mono">{reporteAEliminar.reporteTecnicoNumero}</strong>
              </div>
              <div>
                <span className="text-gray-500">Expediente:</span>{" "}
                <strong>{reporteAEliminar.codigo}</strong>
              </div>
              <div>
                <span className="text-gray-500">Cliente:</span>{" "}
                <span>{reporteAEliminar.clienteNombre}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReporteAEliminar(null)}
                className="px-4 py-2 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  eliminarReporteTecnico(reporteAEliminar.id);
                  setReporteAEliminar(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded text-xs font-semibold cursor-pointer"
              >
                Sí, Eliminar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
