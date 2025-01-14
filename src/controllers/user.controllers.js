import asyncHandler from "../utils/asyncHandler.utils.js";
import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";
import uploadOnCloudinary from "../utils/cloudinary.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {

    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    user.refreshToken = refreshToken;
    console.log(typeof user);
    console.log(user);
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

  console.log(req.files);

  if (!avatarLocalPath) {
    throw new ApiError(400,'avatar image is required');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
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

export {
  registerUser,
  loginUser,
  logoutUser
};