import { z } from "zod";

export const registerSchema = z.object({
  phone: z.string().regex(/^0\d{9}$/, "Phone number invalid"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
