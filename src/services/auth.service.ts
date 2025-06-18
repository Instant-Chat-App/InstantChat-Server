import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/account.entity";
import { getEnv } from "../utils/get-env.service";
import { User } from "../entities/user.entity";
import { TokenPair, TokenPayload } from "../dtos/TokenDto";
import { redisService } from "./redis.service";
import { LoginRequest } from "../dtos/requests/LoginRequest";
import { AuthResponse } from "../dtos/responses/AuthResponse";
import { logger } from "../utils/logger";
import { RegisterRequest } from "../dtos/requests/RegisterRequest";
import { DataResponse } from "../dtos/responses/DataResponse";
import { UpdateProfileRequest } from "../dtos/requests/LoginProfileRequest";
import { ChangePasswordRequest } from "../dtos/requests/ChangePasswordRequest";
import cloudinary from "../config/cloudinary/cloudinary";
import { ProfileResponse } from "../dtos/responses/ProfileResponse";
import { smsService } from "./sms.service";
import { ForgotPasswordRequest } from "../dtos/requests/ForgotPasswordRequest";
import { ResetPasswordRequest } from "../dtos/requests/ResetPasswordRequest";

export class AuthService {
  private readonly accountRepository = AppDataSource.getRepository(Account);
  private readonly userRepository = AppDataSource.getRepository(User);

  private readonly ACCESS_TOKEN_SECRET = getEnv("ACCESS_TOKEN_SECRET");
  private readonly REFRESH_TOKEN_SECRET = getEnv("REFRESH_TOKEN_SECRET");
  private readonly DEFAULT_AVT = getEnv("DEFAULT_AVT_URL");

  private getExpiryInSecond(expiresIn: string): number {
    const multiplier = expiresIn.endsWith("d")
      ? 86400
      : expiresIn.endsWith("h")
      ? 3600
      : expiresIn.endsWith("m")
      ? 60
      : 1;

    const value = parseInt(expiresIn, 10);
    return value * multiplier;
  }

  private async generateTokens(
    accountId: number,
    phone: string
  ): Promise<TokenPair> {
    const accessPayload: TokenPayload = {
      accountId,
      phone,
      tokenType: "access",
    };

    const refreshPayload: TokenPayload = {
      accountId,
      phone,
      tokenType: "refresh",
    };

    const accessToken = jwt.sign(accessPayload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    const refreshToken = jwt.sign(refreshPayload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });

    const expiryInSeconds = this.getExpiryInSecond("7d");
    await redisService.storeRefreshToken(
      refreshToken,
      accountId,
      expiryInSeconds
    );

    return { accessToken, refreshToken };
  }

  async login(
    request: LoginRequest
  ): Promise<AuthResponse | DataResponse<null>> {
    try {
      const account = await this.accountRepository.findOne({
        where: { phone: request.phone },
        relations: ["user"],
        select: {
          accountId: true,
          phone: true,
          password: true,
          isActive: true,
        },
      });

      if (!account) {
        return DataResponse.badRequest(
          "Invalid password attempt for phone number"
        );
      }

      const isValidPassword = await bcrypt.compare(
        request.password,
        account.password!
      );

      if (!isValidPassword) {
        return DataResponse.badRequest(
          "Invalid password attempt for phone number"
        );
      }

      const { accessToken, refreshToken } = await this.generateTokens(
        account.accountId,
        account.phone!
      );
      const authResponse: AuthResponse = { accessToken, refreshToken };
      return authResponse;
    } catch (error) {
      logger.error(`Error during login: ${error}`);
      throw new Error("Authentication failed");
    }
  }

  async register(
    request: RegisterRequest
  ): Promise<ProfileResponse | DataResponse<null>> {
    try {
      const existingAccount = await this.accountRepository.findOne({
        where: { phone: request.phone },
      });

      if (existingAccount) {
        return DataResponse.badRequest("Phone number existed");
      }

      const passwordHash = await bcrypt.hash(request.password, 10);

      const account = new Account();
      account.phone = request.phone;
      account.password = passwordHash;
      account.isActive = true;

      const savedAccount = await this.accountRepository.save(account);

      const user = new User();
      user.userId = savedAccount.accountId;
      user.fullName = request.fullName;
      user.email = request.email;
      user.avatar = this.DEFAULT_AVT;

      await this.userRepository.save(user);

      const accountWithUser = await this.accountRepository.findOne({
        where: { accountId: savedAccount.accountId },
        relations: { user: true },
      });

      if (!accountWithUser) {
        return DataResponse.badRequest(
          "Failed to retrieve user profile after registration"
        );
      }

      return this.mapToProfileResponse(accountWithUser);
    } catch (err) {
      logger.error(`Error during registration: ${err}`);
      throw new Error("Registration failed");
    }
  }

  async refreshToken(token: string): Promise<TokenPair | DataResponse<null>> {
    try {
      const payload = jwt.verify(
        token,
        this.REFRESH_TOKEN_SECRET
      ) as TokenPayload;

      const storedAccountId = await redisService.verifyRefreshToken(token);

      if (!storedAccountId || storedAccountId !== payload.accountId) {
        return DataResponse.unauthorized("Invalid refresh token");
      }

      await redisService.deleteRefreshToken(token);

      return await this.generateTokens(payload.accountId, payload.phone);
    } catch (error) {
      logger.error(`Error refreshing token: ${error}`);
      throw new Error("Fail to refresh token");
    }
  }

  async getProfile(
    accountId: number
  ): Promise<ProfileResponse | DataResponse<null>> {
    const account = await this.accountRepository.findOne({
      where: { accountId: accountId },
      relations: { user: true },
    });

    if (!account) {
      return DataResponse.notFound("Account not found");
    }

    if (!account.user) {
      return DataResponse.notFound("User not found");
    }

    return this.mapToProfileResponse(account);
  }

  async logout(token: string): Promise<any> {
    try {
      if (!token) {
        return DataResponse.badRequest("Refresh token is required");
      }
      const deleted = await redisService.deleteRefreshToken(token);
      if (!deleted) {
        return DataResponse.notFound(
          "Refresh token not found or already expired"
        );
      }
      return true;
    } catch (error) {
      logger.error(`Error during logout: ${error}`);
      return DataResponse.badRequest("Error to revoke refresh token");
    }
  }

  async updateProfile(
    accountId: number,
    request: UpdateProfileRequest
  ): Promise<ProfileResponse | DataResponse<null>> {
    try {
      // Find the user
      const account = await this.accountRepository.findOne({
        where: { accountId },
        relations: { user: true },
      });

      if (!account) {
        return DataResponse.notFound("Account not found");
      }

      if (!account.user) {
        return DataResponse.notFound("User profile not found");
      }

      // Update user fields
      if (request.fullName !== undefined)
        account.user.fullName = request.fullName;
      if (request.email !== undefined) account.user.email = request.email;
      if (request.dob !== undefined) {
        account.user.dob =
          request.dob instanceof Date ? request.dob : new Date(request.dob);
      }
      if (request.gender !== undefined) account.user.gender = request.gender;
      if (request.bio !== undefined) account.user.bio = request.bio;

      // Save updated user
      await this.userRepository.save(account.user);

      // Return updated profile
      return this.mapToProfileResponse(account);
    } catch (error) {
      logger.error(`Error updating profile: ${error}`);
      throw new Error("Profile update failed");
    }
  }

  async changePassword(
    accountId: number,
    request: ChangePasswordRequest
  ): Promise<boolean | DataResponse<null>> {
    try {
      if (request.newPassword !== request.confirmPassword) {
        return DataResponse.badRequest("New passwords don't match");
      }

      const account = await this.accountRepository.findOne({
        where: { accountId },
        select: {
          accountId: true,
          phone: true,
          password: true,
          isActive: true,
        },
      });

      if (!account) {
        return DataResponse.notFound("Account not found");
      }

      const isValidPassword = await bcrypt.compare(
        request.currentPassword,
        account.password!
      );

      if (!isValidPassword) {
        return DataResponse.badRequest("Current password is incorrect");
      }

      const newPasswordHash = await bcrypt.hash(request.newPassword, 10);

      account.password = newPasswordHash;
      await this.accountRepository.save(account);

      return true;
    } catch (error) {
      logger.error(`Error changing password: ${error}`);
      throw new Error("Password change failed");
    }
  }

  async updateAvatar(
    accountId: number,
    avatarUrl: string
  ): Promise<ProfileResponse | DataResponse<null>> {
    try {
      const account = await this.accountRepository.findOne({
        where: { accountId },
        relations: { user: true },
      });

      if (!account) {
        return DataResponse.notFound("Account not found");
      }

      if (!account.user) {
        return DataResponse.notFound("User profile not found");
      }

      // Delete old avatar
      if (account.user.avatar && account.user.avatar.includes("cloudinary")) {
        try {
          // Extract public_id from the Cloudinary URL
          // This is a simplified approach - you may need to adapt based on your URL structure
          const publicId = account.user.avatar.split("/").pop()?.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
            logger.info(`Deleted old avatar with ID: ${publicId}`);
          }
        } catch (cloudinaryError) {
          logger.warn(`Failed to delete old avatar: ${cloudinaryError}`);
        }
      }

      // Update avatar URL
      account.user.avatar = avatarUrl;

      // Save updated user
      await this.userRepository.save(account.user);

      // Return updated profile
      return this.mapToProfileResponse(account);
    } catch (error) {
      logger.error(`Error updating avatar: ${error}`);
      throw new Error("Avatar update failed");
    }
  }

  async forgotPassword(
    req: ForgotPasswordRequest
  ): Promise<boolean | DataResponse<null>> {
    const phone = req.phone;
    try {
      const account = await this.accountRepository.findOne({
        where: { phone },
      });

      if (!account) {
        return DataResponse.notFound("No account found with this phone number");
      }

      const otp = this.generateOTP();

      // Store OTP in Redis (valid for 5 minutes)
      await redisService.storeOTP(phone, otp, 300);

      // Send OTP via SMS
      await smsService.sendOTP(phone, otp);

      return true;
    } catch (error) {
      logger.error(`Error in forgot password: ${error}`);
      throw new Error("Failed to process password reset request");
    }
  }

  async resetPassword(
    req: ResetPasswordRequest
  ): Promise<boolean | DataResponse<null>> {
    const { phone, otp, newPassword, confirmPassword } = req;
    try {
      const isValidOTP = await redisService.verifyOTP(phone, otp);

      if (!isValidOTP) {
        return DataResponse.badRequest("Invalid or expired OTP");
      }

      const account = await this.accountRepository.findOne({
        where: { phone },
      });

      if (!account) {
        return DataResponse.notFound("Account not found");
      }

      if (newPassword !== confirmPassword) {
        return DataResponse.badRequest("Passwords do not match");
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      account.password = passwordHash;
      await this.accountRepository.save(account);

      await redisService.deleteOTP(phone);

      return true;
    } catch (error) {
      logger.error(`Error in reset password: ${error}`);
      throw new Error("Failed to reset password");
    }
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(
        token,
        this.ACCESS_TOKEN_SECRET
      ) as TokenPayload;

      if (payload.tokenType !== "access") {
        logger.warn("Attempt to use a non-access token for authentication");
        return null;
      }

      return payload;
    } catch (error) {
      logger.error(`Error verifying access token: ${error}`);
      return null;
    }
  }

  private mapToProfileResponse(account: Account): ProfileResponse {
    return {
      id: account.accountId,
      phone: account.phone || "",
      fullName: account.user.fullName || "",
      email: account.user.email || null,
      avatar: account.user.avatar || null,
      dob: account.user.dob || null,
      gender: account.user.gender || null,
      bio: account.user.bio || null,
    };
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
