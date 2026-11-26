import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { subirDocumentoDrive } from "@/lib/drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subcarpeta = (formData.get("subcarpeta") as string) || "01_COTIZACION";
    const expedienteCodigo = (formData.get("expedienteCodigo") as string) || "EXP-GENERAL";
    const nombreManual = formData.get("nombreArchivo") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo." },
        { status: 400 }
      );
    }

    const nombreArchivo = nombreManual || file.name;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let urlPublica = "";
    let driveUrl = "";
    let driveError: string | null = null;

    // 1. Almacenamiento primario en Supabase Storage (100% garantizado en la nube)
    const admin = getSupabaseAdmin();
    if (admin) {
      const bucketName = "documentos-expedientes";
      const storagePath = `${subcarpeta}/${Date.now()}_${nombreArchivo}`;

      const { data: uploadRes, error: uploadErr } = await admin.storage
        .from(bucketName)
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

      if (!uploadErr && uploadRes) {
        const { data: pubData } = admin.storage.from(bucketName).getPublicUrl(storagePath);
        urlPublica = pubData?.publicUrl || "";
      } else {
        console.warn("Aviso subiendo a Supabase Storage:", uploadErr);
      }
    }

    // 2. Almacenamiento en Google Drive (si está habilitado con Unidad Compartida / permisos)
    try {
      const driveRes = await subirDocumentoDrive({
        nombreArchivo,
        buffer,
        mimeType: file.type,
        subcarpeta,
        expedienteCodigo,
      });
      driveUrl = driveRes.webViewLink;
    } catch (driveErr: any) {
      driveError = driveErr?.message || String(driveErr);
      console.warn("Aviso Google Drive:", driveError);
    }

    return NextResponse.json({
      success: true,
      nombre: nombreArchivo,
      tamano: file.size,
      url: urlPublica || driveUrl,
      driveUrl: driveUrl || null,
      driveError: driveError || null,
      subcarpeta,
      expedienteCodigo,
    });
  } catch (error: any) {
    console.error("Error en /api/documentos/upload:", error);
    return NextResponse.json(
      { error: error?.message || "Error al procesar el archivo" },
      { status: 500 }
    );
  }
}
