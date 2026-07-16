import { createClient } from "@supabase/supabase-js";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/$/, "");
const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();

export const isPilotConfigured = Boolean(supabaseUrl && publishableKey);
export const isPilotDemo = import.meta.env.MODE === "test"
  || import.meta.env.VITE_PILOT_DEMO === "true"
  || (!isPilotConfigured && import.meta.env.DEV);

export const pilotSupabase = isPilotConfigured
  ? createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  : null;

export const redirectBaseUrl = String(import.meta.env.VITE_REDIRECT_BASE_URL || "https://t.tapote.fr").replace(/\/$/, "");
