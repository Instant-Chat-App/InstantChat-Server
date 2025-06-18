import { Gender } from "../../entities/enum";

export interface UserResponse {
  id: number;
  fullName?: string;
  email?: string;
  avatar?: string; 
  dob?: Date;
  gender?: Gender;
  bio?: string;
  isContact: boolean; 
}