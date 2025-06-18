import { Gender } from "../../entities/enum";

export interface ProfileResponse {
  id: number;
  phone: string;
  fullName: string;
  email: string | null;
  avatar: string | null;
  dob: Date | null;
  gender: Gender | null;
  bio: string | null;
}
