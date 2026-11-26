"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";

export default function HorometrosPage() {
  const { equipos, clientes, reiniciarHorometroEquipo } = useApp();
  const [busqueda, setBusqueda] = useState("");
  const [equipoAReiniciar, setEquipoAReiniciar] = useState<any>(null);

  const equiposFiltrados = equipos.filter((eq) => {
    const cliente = clientes.find((c) => c.id === eq.clienteId);
    return (
      eq.serie.toLowerCase().includes(busqueda.toLowerCase()) ||
      eq.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente?.razonSocial.toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240]">
            Módulo de Horómetros por Equipo
          </h1>
          <p className="text-xs text-gray-600">
            Fuente única confirmada desde los Reportes Técnicos. Evita doble registro de horas y programa la secuencia de mantenimiento.
          </p>
        </div>
      </div>

      <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-900 text-xs">
        <strong>Secuencia oficial INDUSTRAC:</strong> A 2,000 h → B 4,000 h → A 6,000 h → C 8,000 h → A 10,000 h → B 12,000 h (o criterio trimestral: +3 meses desde el último servicio).
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Buscar por número de serie, cliente o modelo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#F2F2F2] border border-gray-200 rounded px-3 py-1.5 pl-8 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
          />
          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400">🔍</span>
        </div>
      </div>

      {/* Tabla de Equipos y Horómetros */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Número de Serie</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Equipo / Modelo</th>
                <th className="py-3 px-4">Horómetro Actual</th>
                <th className="py-3 px-4">Último Mantenimiento</th>
                <th className="py-3 px-4">Fecha Último Serv.</th>
                <th className="py-3 px-4">Próximo Mantenimiento Estimado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equiposFiltrados.map((eq) => {
                const cliente = clientes.find((c) => c.id === eq.clienteId);
                return (
                  <tr key={eq.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-[#051A59]">
                      {eq.serie}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {cliente?.razonSocial || "CLIENTE"}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {eq.modelo}
                    </td>
                    <td className="py-3 px-4">
                      {eq.horometroActual && eq.horometroActual > 0 ? (
                        <span className="font-bold text-sm text-[#051A59] bg-blue-50 px-2.5 py-1 rounded border border-blue-200 shadow-xs">
                          {eq.horometroActual.toLocaleString()} h
                        </span>
                      ) : (
                        <span className="text-gray-500 italic text-[11px] bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          Sin lectura confirmada
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-700">
                      {eq.ultimoMantenimientoTipo || (
                        <span className="text-gray-400 font-normal italic">Sin servicio previo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {eq.ultimoMantenimientoFecha || "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {eq.proximoMantenimientoEstimado || (
                        <span className="text-gray-400 font-normal italic text-[11px]">
                          Requiere adjuntar primer reporte técnico
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {eq.horometroActual > 0 && (
                          <button
                            type="button"
                            onClick={() => setEquipoAReiniciar(eq)}
                            className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer"
                            title="Restablecer horómetro a cero"
                          >
                            <span>🗑️</span>
                            <span>Reiniciar</span>
                          </button>
                        )}
                        <a
                          href="/historial"
                          className="text-xs text-[#18A2D9] hover:underline font-semibold"
                        >
                          Historial →
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REINICIAR HORÓMETRO */}
      {equipoAReiniciar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 space-y-3">
            <h3 className="font-bold text-[#031240] text-sm">¿Reiniciar horómetro del equipo?</h3>
            <p className="text-xs text-gray-600">
              Se restablecerá a <strong>0 horas</strong> el compresor <strong>{equipoAReiniciar.modelo}</strong> (S/N: {equipoAReiniciar.serie}) y se borrará la fecha y tipo de servicio registrado.
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
    </div>
  );
}
