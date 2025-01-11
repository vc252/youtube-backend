import {v2 as cloudinary} from 'cloudinary'
import fs from 'node:fs'
import ApiError from './ApiError.utils.js';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    
    if (!localFilePath) return null;

    const uploadResult = await cloudinary.uploader
      .upload(localFilePath,{
        resource_type: 'auto'
      })

    console.log('file has been uploaded',uploadResult);
    return uploadResult.url;

  } catch(err) {

    console.log('error uploading file to cloudinary ',err.message);
    throw new ApiError(500,'Not able to upload file',[err.message],err.stack);

  } finally {

    try {
      fs.unlinkSync(localFilePath);
      console.log('temp File deleted successfully');
    } catch (err) {
      console.log('Error deleting temp File', err.message)
    }

  }
}

export default uploadOnCloudinary;