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

  async storeOTP(
    phone: string,
    otp: string,
    expiryInSeconds: number = 300
  ): Promise<void> {
    try {
      await this.client.set(`otp:${phone}`, otp, "EX", expiryInSeconds);
    } catch (error) {
      logger.error(`Error storing OTP: ${error}`);
      throw new Error("Failed to store OTP");
    }
  }

  async verifyOTP(phone: string, otp: string): Promise<boolean> {
    try {
      const storedOTP = await this.client.get(`otp:${phone}`);
      return storedOTP === otp;
    } catch (error) {
      logger.error(`Error verifying OTP: ${error}`);
      throw new Error("Failed to verify OTP");
    }
  }

  async deleteOTP(phone: string): Promise<boolean> {
    try {
      const result = await this.client.del(`otp:${phone}`);
      return result === 1;
    } catch (error) {
      logger.error(`Error deleting OTP: ${error}`);
      throw new Error("Failed to delete OTP");
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
