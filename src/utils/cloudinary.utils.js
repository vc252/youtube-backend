import { v2 as cloudinary } from "cloudinary";
import { extractPublicId } from "cloudinary-build-url";
import fs from "node:fs";
import ApiError from "./ApiError.utils.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File has been uploaded to Cloudinary");
    return uploadResult.url;
  } catch (err) {
    console.error("Error uploading file to Cloudinary:", err.message);
    throw new ApiError(500, "Not able to upload file", err.message, err.stack);
  } finally {
    if (localFilePath) {
      try {
        console.log("Attempting to delete temp file:", localFilePath);
        await fs.promises.unlink(localFilePath);
        console.log("Temp file deleted successfully");
        console.log(
          "Checking if file exists after deletion:",
          fs.existsSync(localFilePath)
        );
      } catch (err) {
        console.error("Error deleting temp file:", err.message);
      }
    }
  }
};

const deleteFromCloudinary = async (url) => {
  try {
    if (!url) return null;
    const publicId = extractPublicId(url);
    const destroyResult = await cloudinary.uploader.destroy(publicId);
    console.log("file deleted successfully from cloudinary");
    // console.log(destroyResult);
    return destroyResult;
  } catch (error) {
    throw new ApiError(
      500,
      "error in deleting file from cloudinary",
      [error.message],
      error.stack
    );
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
