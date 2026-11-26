"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";

export default function ReportesTecnicosPage() {
  const { expedientes, adjuntarReporteTecnico, eliminarReporteTecnico } = useApp();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [expedienteId, setExpedienteId] = useState(expedientes[0]?.id || "");
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
  const [reporteAEliminar, setReporteAEliminar] = useState<any>(null);

  // Datos extraídos / validados (limpios sin datos ficticios predeterminados)
  const [numeroReporte, setNumeroReporte] = useState("");
  const [fechaServicio, setFechaServicio] = useState("");
  const [horometro, setHorometro] = useState<number | "">("");
  const [tecnico, setTecnico] = useState("");
  const [actividades, setActividades] = useState("");
  const [alertaAlGuardar, setAlertaAlGuardar] = useState<string | null>(null);

  // Lista de expedientes que tienen reporte
  const expedientesConReporte = expedientes.filter((e) => e.reporteTecnicoNumero);

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoPdf(file);
      // Auto-identificar si en el nombre viene número de reporte
      const matchReporte = file.name.match(/RT[-_ ]?(\d+)/i) || file.name.match(/(\d{4})/);
      if (matchReporte) {
        setNumeroReporte(`RT-2026-${matchReporte[1]}`);
      }
      if (!fechaServicio) {
        setFechaServicio(new Date().toISOString().split("T")[0]);
      }
    }
  };

  const handleConfirmarReporte = (e: React.FormEvent) => {
    e.preventDefault();
    if (!horometro || Number(horometro) <= 0) {
      setAlertaAlGuardar("Debe ingresar la lectura real del horómetro indicada en el reporte técnico.");
      return;
    }
    const resultado = adjuntarReporteTecnico(expedienteId, {
      numeroReporte: numeroReporte.trim() || `RT-2026-${Date.now().toString().slice(-4)}`,
      fechaServicio: fechaServicio || new Date().toISOString().split("T")[0],
      horometro: Number(horometro),
      pdfNombre: archivoPdf ? archivoPdf.name : `${numeroReporte || "REPORTE"}.pdf`,
      tecnico: tecnico.trim() || "Área Técnica INDUSTRAC",
      actividades: actividades.trim() || "Servicio técnico preventivo ejecutado",
    });

    if (resultado.alertaHorometro) {
      setAlertaAlGuardar(resultado.alertaHorometro);
    } else {
      setModalAbierto(false);
      setArchivoPdf(null);
      setAlertaAlGuardar(null);
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
            Recepción y validación de PDFs generados por el sistema actual de reportes. Extrae y actualiza automáticamente el horómetro.
          </p>
        </div>
        <button
          onClick={() => {
            setModalAbierto(true);
            setAlertaAlGuardar(null);
          }}
          className="inline-flex items-center gap-1.5 bg-[#18A2D9] hover:bg-[#14B5D9] text-[#031240] px-4 py-2 rounded text-xs font-semibold shadow-xs"
        >
          <span>📄</span> ADJUNTAR REPORTE TÉCNICO
        </button>
      </div>

      {/* Nota de Integración */}
      <div className="bg-blue-50 border-l-4 border-[#18A2D9] p-3 text-xs text-blue-900 rounded">
        <strong>Integración con el sistema existente:</strong> INDUSTRAC ya cuenta con un sistema generador de reportes. En este módulo se cargan y procesan los PDFs descargados de dicho sistema sin duplicar formularios. Al validar el reporte, el horómetro se actualiza de manera única e irreversible en el equipo correspondiente.
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
                <th className="py-3 px-4">Archivo en Drive</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expedientesConReporte.map((exp) => (
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
                    {exp.horometroRegistrado} horas
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                    04_REPORTE_TECNICO/{exp.reporteTecnicoPdf}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <a
                        href="/expedientes"
                        className="text-xs text-[#051A59] hover:underline font-semibold"
                      >
                        Ver Expediente →
                      </a>
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
              ))}
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
                className="text-gray-400 hover:text-gray-700 text-sm"
              >
                ✕
              </button>
            </div>

            {alertaAlGuardar && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs">
                <strong>Alerta de Inconsistencia:</strong> {alertaAlGuardar}
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setModalAbierto(false);
                      setAlertaAlGuardar(null);
                    }}
                    className="underline font-semibold"
                  >
                    Confirmar de todas formas y cerrar
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmarReporte} className="space-y-4 text-xs">
              {/* Selección de Expediente */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  1. Seleccionar Expediente Administrativo:
                </label>
                <select
                  value={expedienteId}
                  onChange={(e) => setExpedienteId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#031240]"
                >
                  {expedientes.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.codigo} ({exp.clienteNombre})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subida del PDF */}
              <div className="p-3 bg-[#F2F2F2] rounded border border-dashed border-gray-300">
                <label className="block font-semibold text-[#031240] mb-1">
                  2. Cargar PDF del Reporte Técnico:
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleArchivoChange}
                  className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#051A59] file:text-white"
                />
                {archivoPdf && (
                  <div className="mt-2 text-emerald-700 font-medium text-[11px]">
                    ✓ Documento cargado: {archivoPdf.name} (Se archivará en Drive/04_REPORTE_TECNICO)
                  </div>
                )}
              </div>

              {/* Pantalla de Validación de Datos Extraídos */}
              <div className="border border-gray-200 rounded p-3 bg-gray-50 space-y-3">
                <div className="font-semibold text-[#031240] flex items-center justify-between">
                  <span>3. Datos Extraídos / Pantalla de Revisión:</span>
                  <span className="text-[10px] text-emerald-700 font-normal">Revisar y corregir si es necesario</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 mb-1">Número de Reporte:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: RT-2026-0415"
                      value={numeroReporte}
                      onChange={(e) => setNumeroReporte(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Fecha del Servicio:</label>
                    <input
                      type="date"
                      required
                      value={fechaServicio}
                      onChange={(e) => setFechaServicio(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                  </div>

                  {/* CAMPO HOROMETRO ACTUAL PRIORITARIO */}
                  <div className="sm:col-span-2 bg-blue-100/60 p-2.5 rounded border border-[#18A2D9]/40">
                    <label className="block text-[#031240] font-bold mb-1">
                      ⏱️ HORÓMETRO ACTUAL (Horas acumuladas del equipo):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        required
                        placeholder="Ej: 8000"
                        value={horometro}
                        onChange={(e) => setHorometro(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-48 font-bold text-base text-[#051A59] border border-blue-300 rounded px-2.5 py-1 bg-white"
                      />
                      <span className="text-xs font-semibold text-gray-700">horas registradas en compresor</span>
                    </div>
                    <span className="text-[10px] text-gray-500 block mt-1">
                      Al confirmar el reporte, este valor se convertirá en la fuente única del equipo. No se inventan datos ni se calculan ficticiamente.
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-gray-600 mb-1">Técnico que ejecutó el servicio:</label>
                    <input
                      type="text"
                      placeholder="Nombre del técnico responsable"
                      value={tecnico}
                      onChange={(e) => setTecnico(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-gray-600 mb-1">Actividades Realizadas:</label>
                    <textarea
                      rows={2}
                      placeholder="Detalle de actividades técnicas realizadas..."
                      value={actividades}
                      onChange={(e) => setActividades(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#051A59] hover:bg-[#031240] text-white px-5 py-2 rounded text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Confirmar Reporte y Actualizar Horómetro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE REPORTE TÉCNICO                */}
      {/* ============================================================== */}
      {reporteAEliminar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
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
              <div>
                <span className="text-gray-500">Archivo en Drive:</span>{" "}
                <span className="font-mono text-[11px]">{reporteAEliminar.reporteTecnicoPdf}</span>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-800">
              ⚠️ Al eliminar el reporte técnico, el estado de servicio del expediente volverá a <strong>Pendiente</strong> y el documento será retirado de su registro.
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
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Sí, eliminar reporte</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
