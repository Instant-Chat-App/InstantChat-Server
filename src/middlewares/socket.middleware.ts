import { Socket } from "socket.io";
import { AuthService } from "../services/auth.service";
import { logger } from "../utils/logger";

export default async function socketAuthMiddleware(
    socket: Socket,
    next: Function
) {
    const authService = new AuthService();
    const token = socket.handshake.auth.token;
    if (!token) {
        logger.error("Socket connection failed: No token provided");
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const accessToken = token.replace(/^Bearer\s/, "");
        const user = authService.verifyAccessToken(accessToken);

        if (!user) {
            logger.error("Socket connection failed: Invalid token");
            return next(new Error("Authentication error: Invalid token"));
        }
        socket.data.user = user;
        logger.info(`Socket connection established for user: ${user.accountId}`);
        next();
    } catch (error: any) {
        logger.error(`Socket connection failed: ${error.message}`);
        next(new Error("Authentication error: Invalid token"));
    }
}