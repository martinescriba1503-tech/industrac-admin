"use client";

import React from "react";
import { useApp } from "@/lib/app-context";

export default function CalendarioPage() {
  const { expedientes } = useApp();

  const eventos = expedientes
    .filter((e) => e.servicioFechaProgramada)
    .map((e) => ({
      fecha: e.servicioFechaProgramada,
      titulo: `Servicio Compresor - ${e.clienteNombre}`,
      detalle: `${e.equipoModelo} (${e.serie}) • ${e.servicioTecnico || "Técnico por confirmar"}`,
      expediente: e.codigo,
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240]">
            Calendario de Servicios y Recordatorios
          </h1>
          <p className="text-xs text-gray-600">
            Sincronización con Google Calendar: programación de mantenimientos preventivos, visitas técnicas y recordatorios documentarios.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-[#18A2D9] p-3 text-xs text-blue-900 rounded">
        📅 <strong>Integración con Google Calendar:</strong> Cada servicio programado genera automáticamente un evento oficial con el enlace directo al expediente administrativo. Se configuran recordatorios preventivos para OCs, reportes y facturas por vencer sin saturar la agenda.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-[#031240] mb-4">Agenda Operativa de Servicios</h2>
          <div className="space-y-3">
            {eventos.map((ev, idx) => (
              <div key={idx} className="p-3 rounded border border-gray-200 bg-gray-50 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-[#051A59]">{ev.titulo}</div>
                  <div className="text-[11px] text-gray-700 mt-0.5">{ev.detalle}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">Exp: {ev.expediente}</div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-[#18A2D9]/20 text-[#031240] font-bold text-xs px-2.5 py-1 rounded">
                    {ev.fecha}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#031240]">Recordatorios Automáticos</h2>
          <div className="space-y-2.5 text-xs text-gray-700">
            <div className="p-2.5 rounded bg-amber-50 border-l-3 border-amber-400">
              <span className="font-semibold block text-amber-900">OC Pendiente</span>
              <span className="text-[11px]">Seguimiento a Textiles Camones post-servicio.</span>
            </div>
            <div className="p-2.5 rounded bg-blue-50 border-l-3 border-blue-400">
              <span className="font-semibold block text-blue-900">Reporte Técnico Pendiente</span>
              <span className="text-[11px]">Recordar al técnico subir RT tras visita en planta.</span>
            </div>
            <div className="p-2.5 rounded bg-emerald-50 border-l-3 border-emerald-400">
              <span className="font-semibold block text-emerald-900">Vencimiento de Factura</span>
              <span className="text-[11px]">F001-0004921 vence en 15 días (Crédito 30d).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
