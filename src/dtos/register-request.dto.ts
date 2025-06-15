import { Gender } from "../entities/enum";

export interface RegisterRequest {
    phoneNumber: string;
    password: string;
    fullName: string;
    email: string;
    avatar: string; // xu ly anh sau
    dob: Date;
    gender: Gender;
    bio: string;
}