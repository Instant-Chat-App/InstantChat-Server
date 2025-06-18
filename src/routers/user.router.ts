import { Router } from "express";
import UserController from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const userRouter = Router();
const userController = new UserController();

userRouter.post("/contacts/:userId", authMiddleware, (req, res) => {
  userController.addContact(req, res);
});

userRouter.get("/contacts", authMiddleware, (req, res) => {
  userController.getUserContacts(req, res);
});

userRouter.get("/:userId", authMiddleware, (req, res) => {
  userController.getUserInfo(req, res);
});

userRouter.get("/find/:userId", authMiddleware, (req, res) => {
  userController.getUserById(req, res);
});

userRouter.get("/phone/:phone", authMiddleware, (req, res) => {
  userController.getUserByPhone(req, res);
});

userRouter.delete("/contacts/:userId", authMiddleware, (req, res) => {
  userController.removeContact(req, res);
});

export default userRouter;
