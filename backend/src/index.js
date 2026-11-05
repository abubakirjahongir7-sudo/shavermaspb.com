import { createServer } from "./core/server.js";
import { startCourierSync } from "./controllers/courierController.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";
import { config } from "./config/default.js";
import { logger } from "./utils/logger.js";

let httpServer;

async function main() {
  await connectDatabase();

  const app = createServer();
  startCourierSync();
  httpServer = app.listen(config.port, () => {
    logger.info(`HTTP server ${config.port}-portda ishga tushdi (PWA API + admin panel)`);
  });
}

async function shutdown(signal) {
  logger.info(`${signal} qabul qilindi, to'xtatilyapti...`);
  httpServer?.close();
  await disconnectDatabase();
  process.exit(0);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

main().catch((error) => {
  logger.error("Serverni ishga tushirishda xatolik:", error);
  process.exit(1);
});
