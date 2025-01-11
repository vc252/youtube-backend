import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  username: {
    type: string,
    required: [true,'username is required'],
    unique: [true,'username should be unique'],
    lowercase: true,
    trim: true,
    index: true
  },
  fullName: {
    type: string,
    required: [true,'fullName is required'],
    trim: true,
    index: true
  },
  email: {
    type: string,
    required: [true,'email is required'],
    unique: [true,'email should be unique'],
    lowercase: true,
    trim: true,
  },
  password: {
    type: string,
    required: [true,'Password is required']
  },
  avatar: {
    type: string, //cloudinary url
    required: [true,'avatar is required']
  },
  coverImage: {
    type: string, //cloudinary url
  },
  watchHistory: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
      }
    ],
    default: []
  },
  refreshToken: {
    type: String
  }
},{timestamps: true});

userSchema.pre('save',async function(next) {
  try {
    const user = this;
    if (!user.isModified(['password'])) {
      next();
    }
    const hash = await argon.hash(user.password);
    user.password = hash;
    next();
  } catch(err) {
    next(err);
  }
})

//lets see which one to use
//I think there could be one scenario where this might be better
//if we don't what the user is using to login like username or email
userSchema.methods.checkPassword = async function (password) {
  const user = this;
  if (!await argon.verify(user.password,password)) {
    return false;
  }
  return true;
}

userSchema.methods.generateAccessToken = function () {
  const token = jwt.sign({
    _id: this._id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
    avatar:this.avatar
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  });
}
userSchema.methods.generateRefreshToken = function () {
  const token = jwt.sign({
    _id: this._id,
  },
  process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn: process.env.REFRESJ_TOKEN_EXPIRY
  });
}

userSchema.static('verifyUser',async function (username,password) {
  const user = await this.findOne({username});
  if (!user || !await argon.verify(user.password,password)) {
    return false;
  }
  return true;
})

const User = mongoose.model('User',userSchema);

export default User;