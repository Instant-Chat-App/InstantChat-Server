import Redis, { RedisOptions } from "ioredis";
import { getEnv } from "../utils/get-env.service";
import { logger } from "../utils/logger";

class RedisService {
  private readonly client: Redis;
  private isConnected: boolean = false;

  constructor() {
    const redisHost = getEnv("REDIS_HOST", "localhost");
    const redisPort = parseInt(getEnv("REDIS_PORT", "6379"));

    const options: RedisOptions = {
      host: redisHost,
      port: redisPort,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };
    this.client = new Redis(options);
    this.client.on("connect", () => {
      this.isConnected = true;
      logger.info("Redis connected");
    });

    this.client.on("error", (err) => {
      this.isConnected = false;
      logger.error(`Redis error: ${err}`);
    });
  }

  async storeRefreshToken(
    token: string,
    accountId: number,
    expiryInSeconds: number
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Redis is not connected");
    }
    const key = `refresh_token:${token}`;
    const value = accountId.toString();

    await this.client.set(key, value, "EX", expiryInSeconds);
    logger.debug(
      `Stored refresh token for account ${accountId} with ${expiryInSeconds}  second expiry`
    );
  }

  async verifyRefreshToken(token: string): Promise<number | null> {
    if (!this.isConnected) {
      throw new Error("Redis is not connected");
    }

    const key = `refresh_token:${token}`;
    const accountId = await this.client.get(key);

    if (!accountId) {
      return null;
    }

    return parseInt(accountId, 10);
  }

  async deleteRefreshToken(token: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error("Redis is not connected");
    }

    const key = `refresh_token:${token}`;
    const result = await this.client.del(key);

    return result === 1;
  }

  async storePasswordResetToken(
    email: string,
    token: string,
    expiryInSeconds: number = 900 // 15 mins
  ): Promise<void> {
    try {
      await this.client.set(
        `password_reset:${token}`,
        email,
        "EX",
        expiryInSeconds
      );
    } catch (error) {
      logger.error(`Error storing password reset token: ${error}`);
      throw new Error("Failed to store password reset token");
    }
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    try {
      const email = await this.client.get(`password_reset:${token}`);
      return email;
    } catch (error) {
      logger.error(`Error verifying password reset token: ${error}`);
      throw new Error("Failed to verify password reset token");
    }
  }

  async deletePasswordResetToken(token: string): Promise<boolean> {
    try {
      const result = await this.client.del(`password_reset:${token}`);
      return result === 1;
    } catch (error) {
      logger.error(`Error deleting password reset token: ${error}`);
      throw new Error("Failed to delete password reset token");
    }
  }

  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info("Redis connection closed");
    }
  }
}

export const redisService = new RedisService();
