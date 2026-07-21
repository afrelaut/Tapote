import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localUploadsDir = join(__dirname, "..", "data", "dev-uploads");

class DevelopmentStorage {
  durable = false;

  async healthCheck() {
    await mkdir(localUploadsDir, { recursive: true });
    return true;
  }

  async upload({ id, buffer, extension }) {
    await mkdir(localUploadsDir, { recursive: true });
    const storagePath = `${id}.${extension}`;
    await writeFile(join(localUploadsDir, storagePath), buffer, { flag: "wx" });
    return { storagePath };
  }

  async authenticateManagementUser() {
    return null;
  }

  async createSignedDownload() {
    return null;
  }
}

class SupabaseStorage {
  durable = true;

  constructor(config) {
    this.bucket = config.supabaseBucket;
    this.client = createClient(config.supabaseUrl, config.supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "X-Client-Info": "tapote-api" } },
    });
  }

  async healthCheck() {
    const { data, error } = await this.client.storage.getBucket(this.bucket);
    if (error || !data || data.public) {
      throw new Error(error?.message || "Le bucket Supabase doit exister et rester privé.");
    }
    return true;
  }

  async upload({ id, buffer, mimeType, extension }) {
    const storagePath = `orders/${new Date().toISOString().slice(0, 10)}/${id}.${extension}`;
    const { error } = await this.client.storage.from(this.bucket).upload(storagePath, buffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw new Error(`Stockage du logo impossible : ${error.message}`);
    return { storagePath };
  }

  async authenticateManagementUser(accessToken) {
    if (!accessToken) return null;
    const { data, error } = await this.client.auth.getUser(accessToken);
    if (error || !data?.user) return null;
    return { id: data.user.id, email: data.user.email || null };
  }

  async createSignedDownload(storagePath, expiresIn = 300) {
    if (!storagePath) return null;
    const ttl = Math.min(600, Math.max(60, Number(expiresIn) || 300));
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, ttl);
    if (error || !data?.signedUrl) {
      throw new Error(`Signature du logo impossible : ${error?.message || "URL absente"}`);
    }
    return { url: data.signedUrl, expiresIn: ttl };
  }
}

export function createStorage(config) {
  if (config.supabaseUrl && config.supabaseSecretKey) return new SupabaseStorage(config);
  return new DevelopmentStorage();
}
