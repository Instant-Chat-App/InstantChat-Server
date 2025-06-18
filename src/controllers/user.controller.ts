import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { DataResponse } from "../dtos/responses/DataResponse";
import { logger } from "../utils/logger";

export default class UserController {
  private readonly userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUserInfo(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);

      // Kiểm tra userId có hợp lệ không
      if (isNaN(userId)) {
        return res.status(400).json(DataResponse.badRequest("Invalid user ID"));
      }

      const currentUser = req.user;
      if (!currentUser) {
        return res
          .status(401)
          .json(DataResponse.unauthorized("User authentication required"));
      }

      const result = await this.userService.getUserInfo(
        userId,
        currentUser.accountId
      );

      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }

      return res
        .status(200)
        .json(
          DataResponse.success(
            result,
            "User information retrieved successfully"
          )
        );
    } catch (error: any) {
      logger.error(`Get user info error: ${error}`);
      return res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }

  async getUserContacts(req: Request, res: Response) {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        return res
          .status(401)
          .json(DataResponse.unauthorized("User authentication required"));
      }

      const contacts = await this.userService.getUserContacts(
        currentUser.accountId
      );

      if (contacts instanceof DataResponse) {
        return res.status(contacts.code).json(contacts);
      }

      return res
        .status(200)
        .json(
          DataResponse.success(contacts, "User contacts retrieved successfully")
        );
    } catch (error: any) {
      logger.error(`Get user contacts error: ${error}`);
      return res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }
}
