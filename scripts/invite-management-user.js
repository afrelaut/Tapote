import "dotenv/config";
import process from "node:process";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "../shared/catalog.js";

const { Client } = pg;

function readArguments(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new Error("Utilise des arguments --cle valeur.");
    result[key.slice(2)] = value;
  }
  return result;
}

function required(value, label) {
  if (!String(value || "").trim()) throw new Error(`${label} est requis.`);
  return String(value).trim();
}

const args = readArguments(process.argv.slice(2));
const email = required(args.email, "--email").toLowerCase();
const displayName = required(args.name, "--name");
const requestedRole = String(args.role || "manager").toLowerCase();
const organizationName = String(args.organization || "TAPOTE Gestion").trim();
const shouldSeed = String(args.seed || "true").toLowerCase() !== "false";
const password = String(args.password || "");

if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Adresse e-mail invalide.");
if (!["owner", "admin", "manager"].includes(requestedRole)) throw new Error("--role doit valoir owner, admin ou manager.");
if (password && password.length < 12) throw new Error("--password doit contenir au moins 12 caractères.");

const supabaseUrl = required(process.env.SUPABASE_URL, "SUPABASE_URL");
const supabaseSecretKey = required(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SECRET_KEY");
const databaseUrl = required(process.env.DATABASE_URL, "DATABASE_URL");
const publicUrl = String(process.env.PUBLIC_URL || "http://localhost:5173").replace(/\/$/, "");
const supabase = createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false, autoRefreshToken: false } });

let user = null;
for (let page = 1; page <= 10 && !user; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email) || null;
  if (data.users.length < 100) break;
}

let invitationSent = false;
let userCreated = false;
if (!user) {
  const operation = password
    ? supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: displayName } })
    : supabase.auth.admin.inviteUserByEmail(email, { redirectTo: `${publicUrl}/gestion` });
  const { data, error } = await operation;
  if (error) throw error;
  user = data.user;
  invitationSent = !password;
  userCreated = true;
} else if (password) {
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: { ...user.user_metadata, display_name: displayName },
  });
  if (error) throw error;
  user = data.user;
}
if (!user?.id) throw new Error("Impossible d’obtenir l’identifiant du compte Supabase.");

const database = new Client({
  connectionString: databaseUrl,
  ssl: String(process.env.DATABASE_SSL || "true").toLowerCase() === "true" ? { rejectUnauthorized: true } : false,
  application_name: "tapote-management-invite",
});

const clients = [
  ["c1", "Café Noma", "Léa Martin", "lea@cafenoma.fr", "06 24 18 09 32", "Lyon", "Café", "Actif", "2026-06-04"],
  ["c2", "Maison Sépia", "Inès Bernard", "ines@maisonsepia.fr", "06 76 44 12 08", "Paris", "Salon", "Actif", "2026-06-18"],
  ["c3", "Bistrot des Quais", "Hugo Colin", "hugo@bistrot-quais.fr", "07 11 38 64 02", "Bordeaux", "Restaurant", "À suivre", "2026-07-02"],
  ["c4", "Studio Bloom", "Sofia Roux", "hello@studiobloom.fr", "06 53 41 90 18", "Annecy", "Beauté", "Actif", "2026-07-08"],
  ["c5", "Atelier Grain", "Noé Dupont", "noe@ateliergrain.fr", "07 42 18 22 06", "Nantes", "Boutique", "Nouveau", "2026-07-11"],
];
const inventory = [
  ["SUP-A6-CLR", "Chevalet plexi A6", "Support", 18, 9, 12, 30, "2026-07-22"],
  ["NFC-NTAG215", "Puce NFC NTAG215", "Électronique", 42, 13, 25, 100, "2026-07-24"],
  ["CARD-PVC-W", "Carte PVC blanche", "Support", 64, 2, 30, 0, null],
  ["STK-EXT-MAT", "Sticker extérieur mat", "Impression", 7, 3, 15, 50, "2026-07-19"],
  ["BOX-A6-KRAFT", "Étui kraft A6", "Packaging", 23, 8, 20, 0, null],
];
const orders = [
  ["TPT-1048", "c1", "Pack Restaurant ×6", 1, 24900, "assembly", "Boutique", "2026-07-15", "2026-07-18", "Haute", "Aymeric", "Avis Google", null, "6 chevalets, visuel terracotta validé."],
  ["TPT-1047", "c2", "Comptoir A6", 2, 11800, "bat", "Boutique", "2026-07-15", "2026-07-19", "Normale", "Rico", "Réservation", null, "En attente de confirmation du rose de marque."],
  ["TPT-1046", "c3", "Pack Restaurant ×6", 1, 24900, "quality", "Devis", "2026-07-14", "2026-07-17", "Haute", "Aymeric", "Menu", null, "Contrôler les 6 QR avant emballage."],
  ["TPT-1045", "c4", "Comptoir A6", 1, 5900, "ready", "Boutique", "2026-07-13", "2026-07-17", "Normale", "Rico", "Instagram", null, "Colis prêt, étiquette à imprimer."],
  ["TPT-1044", "c5", "Sticker NFC", 1, 3500, "supply", "Boutique", "2026-07-12", "2026-07-18", "Normale", "Aymeric", "Avis Google", null, "Réserver un sticker extérieur mat."],
  ["TPT-1043", "c1", "Carte NFC", 2, 5800, "shipped", "Boutique", "2026-07-10", "2026-07-15", "Normale", "Rico", "Fidélité", "1K02840173012", "Remis à La Poste."],
  ["TPT-1042", "c3", "Pack Restaurant ×6", 1, 24900, "shipped", "Devis", "2026-07-08", "2026-07-14", "Normale", "Aymeric", "Avis Google", "1K02840172991", "Livré le 14 juillet."],
];

await database.connect();
try {
  await database.query("begin");
  let organization = await database.query("select id from public.organizations where name = $1 order by created_at limit 1", [organizationName]);
  let role = requestedRole;
  if (!organization.rowCount) {
    organization = await database.query("insert into public.organizations (name, created_by) values ($1, $2) returning id", [organizationName, user.id]);
    role = "owner";
  } else {
    await database.query(
      `insert into public.organization_members (organization_id, user_id, role)
       values ($1, $2, $3)
       on conflict (organization_id, user_id) do update set role = excluded.role`,
      [organization.rows[0].id, user.id, requestedRole],
    );
  }
  const organizationId = organization.rows[0].id;
  await database.query(
    `insert into public.management_profiles (organization_id, user_id, display_name, job_title)
     values ($1, $2, $3, $4)
     on conflict (organization_id, user_id) do update set display_name = excluded.display_name, job_title = excluded.job_title`,
    [organizationId, user.id, displayName, role === "owner" ? "Propriétaire" : role === "admin" ? "Administrateur" : "Gérant"],
  );
  await database.query("insert into public.management_settings (organization_id) values ($1) on conflict do nothing", [organizationId]);
  await database.query(
    `insert into public.platform_settings (id, management_organization_id)
     values (true, $1)
     on conflict (id) do update set management_organization_id = excluded.management_organization_id`,
    [organizationId],
  );

  const existing = await database.query("select count(*)::integer as count from public.management_clients where organization_id = $1", [organizationId]);
  if (shouldSeed && existing.rows[0].count === 0) {
    const clientIds = new Map();
    for (const client of clients) {
      const inserted = await database.query(
        `insert into public.management_clients
         (organization_id, client_code, name, contact_name, email, phone, city, segment, health, joined_on)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
        [organizationId, ...client],
      );
      clientIds.set(client[0], inserted.rows[0].id);
    }
    const inventoryIds = new Map();
    for (const item of inventory) {
      const inserted = await database.query(
        `insert into public.management_inventory_items
         (organization_id, sku, name, category, stock_quantity, reserved_quantity, threshold_quantity, incoming_quantity, eta_date)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [organizationId, ...item],
      );
      inventoryIds.set(item[0], inserted.rows[0].id);
    }
    for (const order of orders) {
      const inserted = await database.query(
        `insert into public.management_orders
         (organization_id, order_number, client_id, product_name, quantity, total_cents, status, channel, ordered_on, due_on, priority, owner_name, destination, tracking_number, note, shipped_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,case when $7 = 'shipped' then now() else null end)
         returning id`,
        [organizationId, order[0], clientIds.get(order[1]), ...order.slice(2)],
      );
      if (["bat", "supply", "assembly", "quality", "ready"].includes(order[5])) {
        await database.query(
          "insert into public.management_production_jobs (organization_id, order_id, stage) values ($1, $2, $3)",
          [organizationId, inserted.rows[0].id, order[5]],
        );
      }
      if (order[5] === "shipped") {
        await database.query(
          `insert into public.management_shipments (organization_id, order_id, carrier, tracking_number, status, shipped_at)
           values ($1, $2, 'La Poste', $3, 'in_transit', now())`,
          [organizationId, inserted.rows[0].id, order[12]],
        );
      }
    }
    const products = [
      [PRODUCTS.comptoir.name, PRODUCTS.comptoir.price, true, "SUP-A6-CLR", 24, 4.8],
      [PRODUCTS.pack_resto.name, PRODUCTS.pack_resto.price, true, "SUP-A6-CLR", 9, 2.9],
      [PRODUCTS.carte.name, PRODUCTS.carte.price, true, "CARD-PVC-W", 18, 5.2],
      [PRODUCTS.sticker.name, PRODUCTS.sticker.price, true, "STK-EXT-MAT", 12, 3.6],
    ];
    for (const product of products) {
      await database.query(
        `insert into public.management_storefront_products
         (organization_id, name, price_cents, online, inventory_item_id, sales_count, conversion_rate)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [organizationId, product[0], product[1], product[2], inventoryIds.get(product[3]), product[4], product[5]],
      );
    }
    await database.query(
      `insert into public.management_activity (organization_id, kind, description) values
       ($1, 'order', 'La commande TPT-1048 est passée en assemblage'),
       ($1, 'stock', '30 chevalets A6 commandés au fournisseur'),
       ($1, 'client', 'Nouveau client : Atelier Grain'),
       ($1, 'ship', 'TPT-1043 remise au transporteur')`,
      [organizationId],
    );
  }
  await database.query("commit");
  process.stdout.write(`${invitationSent ? "Invitation envoyée" : userCreated ? "Compte créé" : "Compte existant autorisé"} : ${email} · rôle ${role} · espace ${organizationName}.\n`);
} catch (error) {
  await database.query("rollback");
  if (userCreated) {
    const { error: cleanupError } = await supabase.auth.admin.deleteUser(user.id);
    if (cleanupError) error.message = `${error.message} Le compte invité n’a pas pu être nettoyé automatiquement : ${cleanupError.message}`;
  }
  throw error;
} finally {
  await database.end();
}
