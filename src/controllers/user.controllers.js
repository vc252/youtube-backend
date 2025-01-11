import asyncHandler from "../utils/asyncHandler.utils.js";
import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";
import uploadOnCloudinary from "../utils/cloudinary.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";

const registerUser = asyncHandler( async (req,res,next) => {
  
  const {username, firstName, lastName, email, password} = req.body;

  const existingUser = await User.findOne({
    $or: [{username},{email}]
  })
  if (existingUser) {
    throw new ApiError(409,'email or username already exists');
  }

  const avatarLocalPath = req.files?.avatar?.path;
  const coverImageLocalPath = req.files?.coverImage?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400,'avatar image is required');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (coverImageLocalPath) {
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
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

  const userCreated = User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500,'something went wrong while creating user');
  }

  return res.status(200).json(
    new ApiResponse(200,userCreated,'user registered successfully')
  )

})

export {registerUser};