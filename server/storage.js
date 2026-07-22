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

  async provisionPilotWorkspace() {
    const error = new Error("L’activation Pilot nécessite Supabase.");
    error.statusCode = 503;
    error.publicMessage = "L’activation Pilot est indisponible dans cet environnement.";
    throw error;
  }
}

class SupabaseStorage {
  durable = true;

  constructor(config) {
    this.bucket = config.supabaseBucket;
    this.publicUrl = config.publicUrl;
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

  async findUserByEmail(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await this.client.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(`Recherche du compte Pilot impossible : ${error.message}`);
      const user = data?.users?.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);
      if (user) return user;
      if (!data?.users?.length || data.users.length < 1000) break;
    }
    return null;
  }

  async provisionPilotWorkspace({ actorUserId, order, locationName, targetUrl }) {
    let customerUser = await this.findUserByEmail(order.clientEmail);
    if (!customerUser) {
      const { data, error } = await this.client.auth.admin.inviteUserByEmail(order.clientEmail, {
        redirectTo: `${this.publicUrl}/pilot`,
        data: { business_name: order.clientName, invited_from: "tapote_gestion" },
      });
      if (error || !data?.user) {
        const invitationError = new Error(error?.message || "Invitation Pilot impossible.");
        invitationError.statusCode = 502;
        invitationError.publicMessage = "L’invitation Pilot n’a pas pu être envoyée.";
        throw invitationError;
      }
      return { status: "invited", customerUserId: data.user.id, email: order.clientEmail };
    }

    if (!customerUser.email_confirmed_at) {
      return { status: "invited", customerUserId: customerUser.id, email: order.clientEmail };
    }

    const { data, error } = await this.client.rpc("activate_management_order_pilot_as_service", {
      target_actor_user_id: actorUserId,
      target_management_order_id: order.id,
      target_customer_user_id: customerUser.id,
      target_location_name: locationName,
      target_url: targetUrl || null,
    });
    if (error) {
      const activationError = new Error(error.message);
      activationError.statusCode = ["42501"].includes(error.code) ? 403 : 409;
      activationError.publicMessage = ({
        assigned_products_required: "Affecte au moins un support verrouillé à cette commande avant d’activer Pilot.",
        order_not_ready_for_pilot: "La commande doit être prête avant l’activation de Pilot.",
        customer_email_mismatch: "L’adresse du compte Pilot ne correspond pas au client de la commande.",
        valid_https_destination_required: "Ajoute un lien HTTPS valide au support avant l’activation.",
      })[error.message] || "L’espace Pilot n’a pas pu être activé. Vérifie la commande et les supports affectés.";
      throw activationError;
    }
    const activation = Array.isArray(data) ? data[0] : data;
    return {
      status: "active",
      customerUserId: customerUser.id,
      organizationId: activation?.organization_id,
      locationId: activation?.location_id,
      productsCreated: activation?.products_created || 0,
    };
  }
}

export function createStorage(config) {
  if (config.supabaseUrl && config.supabaseSecretKey) return new SupabaseStorage(config);
  return new DevelopmentStorage();
}
