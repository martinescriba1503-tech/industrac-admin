"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Cliente,
  Equipo,
  Cotizacion,
  Expediente,
  MovimientoHistorial,
  CLIENTES_DEMO,
  EQUIPOS_DEMO,
  COTIZACIONES_DEMO,
  EXPEDIENTES_DEMO,
  HISTORIAL_MOVIMIENTOS_DEMO,
} from "./demo-store";

interface AppContextType {
  clientes: Cliente[];
  equipos: Equipo[];
  cotizaciones: Cotizacion[];
  expedientes: Expediente[];
  historial: MovimientoHistorial[];
  notificacion: string | null;
  mostrarNotificacion: (msg: string) => void;
  agregarCliente: (nuevo: Omit<Cliente, "id">) => Cliente;
  agregarCotizacion: (cot: Omit<Cotizacion, "id" | "expedienteId">) => { cotizacionId: string; expedienteId: string };
  actualizarCotizacion: (id: string, updates: Partial<Cotizacion>) => void;
  eliminarCotizacion: (id: string, eliminarExpediente?: boolean) => void;
  actualizarExpediente: (id: string, updates: Partial<Expediente>) => void;
  adjuntarReporteTecnico: (expedienteId: string, reporte: {
    numeroReporte: string;
    fechaServicio: string;
    horometro: number;
    pdfNombre: string;
    tecnico: string;
    actividades: string;
  }) => { exito: boolean; alertaHorometro?: string };
  eliminarReporteTecnico: (expedienteId: string) => void;
  registrarPago: (
    expedienteId: string,
    monto: number,
    comprobante: string,
    doc?: { nombre: string; tipo: "pdf" | "image"; url?: string }
  ) => void;
  eliminarMovimientoHistorial: (id: string) => void;
  limpiarHistorialCompleto: () => void;
  reiniciarHorometroEquipo: (equipoId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "industrac_app_data_v3";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(CLIENTES_DEMO);
  const [equipos, setEquipos] = useState<Equipo[]>(EQUIPOS_DEMO);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(COTIZACIONES_DEMO);
  const [expedientes, setExpedientes] = useState<Expediente[]>(EXPEDIENTES_DEMO);
  const [historial, setHistorial] = useState<MovimientoHistorial[]>(HISTORIAL_MOVIMIENTOS_DEMO);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Sincronizar desde localStorage de manera segura tras el montaje en el cliente
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.clientes && Array.isArray(parsed.clientes) && parsed.clientes.length > 0) {
          setClientes(parsed.clientes);
        }
        if (parsed.equipos && Array.isArray(parsed.equipos)) setEquipos(parsed.equipos);
        if (parsed.cotizaciones && Array.isArray(parsed.cotizaciones)) setCotizaciones(parsed.cotizaciones);
        if (parsed.expedientes && Array.isArray(parsed.expedientes)) setExpedientes(parsed.expedientes);
        if (parsed.historial && Array.isArray(parsed.historial)) setHistorial(parsed.historial);
      }
    } catch {}
  }, []);

  const persistir = (
    cots: Cotizacion[],
    exps: Expediente[],
    eqs: Equipo[],
    hist: MovimientoHistorial[],
    cls: Cliente[] = clientes
  ) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          cotizaciones: cots,
          expedientes: exps,
          equipos: eqs,
          historial: hist,
          clientes: cls,
        })
      );
    } catch {
      // Ignore storage errors
    }
  };

  const agregarCliente = (nuevo: Omit<Cliente, "id">): Cliente => {
    // Si ya existe cliente con mismo RUC, retornar el existente
    if (nuevo.ruc) {
      const existePorRuc = clientes.find((c) => c.ruc === nuevo.ruc);
      if (existePorRuc) return existePorRuc;
    }
    // Si ya existe por razón social exacta, retornar el existente
    const existePorNombre = clientes.find(
      (c) => c.razonSocial.trim().toLowerCase() === nuevo.razonSocial.trim().toLowerCase()
    );
    if (existePorNombre) return existePorNombre;

    const clienteCreado: Cliente = {
      ...nuevo,
      id: `c-${Date.now()}`,
    };
    const nuevosClientes = [...clientes, clienteCreado];
    setClientes(nuevosClientes);
    persistir(cotizaciones, expedientes, equipos, historial, nuevosClientes);
    return clienteCreado;
  };

  const mostrarNotificacion = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => {
      setNotificacion((current) => (current === msg ? null : current));
    }, 4000);
  };

  const agregarCotizacion = (nueva: Omit<Cotizacion, "id" | "expedienteId">) => {
    const cotId = `cot-${Date.now()}`;
    const expId = `exp-${Date.now()}`;
    const year = new Date().getFullYear();
    const shortCode = nueva.numero.replace(/\D/g, "").slice(-4) || "0171";
    const codigoExp = `${shortCode}-${year} – ${nueva.clienteNombre.split(" ")[0]} – ${nueva.equipoModelo.split(" ")[0] || "EQUIPO"}`;

    const nuevaCot: Cotizacion = {
      ...nueva,
      id: cotId,
      expedienteId: expId,
    };

    const nuevoExp: Expediente = {
      id: expId,
      codigo: codigoExp,
      cotizacionNumero: nueva.numero,
      clienteId: nueva.clienteId,
      clienteNombre: nueva.clienteNombre,
      equipoModelo: nueva.equipoModelo,
      serie: nueva.serie,
      descripcion: nueva.descripcion,
      total: nueva.total,
      moneda: nueva.moneda,
      fechaCreacion: nueva.fecha,
      estadoGeneral: "Cotización",
      aprobacionEstado: "Pendiente",
      ordenCompraSituacion: "pendiente",
      servicioEstado: "Pendiente",
      pagosTotal: 0,
      saldoPendiente: nueva.total,
      cierreFinanciero: false,
    };

    const nuevoMovimiento: MovimientoHistorial = {
      id: `mov-${Date.now()}`,
      expedienteCodigo: codigoExp,
      fechaHora: new Date().toLocaleString("es-PE"),
      usuario: "usuario@industrac.com.pe",
      tipo: "Registro de Cotización",
      detalle: `Se registró ${nueva.numero} por ${nueva.moneda} ${nueva.total.toFixed(2)} y se generó el expediente administrativo ${codigoExp}.`,
    };

    const nuevasCots = [nuevaCot, ...cotizaciones];
    const nuevosExps = [nuevoExp, ...expedientes];
    const nuevoHist = [nuevoMovimiento, ...historial];

    setCotizaciones(nuevasCots);
    setExpedientes(nuevosExps);
    setHistorial(nuevoHist);
    persistir(nuevasCots, nuevosExps, equipos, nuevoHist);

    mostrarNotificacion(`Cotización ${nueva.numero} registrada y expediente creado.`);
    return { cotizacionId: cotId, expedienteId: expId };
  };

  const actualizarCotizacion = (id: string, updates: Partial<Cotizacion>) => {
    setCotizaciones((prev) => {
      const nuevas = prev.map((c) => (c.id === id || c.numero === id ? { ...c, ...updates } : c));
      persistir(nuevas, expedientes, equipos, historial);
      return nuevas;
    });
  };

  const eliminarCotizacion = (cotizacionId: string, eliminarExpediente: boolean = true) => {
    const cotAEliminar = cotizaciones.find((c) => c.id === cotizacionId);
    if (!cotAEliminar) return;

    const nuevasCots = cotizaciones.filter((c) => c.id !== cotizacionId);
    let nuevosExps = expedientes;

    if (eliminarExpediente) {
      nuevosExps = expedientes.filter(
        (e) => e.id !== cotAEliminar.expedienteId && e.cotizacionNumero !== cotAEliminar.numero
      );
    }

    const nuevoMovimiento: MovimientoHistorial = {
      id: `mov-${Date.now()}`,
      expedienteCodigo: cotAEliminar.numero,
      fechaHora: new Date().toLocaleString("es-PE"),
      usuario: "administracion@industrac.com.pe",
      tipo: "Eliminación de Cotización",
      detalle: `Se eliminó la cotización ${cotAEliminar.numero} (${cotAEliminar.clienteNombre})${
        eliminarExpediente ? " y su expediente administrativo asociado" : ""
      }.`,
    };

    const nuevoHist = [nuevoMovimiento, ...historial];

    setCotizaciones(nuevasCots);
    setExpedientes(nuevosExps);
    setHistorial(nuevoHist);
    persistir(nuevasCots, nuevosExps, equipos, nuevoHist);

    mostrarNotificacion(`Cotización ${cotAEliminar.numero} eliminada correctamente.`);
  };

  const actualizarExpediente = (id: string, updates: Partial<Expediente>) => {
    const nuevosExps = expedientes.map((exp) => {
      if (exp.id === id) {
        return { ...exp, ...updates };
      }
      return exp;
    });

    const expedienteModificado = expedientes.find(e => e.id === id);
    const nuevoMovimiento: MovimientoHistorial = {
      id: `mov-${Date.now()}`,
      expedienteCodigo: expedienteModificado?.codigo || id,
      fechaHora: new Date().toLocaleString("es-PE"),
      usuario: "usuario@industrac.com.pe",
      tipo: "Actualización Administrativa",
      detalle: `Modificación de estado en expediente: ${Object.keys(updates).join(", ")}.`,
    };

    const nuevoHist = [nuevoMovimiento, ...historial];
    setExpedientes(nuevosExps);
    setHistorial(nuevoHist);
    persistir(cotizaciones, nuevosExps, equipos, nuevoHist);
    mostrarNotificacion("Expediente actualizado exitosamente.");
  };

  const adjuntarReporteTecnico = (expedienteId: string, reporte: {
    numeroReporte: string;
    fechaServicio: string;
    horometro: number;
    pdfNombre: string;
    tecnico: string;
    actividades: string;
  }) => {
    const targetExp = expedientes.find(e => e.id === expedienteId);
    if (!targetExp) return { exito: false };

    let alertaHorometro: string | undefined;

    // Actualizar equipo si coincide serie
    const nuevosEquipos = equipos.map((eq) => {
      if (eq.serie === targetExp.serie || eq.modelo === targetExp.equipoModelo) {
        if (reporte.horometro < eq.horometroActual) {
          alertaHorometro = `¡Atención! El horómetro ingresado (${reporte.horometro} h) es inferior al registro anterior (${eq.horometroActual} h). Verifique el documento.`;
        }
        return {
          ...eq,
          horometroActual: reporte.horometro,
          ultimoMantenimientoFecha: reporte.fechaServicio,
          ultimoMantenimientoTipo: "Servicio Técnico Confirmado",
          proximoMantenimientoEstimado: "Próximo en 3 meses o según horas acumuladas",
        };
      }
      return eq;
    });

    const nuevosExps = expedientes.map((exp) => {
      if (exp.id === expedienteId) {
        return {
          ...exp,
          reporteTecnicoNumero: reporte.numeroReporte,
          reporteTecnicoFecha: reporte.fechaServicio,
          reporteTecnicoPdf: reporte.pdfNombre,
          horometroRegistrado: reporte.horometro,
          servicioEstado: "Ejecutado" as const,
          servicioTecnico: reporte.tecnico,
          estadoGeneral: "Por Facturar" as const,
        };
      }
      return exp;
    });

    const nuevoMovimiento: MovimientoHistorial = {
      id: `mov-${Date.now()}`,
      expedienteCodigo: targetExp.codigo,
      fechaHora: new Date().toLocaleString("es-PE"),
      usuario: "servicio@industrac.com.pe",
      tipo: "Reporte Técnico Confirmado",
      detalle: `Se adjuntó ${reporte.numeroReporte}. Horómetro confirmado en ${reporte.horometro} h. Servicio marcado como Ejecutado.`,
    };

    const nuevoHist = [nuevoMovimiento, ...historial];
    setEquipos(nuevosEquipos);
    setExpedientes(nuevosExps);
    setHistorial(nuevoHist);
    persistir(cotizaciones, nuevosExps, nuevosEquipos, nuevoHist);

    mostrarNotificacion(`Reporte ${reporte.numeroReporte} adjuntado y horómetro actualizado.`);
    return { exito: true, alertaHorometro };
  };

  const eliminarReporteTecnico = (expedienteId: string) => {
    const targetExp = expedientes.find((e) => e.id === expedienteId);
    if (!targetExp || !targetExp.reporteTecnicoNumero) return;

    const numReporte = targetExp.reporteTecnicoNumero;

    const nuevosExps = expedientes.map((exp) => {
      if (exp.id === expedienteId) {
        return {
          ...exp,
          reporteTecnicoNumero: undefined,
          reporteTecnicoFecha: undefined,
          reporteTecnicoPdf: undefined,
          horometroRegistrado: undefined,
          servicioTecnico: undefined,
          servicioEstado: "Pendiente" as const,
          estadoGeneral: (exp.ordenCompraSituacion === "recibida"
            ? "Aprobado"
            : "Cotización") as Expediente["estadoGeneral"],
        };
      }
      return exp;
    });

    const nuevoMovimiento: MovimientoHistorial = {
      id: `mov-${Date.now()}`,
      expedienteCodigo: targetExp.codigo,
      fechaHora: new Date().toLocaleString("es-PE"),
      usuario: "servicio@industrac.com.pe",
      tipo: "Eliminación de Reporte Técnico",
      detalle: `Se desvinculó y eliminó el reporte técnico ${numReporte} del expediente ${targetExp.codigo}.`,
    };

    const nuevoHist = [nuevoMovimiento, ...historial];

    setExpedientes(nuevosExps);
    setHistorial(nuevoHist);
    persistir(cotizaciones, nuevosExps, equipos, nuevoHist);

    mostrarNotificacion(`Reporte técnico ${numReporte} eliminado del expediente.`);
  };

  const registrarPago = (
    expedienteId: string,
    monto: number,
    comprobante: string,
    doc?: { nombre: string; tipo: "pdf" | "image"; url?: string }
  ) => {
    const fechaHoy = new Date().toISOString().split("T")[0];
    const nuevosExps = expedientes.map((exp) => {
      if (exp.id === expedienteId) {
        const nuevoPagos = exp.pagosTotal + monto;
        const nuevoSaldo = Math.max(0, exp.total - nuevoPagos);
        const cierre = nuevoSaldo === 0;

        const nuevoPagoItem = {
          id: `pago-${Date.now()}`,
          fecha: fechaHoy,
          monto,
          comprobante,
          docNombre: doc?.nombre,
          docTipo: doc?.tipo,
          docUrl: doc?.url,
        };

        const historialExistente = exp.pagosHistorial || [];

        return {
          ...exp,
          pagosTotal: nuevoPagos,
          saldoPendiente: nuevoSaldo,
          cierreFinanciero: cierre,
          estadoGeneral: (cierre ? "Cerrado" : "Facturado") as Expediente["estadoGeneral"],
          comprobantePagoDoc: doc?.nombre || exp.comprobantePagoDoc,
          comprobantePagoTipo: doc?.tipo || exp.comprobantePagoTipo,
          comprobantePagoUrl: doc?.url || exp.comprobantePagoUrl,
          comprobantePagoFecha: doc ? fechaHoy : exp.comprobantePagoFecha,
          pagosHistorial: [nuevoPagoItem, ...historialExistente],
        };
      }
      return exp;
    });

    const expTarget = expedientes.find(e => e.id === expedienteId);
    const detalleDoc = doc?.nombre ? ` con archivo adjunto ${doc.nombre}` : "";
    const nuevoMovimiento: MovimientoHistorial = {
      id: `mov-${Date.now()}`,
      expedienteCodigo: expTarget?.codigo || expedienteId,
      fechaHora: new Date().toLocaleString("es-PE"),
      usuario: "cobranzas@industrac.com.pe",
      tipo: "Recepción de Pago",
      detalle: `Abono de ${expTarget?.moneda || "USD"} ${monto.toFixed(2)} registrado con comprobante ${comprobante}${detalleDoc}.`,
    };

    const nuevoHist = [nuevoMovimiento, ...historial];
    setExpedientes(nuevosExps);
    setHistorial(nuevoHist);
    persistir(cotizaciones, nuevosExps, equipos, nuevoHist);
    mostrarNotificacion(`Pago de ${monto.toFixed(2)} registrado correctamente.`);
  };

  const eliminarMovimientoHistorial = (id: string) => {
    const nuevoHist = historial.filter((h) => h.id !== id);
    setHistorial(nuevoHist);
    persistir(cotizaciones, expedientes, equipos, nuevoHist);
    mostrarNotificacion("Registro del historial eliminado.");
  };

  const limpiarHistorialCompleto = () => {
    setHistorial([]);
    persistir(cotizaciones, expedientes, equipos, []);
    mostrarNotificacion("Historial de auditoría vaciado completamente.");
  };

  const reiniciarHorometroEquipo = (equipoId: string) => {
    const targetEq = equipos.find(e => e.id === equipoId);
    if (!targetEq) return;

    const nuevosEquipos = equipos.map((eq) => {
      if (eq.id === equipoId) {
        return {
          ...eq,
          horometroActual: 0,
          ultimoMantenimientoTipo: undefined,
          ultimoMantenimientoFecha: undefined,
          proximoMantenimientoEstimado: undefined,
        };
      }
      return eq;
    });

    const nuevoMov: MovimientoHistorial = {
      id: `mov-${Date.now()}`,
      expedienteCodigo: targetEq.serie,
      fechaHora: new Date().toLocaleString("es-PE"),
      usuario: "administracion@industrac.com.pe",
      tipo: "Reinicio de Horómetro",
      detalle: `Se restableció a cero el horómetro y registro previo del compresor serie ${targetEq.serie}.`,
    };

    const nuevoHist = [nuevoMov, ...historial];
    setEquipos(nuevosEquipos);
    setHistorial(nuevoHist);
    persistir(cotizaciones, expedientes, nuevosEquipos, nuevoHist);
    mostrarNotificacion(`Horómetro del equipo serie ${targetEq.serie} reiniciado a cero.`);
  };

  return (
    <AppContext.Provider
      value={{
        clientes,
        equipos,
        cotizaciones,
        expedientes,
        historial,
        notificacion,
        mostrarNotificacion,
        agregarCliente,
        agregarCotizacion,
        actualizarCotizacion,
        eliminarCotizacion,
        actualizarExpediente,
        adjuntarReporteTecnico,
        eliminarReporteTecnico,
        registrarPago,
        eliminarMovimientoHistorial,
        limpiarHistorialCompleto,
        reiniciarHorometroEquipo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp debe usarse dentro de un AppProvider");
  }
  return context;
}
