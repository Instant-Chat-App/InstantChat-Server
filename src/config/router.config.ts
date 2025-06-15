import { Router } from "express";
import chatRouter from "../routers/chat.router";
import messageRouter from "../routers/message.router";
const routerConfig = Router();

routerConfig.use("/chats", chatRouter);
routerConfig.use("/messages", messageRouter);

export default routerConfig;