const trimTrailingSlash = (value) => String(value || "").trim().replace(/\/$/, "");

const readBoolean = (value, fallback = false) => {
  if (value === undefined || value === "") return fallback;
  return String(value).toLowerCase() === "true";
};

const readNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";
  const publicUrl = trimTrailingSlash(env.PUBLIC_URL || "http://localhost:5173");
  const supabaseUrl = trimTrailingSlash(env.SUPABASE_URL);
  const supabaseSecretKey = String(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const legalPublicFields = [
    "VITE_LEGAL_COMPANY",
    "VITE_LEGAL_CAPITAL",
    "VITE_LEGAL_ADDRESS",
    "VITE_LEGAL_REGISTRATION",
    "VITE_LEGAL_VAT",
    "VITE_LEGAL_DIRECTOR",
    "VITE_LEGAL_CONTACT",
    "VITE_LEGAL_HOST",
    "VITE_LEGAL_PRIVACY_CONTACT",
    "VITE_LEGAL_RETURNS_ADDRESS",
    "VITE_LEGAL_DATA_RETENTION",
    "VITE_LEGAL_VERSION",
  ];

  return {
    nodeEnv,
    isProduction,
    port: readNumber(env.API_PORT || env.PORT, 3001),
    publicUrl,
    allowedOrigins: String(env.ALLOWED_ORIGINS || env.ALLOWED_ORIGIN || "")
      .split(",")
      .map((origin) => trimTrailingSlash(origin))
      .filter(Boolean),
    trustProxyHops: Math.max(0, Math.floor(readNumber(env.TRUST_PROXY_HOPS, 0))),
    stripeSecretKey: String(env.STRIPE_SECRET_KEY || "").trim(),
    stripeWebhookSecret: String(env.STRIPE_WEBHOOK_SECRET || "").trim(),
    stripeAutomaticTax: readBoolean(env.STRIPE_AUTOMATIC_TAX_ENABLED, false),
    stripeSandboxCheckoutEnabled: readBoolean(env.STRIPE_SANDBOX_CHECKOUT_ENABLED, false),
    legalReady: readBoolean(env.LEGAL_READY, false),
    legalVersion: String(env.LEGAL_VERSION || "").trim(),
    legalContentReady: legalPublicFields.every((field) => String(env[field] || "").trim()),
    legalVersionsMatch: Boolean(env.LEGAL_VERSION) && env.LEGAL_VERSION === env.VITE_LEGAL_VERSION,
    allowDemoCheckout: !isProduction && readBoolean(env.ALLOW_DEMO_CHECKOUT, true),
    databaseUrl: String(env.DATABASE_URL || "").trim(),
    databaseSsl: readBoolean(env.DATABASE_SSL, isProduction),
    supabaseUrl,
    supabaseSecretKey,
    supabaseBucket: String(env.SUPABASE_STORAGE_BUCKET || "tapote-order-assets").trim(),
    resendApiKey: String(env.RESEND_API_KEY || "").trim(),
    orderNotificationEmail: String(env.ORDER_NOTIFICATION_EMAIL || "").trim(),
    customerSupportEmail: String(env.CUSTOMER_SUPPORT_EMAIL || env.VITE_LEGAL_CONTACT || env.ORDER_NOTIFICATION_EMAIL || "").trim(),
    readyOrderLeadTime: String(env.READY_ORDER_LEAD_TIME || "").trim(),
    fromEmail: String(env.FROM_EMAIL || "Tapote <onboarding@resend.dev>").trim(),
    sentryDsn: String(env.SENTRY_DSN || "").trim(),
    logLevel: String(env.LOG_LEVEL || (isProduction ? "info" : "debug")).trim(),
    outboxIntervalMs: Math.max(2_000, readNumber(env.OUTBOX_INTERVAL_MS, 10_000)),
  };
}

export function getProductionChecks(config, services = {}) {
  const stripeKeyPrefix = config.stripeSecretKey.split("_").slice(0, 2).join("_");
  const checks = {
    https: !config.isProduction || config.publicUrl.startsWith("https://"),
    legal: config.legalReady && config.legalContentReady && config.legalVersionsMatch,
    stripeConfigured: Boolean(config.stripeSecretKey),
    stripeLive: !config.isProduction || stripeKeyPrefix === "sk_live",
    stripeWebhook: Boolean(config.stripeWebhookSecret),
    database: Boolean(config.databaseUrl) && services.repository?.durable === true,
    privateStorage: Boolean(config.supabaseUrl && config.supabaseSecretKey) && services.storage?.durable === true,
    orderEmail: Boolean(config.resendApiKey && config.orderNotificationEmail && config.fromEmail && !/@resend\.dev\b/i.test(config.fromEmail)),
  };

  return {
    checks,
    ready: Object.values(checks).every(Boolean),
  };
}
