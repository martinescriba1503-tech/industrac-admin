"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";

export default function ServiciosPage() {
  const { expedientes, actualizarExpediente } = useApp();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [expId, setExpId] = useState(expedientes[0]?.id || "");
  const [fecha, setFecha] = useState("2026-11-28");
  const [tecnico, setTecnico] = useState("Téc. Juan Pérez / Téc. Carlos Silva");
  const [ubicacion, setUbicacion] = useState("Planta Principal (Lima)");

  const handleProgramar = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarExpediente(expId, {
      servicioEstado: "Programado",
      servicioFechaProgramada: fecha,
      servicioTecnico: tecnico,
      estadoGeneral: "En Servicio",
    });
    setModalAbierto(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240]">
            Servicios y Programación
          </h1>
          <p className="text-xs text-gray-600">
            Gestión técnica de servicios, asignación de cuadrillas de técnicos y fechas de intervención en planta.
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-[#051A59] hover:bg-[#031240] text-white px-4 py-2 rounded text-xs font-semibold"
        >
          + Programar Nuevo Servicio
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Expediente</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Equipo / Serie</th>
                <th className="py-3 px-4">Fecha Programada</th>
                <th className="py-3 px-4">Técnico Asignado</th>
                <th className="py-3 px-4">Estado del Servicio</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expedientes.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-[#051A59]">{exp.codigo}</td>
                  <td className="py-3 px-4 font-medium">{exp.clienteNombre}</td>
                  <td className="py-3 px-4 text-gray-600">{exp.equipoModelo} ({exp.serie})</td>
                  <td className="py-3 px-4 font-semibold text-[#051A59]">{exp.servicioFechaProgramada || "Por programar"}</td>
                  <td className="py-3 px-4 text-gray-700">{exp.servicioTecnico || "Sin técnico"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        exp.servicioEstado === "Programado"
                          ? "bg-blue-100 text-blue-800"
                          : exp.servicioEstado === "Ejecutado"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {exp.servicioEstado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a href="/reportes-tecnicos" className="text-xs text-[#18A2D9] font-semibold hover:underline">
                      Adjuntar Reporte →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-[#031240]">Programar Servicio Técnico</h2>
            <form onSubmit={handleProgramar} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Expediente:</label>
                <select
                  value={expId}
                  onChange={(e) => setExpId(e.target.value)}
                  className="w-full border rounded px-2.5 py-1.5 text-xs text-[#031240]"
                >
                  {expedientes.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.codigo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-1 font-medium">Fecha Programada:</label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full border rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1 font-medium">Técnico o Cuadrilla:</label>
                <input
                  type="text"
                  required
                  value={tecnico}
                  onChange={(e) => setTecnico(e.target.value)}
                  className="w-full border rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1 font-medium">Ubicación / Planta:</label>
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full border rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#051A59] text-white px-4 py-1.5 rounded text-xs font-semibold"
                >
                  Guardar Programación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
