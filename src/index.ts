import express from "express";
import initApplication from "./config/init-application";
import { createServer } from "http";
import { getEnv } from "./utils/get-env.service";
import routerConfig from "./config/router.config";
import { logger } from "./utils/logger";
import setupSocket from "./socketio/socket-io";
import corsConfig from "./config/cors.config";

initializeApplication();

async function initializeApplication() {
  await initApplication();

  const app = express();
  app.use(corsConfig);
  const server = createServer(app);

  app.use(express.json());
  setupSocket(server);

  const port = getEnv("PORT", "8080");
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/api", routerConfig);

  server.listen(port, () => {
    logger.info(`Server is running at http://localhost:${port}`);
  });
}
