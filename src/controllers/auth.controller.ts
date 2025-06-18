import { LoginRequest } from "../dtos/requests/LoginRequest";
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { logger } from "../utils/logger";
import { RegisterRequest } from "../dtos/requests/RegisterRequest";
import { DataResponse } from "../dtos/responses/DataResponse";
import "../middlewares/auth.middleware";
import { UpdateProfileRequest } from "../dtos/requests/LoginProfileRequest";
import { ChangePasswordRequest } from "../dtos/requests/ChangePasswordRequest";
import { ForgotPasswordRequest } from "../dtos/requests/ForgotPasswordRequest";
import { ResetPasswordRequest } from "../dtos/requests/ResetPasswordRequest";

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

      const result = await this.authService.refreshToken(refreshToken);
      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }

      res
        .status(200)
        .json(DataResponse.success(result, "Token refreshed successfully"));
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

      const result = await this.authService.logout(refreshToken);

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

  async updateProfile(req: Request, res: Response) {
    try {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json(DataResponse.badRequest("User authentication required"));
      }

      const updateProfileRequest: UpdateProfileRequest = req.body;
      const result = await this.authService.updateProfile(
        user.accountId,
        updateProfileRequest
      );

      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }

      res
        .status(200)
        .json(DataResponse.success(result, "Profile updated successfully"));
    } catch (error: any) {
      logger.error(`Update profile error: ${error}`);
      res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json(DataResponse.badRequest("User authentication required"));
      }

      const changePasswordRequest: ChangePasswordRequest = req.body;
      const result = await this.authService.changePassword(
        user.accountId,
        changePasswordRequest
      );

      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }

      res
        .status(200)
        .json(DataResponse.success(null, "Password changed successfully"));
    } catch (error: any) {
      logger.error(`Change password error: ${error}`);
      res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }

  async uploadAvatar(req: Request, res: Response) {
    try {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json(DataResponse.badRequest("User authentication required"));
      }

      // Check if file was uploaded successfully
      if (!req.file) {
        return res
          .status(400)
          .json(DataResponse.badRequest("No avatar image uploaded"));
      }

      // The file info is added by multer-storage-cloudinary
      const cloudinaryFile = req.file as Express.Multer.File & {
        path: string; // Contains the Cloudinary URL
      };

      // Update user avatar with Cloudinary URL
      const result = await this.authService.updateAvatar(
        user.accountId,
        cloudinaryFile.path
      );

      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }

      res
        .status(200)
        .json(DataResponse.success(result, "Avatar uploaded successfully"));
    } catch (error: any) {
      logger.error(`Avatar upload error: ${error}`);
      res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const forgotPasswordRequest: ForgotPasswordRequest = req.body;

      const result = await this.authService.forgotPassword(
        forgotPasswordRequest.email
      );

      return res.status(result.code).json(result);
    } catch (error: any) {
      logger.error(`Forgot password error: ${error}`);
      return res
        .status(500)
        .json(
          DataResponse.error(
            "Internal server error",
            error.message || "Unknown error"
          )
        );
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const resetPasswordRequest: ResetPasswordRequest = req.body;

      const result = await this.authService.resetPassword(resetPasswordRequest);

      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }

      return res
        .status(200)
        .json(
          DataResponse.success(null, "Password has been reset successfully")
        );
    } catch (error: any) {
      logger.error(`Reset password error: ${error}`);
      return res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }
}
