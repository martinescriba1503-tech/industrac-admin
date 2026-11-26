import { google } from "googleapis";
import { Readable } from "stream";

const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
// Corregir posibles saltos de línea escapados en la llave privada (\n -> newline)
const serviceAccountKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "";

/**
 * Obtiene el cliente autenticado de Google Drive mediante Service Account
 */
export function getGoogleDriveClient() {
  if (typeof window !== "undefined") {
    throw new Error("Google Drive solo puede invocarse en el servidor.");
  }

  if (!serviceAccountEmail || !serviceAccountKey) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: serviceAccountKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Sube un archivo a Google Drive dentro de la estructura documental del expediente.
 * Si las credenciales no están configuradas, opera en modo simulado local sin fallar.
 */
export async function subirDocumentoDrive({
  nombreArchivo,
  buffer,
  mimeType,
  subcarpeta, // ej: "01_COTIZACION", "05_ACTA_HES", "06_FACTURACION", "07_PAGOS"
  expedienteCodigo,
}: {
  nombreArchivo: string;
  buffer: Buffer;
  mimeType: string;
  subcarpeta: string;
  expedienteCodigo: string;
}): Promise<{ fileId: string; webViewLink: string; simulado: boolean }> {
  const drive = getGoogleDriveClient();

  if (!drive || !rootFolderId) {
    // Modo simulación local cuando las credenciales aún no se han completado
    return {
      fileId: `drive-sim-${Date.now()}`,
      webViewLink: `https://drive.google.com/drive/folders/${rootFolderId || "local"}/${encodeURIComponent(expedienteCodigo)}/${subcarpeta}/${encodeURIComponent(nombreArchivo)}`,
      simulado: true,
    };
  }

  try {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const response = await drive.files.create({
      requestBody: {
        name: nombreArchivo,
        parents: [rootFolderId], // O el ID de la subcarpeta del expediente
        description: `Expediente: ${expedienteCodigo} | Sección: ${subcarpeta}`,
      },
      media: {
        mimeType: mimeType || "application/octet-stream",
        body: stream,
      },
      fields: "id, name, webViewLink",
    });

    return {
      fileId: response.data.id || `file-${Date.now()}`,
      webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
      simulado: false,
    };
  } catch (error) {
    console.error("Error al subir a Google Drive:", error);
    throw error;
  }
}
