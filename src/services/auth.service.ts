import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/account.entity";
import { getEnv } from "../utils/get-env.service";
import { User } from "../entities/user.entity";
import { TokenPair, TokenPayload } from "../dtos/token.dto";
import { redisService } from "./redis.service";
import { LoginRequest } from "../dtos/requests/login-request.dto";
import { AuthResponse } from "../dtos/responses/auth-response.dto";
import { logger } from "../utils/logger";
import { RegisterRequest } from "../dtos/requests/register-request.dto";
import { DataResponse } from "../dtos/responses/DataResponse";
import { ProfileResponse } from "../dtos/responses/profile.dto";

export class AuthService {
  private readonly accountRepository = AppDataSource.getRepository(Account);
  private readonly userRepository = AppDataSource.getRepository(User);

  private readonly ACCESS_TOKEN_SECRET = getEnv("ACCESS_TOKEN_SECRET");
  private readonly REFRESH_TOKEN_SECRET = getEnv("REFRESH_TOKEN_SECRET");

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
    const payload: TokenPayload = { accountId, phone };

    const accessToken = jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
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
      });

      if (!account) {
        return DataResponse.badRequest("Phone number not existed");
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

  async register(request: RegisterRequest): Promise<AuthResponse | DataResponse<null>> {
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
      user.avatar = request.avatar;
      user.dob =
        request.dob instanceof Date ? request.dob : new Date(request.dob);
      user.gender = request.gender;
      user.bio = request.bio;

      await this.userRepository.save(user);

      const response: AuthResponse = await this.generateTokens(
        savedAccount.accountId,
        savedAccount.phone!
      );

      return response;
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
      throw new Error("Refresh token failed");
    }
  }

  async getProfile(accountId: number): Promise<ProfileResponse| DataResponse<null>> {
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
    
    return {
      id: account.accountId,
      phone: account.phone || "",
      user: {
        fullName: account.user.fullName || "",
        email: account.user.email || "",
        avatar: account.user.avatar || "",
        dob: account.user.dob || new Date(),
        gender: String(account.user.gender || ""),
        bio: account.user.bio || ""
      }
    };
  }

  async logout(token: string): Promise<boolean> {
    try {
      return await redisService.deleteRefreshToken(token);
    } catch (error) {
      logger.error(`Error during logout: ${error}`);
      return false;
    }
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      logger.error(`Error verifying access token: ${error}`);
      return null;
    }
  }
}
