export interface ProfileResponse {
  id: number;
  phone: string;
  user: {
    fullName: string,
    email: string,
    avatar: string,
    dob: Date,
    gender: string,
    bio: string
  };
}
