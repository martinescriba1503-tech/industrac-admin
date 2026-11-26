"use client";

import React, { useState } from "react";
import { getPublicEnvStatus } from "@/lib/env";

export default function ConfiguracionPage() {
  const env = getPublicEnvStatus();
  const [alertaHoras, setAlertaHoras] = useState(200);
  const [recordatorioFacturaDias, setRecordatorioFacturaDias] = useState(7);
  const [carpetaDrive, setCarpetaDrive] = useState("INDUSTRAC - GESTIÓN ADMINISTRATIVA");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240]">
            Configuración del Sistema
          </h1>
          <p className="text-xs text-gray-600">
            Parámetros operativos de alertas, integraciones de Google Workspace y Supabase.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-[#031240] border-b pb-2">
          1. Reglas de Mantenimiento y Alertas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Anticipación para alerta de próximo servicio (Horas):
            </label>
            <input
              type="number"
              value={alertaHoras}
              onChange={(e) => setAlertaHoras(Number(e.target.value))}
              className="w-full border rounded px-3 py-1.5 text-xs text-[#031240]"
            />
            <span className="text-[10px] text-gray-500">
              Notifica cuando el horómetro esté a X horas del siguiente mantenimiento.
            </span>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Recordatorio previo a vencimiento de facturas (Días):
            </label>
            <input
              type="number"
              value={recordatorioFacturaDias}
              onChange={(e) => setRecordatorioFacturaDias(Number(e.target.value))}
              className="w-full border rounded px-3 py-1.5 text-xs text-[#031240]"
            />
            <span className="text-[10px] text-gray-500">
              Días de anticipación para crear alerta de cobranza.
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-[#031240] border-b pb-2">
          2. Integraciones de Almacenamiento y Calendario
        </h2>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Carpeta Raíz en Google Drive:
          </label>
          <input
            type="text"
            value={carpetaDrive}
            onChange={(e) => setCarpetaDrive(e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-xs font-mono text-[#031240]"
          />
          <span className="text-[10px] text-gray-500">
            Estructura automática creada: [AÑO] / [CLIENTE] / [NÚMERO_EXPEDIENTE] / [01 a 07].
          </span>
        </div>

        <div className="p-3 bg-gray-50 border rounded text-[11px] text-gray-700">
          <div><strong>Estado de Supabase:</strong> {env.supabaseUrlConfigured ? "Conectado" : "Pendiente de credenciales en .env"}</div>
          <div className="mt-1"><strong>Servidor de Notificaciones / Calendar:</strong> Configurado en modo local.</div>
        </div>
      </div>
    </div>
  );
}
