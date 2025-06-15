import { LoginRequest } from "../dtos/login-request.dto";
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { logger } from "../utils/logger";
import { RegisterRequest } from "../dtos/register-request.dto";

export class AuthController {
  private readonly authService = new AuthService();

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginRequest: LoginRequest = req.body;
      const result = await this.authService.login(loginRequest);

      if (!result) {
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      logger.error(`Login error: ${error}`);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerRequest: RegisterRequest = req.body;
      // Validate input
      if (!registerRequest.phoneNumber || !registerRequest.password) {
        res.status(400).json({
          success: false,
          message: "Phone number, password are required",
        });
        return;
      }

      const result = await this.authService.register(registerRequest);

      if (!result) {
        res.status(409).json({
          success: false,
          message: "Phone number already exists",
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: result,
      });
    } catch (error) {
      logger.error(`Registration error: ${error}`);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
        return;
      }

      const tokens = this.authService.refreshToken(refreshToken);

      if (!tokens) {
        res.status(401).json({
          success: false,
          message: "Invalid or expired refresh token",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: tokens,
      });
    } catch (error) {
      logger.error(`Token refresh error: ${error}`);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
        return;
      }

      const result = this.authService.logout(refreshToken);

      if (await result) {
        res.status(200).json({
          success: true,
          message: "Logged out successfully",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Invalid refresh token",
        });
      }
    } catch (error) {
      logger.error(`Logout error: ${error}`);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}
