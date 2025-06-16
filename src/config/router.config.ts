import { Router } from "express";
import chatRouter from "../routers/chat.router";
import messageRouter from "../routers/message.router";
import authRouter from "../routers/auth.router";
const routerConfig = Router();

routerConfig.use("/chats", chatRouter);

routerConfig.use("/messages", messageRouter);
routerConfig.use("/auth", authRouter);


export default routerConfig;
