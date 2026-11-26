"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { Equipo, MovimientoHistorial } from "@/lib/demo-store";

export default function HistorialPage() {
  const {
    equipos,
    historial,
    eliminarMovimientoHistorial,
    limpiarHistorialCompleto,
    reiniciarHorometroEquipo,
  } = useApp();

  const [tab, setTab] = useState<"equipos" | "auditoria">("equipos");
  const [busqueda, setBusqueda] = useState("");

  // Modales de confirmación
  const [itemAEliminar, setItemAEliminar] = useState<MovimientoHistorial | null>(null);
  const [equipoAReiniciar, setEquipoAReiniciar] = useState<Equipo | null>(null);
  const [modalVaciarTodo, setModalVaciarTodo] = useState(false);

  const historialFiltrado = historial.filter((h) => {
    const texto = `${h.fechaHora} ${h.usuario} ${h.expedienteCodigo} ${h.tipo} ${h.detalle}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240] flex items-center gap-2">
            <span>Historial de Mantenimiento y Auditoría</span>
          </h1>
          <p className="text-xs text-gray-600">
            Trazabilidad por número de serie de equipos, control de horas y bitácora de auditoría de todas las acciones del sistema.
          </p>
        </div>

        {tab === "auditoria" && historial.length > 0 && (
          <button
            onClick={() => setModalVaciarTodo(true)}
            className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>🗑️</span>
            <span>Limpiar Todo el Histórico</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("equipos")}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            tab === "equipos" ? "border-[#051A59] text-[#051A59]" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Historial por Equipo (Compresores)
        </button>
        <button
          onClick={() => setTab("auditoria")}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            tab === "auditoria" ? "border-[#051A59] text-[#051A59]" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Bitácora de Auditoría ({historial.length})
        </button>
      </div>

      {/* TAB 1: HISTORIAL POR EQUIPO */}
      {tab === "equipos" ? (
        <div className="space-y-4">
          {equipos.map((eq) => {
            const tieneHoras = eq.horometroActual > 0;

            return (
              <div key={eq.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#051A59]">{eq.modelo}</h3>
                    <div className="text-xs text-gray-500 font-mono">Número de Serie: {eq.serie}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
                      tieneHoras
                        ? "text-[#031240] bg-blue-50 border-blue-200"
                        : "text-gray-500 bg-gray-100 border-gray-200"
                    }`}>
                      Horómetro Actual: {tieneHoras ? `${eq.horometroActual.toLocaleString()} h` : "Sin lectura (0 h)"}
                    </span>

                    {tieneHoras && (
                      <button
                        onClick={() => setEquipoAReiniciar(eq)}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded font-semibold transition-colors cursor-pointer"
                        title="Restablecer lectura de horómetro y mantenimiento"
                      >
                        <span>🗑️</span>
                        <span>Reiniciar Horómetro</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Último Servicio Realizado</span>
                    <span className="font-semibold text-gray-800">
                      {eq.ultimoMantenimientoTipo || <span className="text-gray-400 font-normal italic">Sin servicio previo</span>}
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      Fecha: {eq.ultimoMantenimientoFecha || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Próximo Mantenimiento Estimado</span>
                    <span className="font-semibold text-[#18A2D9]">
                      {eq.proximoMantenimientoEstimado || (
                        <span className="text-gray-400 font-normal italic">Se calculará con el 1er reporte</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Secuencia Oficial INDUSTRAC</span>
                    <span className="text-[11px] text-gray-600 block">
                      A 2,000h → B 4,000h → A 6,000h → C 8,000h → A 10,000h → B 12,000h
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TAB 2: AUDITORÍA CON ACCIÓN DE ELIMINAR */
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
            <div className="w-full sm:w-80 relative">
              <input
                type="text"
                placeholder="Filtrar por usuario, acción, expediente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[#F2F2F2] border border-gray-200 rounded px-3 py-1.5 pl-8 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
              />
              <span className="absolute left-2.5 top-1.5 text-xs text-gray-400">🔍</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Total movimientos: {historialFiltrado.length}
            </span>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Expediente / Serie</th>
                    <th className="py-3 px-4">Tipo de Movimiento</th>
                    <th className="py-3 px-4">Detalle</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historialFiltrado.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                        No hay registros en el historial de auditoría.
                      </td>
                    </tr>
                  ) : (
                    historialFiltrado.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                          {h.fechaHora}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800">{h.usuario}</td>
                        <td className="py-3 px-4 font-semibold text-[#051A59] max-w-[150px] truncate">
                          {h.expedienteCodigo}
                        </td>
                        <td className="py-3 px-4 font-medium">{h.tipo}</td>
                        <td className="py-3 px-4 text-gray-600">{h.detalle}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setItemAEliminar(h)}
                            className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-0.5 rounded font-semibold border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="Eliminar este registro del histórico"
                          >
                            <span>🗑️</span>
                            <span>Eliminar</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN DE REGISTRO HISTÓRICO INDIVIDUAL */}
      {itemAEliminar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 space-y-3">
            <h3 className="font-bold text-[#031240] text-sm">¿Eliminar registro histórico?</h3>
            <div className="p-3 bg-gray-50 rounded border text-xs text-gray-700 space-y-1">
              <div><strong>Movimiento:</strong> {itemAEliminar.tipo}</div>
              <div><strong>Fecha:</strong> {itemAEliminar.fechaHora}</div>
              <div><strong>Detalle:</strong> {itemAEliminar.detalle}</div>
            </div>
            <p className="text-xs text-gray-500">
              Esta acción eliminará de forma permanente el registro del historial.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setItemAEliminar(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  eliminarMovimientoHistorial(itemAEliminar.id);
                  setItemAEliminar(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded text-xs font-semibold cursor-pointer"
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REINICIAR HORÓMETRO DE EQUIPO */}
      {equipoAReiniciar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 space-y-3">
            <h3 className="font-bold text-[#031240] text-sm">¿Reiniciar horómetro del equipo?</h3>
            <p className="text-xs text-gray-600">
              Se restablecerá a <strong>0 horas</strong> el equipo <strong>{equipoAReiniciar.modelo}</strong> (S/N: {equipoAReiniciar.serie}) y se borrarán las fechas y tipos de servicio registrados.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setEquipoAReiniciar(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  reiniciarHorometroEquipo(equipoAReiniciar.id);
                  setEquipoAReiniciar(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded text-xs font-semibold cursor-pointer"
              >
                Confirmar Reinicio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VACIAR TODO EL HISTORIAL */}
      {modalVaciarTodo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 space-y-3">
            <h3 className="font-bold text-rose-700 text-sm">¿Vaciar todo el historial de auditoría?</h3>
            <p className="text-xs text-gray-600">
              Se eliminarán todos los movimientos registrados en la bitácora de auditoría. Esta acción es irreversible.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setModalVaciarTodo(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  limpiarHistorialCompleto();
                  setModalVaciarTodo(false);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded text-xs font-semibold cursor-pointer"
              >
                Sí, Vaciar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
