import { Gender } from "../../entities/enum";

export interface UserResponse {
  userId: number;
  fullName?: string;
  email?: string;
  avatar?: string; 
  dob?: Date;
  gender?: Gender;
  bio?: string;
  isContact: boolean; // Để biết người dùng này có trong danh bạ không
}