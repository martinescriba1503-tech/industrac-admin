/**
 * Validación tipada de variables de entorno.
 * Separa estrictamente la configuración pública de las credenciales privadas del servidor.
 */

export interface PublicEnvStatus {
  supabaseUrlConfigured: boolean;
  supabaseAnonKeyConfigured: boolean;
  appUrl: string;
}

export interface ServerIntegrationStatus {
  supabaseServiceRoleConfigured: boolean;
  googleDriveConfigured: boolean;
  googleCalendarConfigured: boolean;
}

/**
 * Devuelve el estado de configuración pública sin exponer valores sensibles.
 */
export function getPublicEnvStatus(): PublicEnvStatus {
  return {
    supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  };
}

/**
 * Verifica exclusivamente en el servidor si las credenciales privadas están disponibles.
 * Lanza error si se intenta invocar desde el navegador.
 */
export function getServerIntegrationStatus(): ServerIntegrationStatus {
  if (typeof window !== "undefined") {
    throw new Error("getServerIntegrationStatus solo puede ejecutarse en el servidor.");
  }

  const hasGoogleServiceAccount = Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
  const hasGoogleOAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const hasGoogleAuth = hasGoogleServiceAccount || hasGoogleOAuth;

  return {
    supabaseServiceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    googleDriveConfigured:
      hasGoogleAuth && Boolean(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID),
    googleCalendarConfigured:
      hasGoogleAuth && Boolean(process.env.GOOGLE_CALENDAR_ID),
  };
}
