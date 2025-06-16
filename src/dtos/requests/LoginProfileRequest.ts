import { Gender } from "../../entities/enum";

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  dob?: Date | string;
  gender?: Gender;
  bio?: string;
}
