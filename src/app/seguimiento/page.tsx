"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";

export default function SeguimientoPage() {
  const { expedientes } = useApp();
  const [filtro, setFiltro] = useState("TODOS");

  const filtrados = expedientes.filter((e) => {
    if (filtro === "OC_PENDIENTE") return e.ordenCompraSituacion === "pendiente";
    if (filtro === "APROBACION_PENDIENTE") return e.aprobacionEstado === "Pendiente";
    if (filtro === "POR_FACTURAR") return e.estadoGeneral === "Por Facturar";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240]">
            Seguimiento Administrativo y Aprobaciones
          </h1>
          <p className="text-xs text-gray-600">
            Control de órdenes de compra, autorizaciones comerciales y avance de etapas sin bloquear la operación.
          </p>
        </div>
      </div>

      {/* Tarjetas de Estados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setFiltro("APROBACION_PENDIENTE")}
          className={`p-4 rounded-lg border text-left transition-all ${
            filtro === "APROBACION_PENDIENTE" ? "bg-amber-50 border-amber-400" : "bg-white border-gray-200"
          }`}
        >
          <div className="text-[11px] font-semibold text-gray-500 uppercase">Cotizaciones Pendientes</div>
          <div className="text-xl font-bold text-amber-700 mt-1">
            {expedientes.filter((e) => e.aprobacionEstado === "Pendiente").length}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Esperando visto bueno del cliente</div>
        </button>

        <button
          onClick={() => setFiltro("OC_PENDIENTE")}
          className={`p-4 rounded-lg border text-left transition-all ${
            filtro === "OC_PENDIENTE" ? "bg-blue-50 border-blue-400" : "bg-white border-gray-200"
          }`}
        >
          <div className="text-[11px] font-semibold text-gray-500 uppercase">Órdenes de Compra Pendientes</div>
          <div className="text-xl font-bold text-blue-700 mt-1">
            {expedientes.filter((e) => e.ordenCompraSituacion === "pendiente").length}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">El servicio puede ejecutarse</div>
        </button>

        <button
          onClick={() => setFiltro("POR_FACTURAR")}
          className={`p-4 rounded-lg border text-left transition-all ${
            filtro === "POR_FACTURAR" ? "bg-purple-50 border-purple-400" : "bg-white border-gray-200"
          }`}
        >
          <div className="text-[11px] font-semibold text-gray-500 uppercase">Listos para Facturar</div>
          <div className="text-xl font-bold text-purple-700 mt-1">
            {expedientes.filter((e) => e.estadoGeneral === "Por Facturar").length}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Servicio y reporte técnico validados</div>
        </button>
      </div>

      {/* Tabla de Seguimiento */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#031240]">
            Expedientes en Seguimiento ({filtrados.length})
          </span>
          {filtro !== "TODOS" && (
            <button
              onClick={() => setFiltro("TODOS")}
              className="text-xs text-[#18A2D9] hover:underline font-medium"
            >
              Mostrar todos
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Expediente</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Aprobación</th>
                <th className="py-3 px-4">Situación OC</th>
                <th className="py-3 px-4">Servicio</th>
                <th className="py-3 px-4">Estado General</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-[#051A59]">{exp.codigo}</td>
                  <td className="py-3 px-4">{exp.clienteNombre}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100">
                      {exp.aprobacionEstado}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        exp.ordenCompraSituacion === "recibida"
                          ? "bg-emerald-100 text-emerald-800"
                          : exp.ordenCompraSituacion === "pendiente"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {exp.ordenCompraSituacion === "recibida"
                        ? `Recibida (${exp.ordenCompraNumero})`
                        : exp.ordenCompraSituacion === "pendiente"
                        ? "OC Pendiente (Continuar)"
                        : "No Aplica"}
                    </span>
                  </td>
                  <td className="py-3 px-4">{exp.servicioEstado}</td>
                  <td className="py-3 px-4 font-medium">{exp.estadoGeneral}</td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href="/expedientes"
                      className="text-xs text-[#18A2D9] hover:underline font-semibold"
                    >
                      Gestionar →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
