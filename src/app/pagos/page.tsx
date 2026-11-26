"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { Expediente } from "@/lib/demo-store";
import DocumentModal from "@/components/DocumentModal";

export default function PagosPage() {
  const { expedientes, registrarPago, actualizarExpediente, mostrarNotificacion } = useApp();

  // Modal registrar pago
  const [modalAbierto, setModalAbierto] = useState(false);
  const [expId, setExpId] = useState(expedientes[0]?.id || "");
  const [monto, setMonto] = useState<number>(1000);
  const [comprobante, setComprobante] = useState("TRANSF-BCP-99120");

  // Archivo seleccionado para el comprobante (PDF o Foto)
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoPreviewUrl, setArchivoPreviewUrl] = useState<string | null>(null);
  const [archivoTipo, setArchivoTipo] = useState<"pdf" | "image">("image");

  // Modal rápido de subida de voucher para un expediente
  const [modalSubirExp, setModalSubirExp] = useState<Expediente | null>(null);

  // Visor de voucher / comprobante
  const [visorDoc, setVisorDoc] = useState<{
    abierto: boolean;
    expediente?: Expediente;
    nombre: string;
    tipo: "pdf" | "image";
    url?: string;
    monto?: number;
    numOperacion?: string;
  }>({
    abierto: false,
    nombre: "",
    tipo: "image",
  });

  const totalFacturadoUSD = expedientes.filter(e => e.moneda === "USD").reduce((a, b) => a + b.total, 0);
  const totalCobradoUSD = expedientes.filter(e => e.moneda === "USD").reduce((a, b) => a + b.pagosTotal, 0);
  const saldoUSD = expedientes.filter(e => e.moneda === "USD").reduce((a, b) => a + b.saldoPendiente, 0);

  const procesarArchivo = (file: File) => {
    const esImg = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    setArchivo(file);
    setArchivoTipo(esImg ? "image" : "pdf");

    const reader = new FileReader();
    reader.onload = () => {
      setArchivoPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-detectar número de operación o comprobante
    const matchOp = file.name.match(/OP[-_ ]?(\d+)/i) || file.name.match(/(BCP|BBVA|INTERBANK|TRANSF)[-_ ]?([A-Z0-9]+)/i);
    if (matchOp) {
      setComprobante(matchOp[0].toUpperCase().replace("_", "-"));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) procesarArchivo(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) procesarArchivo(f);
  };

  const handleConfirmarPago = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expId || monto <= 0) return;

    const docInfo = archivo
      ? {
          nombre: archivo.name,
          tipo: archivoTipo,
          url: archivoPreviewUrl || undefined,
        }
      : undefined;

    registrarPago(expId, Number(monto), comprobante, docInfo);

    if (archivo) {
      const expTarget = expedientes.find((x) => x.id === expId);
      const upData = new FormData();
      upData.append("file", archivo);
      upData.append("subcarpeta", "07_PAGOS");
      upData.append("expedienteCodigo", expTarget?.codigo || "EXP-PAGO");
      upData.append("nombreArchivo", archivo.name);

      fetch("/api/documentos/upload", {
        method: "POST",
        body: upData,
      })
        .then(async (res) => {
          if (res.ok) {
            const upRes = await res.json();
            if (upRes.url) {
              actualizarExpediente(expId, { comprobantePagoUrl: upRes.url });
            }
          }
        })
        .catch((e) => console.warn("Error subiendo voucher:", e));
    }

    limpiarFormulario();
  };

  const handleGuardarSubidaRapida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSubirExp || !archivo) return;

    const fechaHoy = new Date().toISOString().split("T")[0];
    actualizarExpediente(modalSubirExp.id, {
      comprobantePagoDoc: archivo.name,
      comprobantePagoTipo: archivoTipo,
      comprobantePagoUrl: archivoPreviewUrl || undefined,
      comprobantePagoFecha: fechaHoy,
    });

    const targetId = modalSubirExp.id;
    const upData = new FormData();
    upData.append("file", archivo);
    upData.append("subcarpeta", "07_PAGOS");
    upData.append("expedienteCodigo", modalSubirExp.codigo);
    upData.append("nombreArchivo", archivo.name);

    fetch("/api/documentos/upload", {
      method: "POST",
      body: upData,
    })
      .then(async (res) => {
        if (res.ok) {
          const upRes = await res.json();
          if (upRes.url) {
            actualizarExpediente(targetId, { comprobantePagoUrl: upRes.url });
          }
        }
      })
      .catch((e) => console.warn("Error subiendo voucher rápido:", e));

    mostrarNotificacion(`Voucher ${archivo.name} vinculado al expediente.`);
    limpiarFormulario();
  };

  const limpiarFormulario = () => {
    setModalAbierto(false);
    setModalSubirExp(null);
    setArchivo(null);
    setArchivoPreviewUrl(null);
  };

  const abrirVisor = (exp: Expediente) => {
    setVisorDoc({
      abierto: true,
      expediente: exp,
      nombre: exp.comprobantePagoDoc || "COMPROBANTE_PAGO.pdf",
      tipo: exp.comprobantePagoTipo || (/\.(png|jpe?g|webp)$/i.test(exp.comprobantePagoDoc || "") ? "image" : "pdf"),
      url: exp.comprobantePagoUrl,
      monto: exp.pagosTotal,
      numOperacion: exp.pagosHistorial?.[0]?.comprobante,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240] flex items-center gap-2">
            <span>Pagos y Cobranzas</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
              VOUCHER PDF / FOTO
            </span>
          </h1>
          <p className="text-xs text-gray-600">
            Control de cuentas por cobrar, registro de abonos parciales, conciliación bancaria y archivo de vouchers en Google Drive.
          </p>
        </div>
        <button
          onClick={() => {
            setExpId(expedientes[0]?.id || "");
            setMonto(1000);
            setComprobante("TRANSF-BCP-99120");
            setArchivo(null);
            setArchivoPreviewUrl(null);
            setModalAbierto(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>💵</span>
          <span>+ Registrar Abono / Adjuntar Voucher</span>
        </button>
      </div>

      {/* Indicadores Financieros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Facturado (USD)</div>
          <div className="text-2xl font-bold text-[#031240] mt-1">${totalFacturadoUSD.toFixed(2)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Suma de expedientes facturados</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Cobrado (USD)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">${totalCobradoUSD.toFixed(2)}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Respaldado con vouchers archivados</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Saldo por Cobrar (USD)</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">${saldoUSD.toFixed(2)}</div>
          <div className="text-[10px] text-amber-600 mt-0.5 font-medium">Pendiente de regularización</div>
        </div>
      </div>

      {/* Banner Informativo Drive */}
      <div className="bg-[#051A59]/5 border-l-4 border-emerald-500 p-3 text-xs text-[#031240] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏦</span>
          <div>
            <strong>Archivo de Vouchers en Google Drive:</strong> Las fotos de transferencias tomadas desde celular, capturas de pantalla o extractos bancarios en PDF se resguardan en <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px] font-bold text-[#051A59]">07_PAGOS/</code>.
          </div>
        </div>
        <span className="text-[11px] text-gray-500 font-mono">Formatos: .jpg, .png, .pdf</span>
      </div>

      {/* Tabla de Expedientes y Estados de Cobro */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#031240]">
            Estado de Cobranzas por Expediente
          </h2>
          <span className="text-xs text-gray-500">
            Total expedientes: {expedientes.length}
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Expediente</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Factura N°</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Total Pagado</th>
              <th className="py-3 px-4">Saldo Pendiente</th>
              <th className="py-3 px-4">Voucher (PDF / Foto)</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expedientes.map((exp) => {
              const tieneDoc = Boolean(exp.comprobantePagoDoc);
              const esImagen = exp.comprobantePagoTipo === "image" || /\.(png|jpe?g|webp)$/i.test(exp.comprobantePagoDoc || "");

              return (
                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#051A59]">{exp.codigo}</td>
                  <td className="py-3 px-4 font-medium">{exp.clienteNombre}</td>
                  <td className="py-3 px-4 font-mono">{exp.facturaNumero || <span className="text-gray-400 font-sans">Sin factura</span>}</td>
                  <td className="py-3 px-4">{exp.moneda} {exp.total.toFixed(2)}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">{exp.moneda} {exp.pagosTotal.toFixed(2)}</td>
                  <td className="py-3 px-4 font-semibold text-amber-700">
                    {exp.saldoPendiente > 0 ? `${exp.moneda} ${exp.saldoPendiente.toFixed(2)}` : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Cancelado</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {tieneDoc ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          esImagen ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {esImagen ? "📸 VOUCHER" : "📄 PDF"}
                        </span>
                        <span className="font-mono text-[11px] text-gray-700 truncate max-w-[120px]" title={exp.comprobantePagoDoc}>
                          {exp.comprobantePagoDoc}
                        </span>
                        <button
                          onClick={() => abrirVisor(exp)}
                          className="text-emerald-700 hover:text-emerald-900 font-bold text-xs p-1"
                          title="Ver comprobante de pago adjunto"
                        >
                          👁
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-[11px] italic">Sin voucher</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setModalSubirExp(exp);
                          setArchivo(null);
                          setArchivoPreviewUrl(null);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer"
                        title="Subir o actualizar comprobante bancario"
                      >
                        <span>📎</span>
                        <span>{tieneDoc ? "Cambiar Voucher" : "Subir Voucher"}</span>
                      </button>
                      <a href="/expedientes" className="text-xs text-[#051A59] font-semibold hover:underline">
                        Expediente →
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: REGISTRAR ABONO CON VOUCHER (PDF O FOTO) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <h2 className="text-base font-bold text-[#031240]">Registrar Abono / Pago Parcial</h2>
              <button onClick={limpiarFormulario} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleConfirmarPago} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Expediente:</label>
                <select
                  value={expId}
                  onChange={(e) => setExpId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-2 text-xs text-[#031240] bg-white focus:outline-none focus:border-[#18A2D9]"
                >
                  {expedientes.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.codigo} (Saldo: {e.moneda} {e.saldoPendiente.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Monto Pagado:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={monto}
                    onChange={(e) => setMonto(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-bold text-[#051A59]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">N° Operación / Referencia:</label>
                  <input
                    type="text"
                    required
                    value={comprobante}
                    onChange={(e) => setComprobante(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* ZONA DE SUBIDA DE VOUCHER (PDF O FOTO) */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1.5">
                  Adjuntar Comprobante o Voucher Bancario (PDF o Foto):
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-emerald-400/80 hover:border-emerald-500 rounded-lg p-4 bg-emerald-50/40 text-center transition-colors cursor-pointer"
                  onClick={() => document.getElementById("input-file-voucher")?.click()}
                >
                  <input
                    id="input-file-voucher"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {archivo ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-emerald-400 text-emerald-800 text-xs font-semibold shadow-xs">
                        <span>{archivoTipo === "image" ? "📸 Foto de Voucher" : "📄 PDF de Voucher"}:</span>
                        <span className="font-mono text-[11px]">{archivo.name}</span>
                        <span className="text-[10px] text-gray-400">({(archivo.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      {archivoTipo === "image" && archivoPreviewUrl && (
                        <div className="flex justify-center mt-2">
                          <img
                            src={archivoPreviewUrl}
                            alt="Vista previa voucher"
                            className="max-h-28 rounded border border-emerald-200 shadow-xs object-contain"
                          />
                        </div>
                      )}
                      <p className="text-[10px] text-gray-500">Haz clic para cambiar archivo</p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      <div className="text-2xl">📸 🧾</div>
                      <p className="font-semibold text-gray-800">
                        Arrastra aquí la Foto del Voucher o el comprobante en PDF
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Fotos de transferencias móviles (BCP, BBVA, Interbank) o documentos bancarios
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-gray-50 border rounded text-[11px] text-gray-600 flex items-center justify-between">
                <span>Destino en Google Drive:</span>
                <span className="font-mono font-semibold text-emerald-800">07_PAGOS/</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Pago y Guardar Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBIDA RÁPIDA DE VOUCHER DESDE FILA */}
      {modalSubirExp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <div>
                <h2 className="text-base font-bold text-[#031240]">Adjuntar Voucher de Pago</h2>
                <p className="text-xs text-gray-500 font-semibold">{modalSubirExp.codigo}</p>
              </div>
              <button onClick={limpiarFormulario} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleGuardarSubidaRapida} className="space-y-3.5 text-xs">
              <div className="p-3 bg-gray-50 rounded border text-xs space-y-1">
                <div><strong>Cliente:</strong> {modalSubirExp.clienteNombre}</div>
                <div><strong>Factura N°:</strong> {modalSubirExp.facturaNumero || "Sin factura"}</div>
                <div><strong>Monto Pagado:</strong> {modalSubirExp.moneda} {modalSubirExp.pagosTotal.toFixed(2)}</div>
              </div>

              {/* Selector de archivo */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Selecciona la Foto o PDF del Voucher:
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-emerald-400 rounded-lg p-4 bg-emerald-50/50 text-center cursor-pointer"
                  onClick={() => document.getElementById("input-file-rapido-voucher")?.click()}
                >
                  <input
                    id="input-file-rapido-voucher"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {archivo ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-emerald-400 text-emerald-800 text-xs font-semibold">
                        <span>{archivoTipo === "image" ? "📸 Foto" : "📄 PDF"}:</span>
                        <span className="font-mono text-[11px] truncate max-w-[200px]">{archivo.name}</span>
                      </div>
                      {archivoTipo === "image" && archivoPreviewUrl && (
                        <div className="flex justify-center">
                          <img src={archivoPreviewUrl} alt="Preview" className="max-h-24 rounded border object-contain" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-2 text-gray-600">
                      <div className="text-2xl mb-1">🧾</div>
                      <p className="font-semibold">Arrastra o selecciona el voucher aquí</p>
                      <p className="text-[10px] text-gray-400">PDF, JPG o PNG</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!archivo}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
                >
                  Vincular y Guardar en Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISOR MODAL DE VOUCHER / COMPROBANTE */}
      <DocumentModal
        isOpen={visorDoc.abierto}
        onClose={() => setVisorDoc({ abierto: false, nombre: "", tipo: "image" })}
        titulo={`Voucher de Pago - ${visorDoc.expediente?.clienteNombre || ""}`}
        nombreArchivo={visorDoc.nombre}
        tipoArchivo={visorDoc.tipo}
        url={visorDoc.url}
        carpetaDrive="07_PAGOS"
        detalles={[
          { etiqueta: "Expediente", valor: visorDoc.expediente?.codigo || "" },
          { etiqueta: "Cliente", valor: visorDoc.expediente?.clienteNombre || "" },
          {
            etiqueta: "Total Abonado",
            valor: `${visorDoc.expediente?.moneda || "USD"} ${visorDoc.expediente?.pagosTotal.toFixed(2) || "0.00"}`,
          },
          {
            etiqueta: "Saldo Pendiente",
            valor: `${visorDoc.expediente?.moneda || "USD"} ${visorDoc.expediente?.saldoPendiente.toFixed(2) || "0.00"}`,
          },
        ]}
      />
    </div>
  );
}
