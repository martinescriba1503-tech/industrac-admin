"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { Expediente } from "@/lib/demo-store";
import DocumentModal from "@/components/DocumentModal";

export default function FacturacionPage() {
  const { expedientes, actualizarExpediente, mostrarNotificacion } = useApp();

  // Modal completo de emisión
  const [modalAbierto, setModalAbierto] = useState(false);
  const [expId, setExpId] = useState(expedientes[0]?.id || "");
  const [numFactura, setNumFactura] = useState("F001-0004930");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

  // Archivo seleccionado (PDF o Foto)
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoPreviewUrl, setArchivoPreviewUrl] = useState<string | null>(null);
  const [archivoTipo, setArchivoTipo] = useState<"pdf" | "image">("pdf");

  // Modal rápido de subida desde fila
  const [modalSubirExp, setModalSubirExp] = useState<Expediente | null>(null);

  // Visor de factura
  const [visorDoc, setVisorDoc] = useState<{
    abierto: boolean;
    expediente?: Expediente;
    nombre: string;
    tipo: "pdf" | "image";
    url?: string;
  }>({
    abierto: false,
    nombre: "",
    tipo: "pdf",
  });

  const procesarArchivo = (file: File) => {
    const esImg = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    setArchivo(file);
    setArchivoTipo(esImg ? "image" : "pdf");

    const reader = new FileReader();
    reader.onload = () => {
      setArchivoPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Intentar deducir número de factura desde el nombre
    const matchFactura = file.name.match(/F\d{3}[-_ ]?\d{7,8}/i) || file.name.match(/([FE]\d{3}[-_ ]?\d+)/i);
    if (matchFactura) {
      setNumFactura(matchFactura[1].toUpperCase().replace("_", "-"));
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

  const handleGuardarFactura = (e: React.FormEvent) => {
    e.preventDefault();
    const target = expedientes.find((x) => x.id === expId);
    if (!target) return;

    const updates: Partial<Expediente> = {
      facturaNumero: numFactura.trim(),
      facturaFecha: fecha,
      facturaMonto: target.total,
      estadoGeneral: "Facturado",
    };

    if (archivo) {
      updates.facturaDocNombre = archivo.name;
      updates.facturaDocTipo = archivoTipo;
      updates.facturaDocUrl = archivoPreviewUrl || undefined;
      updates.facturaDocFecha = fecha;

      const upData = new FormData();
      upData.append("file", archivo);
      upData.append("subcarpeta", "06_FACTURACION");
      upData.append("expedienteCodigo", target.codigo);
      upData.append("nombreArchivo", archivo.name);

      fetch("/api/documentos/upload", {
        method: "POST",
        body: upData,
      })
        .then(async (res) => {
          if (res.ok) {
            const upRes = await res.json();
            if (upRes.url) {
              actualizarExpediente(expId, { facturaDocUrl: upRes.url });
            }
          }
        })
        .catch((e) => console.warn("Error subiendo factura:", e));
    }

    actualizarExpediente(expId, updates);
    mostrarNotificacion(`Factura ${numFactura} emitida y documento vinculado.`);
    limpiarFormulario();
  };

  const handleGuardarSubidaRapida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSubirExp || !archivo) return;

    const fechaHoy = new Date().toISOString().split("T")[0];
    actualizarExpediente(modalSubirExp.id, {
      facturaDocNombre: archivo.name,
      facturaDocTipo: archivoTipo,
      facturaDocUrl: archivoPreviewUrl || undefined,
      facturaDocFecha: fechaHoy,
      facturaNumero: numFactura.trim() || modalSubirExp.facturaNumero || "F001-0004930",
      facturaFecha: modalSubirExp.facturaFecha || fechaHoy,
      facturaMonto: modalSubirExp.total,
      estadoGeneral: "Facturado",
    });

    const targetId = modalSubirExp.id;
    const upData = new FormData();
    upData.append("file", archivo);
    upData.append("subcarpeta", "06_FACTURACION");
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
            actualizarExpediente(targetId, { facturaDocUrl: upRes.url });
          }
        }
      })
      .catch((e) => console.warn("Error subiendo factura rápida:", e));

    mostrarNotificacion(`Documento de factura ${archivo.name} adjuntado.`);
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
      nombre: exp.facturaDocNombre || `${exp.facturaNumero || "FACTURA"}.pdf`,
      tipo: exp.facturaDocTipo || "pdf",
      url: exp.facturaDocUrl,
    });
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240] flex items-center gap-2">
            <span>Módulo de Facturación</span>
            <span className="text-xs bg-[#18A2D9]/20 text-[#051A59] px-2.5 py-0.5 rounded-full font-bold">
              PDF / FOTO
            </span>
          </h1>
          <p className="text-xs text-gray-600">
            Emisión, digitalización y consulta de facturas electrónicas relacionadas a expedientes concluidos.
          </p>
        </div>
        <button
          onClick={() => {
            setExpId(expedientes[0]?.id || "");
            setNumFactura("F001-0004930");
            setFecha(new Date().toISOString().split("T")[0]);
            setArchivo(null);
            setArchivoPreviewUrl(null);
            setModalAbierto(true);
          }}
          className="bg-[#051A59] hover:bg-[#031240] text-white px-4 py-2 rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>📎</span>
          <span>+ Emitir / Registrar Factura (PDF/Foto)</span>
        </button>
      </div>

      {/* Banner Informativo Drive */}
      <div className="bg-[#051A59]/5 border-l-4 border-[#18A2D9] p-3 text-xs text-[#031240] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">💼</span>
          <div>
            <strong>Archivo tributario en Google Drive:</strong> Las facturas emitidas, en formato digital PDF o foto del comprobante físico, quedan sincronizadas en <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px] font-bold text-[#051A59]">06_FACTURACION/</code>.
          </div>
        </div>
        <span className="text-[11px] text-gray-500 font-mono">Formatos: .pdf, .jpg, .png</span>
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">N° Factura</th>
              <th className="py-3 px-4">Expediente</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Fecha Emisión</th>
              <th className="py-3 px-4">Importe Total</th>
              <th className="py-3 px-4">Saldo Pendiente</th>
              <th className="py-3 px-4">Documento (PDF / Foto)</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expedientes.map((exp) => {
              const tieneDoc = Boolean(exp.facturaDocNombre);
              const esImagen = exp.facturaDocTipo === "image" || /\.(png|jpe?g|webp)$/i.test(exp.facturaDocNombre || "");

              return (
                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#051A59]">
                    {exp.facturaNumero || <span className="text-gray-400 font-normal italic">Sin facturar</span>}
                  </td>
                  <td className="py-3 px-4 font-medium">{exp.codigo}</td>
                  <td className="py-3 px-4">{exp.clienteNombre}</td>
                  <td className="py-3 px-4 text-gray-600">{exp.facturaFecha || "-"}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {exp.moneda} {exp.total.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    <span className={exp.saldoPendiente > 0 ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"}>
                      {exp.moneda} {exp.saldoPendiente.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {tieneDoc ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          esImagen ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {esImagen ? "📸 FOTO" : "📄 PDF"}
                        </span>
                        <span className="font-mono text-[11px] text-gray-700 truncate max-w-[120px]" title={exp.facturaDocNombre}>
                          {exp.facturaDocNombre}
                        </span>
                        <button
                          onClick={() => abrirVisor(exp)}
                          className="text-[#18A2D9] hover:text-[#051A59] font-bold text-xs p-1"
                          title="Ver documento adjunto de factura"
                        >
                          👁
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-[11px] italic">Sin adjunto</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setModalSubirExp(exp);
                          setNumFactura(exp.facturaNumero || "F001-0004930");
                          setArchivo(null);
                          setArchivoPreviewUrl(null);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] bg-sky-50 hover:bg-sky-100 text-[#051A59] border border-sky-200 font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer"
                        title="Subir documento PDF o Foto de la factura"
                      >
                        <span>📎</span>
                        <span>{tieneDoc ? "Cambiar Factura" : "Subir PDF/Foto"}</span>
                      </button>
                      <a href="/pagos" className="text-xs text-[#18A2D9] font-semibold hover:underline">
                        Cobro →
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: REGISTRAR FACTURA CON SUBIDA DE DOCUMENTO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <h2 className="text-base font-bold text-[#031240]">Registrar / Emitir Factura</h2>
              <button onClick={limpiarFormulario} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleGuardarFactura} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Expediente a Facturar:</label>
                <select
                  value={expId}
                  onChange={(e) => setExpId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-2 text-xs text-[#031240] bg-white focus:outline-none focus:border-[#18A2D9]"
                >
                  {expedientes.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.codigo} ({e.moneda} {e.total.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Número de Factura:</label>
                  <input
                    type="text"
                    required
                    value={numFactura}
                    onChange={(e) => setNumFactura(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Fecha de Emisión:</label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* ZONA DE SUBIDA DE PDF O FOTO DE FACTURA */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1.5">
                  Adjuntar Documento de la Factura (PDF o Fotografía):
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[#18A2D9]/60 hover:border-[#18A2D9] rounded-lg p-4 bg-sky-50/40 text-center transition-colors cursor-pointer"
                  onClick={() => document.getElementById("input-file-factura")?.click()}
                >
                  <input
                    id="input-file-factura"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {archivo ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-xs">
                        <span>{archivoTipo === "image" ? "📸 Foto de Factura" : "📄 PDF de Factura"}:</span>
                        <span className="font-mono text-[11px]">{archivo.name}</span>
                        <span className="text-[10px] text-gray-400">({(archivo.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      {archivoTipo === "image" && archivoPreviewUrl && (
                        <div className="flex justify-center mt-2">
                          <img
                            src={archivoPreviewUrl}
                            alt="Vista previa factura"
                            className="max-h-28 rounded border border-gray-300 shadow-xs object-contain"
                          />
                        </div>
                      )}
                      <p className="text-[10px] text-gray-500">Haz clic para cambiar archivo</p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      <div className="text-2xl">📸 📄</div>
                      <p className="font-semibold text-gray-800">
                        Arrastra aquí el PDF o Foto de la Factura, o haz clic para examinar
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Acepta PDFs oficiales SUNAT y fotografías de comprobantes físicos
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-gray-50 border rounded text-[11px] text-gray-600 flex items-center justify-between">
                <span>Destino en Drive:</span>
                <span className="font-mono font-semibold text-[#051A59]">06_FACTURACION/</span>
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
                  className="bg-[#051A59] hover:bg-[#031240] text-white px-4 py-1.5 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Emisión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBIDA RÁPIDA DE FACTURA DESDE FILA */}
      {modalSubirExp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <div>
                <h2 className="text-base font-bold text-[#031240]">Subir Factura (PDF / Foto)</h2>
                <p className="text-xs text-gray-500 font-semibold">{modalSubirExp.codigo}</p>
              </div>
              <button onClick={limpiarFormulario} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleGuardarSubidaRapida} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">N° de Factura:</label>
                <input
                  type="text"
                  required
                  value={numFactura}
                  onChange={(e) => setNumFactura(e.target.value)}
                  className="w-full border rounded px-2.5 py-1.5 text-xs font-mono font-semibold"
                />
              </div>

              {/* Selector de archivo */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Selecciona el archivo (PDF o Foto):
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[#18A2D9] rounded-lg p-4 bg-sky-50/50 text-center cursor-pointer"
                  onClick={() => document.getElementById("input-file-rapido-factura")?.click()}
                >
                  <input
                    id="input-file-rapido-factura"
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
                      <div className="text-2xl mb-1">📎</div>
                      <p className="font-semibold">Selecciona o arrastra el comprobante aquí</p>
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
                  className="bg-[#051A59] hover:bg-[#031240] disabled:bg-gray-300 text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
                >
                  Confirmar y Subir a Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISOR MODAL DE FACTURA */}
      <DocumentModal
        isOpen={visorDoc.abierto}
        onClose={() => setVisorDoc({ abierto: false, nombre: "", tipo: "pdf" })}
        titulo={`Factura Electrónica - ${visorDoc.expediente?.clienteNombre || ""}`}
        nombreArchivo={visorDoc.nombre}
        tipoArchivo={visorDoc.tipo}
        url={visorDoc.url}
        carpetaDrive="06_FACTURACION"
        detalles={[
          { etiqueta: "N° Factura", valor: visorDoc.expediente?.facturaNumero || "-" },
          { etiqueta: "Expediente", valor: visorDoc.expediente?.codigo || "" },
          { etiqueta: "Cliente", valor: visorDoc.expediente?.clienteNombre || "" },
          { etiqueta: "Fecha Emisión", valor: visorDoc.expediente?.facturaFecha || "-" },
          {
            etiqueta: "Importe",
            valor: `${visorDoc.expediente?.moneda || "USD"} ${visorDoc.expediente?.total.toFixed(2) || "0.00"}`,
          },
        ]}
      />
    </div>
  );
}
