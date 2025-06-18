import { Router } from "express";
import UserController from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const userRouter = Router();
const userController = new UserController();

userRouter.get("/contacts", authMiddleware, (req, res) => {
  userController.getUserContacts(req, res);
});

userRouter.get("/:userId", authMiddleware, (req, res) => {
  userController.getUserInfo(req, res);
});

userRouter.get("/find", authMiddleware, (req, res) => {
  userController.getUserById(req, res);
});

export default userRouter;
