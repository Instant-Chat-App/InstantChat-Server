import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../schemas/auth.schema";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadUserAvatar } from "../middlewares/upload.middleware";

const authRouter = Router();

const authController = new AuthController();

authRouter.post("/login", validate(loginSchema), (req, res) => {
  authController.login(req, res);
});

authRouter.post("/register", validate(registerSchema), (req, res) => {
  authController.register(req, res);
});

authRouter.post("/refresh", (req, res) => {
  authController.refresh(req, res);
});

authRouter.post("/logout", (req, res) => {
  authController.logout(req, res);
});

authRouter.get("/profile", authMiddleware, (req, res) => {
  authController.getProfile(req, res);
});

authRouter.patch(
  "/profile",
  authMiddleware,
  validate(updateProfileSchema),
  (req, res) => authController.updateProfile(req, res)
);

authRouter.put(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  (req, res) => authController.changePassword(req, res)
);

authRouter.post("/avatar", authMiddleware, uploadUserAvatar, (req, res) =>
  authController.uploadAvatar(req, res)
);

authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  (req, res) => {
    authController.forgotPassword(req, res);
  }
);

authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  (req, res) => {
    authController.resetPassword(req, res);
  }
);

export default authRouter;
