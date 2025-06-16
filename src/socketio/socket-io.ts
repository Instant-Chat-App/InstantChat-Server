import { Server as HttpServer, IncomingMessage, ServerResponse } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "../utils/logger";
import { createClient } from "redis";
import { getEnv } from "../utils/get-env.service";
import { createAdapter } from "@socket.io/redis-adapter";

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

    const pubClient = createClient({
        url: `redis://${getEnv("REDIS_HOST", "localhost")}:${getEnv("REDIS_PORT", "6379")}`
    });

    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
            io.adapter(createAdapter(pubClient, subClient));
            logger.info("Redis connected successfully for Socket.IO");

            io.on("connection", (socket) => {
                logger.info(`New client connected: ${socket.id}`);

                socket.on("disconnect", () => {
                    logger.info(`Client disconnected: ${socket.id}`);
                });

                socket.on("error", (error) => {
                    logger.error(`Socket error: ${error}`);
                });

                //WORK IN PROGRESS
                socket.on("joinRoom", (room) => {
                    socket.join(room);
                    logger.info(`Client ${socket.id} joined room: ${room}`);
                });

                socket.on("sendMessage", (data) => {
                    const { room, message } = data;
                    io.to(room).emit("message", message);
                    logger.info(`Message sent to room ${room}: ${message}`);
                });
            });
        })
        .catch((error) => {
            logger.error("Failed to connect to Redis:", error);
        });






    logger.info("Socket.IO initialized successfully");

    return io;
}
