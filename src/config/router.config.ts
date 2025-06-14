import { Router } from "express";
import chatRouter from "../routers/chat.router";
const routerConfig = Router();

routerConfig.use("/chats", chatRouter);

export default routerConfig;