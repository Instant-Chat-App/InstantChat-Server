import { logger } from "../utils/logger";
import { getEnv } from "../utils/get-env.service";
import twilio from "twilio";

class SMSService {
  private readonly client: any;

  constructor() {
    this.client = twilio(
      getEnv("TWILIO_ACCOUNT_SID"),
      getEnv("TWILIO_AUTH_TOKEN")
    );
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const message = await this.client.messages.create({
        body: `Your InstantChat verification code is: ${otp}.This code will valid for 5 minutes.`,
        from: getEnv("TWILIO_PHONE_NUMBER"),
        to: formattedPhone,
      });

      logger.info(`SMS sent to ${phoneNumber}, SID: ${message.sid}`);
      return true;
    } catch (error) {
      logger.error(`Error sending SMS: ${error}`);
      throw new Error("Failed to send SMS");
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.startsWith("0")) {
      return `+84${phoneNumber.substring(1)}`;
    }
    return phoneNumber;
  }
}

export const smsService = new SMSService();
