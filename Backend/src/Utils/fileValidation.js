import fs from "fs";

// Allowed MIME types whitelist for safe image uploads
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Validates uploaded file type, size, and presence
 * @param {Object} file - Express-fileupload file object
 * @param {Object} options - { maxSizeMB: number }
 * @returns {Object} - { valid: boolean, message?: string }
 */
export const validateImageFile = (file, options = {}) => {
  if (!file) {
    return { valid: false, message: "No file provided" };
  }

  const maxSizeMB = options.maxSizeMB || 5;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // 1. Strict MIME type check against whitelist
  if (!file.mimetype || !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    return {
      valid: false,
      message: `Invalid file type (${file.mimetype || "unknown"}). Only JPEG, PNG, WEBP, and GIF images are allowed.`,
    };
  }

  // 2. Strict file size check
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      message: `File size (${(file.size / (1024 * 1024)).toFixed(
        2
      )} MB) exceeds maximum allowed limit of ${maxSizeMB} MB.`,
    };
  }

  return { valid: true };
};

/**
 * Safely removes temporary upload file from disk
 * @param {Object} file - Express-fileupload file object
 */
export const cleanupTempFile = async (file) => {
  if (file && file.tempFilePath) {
    try {
      if (fs.existsSync(file.tempFilePath)) {
        await fs.promises.unlink(file.tempFilePath);
      }
    } catch (err) {
      console.warn("Failed to clean up temp upload file:", err.message);
    }
  }
};
