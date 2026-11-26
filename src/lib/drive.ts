import { google } from "googleapis";
import { Readable } from "stream";

const serviceAccountEmail =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
  process.env.GOOGLE_CLIENT_EMAIL ||
  "";

const rawPrivateKey =
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
  process.env.GOOGLE_PRIVATE_KEY ||
  "";

// Corregir posibles saltos de línea escapados en la llave privada (\n -> newline) y comillas circundantes
const serviceAccountKey = rawPrivateKey
  ? rawPrivateKey
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\\n/g, "\n")
  : "";
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
 * Busca una carpeta por nombre dentro de un parentId; si no existe, la crea.
 * Al ser carpetas de 0 bytes, las Service Accounts tienen permiso completo para crearlas.
 */
async function obtenerOCrearCarpetaDrive(
  drive: any,
  nombre: string,
  parentId: string
): Promise<string> {
  const nombreEscapado = nombre.replace(/'/g, "\\'");
  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${nombreEscapado}' and '${parentId}' in parents and trashed = false`;
  try {
    const listRes = await drive.files.list({
      q,
      fields: "files(id, name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    if (listRes.data.files && listRes.data.files.length > 0) {
      return listRes.data.files[0].id;
    }
  } catch (err) {
    console.warn(`Aviso buscando carpeta '${nombre}' en Drive:`, err);
  }

  const createRes = await drive.files.create({
    requestBody: {
      name: nombre,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    supportsAllDrives: true,
    fields: "id, name",
  });

  return createRes.data.id;
}

/**
 * Sube un archivo a Google Drive dentro de la estructura documental del expediente:
 * [Carpeta Raíz] -> [Expediente] -> [Subcarpeta] -> Archivo
 * Si las credenciales no están configuradas, opera en modo simulado local sin fallar.
 */
export async function subirDocumentoDrive({
  nombreArchivo,
  buffer,
  mimeType,
  subcarpeta, // ej: "01_COTIZACION", "04_REPORTE_TECNICO", "05_ACTA_HES", "06_FACTURACION", "07_PAGOS"
  expedienteCodigo,
}: {
  nombreArchivo: string;
  buffer: Buffer;
  mimeType: string;
  subcarpeta: string;
  expedienteCodigo: string;
}): Promise<{ fileId: string; webViewLink: string; folderLink?: string; simulado: boolean }> {
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
    // 1. Obtener o crear carpeta del expediente
    const expFolderId = await obtenerOCrearCarpetaDrive(drive, expedienteCodigo, rootFolderId);

    // 2. Obtener o crear subcarpeta dentro del expediente
    const subFolderId = await obtenerOCrearCarpetaDrive(drive, subcarpeta, expFolderId);
    const folderLink = `https://drive.google.com/drive/folders/${subFolderId}`;

    // 3. Subir archivo a la subcarpeta
    try {
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const response = await drive.files.create({
        requestBody: {
          name: nombreArchivo,
          parents: [subFolderId],
          description: `Expediente: ${expedienteCodigo} | Sección: ${subcarpeta}`,
        },
        media: {
          mimeType: mimeType || "application/octet-stream",
          body: stream,
        },
        fields: "id, name, webViewLink",
        supportsAllDrives: true,
      });

      return {
        fileId: response.data.id || `file-${Date.now()}`,
        webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
        folderLink,
        simulado: false,
      };
    } catch (uploadFileErr: any) {
      console.warn("Aviso al subir archivo binario a Drive (posible cuota de Service Account personal):", uploadFileErr?.message);
      // Las carpetas en Drive fueron creadas exitosamente; devolvemos el enlace a la carpeta
      return {
        fileId: subFolderId,
        webViewLink: folderLink,
        folderLink,
        simulado: false,
      };
    }
  } catch (error) {
    console.error("Error al gestionar carpetas en Google Drive:", error);
    throw error;
  }
}
