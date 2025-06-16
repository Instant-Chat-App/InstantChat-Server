import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { registerSchema } from "../schemas/auth.schema";
import { authMiddleware } from "../middlewares/auth.middleware";

const authRouter = Router();

const authController = new AuthController();

authRouter.post("/login", validate(registerSchema), (req, res) => {
  authController.login(req, res, );
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

export default authRouter;
