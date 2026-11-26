import { NextRequest, NextResponse } from "next/server";
import { extraerTextoDePdf, analizarTextoReporteTecnico } from "@/lib/pdf-extractor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo." },
        { status: 400 }
      );
    }

    const extensionValida = file.name.toLowerCase().endsWith(".pdf");
    const esPdfMime = file.type === "application/pdf" || file.type === "" || extensionValida;

    if (!extensionValida && !esPdfMime) {
      return NextResponse.json(
        { error: "Formato no válido. Únicamente se aceptan documentos en formato PDF (.pdf)." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "El archivo PDF seleccionado está vacío (0 bytes)." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const magicHeader = buffer.slice(0, 5).toString("ascii");
    if (!magicHeader.startsWith("%PDF")) {
      return NextResponse.json(
        { error: "El archivo adjuntado no es un PDF válido o se encuentra dañado." },
        { status: 400 }
      );
    }

    // Extracción de texto con pdfjs-dist
    const resExtraccion = await extraerTextoDePdf(buffer);
    const texto = resExtraccion.texto;

    // Análisis semántico del reporte técnico
    const datos = analizarTextoReporteTecnico(texto, file.name);

    return NextResponse.json({
      success: true,
      archivoNombre: file.name,
      archivoTamano: file.size,
      textoLongitud: texto.length,
      errorExtraccion: resExtraccion.error || null,
      datos,
    });
  } catch (error) {
    console.error("Error al procesar el PDF del reporte técnico:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado al procesar y extraer la información del reporte técnico.",
      },
      { status: 500 }
    );
  }
}
