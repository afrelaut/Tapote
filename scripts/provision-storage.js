import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "tapote-order-assets";

if (!url || !secretKey) {
  console.error("Renseigne SUPABASE_URL et SUPABASE_SECRET_KEY dans .env avant de provisionner le Storage.");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const options = {
  public: false,
  fileSizeLimit: 2 * 1024 * 1024,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
};

const { data: existing, error: readError } = await supabase.storage.getBucket(bucket);
if (readError && !/not found/i.test(readError.message)) throw readError;

if (existing) {
  const { error } = await supabase.storage.updateBucket(bucket, options);
  if (error) throw error;
  console.log(`Bucket privé ${bucket} vérifié et mis à jour.`);
} else {
  const { error } = await supabase.storage.createBucket(bucket, options);
  if (error) throw error;
  console.log(`Bucket privé ${bucket} créé.`);
}
