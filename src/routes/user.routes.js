import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import { validateRegistration } from "../middlewares/validation.middlewares.js";
import upload from "../middlewares/multer.middlewares.js";

const userRouter = Router();

userRouter.route('/register')
  .post(
    upload.fields([
      {
        name: 'avatar',
        maxCount: 1
      },
      {
        name: 'coverImage',
        maxCount: 1
      }
    ]),
    validateRegistration,registerUser)

export default userRouter;