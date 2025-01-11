import {v2 as cloudinary} from 'cloudinary'
import fs from 'node:fs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET 
})

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (localFilePath) return null;
    const uploadResult = await cloudinary.uploader
      .upload(localFilePath,{
        resource_type: 'auto'
      })
    console.log('file has been uploaded',uploadResult);
    return uploadResult.url;
  } catch(err) {
    //remove the locally saved temp file
    fs.unlinkSync(localFilePath);
    return null;
  }
}