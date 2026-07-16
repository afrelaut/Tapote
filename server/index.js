import "dotenv/config";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { createOutboxWorker } from "./notifications.js";
import { createRepository } from "./repository.js";
import { createStorage } from "./storage.js";

const config = loadConfig();
const logger = createLogger(config);
const repository = createRepository(config);
const storage = createStorage(config);
const outboxWorker = createOutboxWorker({ config, repository, logger });
const app = createApp({ config, repository, storage, logger, outboxWorker });

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, production: config.isProduction }, "Tapote API démarrée");
  outboxWorker.start();
});

server.requestTimeout = 15_000;
server.headersTimeout = 20_000;
server.keepAliveTimeout = 5_000;
server.on("error", (error) => logger.fatal({ err: error }, "Erreur du serveur HTTP"));

let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Arrêt gracieux de Tapote API");
  outboxWorker.stop();
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();
  server.close(async () => {
    try {
      await repository.close();
      clearTimeout(forceExit);
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, "Erreur pendant l’arrêt");
      process.exit(1);
    }
  });
};

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
