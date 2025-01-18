import asyncHandler from "../utils/asyncHandler.utils.js";
import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {

    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    user.refreshToken = refreshToken;

    await user.save({validateModifiedOnly: true})

    return {accessToken, refreshToken};

  } catch (error) {
    throw new ApiError(500,'something went wrong while generating token',[error.message],error.stack);
  }
}

const registerUser = asyncHandler( async (req, res, next) => {

  const {username, firstName, lastName, email, password} = req.body;

  const existingUser = await User.findOne({
    $or: [{username},{email}]
  })
  if (existingUser) {
    throw new ApiError(409,'email or username already exists');
  }

  const avatarLocalPath = req.files?.avatar?.at(0).path;
  const coverImageLocalPath = req.files?.coverImage?.at(0).path;

  if (!avatarLocalPath) {
    throw new ApiError(400,'avatar image is required');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (coverImageLocalPath) {
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage) {
      throw new ApiError(500,'not able to upload cover image');
    }
  }

  if (!avatar) {
    throw new ApiError(500,'not able to upload avatar');
  }

  const user = await User.create({
    username: username.toLowerCase(),
    firstName,
    lastName,
    password,
    email,
    avatar,
    coverImage: coverImage || ""
  })

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500,'something went wrong while creating user');
  }

  return res.status(200).json(
    new ApiResponse(200,userCreated,'user registered successfully')
  )

})

const loginUser = asyncHandler( async (req, res, next) => {

  const {username, email, password} = req.body;
  const userId = await User.verifyUser(username, email, password);

  if (!userId) {
    throw new ApiError(500, "Unexpected error: user verification failed");
  }

  const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(userId);

  const loggedInUser = await User.findById(userId).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    //just in case the user wants to do something with the accessToken or we are not able to
    //modify the cookies like in mobile apps
    new ApiResponse(200,{
      user: loggedInUser,
      accessToken,
      refreshToken
    },'User logged In Successfully')
  )

})

const logoutUser = asyncHandler( async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken",options)
  .cookie("refreshToken",options)
  .json(
    new ApiResponse(200,{},'User logged Out')
  )
})

const refreshAccessToken = asyncHandler( async (req, res, next) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401,'Unauthorized request');
  }

  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decodedToken?._id);

  if (!user || user.refreshToken != incomingRefreshToken) {
    throw new ApiError(401,'Refresh token expired or invalid');
  }

  const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);

  const options = {
    httpOnly: true,
    secure: true
  }
  res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,{
      accessToken,
      refreshToken: refreshToken
    },"User logged in successfully using refresh token")
  )
})

const changePassword = asyncHandler( async (req,res,next) => {
  const {oldPassword, newPassword} = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(400,'user does not exists');
  }
  if (!(await user.checkPassword(oldPassword))) {
    throw new ApiError(401,'Invalid old Password');
  }
  user.password = newPassword;
  user.save();
  res.status(200).json(
    new ApiResponse(200,null,'password changed successfully')
  )
})

const getCurrentUser = asyncHandler( async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(400,'user does not exists');
  }
  // if (req.user._id instanceof mongoose.Types.ObjectId) console.log(true);
  res.status(200).json(
    new ApiResponse(200,req.user,'current user fetched successfully')
  )
})

const updateAccountDetails = asyncHandler( async (req,res,next) => {
  const {firstName, lastName, email} = req.body;
  const updatedUser = await User.updateOne({_id: req.user._id},{
    $set: {
      firstName,
      lastName,
      email
    }
  },{new: true})
  .select(
    "-password -refreshToken"
  )

  return res
  .status(200)
  .json(
    new ApiResponse(200,updatedUser,'account details updated successfully')
  )
})

const updateAvatar = asyncHandler( async (req,res,next) => {

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400,'no file uploaded')
  }

  const oldAvatarUrl = req.user.avatar;
  const result = await deleteFromCloudinary(oldAvatarUrl);
  if (!result || result==="error") {
    throw new ApiError(500,'error in deleting the avatar file',[result]);
  }

  const newAvatar = await uploadOnCloudinary(avatarLocalPath);
  if (!newAvatar) {
    throw new ApiError(500,'not able to upload new avatar');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: newAvatar
      }
    },{new: true}
  ).select(
    "-password -refreshToken"
  )

  return res
  .status(200)
  .json(
    new ApiResponse(200,{
      user,
      newAvatar
    },'avatar updated successfully')
  )
})

const updateCoverImage = asyncHandler( async (req,res,next) => {

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400,'no file uploaded')
  }

  const oldCoverImageUrl = req.user.coverImage;
  if (oldCoverImageUrl) {
    const result = await deleteFromCloudinary(oldCoverImageUrl);
    if (!result || result==="error") {
      throw new ApiError(500,'error in deleting the coverImage file',[result]);
    }
  }

  const newCoverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!newCoverImage) {
    throw new ApiError(500,'not able to upload new cover image');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: newCoverImage
      }
    },{new: true}
  ).select(
    "-password -refreshToken"
  )

  return res
  .status(200)
  .json(
    new ApiResponse(200,{
      user,
      newCoverImage
    },'coverImage updated successfully')
  )
})

const getUserChannelProfile = asyncHandler( async (req, res, next) => {
  const {username} = req.params;

  if (!username) {
    throw new ApiError(400,'Username not provided');
  }

  username = username?.trim();

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers"
        },
        subscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"]
            },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        username: 1,
        subscriberCount:1,
        subscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])

  if (!channel?.length) {
    throw new ApiError(404,'channel does not exists');
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0],'User channel fetched successfully')
  )
})

const getWatchHistory = asyncHandler( async (req, res, next) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: req.user._id
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        //this will work on the objects in watch history
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              //this will work on the objects in owner
              pipeline: [
                {
                  $project:{
                    firstName: 1,
                    lastName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  if (!user?.length) {
    throw new ApiError(404,"user does not exists");
  }

  return res
  .satus(200)
  .json(
    new ApiResponse(200,user[0],"watch history fetched successfully")
  )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory
};