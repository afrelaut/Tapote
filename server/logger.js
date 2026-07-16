import pino from "pino";

export function createLogger(config) {
  return pino({
    level: config.logLevel,
    base: { service: "tapote-api", environment: config.nodeEnv },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "request.headers.authorization",
        "request.headers.cookie",
        "stripeSecretKey",
        "stripeWebhookSecret",
        "databaseUrl",
        "supabaseSecretKey",
        "resendApiKey",
      ],
      censor: "[redacted]",
    },
  });
}
