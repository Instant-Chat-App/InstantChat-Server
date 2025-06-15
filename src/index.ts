import express, {  } from 'express';
import initApplication from './config/init-application';
import { createServer } from 'http';
import { getEnv } from './utils/get-env.service';
import routerConfig from './config/router.config';


initializeApplication();

async function initializeApplication(){
  await initApplication();
  
  const app = express();
  const server = createServer(app);

  const port = getEnv('PORT', '8080');

  app.use("/api", routerConfig);

  server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}


