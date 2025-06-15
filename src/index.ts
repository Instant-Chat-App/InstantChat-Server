import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import ChatController from './controllers/chat.controller';
import ChatRepository from './repository/chat.repository';
import initApplication from './config/init-application';
import { create } from 'domain';
import { createServer } from 'http';
import { getEnv } from './utils/get-env.service';
import routerConfig from './config/router.config';
import { logger } from './utils/logger';
import corsMiddleware from './config/cors.config';
import setupSocket from './socketio/socket-io';


initializeApplication();

async function initializeApplication(){
  await initApplication();
  
  const app = express();
  const server = createServer(app);

  app.use(express.json());
  setupSocket(server);

  const port = getEnv('PORT', '8080');
  app.use(corsMiddleware);
  app.use("/api", routerConfig);
  
  server.listen(port, () => {
    logger.info(`Server is running at http://localhost:${port}`);
  });
}


