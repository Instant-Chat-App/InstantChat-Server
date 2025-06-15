import { Router } from "express";
import chatRouter from "../routers/chat.router";
import messageRouter from "../routers/message.router";
import storageRouter from "../routers/storage.router";
const routerConfig = Router();

routerConfig.use("/chats", chatRouter);
routerConfig.use("/messages", messageRouter);

routerConfig.use("/storage", storageRouter);
export default routerConfig;