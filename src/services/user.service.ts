import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";
import { DataResponse } from "../dtos/responses/DataResponse";
import { UserResponse } from "../dtos/responses/UserResponse";
import { logger } from "../utils/logger";
import UserRepository from "../repository/user.repository";

export class UserService {
  private readonly userRepository = AppDataSource.getRepository(User);
  private readonly secondUserRepository = new UserRepository();
  async getUserInfo(
    userId: number,
    currentUserId: number
  ): Promise<UserResponse | DataResponse<null>> {
    try {
      // Không cho phép lấy thông tin của chính mình (nên dùng API profile)
      if (userId === currentUserId) {
        return DataResponse.badRequest("Can't get your own profile");
      }

      // Tìm user theo ID
      const user = await this.userRepository.findOne({
        where: { userId },
      });

      if (!user) {
        return DataResponse.notFound("User not found");
      }

      // Lấy thông tin của current user với relations contacts để kiểm tra
      const currentUser = await this.userRepository.findOne({
        where: { userId: currentUserId },
        relations: ["contacts"],
      });

      if (!currentUser) {
        return DataResponse.notFound("Current user not found");
      }

      // Kiểm tra xem user này có trong danh bạ của currentUser không
      const isContact =
        currentUser.contacts?.some((contact) => contact.userId === userId) ||
        false;

      // Chuyển đổi thành UserResponse
      const userResponse: UserResponse = {
        id: user.userId,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        dob: user.dob,
        gender: user.gender,
        bio: user.bio,
        isContact: isContact,
      };

      return userResponse;
    } catch (error: any) {
      logger.error(`Error getting user info: ${error}`);
      throw new Error(`Failed to get user information: ${error.message}`);
    }
  }

  async getUserContacts(
    currentUserId: number
  ): Promise<UserResponse[] | DataResponse<null>> {
    try {
      // Lấy user hiện tại kèm danh sách contacts
      const currentUser = await this.userRepository.findOne({
        where: { userId: currentUserId },
        relations: ["contacts"],
      });

      if (
        !currentUser ||
        !currentUser.contacts ||
        currentUser.contacts.length === 0
      ) {
        return [];
      }

      // Map contacts thành UserResponse
      const userResponses: UserResponse[] = currentUser.contacts.map(
        (contact) => ({
          id: contact.userId,
          fullName: contact.fullName,
          email: contact.email,
          avatar: contact.avatar,
          dob: contact.dob,
          gender: contact.gender,
          bio: contact.bio,
          isContact: true,
        })
      );

      return userResponses;
    } catch (error: any) {
      logger.error(`Error getting user contacts: ${error}`);
      throw new Error(`Failed to get user contacts: ${error.message}`);
    }
  }

  async getUserById(
    currentUserId: number,
    targetUserId: number
  ): Promise<UserResponse | null> {
    const user = await this.secondUserRepository.getUserById(
      currentUserId,
      targetUserId
    );
    if (!user) {
      return null;
    }

    return {
      id: user.userId,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      dob: user.dob,
      gender: user.gender,
      bio: user.bio,
      isContact: user.isContact,
    };
  }

  async getUserByPhone(
    phone: string,
    currentUserId: number
  ): Promise<UserResponse | null> {
    const user = await this.secondUserRepository.getUserByPhone(
      phone,
      currentUserId
    );
    if (!user) {
      return null;
    }

    return {
      id: user.userId,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      dob: user.dob,
      gender: user.gender,
      bio: user.bio,
      isContact: user.isContact,
    };
  }
}
