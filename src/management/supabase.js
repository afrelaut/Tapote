import { createClient } from "@supabase/supabase-js";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/$/, "");
const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();

export const isManagementConfigured = Boolean(supabaseUrl && publishableKey);

export const managementSupabase = isManagementConfigured
  ? createClient(supabaseUrl, publishableKey, {
    auth: {
      storageKey: "tapote-management-auth",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })
  : null;
