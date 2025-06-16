import { z } from "zod";
import { Gender } from "../entities/enum";

export const loginSchema = z.object({
  phone: z.string().regex(/^0\d{9}$/, "Phone number invalid"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  phone: z.string().regex(/^0\d{9}$/, "Phone number invalid"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name cannot exceed 100 characters")
    .optional(),
  email: z.string().email("Invalid email format").optional(),
  dob: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .transform((val) => new Date(val))
    .optional(),
  gender: z
    .nativeEnum(Gender, {
      errorMap: () => ({ message: "Gender must be MALE, FEMALE, or OTHER" }),
    })
    .optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
});

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name cannot exceed 100 characters")
    .optional(),
  email: z.string().email("Invalid email format").optional(),
  avatar: z.string().optional(),
  dob: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .transform((val) => new Date(val))
    .optional(),
  gender: z
    .nativeEnum(Gender, {
      errorMap: () => ({ message: "Gender must be MALE, FEMALE, or OTHER" }),
    })
    .optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Confirm password must match new password",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Phone number invalid")
    .min(1, "Phone number is required"),
});

export const resetPasswordSchema = z
  .object({
    phone: z.string().regex(/^0\d{9}$/, "Phone number invalid"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
