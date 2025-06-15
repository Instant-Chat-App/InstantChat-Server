import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/account.entity";
import { getEnv } from "../utils/get-env.service";
import { User } from "../entities/user.entity";
import { TokenPair, TokenPayload } from "../dtos/token.dto";
import { redisService } from "./redis.service";
import { LoginRequest } from "../dtos/login-request.dto";
import { AuthResponse } from "../dtos/auth-response.dto";
import { logger } from "../utils/logger";
import { RegisterRequest } from "../dtos/register-request.dto";

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
    phoneNumber: string
  ): Promise<TokenPair> {
    const payload: TokenPayload = { accountId, phoneNumber };

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

  async login(request: LoginRequest): Promise<AuthResponse | null> {
    try {
      const account = await this.accountRepository.findOne({
        where: { phone: request.phoneNumber },
        relations: ["user"],
      });

      if (!account) {
        logger.warn(`Phone number not existed: ${request.phoneNumber}`);
        return null;
      }

      const isValidPassword = await bcrypt.compare(
        request.password,
        account.password!
      );

      if (!isValidPassword) {
        logger.warn(
          `Invalid password attempt for phone number: ${request.phoneNumber}`
        );
        return null;
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

  async register(request: RegisterRequest) {
    try {
      const existingAccount = await this.accountRepository.findOne({
        where: { phone: request.phoneNumber },
      });

      if (existingAccount) {
        return null;
      }

      const passwordHash = await bcrypt.hash(request.password, 10);

      const account = new Account();
      account.phone = request.phoneNumber;
      account.password = passwordHash;
      account.isActive = true;

      const savedAccount = await this.accountRepository.save(account);

      const user = new User();
      user.userId = savedAccount.accountId;
      user.fullName = request.fullName;
      user.email = request.email;
      user.avatar = request.avatar;
      user.dob = request.dob;
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

  async refreshToken(token: string): Promise<TokenPair | null> {
    try {
      const payload = jwt.verify(
        token,
        this.REFRESH_TOKEN_SECRET
      ) as TokenPayload;

      const storedAccountId = await redisService.verifyRefreshToken(token);

      if (!storedAccountId || storedAccountId !== payload.accountId) {
        logger.warn(
          `Attempt to use invalid refresh token for account: ${payload.accountId}`
        );
        return null;
      }

      await redisService.deleteRefreshToken(token);

      return await this.generateTokens(payload.accountId, payload.phoneNumber);
    } catch (error) {
      logger.error(`Error refreshing token: ${error}`);
      return null;
    }
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
