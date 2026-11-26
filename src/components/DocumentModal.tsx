"use client";

import React, { useState } from "react";

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  nombreArchivo: string;
  tipoArchivo: "pdf" | "image";
  url?: string;
  carpetaDrive?: string;
  detalles?: { etiqueta: string; valor: string | number }[];
}

export default function DocumentModal({
  isOpen,
  onClose,
  titulo,
  nombreArchivo,
  tipoArchivo,
  url,
  carpetaDrive = "01_COTIZACION",
  detalles = [],
}: DocumentModalProps) {
  const [zoom, setZoom] = useState(false);

  if (!isOpen) return null;

  const esImagen = tipoArchivo === "image" || /\.(png|jpe?g|webp|gif)$/i.test(nombreArchivo);
  const tieneDataUrl = url && (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("http"));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-gray-200">
        {/* Cabecera Corporativa */}
        <div className="bg-[#031240] text-white px-5 py-4 flex items-center justify-between border-b border-[#051A59]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {esImagen ? "🖼️" : "📄"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">{titulo}</h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  esImagen ? "bg-amber-400 text-[#031240]" : "bg-[#18A2D9] text-[#031240]"
                }`}>
                  {esImagen ? "Foto / Imagen" : "Documento PDF"}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 font-mono mt-0.5 truncate max-w-md">
                {carpetaDrive}/{nombreArchivo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-lg p-1 rounded-full hover:bg-white/10"
            title="Cerrar visor"
          >
            ✕
          </button>
        </div>

        {/* Barra de metadatos rápidos */}
        {detalles.length > 0 && (
          <div className="bg-[#F2F2F2] px-5 py-2.5 border-b border-gray-200 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-700">
            {detalles.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="font-semibold text-[#051A59]">{d.etiqueta}:</span>
                <span className="text-gray-900 font-medium">{d.valor}</span>
              </div>
            ))}
            <div className="ml-auto text-[11px] text-gray-500 font-mono flex items-center gap-1">
              <span>☁️ Google Drive:</span>
              <span className="font-semibold text-emerald-700">Sincronizado</span>
            </div>
          </div>
        )}

        {/* Contenedor del Visor */}
        <div className="flex-1 bg-gray-900 overflow-auto p-4 flex items-center justify-center min-h-[360px] max-h-[580px] relative">
          {esImagen ? (
            tieneDataUrl ? (
              <div className="relative max-w-full max-h-full flex items-center justify-center">
                <img
                  src={url}
                  alt={nombreArchivo}
                  className={`rounded shadow-lg transition-transform duration-200 object-contain ${
                    zoom ? "scale-150 cursor-zoom-out max-h-none" : "cursor-zoom-in max-h-[520px] max-w-full"
                  }`}
                  onClick={() => setZoom(!zoom)}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 max-w-lg w-full text-center shadow-lg border border-gray-200 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-4xl">
                  📸
                </div>
                <div>
                  <h4 className="font-bold text-[#031240] text-sm">{nombreArchivo}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Fotografía digitalizada almacenada en Google Drive corporativo.
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded border text-left text-xs font-mono space-y-1 text-gray-600">
                  <div>Ruta Drive: <strong>{carpetaDrive}/{nombreArchivo}</strong></div>
                  <div>Formato: <strong>Imagen digital (JPEG/PNG/WEBP)</strong></div>
                  <div>Estado: <strong>Documento verificado y archivado</strong></div>
                </div>
              </div>
            )
          ) : (
            tieneDataUrl && url.startsWith("data:application/pdf") ? (
              <iframe
                src={url}
                title={nombreArchivo}
                className="w-full h-[520px] rounded border border-gray-700 bg-white"
              />
            ) : (
              <div className="bg-white rounded-lg p-8 max-w-lg w-full text-center shadow-lg border border-gray-200 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 border-2 border-[#18A2D9] flex items-center justify-center text-4xl text-[#051A59]">
                  📄
                </div>
                <div>
                  <h4 className="font-bold text-[#031240] text-sm">{nombreArchivo}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Documento PDF oficial vinculado al expediente administrativo de INDUSTRAC S.A.C.
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded border text-left text-xs font-mono space-y-1 text-gray-600">
                  <div>Ruta Drive: <strong>{carpetaDrive}/{nombreArchivo}</strong></div>
                  <div>Tipo: <strong>Documento Portable (PDF)</strong></div>
                  <div>Integridad: <strong>Validado en repositorio oficial</strong></div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Pie del modal */}
        <div className="px-5 py-3 bg-[#F2F2F2] border-t border-gray-200 flex items-center justify-between text-xs">
          <div className="text-gray-500 text-[11px]">
            {esImagen && tieneDataUrl ? "Haz clic en la imagen para ampliar/reducir" : "Archivo oficial respaldado en la nube"}
          </div>
          <div className="flex gap-2">
            {tieneDataUrl && (
              <a
                href={url}
                download={nombreArchivo}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-100 transition-colors inline-flex items-center gap-1"
              >
                <span>⬇️</span> Descargar
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#051A59] text-white rounded font-semibold hover:bg-[#031240] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
