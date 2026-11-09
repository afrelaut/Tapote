// Point d'entrée Vercel : toute l'API Express (Stripe, redirecteur /a/:code,
// uploads, pages HTML avec méta SEO) tourne ici en fonction serverless.
// Le serveur Docker (server/index.js) reste utilisable à l'identique.
import "../server/instrument.js";
import { waitUntil } from "@vercel/functions";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../server/app.js";
import { loadConfig } from "../server/config.js";
import { createLogger } from "../server/logger.js";
import { createOutboxWorker } from "../server/notifications.js";
import { createRepository } from "../server/repository.js";
import { createStorage } from "../server/storage.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Autorité racine Supabase pour la connexion Postgres (remplace NODE_EXTRA_CA_CERTS du Dockerfile).
process.env.DATABASE_CA_CERT_PATH ||= join(root, "deploy", "certs", "supabase-root-2021.crt");
// Chaque instance serverless ouvre son propre pool : on reste sobre côté Supabase.
process.env.DATABASE_POOL_MAX ||= "3";
// Vercel place un proxy devant la fonction : nécessaire pour l'IP réelle (rate limits).
process.env.TRUST_PROXY_HOPS ||= "1";

const config = loadConfig();
const logger = createLogger(config);
const repository = createRepository(config);
const storage = createStorage(config);
const outboxWorker = createOutboxWorker({ config, repository, logger });

// Le gabarit HTML est renommé _app.html au build (voir vercel.json) pour que
// toutes les pages passent par Express (méta SEO, CSP, codes 404).
const loadStorefrontHtml = async (request) => {
  try {
    return await readFile(join(root, "dist", "_app.html"), "utf8");
  } catch {
    const host = request.headers["x-forwarded-host"] || request.headers.host;
    const fallback = await fetch(`https://${host}/_app.html`);
    if (!fallback.ok) throw new Error(`Gabarit HTML introuvable (${fallback.status})`);
    return fallback.text();
  }
};

const defer = (task) => waitUntil(
  Promise.resolve()
    .then(task)
    .catch((error) => logger.error({ err: error }, "Tâche différée en échec")),
);

const app = createApp({ config, repository, storage, logger, outboxWorker, loadStorefrontHtml, defer });

export default app;
