import { Router } from "express";
import { changePassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateAvatar, updateCoverImage } from "../controllers/user.controllers.js";
import { validateRegistration, validatePasswordChange, validateAccountUpdate } from "../middlewares/validation.middlewares.js";
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
userRouter.route('/refresh-token')
  .post(refreshAccessToken)

userRouter.use(verifyJWT);

userRouter.route('/logout')
  .post(logoutUser)

userRouter.route('/change-password')
  .post(
    validatePasswordChange,
    changePassword
  )
userRouter.route('/update-account')
  .patch(
    validateAccountUpdate,
    updateAccountDetails
  )
userRouter.route('/update-avatar')
  .patch(
    upload.single('avatar'),
    updateAvatar
  )
userRouter.route('/update-coverImage')
  .patch(
    upload.single('coverImage'),
    updateCoverImage
  )
userRouter.route('/current-user')
  .get(
    getCurrentUser
  )
userRouter.route('/c/:username')
  .get(
    getUserChannelProfile
  )
userRouter.route('/watchHistory')
  .get(
    getWatchHistory
  )

export default userRouter;