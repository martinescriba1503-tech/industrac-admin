"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/app-context";

export default function DashboardPage() {
  const { cotizaciones, expedientes, historial } = useApp();
  const [tabGrafico, setTabGrafico] = useState<"financiero" | "comercial">("financiero");

  // =========================================================================
  // 1. CÁLCULO DE INDICADORES DE GESTIÓN (FUENTE ÚNICA DE INFORMACIÓN)
  // =========================================================================
  const kpis = useMemo(() => {
    // A. Cotizaciones del mes
    const totalCots = cotizaciones.length;
    const cotsPendientes = cotizaciones.filter((c) => c.estado === "Pendiente").length;
    const cotsAprobadas = cotizaciones.filter((c) => c.estado === "Aprobada").length;
    const cotsRechazadas = cotizaciones.filter(
      (c) => c.estado === "Rechazada" || c.estado === "Requiere modificación"
    ).length;
    const tasaAprobacion =
      totalCots > 0 ? Math.round((cotsAprobadas / totalCots) * 100) : 0;

    // B. Servicios activos
    const servProgramados = expedientes.filter(
      (e) => e.servicioEstado === "Programado"
    ).length;
    const servEnEjecucion = expedientes.filter(
      (e) => e.servicioEstado === "Reprogramado" || (e.estadoGeneral === "En Servicio" && e.servicioEstado !== "Ejecutado")
    ).length;
    const servEjecutados = expedientes.filter(
      (e) => e.servicioEstado === "Ejecutado"
    ).length;
    const totalServiciosActivos = servProgramados + servEnEjecucion;

    // C. Documentación pendiente
    const reportesPorAdjuntar = expedientes.filter(
      (e) => e.servicioEstado === "Ejecutado" && !e.reporteTecnicoNumero
    ).length;
    const facturasPorEmitir = expedientes.filter(
      (e) => e.reporteTecnicoNumero && !e.facturaNumero
    ).length;
    const ocPorRecibir = expedientes.filter(
      (e) => e.ordenCompraSituacion === "pendiente"
    ).length;
    const totalDocsPendientes = reportesPorAdjuntar + facturasPorEmitir + ocPorRecibir;

    // D. Saldo por cobrar (Criterio estricto y transparente sin discrepancias)
    // 1. Facturas vencidas o emitidas con saldo pendiente
    const facturasConSaldo = expedientes.filter(
      (e) => e.facturaNumero && e.saldoPendiente > 0
    );
    const saldoFacturadoVencidoUSD = facturasConSaldo
      .filter((e) => e.moneda === "USD")
      .reduce((sum, e) => sum + e.saldoPendiente, 0);
    const saldoFacturadoVencidoPEN = facturasConSaldo
      .filter((e) => e.moneda === "PEN")
      .reduce((sum, e) => sum + e.saldoPendiente, 0);

    // 2. Saldos por facturar (en proceso o por cobrar)
    const saldoPorFacturarUSD = expedientes
      .filter((e) => !e.facturaNumero && e.saldoPendiente > 0 && e.moneda === "USD")
      .reduce((sum, e) => sum + e.saldoPendiente, 0);
    const saldoPorFacturarPEN = expedientes
      .filter((e) => !e.facturaNumero && e.saldoPendiente > 0 && e.moneda === "PEN")
      .reduce((sum, e) => sum + e.saldoPendiente, 0);

    // 3. Saldo Total por cobrar
    const saldoTotalUSD = saldoFacturadoVencidoUSD + saldoPorFacturarUSD;
    const saldoTotalPEN = saldoFacturadoVencidoPEN + saldoPorFacturarPEN;

    // E. Rendimiento Operativo (Mejora 5)
    const hoyStr = new Date().toISOString().split("T")[0];
    const serviciosRetrasados = expedientes.filter(
      (e) =>
        e.servicioEstado === "Programado" &&
        e.servicioFechaProgramada &&
        e.servicioFechaProgramada < hoyStr
    ).length;

    const informesPendientesAprobacion = expedientes.filter(
      (e) => e.reporteTecnicoNumero && e.aprobacionEstado === "Pendiente"
    ).length;

    const totalCobradoUSD = expedientes
      .filter((e) => e.moneda === "USD")
      .reduce((sum, e) => sum + (e.pagosTotal || 0), 0);
    const totalFacturadoUSD = expedientes
      .filter((e) => e.moneda === "USD" && e.facturaNumero)
      .reduce((sum, e) => sum + (e.facturaMonto || e.total), 0);

    return {
      totalCots,
      cotsPendientes,
      cotsAprobadas,
      cotsRechazadas,
      tasaAprobacion,
      servProgramados,
      servEnEjecucion,
      servEjecutados,
      totalServiciosActivos,
      reportesPorAdjuntar,
      facturasPorEmitir,
      ocPorRecibir,
      totalDocsPendientes,
      saldoFacturadoVencidoUSD,
      saldoFacturadoVencidoPEN,
      saldoPorFacturarUSD,
      saldoPorFacturarPEN,
      saldoTotalUSD,
      saldoTotalPEN,
      serviciosRetrasados,
      informesPendientesAprobacion,
      totalCobradoUSD,
      totalFacturadoUSD,
    };
  }, [cotizaciones, expedientes]);

  // =========================================================================
  // 2. ALERTAS Y PRÓXIMOS VENCIMIENTOS CLASIFICADOS POR URGENCIA
  // =========================================================================
  const { alertasCriticas, proximosVencimientos } = useMemo(() => {
    const alertas: Array<{
      id: string;
      nivel: "CRÍTICA" | "ALTA" | "MEDIA";
      titulo: string;
      descripcion: string;
      expedienteId?: string;
    }> = [];

    const vencimientos: Array<{
      id: string;
      titulo: string;
      entidad: string;
      tipoEstado: "Vencido" | "Por recibir" | "Por vencer";
      importe?: string;
      expedienteCodigo?: string;
    }> = [];

    // 1. Facturas vencidas con saldo pendiente
    expedientes.forEach((exp) => {
      if (exp.facturaNumero && exp.saldoPendiente > 0) {
        vencimientos.push({
          id: `venc-fac-${exp.id}`,
          titulo: `Factura ${exp.facturaNumero}`,
          entidad: exp.clienteNombre,
          tipoEstado: "Vencido",
          importe: `${exp.moneda} ${exp.saldoPendiente.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}`,
          expedienteCodigo: exp.codigo,
        });

        alertas.push({
          id: `al-fac-${exp.id}`,
          nivel: "CRÍTICA",
          titulo: `Factura pendiente de cobro: ${exp.facturaNumero}`,
          descripcion: `${exp.clienteNombre} mantiene un saldo pendiente de ${
            exp.moneda
          } ${exp.saldoPendiente.toFixed(2)}. Requiere gestión de cobranza.`,
          expedienteId: exp.id,
        });
      }

      // 2. Órdenes de compra pendientes
      if (exp.ordenCompraSituacion === "pendiente") {
        vencimientos.push({
          id: `venc-oc-${exp.id}`,
          titulo: "Orden de compra pendiente",
          entidad: exp.clienteNombre,
          tipoEstado: "Por recibir",
          importe: "Por recibir",
          expedienteCodigo: exp.codigo,
        });

        alertas.push({
          id: `al-oc-${exp.id}`,
          nivel: "ALTA",
          titulo: `OC pendiente: ${exp.clienteNombre}`,
          descripcion: `Exp. ${exp.codigo}: El cliente enviará OC post-servicio. Asegurar recepción antes de emitir factura.`,
          expedienteId: exp.id,
        });
      }

      // 3. Servicios finalizados sin reporte técnico
      if (exp.servicioEstado === "Ejecutado" && !exp.reporteTecnicoNumero) {
        alertas.push({
          id: `al-rep-${exp.id}`,
          nivel: "ALTA",
          titulo: `Servicio ejecutado sin reporte: ${exp.codigo}`,
          descripcion: `El servicio fue completado por el área técnica pero aún no se adjunta el PDF del reporte oficial.`,
          expedienteId: exp.id,
        });
      }

      // 4. Servicios programados próximos
      if (exp.servicioEstado === "Programado" && exp.servicioFechaProgramada) {
        vencimientos.push({
          id: `venc-serv-${exp.id}`,
          titulo: `Servicio en fecha ${exp.servicioFechaProgramada}`,
          entidad: exp.clienteNombre,
          tipoEstado: "Por vencer",
          importe: exp.equipoModelo,
          expedienteCodigo: exp.codigo,
        });
      }
    });

    // 5. Cotizaciones pendientes de respuesta
    cotizaciones
      .filter((c) => c.estado === "Pendiente")
      .slice(0, 2)
      .forEach((cot) => {
        alertas.push({
          id: `al-cot-${cot.id}`,
          nivel: "MEDIA",
          titulo: `Cotización por confirmar: ${cot.numero}`,
          descripcion: `${cot.clienteNombre} (${cot.moneda} ${cot.total.toFixed(
            2
          )}) en espera de orden de compra o aprobación de presupuesto.`,
        });
      });

    return { alertasCriticas: alertas.slice(0, 4), proximosVencimientos: vencimientos.slice(0, 5) };
  }, [expedientes, cotizaciones]);

  // Lista de servicios activos para la tabla
  const serviciosActivos = useMemo(() => {
    return expedientes.filter(
      (e) =>
        e.servicioEstado === "Programado" ||
        e.servicioEstado === "Reprogramado" ||
        (e.estadoGeneral === "En Servicio" && e.servicioEstado !== "Ejecutado")
    );
  }, [expedientes]);

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* 1. ENCABEZADO Y ACCESOS RÁPIDOS                                     */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240]">
            Panel de Control y Gestión
          </h1>
          <p className="text-xs text-gray-600">
            Resumen en tiempo real del ciclo administrativo, técnico y financiero de INDUSTRAC S.A.C.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/cotizaciones"
            className="inline-flex items-center gap-1.5 bg-[#051A59] hover:bg-[#031240] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span className="text-sm font-bold">+</span>
            <span>Nueva Cotización</span>
          </Link>
          <Link
            href="/reportes-tecnicos"
            className="inline-flex items-center gap-1.5 bg-[#18A2D9] hover:bg-[#14B5D9] text-[#031240] px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <span>📄</span>
            <span>Adjuntar Reporte</span>
          </Link>
          <Link
            href="/expedientes"
            className="inline-flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs"
          >
            <span>📁 Expedientes</span>
          </Link>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. PRIMERA FILA: 4 INDICADORES DE GESTIÓN COMPLETOS                 */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: COTIZACIONES DEL MES */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-[#18A2D9] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {kpis.cotsPendientes} pendientes
            </span>
            <span className="text-xs text-gray-400">📄</span>
          </div>
          <div className="text-3xl font-extrabold text-[#031240] tracking-tight">
            {kpis.totalCots < 10 ? `0${kpis.totalCots}` : kpis.totalCots}
          </div>
          <div className="text-xs font-bold text-[#051A59] mt-0.5 uppercase tracking-wide">
            COTIZACIONES DEL MES
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
            <span className="text-emerald-700 font-medium">✓ {kpis.cotsAprobadas} aprobadas</span>
            <span className="text-gray-300">•</span>
            <span className="text-rose-700 font-medium">✕ {kpis.cotsRechazadas} rechazadas</span>
          </div>
        </div>

        {/* KPI 2: SERVICIOS ACTIVOS */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-[#18A2D9] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              En curso
            </span>
            <span className="text-xs text-gray-400">🛠️</span>
          </div>
          <div className="text-3xl font-extrabold text-[#031240] tracking-tight">
            {kpis.totalServiciosActivos < 10
              ? `0${kpis.totalServiciosActivos}`
              : kpis.totalServiciosActivos}
          </div>
          <div className="text-xs font-bold text-[#051A59] mt-0.5 uppercase tracking-wide">
            SERVICIOS ACTIVOS
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
            <span className="text-[#18A2D9] font-medium">{kpis.servProgramados} programados</span>
            <span className="text-gray-300">•</span>
            <span className="text-emerald-700 font-medium">{kpis.servEjecutados} finalizados</span>
          </div>
        </div>

        {/* KPI 3: DOCUMENTACIÓN PENDIENTE */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-[#18A2D9] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Revisar ({kpis.totalDocsPendientes})
            </span>
            <span className="text-xs text-gray-400">📑</span>
          </div>
          <div className="text-3xl font-extrabold text-[#031240] tracking-tight">
            {kpis.totalDocsPendientes < 10
              ? `0${kpis.totalDocsPendientes}`
              : kpis.totalDocsPendientes}
          </div>
          <div className="text-xs font-bold text-[#051A59] mt-0.5 uppercase tracking-wide">
            DOCUMENTACIÓN PENDIENTE
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
            <span className="text-amber-800 font-medium">{kpis.reportesPorAdjuntar} reportes</span>
            <span className="text-gray-300">•</span>
            <span className="text-blue-800 font-medium">{kpis.facturasPorEmitir} facturas</span>
            <span className="text-gray-300">•</span>
            <span className="text-purple-800 font-medium">{kpis.ocPorRecibir} OC</span>
          </div>
        </div>

        {/* KPI 4: TOTAL POR COBRAR */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-[#18A2D9] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Finanzas
            </span>
            <span className="text-xs text-gray-400">💰</span>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-[#051A59] tracking-tight truncate">
            ${kpis.saldoTotalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-bold text-[#051A59] mt-0.5 uppercase tracking-wide">
            TOTAL POR COBRAR
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
            <span className="text-rose-700 font-bold" title="Facturas con saldo pendiente de cobro">
              Vencido: ${kpis.saldoFacturadoVencidoUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-emerald-700 font-medium" title="En servicio o por facturar">
              Por vencer: ${kpis.saldoPorFacturarUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. SEGUNDA FILA: GRÁFICO FINANCIERO + RENDIMIENTO OPERATIVO        */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO FINANCIERO INTERACTIVO (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-xs p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#031240]">
                Desempeño y Flujo Financiero
              </h2>
              <p className="text-[11px] text-gray-500">
                Visualización de cotizaciones emitidas, facturación, cobranzas efectivas y saldos pendientes.
              </p>
            </div>
            <div className="inline-flex rounded-lg bg-[#F2F2F2] p-1 border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setTabGrafico("financiero")}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  tabGrafico === "financiero"
                    ? "bg-[#051A59] text-white shadow-xs"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                Flujo Financiero (USD)
              </button>
              <button
                type="button"
                onClick={() => setTabGrafico("comercial")}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  tabGrafico === "comercial"
                    ? "bg-[#051A59] text-white shadow-xs"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                Cotizaciones vs Aprobadas
              </button>
            </div>
          </div>

          {/* Renderizado de Gráficos SVG */}
          {tabGrafico === "financiero" ? (
            <div className="space-y-4">
              {/* Barra Gráfica Comparativa */}
              <div className="bg-[#F2F2F2]/60 rounded-xl p-4 border border-gray-200">
                <div className="text-xs font-semibold text-gray-700 mb-2 flex justify-between items-center">
                  <span>Distribución de Cartera Comercial y Facturación (USD):</span>
                  <span className="font-bold text-[#051A59]">
                    Total Comprometido: ${(kpis.totalCobradoUSD + kpis.saldoTotalUSD).toFixed(2)}
                  </span>
                </div>
                {/* Barra de progreso apilada */}
                <div className="w-full h-8 rounded-lg overflow-hidden flex bg-gray-200 shadow-inner">
                  <div
                    style={{
                      width: `${
                        kpis.totalCobradoUSD + kpis.saldoTotalUSD > 0
                          ? (kpis.totalCobradoUSD / (kpis.totalCobradoUSD + kpis.saldoTotalUSD)) * 100
                          : 35
                      }%`,
                    }}
                    className="bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold transition-all"
                    title={`Cobranza Efectiva: $${kpis.totalCobradoUSD.toFixed(2)}`}
                  >
                    Cobrado (${kpis.totalCobradoUSD.toFixed(0)})
                  </div>
                  <div
                    style={{
                      width: `${
                        kpis.totalCobradoUSD + kpis.saldoTotalUSD > 0
                          ? (kpis.saldoFacturadoVencidoUSD / (kpis.totalCobradoUSD + kpis.saldoTotalUSD)) * 100
                          : 35
                      }%`,
                    }}
                    className="bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold transition-all"
                    title={`Saldo Facturado Vencido: $${kpis.saldoFacturadoVencidoUSD.toFixed(2)}`}
                  >
                    Vencido (${kpis.saldoFacturadoVencidoUSD.toFixed(0)})
                  </div>
                  <div
                    style={{
                      width: `${
                        kpis.totalCobradoUSD + kpis.saldoTotalUSD > 0
                          ? (kpis.saldoPorFacturarUSD / (kpis.totalCobradoUSD + kpis.saldoTotalUSD)) * 100
                          : 30
                      }%`,
                    }}
                    className="bg-[#18A2D9] text-[#031240] flex items-center justify-center text-[10px] font-bold transition-all"
                    title={`Saldo Por Facturar: $${kpis.saldoPorFacturarUSD.toFixed(2)}`}
                  >
                    Por Facturar (${kpis.saldoPorFacturarUSD.toFixed(0)})
                  </div>
                </div>

                {/* Leyenda del Gráfico */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-200 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500"></span>
                    <span className="text-gray-700">Cobros Realizados:</span>
                    <strong className="text-emerald-700">${kpis.totalCobradoUSD.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500"></span>
                    <span className="text-gray-700">Saldo Facturado Vencido:</span>
                    <strong className="text-rose-700">${kpis.saldoFacturadoVencidoUSD.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#18A2D9]"></span>
                    <span className="text-gray-700">Saldo Por Facturar:</span>
                    <strong className="text-[#051A59]">${kpis.saldoPorFacturarUSD.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Comparativo de Cuentas por Cobrar en Soles */}
              {kpis.saldoTotalPEN > 0 && (
                <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                  <span className="font-semibold">Cartera adicional en Moneda Nacional (PEN):</span>
                  <span className="font-mono font-bold text-sm text-amber-950">
                    S/ {kpis.saldoTotalPEN.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#F2F2F2]/60 rounded-xl p-4 border border-gray-200 space-y-4">
              <div className="text-xs font-semibold text-gray-700 flex justify-between items-center">
                <span>Efectividad de Conversión Comercial:</span>
                <span className="font-bold text-emerald-700">{kpis.tasaAprobacion}% de Aprobación</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Cotizaciones Emitidas ({kpis.totalCots})</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div className="bg-[#051A59] h-full w-full rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Cotizaciones Aprobadas ({kpis.cotsAprobadas})</span>
                    <span>{kpis.tasaAprobacion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${kpis.tasaAprobacion}%` }}
                      className="bg-emerald-500 h-full rounded-full"
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Pendientes de Decisión ({kpis.cotsPendientes})</span>
                    <span>{kpis.totalCots > 0 ? Math.round((kpis.cotsPendientes / kpis.totalCots) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${kpis.totalCots > 0 ? (kpis.cotsPendientes / kpis.totalCots) * 100 : 0}%`,
                      }}
                      className="bg-amber-500 h-full rounded-full"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INDICADOR DE RENDIMIENTO OPERATIVO (1/3) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <h2 className="text-sm font-bold text-[#031240] flex items-center gap-1.5">
                <span>⚡</span> Rendimiento Operativo
              </h2>
              <span className="text-[10px] font-semibold text-[#18A2D9] uppercase tracking-wider">
                Operaciones
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">
              Métricas clave de ejecución técnica en compresores y seguimiento documental.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-700">Servicios realizados en el mes:</span>
                <strong className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {kpis.servEjecutados}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-700">Servicios pendientes de ejecución:</span>
                <strong className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {kpis.servProgramados}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-700">Servicios con retraso:</span>
                <strong
                  className={`font-bold px-2 py-0.5 rounded border ${
                    kpis.serviciosRetrasados > 0
                      ? "text-rose-700 bg-rose-50 border-rose-200 animate-pulse"
                      : "text-gray-600 bg-white border-gray-200"
                  }`}
                >
                  {kpis.serviciosRetrasados}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-700">Finalizados sin informe técnico:</span>
                <strong
                  className={`font-bold px-2 py-0.5 rounded border ${
                    kpis.reportesPorAdjuntar > 0
                      ? "text-amber-800 bg-amber-50 border-amber-200"
                      : "text-gray-600 bg-white border-gray-200"
                  }`}
                >
                  {kpis.reportesPorAdjuntar}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-700">Informes por facturar:</span>
                <strong className="font-bold text-[#051A59] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {kpis.facturasPorEmitir}
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Cumplimiento general:</span>
            <span className="font-bold text-emerald-700">
              {kpis.totalServiciosActivos + kpis.servEjecutados > 0
                ? `${Math.round(
                    (kpis.servEjecutados / (kpis.totalServiciosActivos + kpis.servEjecutados)) * 100
                  )}%`
                : "100%"}
            </span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. TERCERA FILA: ÁREA PRINCIPAL (2/3) + PANEL LATERAL (1/3)         */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA PRINCIPAL (2/3): TABLAS DE COTIZACIONES Y SERVICIOS */}
        <div className="lg:col-span-2 space-y-6">
          {/* TABLA: ÚLTIMAS COTIZACIONES REGISTRADAS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#031240]">
                  Últimas Cotizaciones Registradas
                </h2>
                <p className="text-[11px] text-gray-500">
                  Mostrando fecha de registro, cliente, modelo cotizado y estado.
                </p>
              </div>
              <Link
                href="/cotizaciones"
                className="text-xs text-[#18A2D9] hover:underline font-semibold"
              >
                Ver todas ({cotizaciones.length}) →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3.5">Número</th>
                    <th className="py-2.5 px-3.5">Fecha Registro</th>
                    <th className="py-2.5 px-3.5">Cliente</th>
                    <th className="py-2.5 px-3.5">Equipo</th>
                    <th className="py-2.5 px-3.5">Total</th>
                    <th className="py-2.5 px-3.5">Estado</th>
                    <th className="py-2.5 px-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cotizaciones.slice(0, 5).map((cot) => (
                    <tr key={cot.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3.5 font-bold text-[#051A59]">
                        {cot.numero}
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-600 font-mono text-[11px]">
                        {cot.fecha}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-gray-900 max-w-[140px] truncate">
                        {cot.clienteNombre}
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-600 max-w-[130px] truncate">
                        {cot.equipoModelo}
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-gray-900">
                        {cot.moneda} {cot.total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
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
                      <td className="py-2.5 px-3.5 text-right">
                        <Link
                          href="/expedientes"
                          className="text-[#18A2D9] hover:underline font-semibold"
                        >
                          Expediente →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA: SERVICIOS PROGRAMADOS Y EN EJECUCIÓN */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#031240]">
                  Servicios Programados y Activos
                </h2>
                <p className="text-[11px] text-gray-500">
                  Compresores en servicio con fecha agendada y técnico responsable.
                </p>
              </div>
              <Link
                href="/servicios"
                className="text-xs text-[#18A2D9] hover:underline font-semibold"
              >
                Ver todos ({expedientes.length}) →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3.5">Expediente</th>
                    <th className="py-2.5 px-3.5">Cliente</th>
                    <th className="py-2.5 px-3.5">Fecha Servicio</th>
                    <th className="py-2.5 px-3.5">Técnico</th>
                    <th className="py-2.5 px-3.5">Estado</th>
                    <th className="py-2.5 px-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {serviciosActivos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-500">
                        No hay servicios programados pendientes en este momento.
                      </td>
                    </tr>
                  ) : (
                    serviciosActivos.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3.5 font-bold text-[#051A59] max-w-[140px] truncate">
                          {exp.codigo}
                        </td>
                        <td className="py-2.5 px-3.5 text-gray-900 font-medium">
                          {exp.clienteNombre}
                        </td>
                        <td className="py-2.5 px-3.5 text-gray-600 font-mono text-[11px]">
                          {exp.servicioFechaProgramada || "Por programar"}
                        </td>
                        <td className="py-2.5 px-3.5 text-gray-600">
                          {exp.servicioTecnico || "Sin asignar"}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
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
                        <td className="py-2.5 px-3.5 text-right">
                          <Link
                            href="/expedientes"
                            className="text-[#18A2D9] hover:underline font-semibold"
                          >
                            Ver →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PANEL LATERAL DERECHO (1/3): ALERTAS CRÍTICAS + PRÓXIMOS VENCIMIENTOS */}
        <div className="space-y-6">
          {/* SECCIÓN: PRÓXIMOS VENCIMIENTOS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <h2 className="text-sm font-bold text-[#031240] flex items-center gap-1.5">
                <span>⏰</span> Próximos Vencimientos
              </h2>
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Prioridad
              </span>
            </div>

            <div className="space-y-2.5">
              {proximosVencimientos.length === 0 ? (
                <div className="text-xs text-gray-500 py-2">
                  No hay vencimientos pendientes de cobro o recepción.
                </div>
              ) : (
                proximosVencimientos.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border bg-[#F2F2F2]/40 hover:bg-white hover:border-[#18A2D9] transition-all space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#031240]">{item.titulo}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.tipoEstado === "Vencido"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : item.tipoEstado === "Por recibir"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {item.tipoEstado}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-600 truncate">{item.entidad}</div>
                    {item.importe && (
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 font-semibold">
                        <span className="text-[10px] text-gray-500">Monto / Referencia:</span>
                        <span
                          className={`font-mono ${
                            item.tipoEstado === "Vencido" ? "text-rose-700 font-bold" : "text-[#051A59]"
                          }`}
                        >
                          {item.importe}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECCIÓN: ALERTAS CRÍTICAS Y ACTIVIDADES POR URGENCIA */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <h2 className="text-sm font-bold text-[#031240] flex items-center gap-1.5">
                <span>🔔</span> Alertas según Urgencia
              </h2>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {alertasCriticas.length} activas
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {alertasCriticas.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-3 rounded-lg border-l-4 text-xs ${
                    alerta.nivel === "CRÍTICA"
                      ? "bg-rose-50/70 border-rose-600 text-rose-950"
                      : alerta.nivel === "ALTA"
                      ? "bg-amber-50/70 border-amber-500 text-amber-950"
                      : "bg-blue-50/70 border-[#18A2D9] text-blue-950"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{alerta.titulo}</span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        alerta.nivel === "CRÍTICA"
                          ? "bg-rose-200 text-rose-900"
                          : alerta.nivel === "ALTA"
                          ? "bg-amber-200 text-amber-900"
                          : "bg-blue-200 text-blue-900"
                      }`}
                    >
                      {alerta.nivel}
                    </span>
                  </div>
                  <div className="text-[11px] leading-snug text-gray-700">
                    {alerta.descripcion}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN: ÚLTIMOS MOVIMIENTOS ADMINISTRATIVOS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
            <h2 className="text-sm font-bold text-[#031240] mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
              <span>📜 Trazabilidad Reciente</span>
              <Link href="/historial" className="text-[11px] text-[#18A2D9] hover:underline font-normal">
                Ver historial →
              </Link>
            </h2>
            <div className="space-y-3">
              {historial.slice(0, 4).map((mov) => (
                <div
                  key={mov.id}
                  className="text-xs border-b border-gray-100 pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                    <span className="font-bold text-[#051A59]">{mov.tipo}</span>
                    <span className="font-mono">{mov.fechaHora}</span>
                  </div>
                  <div className="text-gray-800 text-[11px] leading-snug">
                    {mov.detalle}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
