import { v2 as cloudinary } from "cloudinary";
import { cleanupTempFile } from "./fileValidation.js";

const ImageUploadCloudinary = async (file, folder, height, quality) => {
  const options = {
    folder,
    resource_type: "image", // Force non-executable image resource type
  };

  if (height) {
    options.height = height;
  }
  if (quality) {
    options.quality = quality;
  }

  try {
    return await cloudinary.uploader.upload(file.tempFilePath, options);
  } catch (error) {
    console.error("Cloudinary upload error:", error.stack || error);
    throw new Error("Failed to upload media file. Please try again.");
  } finally {
    // Automatically delete temp file from server disk
    await cleanupTempFile(file);
  }
};

export { ImageUploadCloudinary };
