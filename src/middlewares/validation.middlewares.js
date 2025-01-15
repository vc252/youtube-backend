import { array, z } from 'zod';
import ApiError from '../utils/ApiError.utils.js';

function validateRegistration(req,_,next) {
  try {
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    const requiredBody = z.object({
      username: z
        .string('username should be a string')
        .min(1,'minimum 1 character in username')
        .max(50,'maximum 50 characters in username'),
      firstName: z
        .string('firstName should be a string')
        .min(1,'minimum 1 character in first name')
        .max(100,'maximum 100 characters in first name'),
      lastName: z
        .string('lastName should be a string')
        .min(1,'minimum 1 character in last name')
        .max(100,'maximum 100 characters in last name'),
      email: z
        .string('email should be a string')
        .email('email not of valid format'),
      password: z
        .string('password should be a string')
        .refine(value => passwordRegex.test(value),'password must contain atleast 1 upper, 1 lower, 1 special and 1 numeric character'),
      // avatar: z
      //   .string('avatar should be a string')
      //   .optional(),
      // coverImage: z
      //   .string('coverImage should be a string')
      //   .optional(),
      // refreshToken: z
      //   .string('refreshToken should be a string')
      //   .optional(),
      // watchHistory: z
      //   .array('watchHistory should be an array')
      //   .optional()
    })
  
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);
  
    if (!parsedDataWithSuccess.success) {
      throw new ApiError(401,'registration format not valid',[parsedDataWithSuccess.error])
    }
  
    next();
  } catch (error) {
    next(error);
  }
}

function validatePasswordChange(req,_,next) {
  try {
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
  
    const requiredBody = z.object({
      newPassword: z
        .string('password should be a string')
        .refine(value => passwordRegex.test(value),'password must contain atleast 1 upper, 1 lower, 1 special and 1 numeric character'),
    })
  
    const parsedWithSuccess = requiredBody.safeParse(req.body);
  
    if (!parsedWithSuccess.success) {
      throw new ApiError(401,'new password format not valid',[parsedWithSuccess.error])
    }
  
    next();
  } catch (error) {
    next(error);
  }
}

export {
  validateRegistration,
  validatePasswordChange
};