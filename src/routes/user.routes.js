import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controllers.js";
import { validateRegistration } from "../middlewares/validation.middlewares.js";
import upload from "../middlewares/multer.middlewares.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

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

userRouter.route('/login')
  .post(loginUser)

//secure routes
userRouter.route('/logout')
  .post(verifyJWT,logoutUser)
userRouter.route('/refresh-token')
  .post(refreshAccessToken)

export default userRouter;