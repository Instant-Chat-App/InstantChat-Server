import { Server as HttpServer, IncomingMessage, ServerResponse } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "../utils/logger";

let socketIO: SocketIOServer | null = null;
export default function setupSocket(
    server: HttpServer<typeof IncomingMessage, typeof ServerResponse>
) {
    logger.info("Initializing Socket.IO...");

    if (socketIO) {
        logger.warn("Socket.IO is already initialized, returning existing instance.");
        return socketIO;
    }
    
    const io = new SocketIOServer(server, {
        cors: {
            origin: "*",
            methods: "*",
            allowedHeaders: "*",
        }
    });


    io.on("connection", (socket) => {
        socket.on("join_chat", (chatId) => {
            socket.join(`chat:${chatId}`);
        });

        socket.on("send_message", (msg) => {
            io.to(`chat:${msg.chatId}`).emit("new_message", msg);
        });
    });
    logger.info("Socket.IO initialized successfully");

    return io;
}
