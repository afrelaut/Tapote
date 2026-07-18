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

export async function getPilotSession() {
  if (!pilotSupabase) return null;
  const { data: sessionData, error: sessionError } = await pilotSupabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return null;
  const { data: userData, error: userError } = await pilotSupabase.auth.getUser();
  if (userError) throw userError;
  return userData.user ? { ...sessionData.session, user: userData.user } : null;
}

export const redirectBaseUrl = String(import.meta.env.VITE_REDIRECT_BASE_URL || "https://t.tapote.fr").replace(/\/$/, "");
