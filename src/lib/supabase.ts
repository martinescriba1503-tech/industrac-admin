import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Cliente público de Supabase (Navegador / Cliente)
 * Seguro para usar en componentes con 'use client'.
 */
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Cliente administrativo de Supabase (Solo Servidor)
 * Utiliza la Service Role Key para bypass de RLS en operaciones de sincronización.
 */
export function getSupabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("El cliente admin de Supabase solo puede usarse en el servidor.");
  }
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}
