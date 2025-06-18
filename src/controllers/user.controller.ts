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

  async getUserById(req: Request, res: Response) {
    try {
      const targetUserId = req.params.userId
        ? parseInt(req.params.userId)
        : null;

      if (!targetUserId || isNaN(targetUserId)) {
        return res.status(400).json({ message: "Invalid userId" });
      }

      const currentUser = req.user;
      if (!currentUser) {
        return res
          .status(401)
          .json(DataResponse.unauthorized("User authentication required"));
      }

      const result = await this.userService.getUserById(
        currentUser.accountId,
        targetUserId
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

  async getUserByPhone(req: Request, res: Response) {
    try {
      const phone = req.params.phone;
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const currentUser = req.user;
      if (!currentUser) {
        return res
          .status(401)
          .json(DataResponse.unauthorized("User authentication required"));
      }

      const result = await this.userService.getUserByPhone(
        phone,
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
      logger.error(`Get user by phone error: ${error}`);
      return res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }

  async addContact(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        return res.status(400).json(DataResponse.badRequest("Invalid user ID"));
      }

      const currentUser = req.user;
      if (!currentUser) {
        return res
          .status(401)
          .json(DataResponse.unauthorized("User authentication required"));
      }

      const result = await this.userService.addContact(
        currentUser.accountId,
        userId
      );

      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }

      return res
        .status(201)
        .json(DataResponse.success(result, "Contact added successfully"));
    } catch (error: any) {
      logger.error(`Add contact error: ${error}`);
      return res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }

  async removeContact(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        return res.status(400).json(DataResponse.badRequest("Invalid user ID"));
      }

      const currentUser = req.user;
      if (!currentUser) {
        return res
          .status(401)
          .json(DataResponse.unauthorized("User authentication required"));
      }

      const result = await this.userService.removeContact(
        currentUser.accountId,
        userId
      );

      if (result instanceof DataResponse) {
        return res.status(result.code).json(result);
      }

      return res
        .status(200)
        .json(DataResponse.success(null, "Contact removed successfully"));
    } catch (error: any) {
      logger.error(`Remove contact error: ${error}`);
      return res
        .status(500)
        .json(DataResponse.error("Internal server error", error.message));
    }
  }
}
