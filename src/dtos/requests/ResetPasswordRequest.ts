export interface ResetPasswordRequest {
  phone: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}
