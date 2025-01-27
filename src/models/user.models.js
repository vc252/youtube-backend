import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import argon from "argon2";
import ApiError from "../utils/ApiError.utils.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      unique: [true, "username should be unique"],
      lowercase: true,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, "firstName is required"],
      index: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "lastName is required"],
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: [true, "email should be unique"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
    },
    avatar: {
      type: String, //cloudinary url
      required: [true, "avatar is required"],
    },
    coverImage: {
      type: String, //cloudinary url
    },
    watchHistory: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Video",
        },
      ],
      default: [],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    const user = this;
    if (!user.isModified(["password"])) {
      next();
    }
    const hash = await argon.hash(user.password);
    user.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});

//lets see which one to use
//I think there could be one scenario where this might be better
//if we don't what the user is using to login like username or email
//we are using this to check the old password
userSchema.methods.checkPassword = async function (password) {
  return await argon.verify(this.password, password);
};

userSchema.methods.generateAccessToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      avatar: this.avatar,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );

  return token;
};

userSchema.methods.generateRefreshToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );

  return token;
};

userSchema.static("verifyUser", async function (username, email, password) {
  const user = await this.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  if (!(await argon.verify(user.password, password))) {
    throw new ApiError(401, "Invalid password");
  }

  return user._id;
});

userSchema.plugin(mongooseAggregatePaginate);

const User = mongoose.model("User", userSchema);

export default User;
