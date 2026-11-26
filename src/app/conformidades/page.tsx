"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { Expediente } from "@/lib/demo-store";
import DocumentModal from "@/components/DocumentModal";

export default function ConformidadesPage() {
  const { expedientes, actualizarExpediente, mostrarNotificacion } = useApp();

  // Modal completo de registro/edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [expId, setExpId] = useState(expedientes[0]?.id || "");
  const [acta, setActa] = useState("");
  const [hes, setHes] = useState("");

  // Archivo seleccionado (PDF o Foto)
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoPreviewUrl, setArchivoPreviewUrl] = useState<string | null>(null);
  const [archivoTipo, setArchivoTipo] = useState<"pdf" | "image">("pdf");

  // Modal rápido de subida desde fila
  const [modalSubirExp, setModalSubirExp] = useState<Expediente | null>(null);

  // Visor de documentos
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

    // Intentar deducir números desde el nombre si están vacíos
    const matchActa = file.name.match(/ACTA[-_ ]?([A-Z0-9-]+)/i);
    if (matchActa && !acta) {
      setActa(`ACTA-${matchActa[1].toUpperCase()}`);
    }
    const matchHes = file.name.match(/HES[-_ ]?([A-Z0-9-]+)/i);
    if (matchHes && !hes) {
      setHes(`HES-${matchHes[1].toUpperCase()}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      procesarArchivo(f);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      procesarArchivo(f);
    }
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    const expTarget = expedientes.find((x) => x.id === expId);
    if (!expTarget) return;

    const fechaHoy = new Date().toISOString().split("T")[0];
    const updates: Partial<Expediente> = {
      actaNumero: acta.trim() || expTarget.actaNumero,
      hesNumero: hes.trim() || expTarget.hesNumero,
    };

    if (archivo) {
      updates.actaDocNombre = archivo.name;
      updates.actaDocTipo = archivoTipo;
      updates.actaDocUrl = archivoPreviewUrl || undefined;
      updates.actaDocFecha = fechaHoy;
    }

    actualizarExpediente(expId, updates);
    mostrarNotificacion(`Documento de Acta/HES guardado para ${expTarget.codigo}`);
    limpiarFormulario();
  };

  const handleGuardarSubidaRapida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSubirExp || !archivo) return;

    const fechaHoy = new Date().toISOString().split("T")[0];
    actualizarExpediente(modalSubirExp.id, {
      actaDocNombre: archivo.name,
      actaDocTipo: archivoTipo,
      actaDocUrl: archivoPreviewUrl || undefined,
      actaDocFecha: fechaHoy,
      actaNumero: acta.trim() || modalSubirExp.actaNumero || `ACTA-${Date.now().toString().slice(-4)}`,
      hesNumero: hes.trim() || modalSubirExp.hesNumero,
    });

    mostrarNotificacion(`Documento ${archivo.name} adjuntado a ${modalSubirExp.codigo}`);
    limpiarFormulario();
  };

  const limpiarFormulario = () => {
    setModalAbierto(false);
    setModalSubirExp(null);
    setArchivo(null);
    setArchivoPreviewUrl(null);
    setActa("");
    setHes("");
  };

  const abrirVisor = (exp: Expediente) => {
    setVisorDoc({
      abierto: true,
      expediente: exp,
      nombre: exp.actaDocNombre || `${exp.actaNumero || "ACTA"}.pdf`,
      tipo: exp.actaDocTipo || "pdf",
      url: exp.actaDocUrl,
    });
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#031240] flex items-center gap-2">
            <span>Actas de Conformidad y Códigos HES</span>
            <span className="text-xs bg-[#18A2D9]/20 text-[#051A59] px-2.5 py-0.5 rounded-full font-bold">
              PDF / FOTO
            </span>
          </h1>
          <p className="text-xs text-gray-600">
            Registro y digitalización de actas firmadas o fotografías de entrega y aceptación requeridas para autorizar facturación.
          </p>
        </div>
        <button
          onClick={() => {
            setExpId(expedientes[0]?.id || "");
            setActa("");
            setHes("");
            setArchivo(null);
            setArchivoPreviewUrl(null);
            setModalAbierto(true);
          }}
          className="bg-[#051A59] hover:bg-[#031240] text-white px-4 py-2 rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>📎</span>
          <span>+ Registrar Acta / Subir Documento</span>
        </button>
      </div>

      {/* Banner Informativo de Digitalización */}
      <div className="bg-[#051A59]/5 border-l-4 border-[#18A2D9] p-3 text-xs text-[#031240] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📁</span>
          <div>
            <strong>Almacenamiento automático en Google Drive:</strong> Los documentos adjuntados (PDF o fotos tomadas desde campo) se clasifican automáticamente en la subcarpeta <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px] font-bold text-[#051A59]">05_ACTA_HES/</code> de cada expediente.
          </div>
        </div>
        <span className="text-[11px] text-gray-500 font-mono whitespace-nowrap">Formatos: .pdf, .jpg, .png, .webp</span>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F2F2F2] text-gray-600 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Expediente</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">N° Acta</th>
              <th className="py-3 px-4">N° HES</th>
              <th className="py-3 px-4">Documento (PDF / Foto)</th>
              <th className="py-3 px-4">Carpeta Drive</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expedientes.map((exp) => {
              const tieneDoc = Boolean(exp.actaDocNombre);
              const esImagen = exp.actaDocTipo === "image" || /\.(png|jpe?g|webp)$/i.test(exp.actaDocNombre || "");

              return (
                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#051A59]">{exp.codigo}</td>
                  <td className="py-3 px-4 font-medium">{exp.clienteNombre}</td>
                  <td className="py-3 px-4">
                    {exp.actaNumero ? (
                      <span className="font-semibold text-gray-800">{exp.actaNumero}</span>
                    ) : (
                      <span className="text-gray-400 italic">Pendiente</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#18A2D9]">
                    {exp.hesNumero || <span className="text-gray-400 font-normal">No registrado</span>}
                  </td>
                  <td className="py-3 px-4">
                    {tieneDoc ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          esImagen ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {esImagen ? "📸 FOTO" : "📄 PDF"}
                        </span>
                        <span className="font-mono text-[11px] text-gray-700 truncate max-w-[130px]" title={exp.actaDocNombre}>
                          {exp.actaDocNombre}
                        </span>
                        <button
                          onClick={() => abrirVisor(exp)}
                          className="text-[#18A2D9] hover:text-[#051A59] font-bold text-xs p-1"
                          title="Ver documento adjunto"
                        >
                          👁
                        </button>
                      </div>
                    ) : (
                      <span className="text-amber-600 font-medium text-[11px] flex items-center gap-1">
                        ⚠️ Sin archivo
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-[10px]">
                    05_ACTA_HES/
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setModalSubirExp(exp);
                          setActa(exp.actaNumero || "");
                          setHes(exp.hesNumero || "");
                          setArchivo(null);
                          setArchivoPreviewUrl(null);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] bg-sky-50 hover:bg-sky-100 text-[#051A59] border border-sky-200 font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer"
                        title="Subir documento PDF o Foto del acta"
                      >
                        <span>📎</span>
                        <span>{tieneDoc ? "Cambiar Doc" : "Subir PDF/Foto"}</span>
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

      {/* MODAL 1: REGISTRAR / EDITAR ACTA Y HES CON SUBIDA DE DOCUMENTO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <h2 className="text-base font-bold text-[#031240] flex items-center gap-2">
                <span>Registrar Acta de Conformidad o HES</span>
              </h2>
              <button onClick={limpiarFormulario} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Expediente:</label>
                <select
                  value={expId}
                  onChange={(e) => setExpId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-2 text-xs text-[#031240] bg-white focus:outline-none focus:border-[#18A2D9]"
                >
                  {expedientes.map((e) => (
                    <option key={e.id} value={e.id}>{e.codigo}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Número de Acta:</label>
                  <input
                    type="text"
                    placeholder="Ej: ACTA-2026-092"
                    value={acta}
                    onChange={(e) => setActa(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#18A2D9]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Código HES (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ej: HES-4500992"
                    value={hes}
                    onChange={(e) => setHes(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#18A2D9]"
                  />
                </div>
              </div>

              {/* ZONA DE SUBIDA DE PDF O FOTO */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1.5">
                  Adjuntar Documento (PDF o Fotografía del Acta):
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[#18A2D9]/60 hover:border-[#18A2D9] rounded-lg p-4 bg-sky-50/40 text-center transition-colors cursor-pointer"
                  onClick={() => document.getElementById("input-file-acta")?.click()}
                >
                  <input
                    id="input-file-acta"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {archivo ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-xs">
                        <span>{archivoTipo === "image" ? "📸 Foto Seleccionada" : "📄 PDF Seleccionado"}:</span>
                        <span className="font-mono text-[11px]">{archivo.name}</span>
                        <span className="text-[10px] text-gray-400">({(archivo.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      {archivoTipo === "image" && archivoPreviewUrl && (
                        <div className="flex justify-center mt-2">
                          <img
                            src={archivoPreviewUrl}
                            alt="Vista previa"
                            className="max-h-28 rounded border border-gray-300 shadow-xs object-contain"
                          />
                        </div>
                      )}
                      <p className="text-[10px] text-gray-500">Haz clic para cambiar de archivo</p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      <div className="text-2xl">📸 📄</div>
                      <p className="font-semibold text-gray-800">
                        Arrastra aquí el PDF o Foto del Acta, o haz clic para examinar
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Acepta documentos PDF y fotos (JPG, PNG, WEBP) tomadas desde celular o escaneadas
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-gray-50 border rounded text-[11px] text-gray-600 flex items-center justify-between">
                <span>Destino en Drive:</span>
                <span className="font-mono font-semibold text-[#051A59]">05_ACTA_HES/</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#051A59] hover:bg-[#031240] text-white px-4 py-1.5 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Guardar Documentos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBIDA RÁPIDA DE DOCUMENTO DESDE FILA */}
      {modalSubirExp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <div>
                <h2 className="text-base font-bold text-[#031240]">Subir Acta / HES</h2>
                <p className="text-xs text-gray-500 font-semibold">{modalSubirExp.codigo}</p>
              </div>
              <button onClick={limpiarFormulario} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleGuardarSubidaRapida} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">N° Acta:</label>
                  <input
                    type="text"
                    value={acta}
                    placeholder="ACTA-2026-..."
                    onChange={(e) => setActa(e.target.value)}
                    className="w-full border rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">N° HES (Opcional):</label>
                  <input
                    type="text"
                    value={hes}
                    placeholder="HES-..."
                    onChange={(e) => setHes(e.target.value)}
                    className="w-full border rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
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
                  onClick={() => document.getElementById("input-file-rapido-acta")?.click()}
                >
                  <input
                    id="input-file-rapido-acta"
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
                      <p className="font-semibold">Selecciona o arrastra el archivo aquí</p>
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
                  className="bg-[#051A59] hover:bg-[#031240] disabled:bg-gray-300 text-white px-4 py-1.5 rounded text-xs font-semibold"
                >
                  Confirmar y Subir a Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISOR MODAL DE DOCUMENTO (PDF / FOTO) */}
      <DocumentModal
        isOpen={visorDoc.abierto}
        onClose={() => setVisorDoc({ abierto: false, nombre: "", tipo: "pdf" })}
        titulo={`Acta de Conformidad - ${visorDoc.expediente?.clienteNombre || ""}`}
        nombreArchivo={visorDoc.nombre}
        tipoArchivo={visorDoc.tipo}
        url={visorDoc.url}
        carpetaDrive="05_ACTA_HES"
        detalles={[
          { etiqueta: "Expediente", valor: visorDoc.expediente?.codigo || "" },
          { etiqueta: "Cliente", valor: visorDoc.expediente?.clienteNombre || "" },
          { etiqueta: "N° Acta", valor: visorDoc.expediente?.actaNumero || "Pendiente" },
          { etiqueta: "N° HES", valor: visorDoc.expediente?.hesNumero || "No registrado" },
        ]}
      />
    </div>
  );
}
