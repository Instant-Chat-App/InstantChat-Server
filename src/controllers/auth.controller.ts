import { LoginRequest } from "../dtos/requests/login-request.dto";
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { logger } from "../utils/logger";
import { RegisterRequest } from "../dtos/requests/register-request.dto";
import { DataResponse } from "../dtos/responses/DataResponse";
import "../middlewares/auth.middleware";

export default class AuthController {
  private readonly authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(req: Request, res: Response) {
    try {
      const loginRequest: LoginRequest = req.body;
      const result = await this.authService.login(loginRequest);

      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }

      res.status(200).json(DataResponse.success(result, "Login successfully"));
    } catch (error: any) {
      logger.error(`Login error: ${error}`);
      res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }

  async register(req: Request, res: Response) {
    try {
      console.log("Request body:", req.body);
      const registerRequest: RegisterRequest = req.body;

      const result = await this.authService.register(registerRequest);

      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }
      res
        .status(201)
        .json(DataResponse.success(result, "Registration successfully"));
    } catch (error: any) {
      logger.error(`Registration error: ${error}`);
      res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      const tokens = this.authService.refreshToken(refreshToken);
      if (tokens instanceof DataResponse) {
        return res.status(tokens.code).json(tokens);
      }

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: tokens,
      });
    } catch (error: any) {
      logger.error(`Token refresh error: ${error}`);
      res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      const result = this.authService.logout(refreshToken);

      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }

      res
        .status(200)
        .json(DataResponse.success(result, "Log out successfully"));
    } catch (error: any) {
      logger.error(`Logout error: ${error}`);
      res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json(DataResponse.badRequest("User authentication required"));
      }

      const result = await this.authService.getProfile(user.accountId);

      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }

      res
        .status(200)
        .json(DataResponse.success(result, "Get profile successfully"));
    } catch (error: any) {
      logger.error(`Get profile error: ${error}`);
      res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }
}
