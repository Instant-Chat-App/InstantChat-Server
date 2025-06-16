import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { logger } from "../utils/logger";

declare global {
  namespace Express {
    interface Request {
      user?: {
        accountId: number;
        phone: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authorization header is missing or invalid",
      });
      return;
    }

    // Extract token from 'Bearer <token>'
    const token = authHeader.split(" ")[1];

    const authService = new AuthService();
    const payload = authService.verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    req.user = {
      accountId: payload.accountId,
      phone: payload.phone,
    };

    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
