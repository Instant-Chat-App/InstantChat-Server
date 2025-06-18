import { Router } from "express";
import chatRouter from "../routers/chat.router";
import messageRouter from "../routers/message.router";
import authRouter from "../routers/auth.router";
import userRouter from "../routers/user.router";
const routerConfig = Router();

routerConfig.use("/chats", chatRouter);

routerConfig.use("/messages", messageRouter);

routerConfig.use("/auth", authRouter);

routerConfig.use("/users", userRouter);

export default routerConfig;
