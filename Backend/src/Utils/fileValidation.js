import fs from "fs";

// Allowed MIME types whitelist for safe image uploads
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif"
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

  // 2. Strict file extension check
  const ext = file.name ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      message: `Invalid image file extension (${ext || "none"}). Only .jpg, .jpeg, .png, .webp, and .gif are allowed.`,
    };
  }

  // 3. Strict file size check
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

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
]);

const ALLOWED_VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".mov",
  ".avi"
]);

const ALLOWED_DOC_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

const ALLOWED_DOC_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
  ".zip"
]);

export const validateVideoFile = (file, options = {}) => {
  if (!file) return { valid: false, message: "No video provided" };
  const maxSizeMB = options.maxSizeMB || 50;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!file.mimetype || !ALLOWED_VIDEO_TYPES.has(file.mimetype.toLowerCase())) {
    return {
      valid: false,
      message: `Invalid video type (${file.mimetype || "unknown"}). Allowed formats: MP4, WebM, MOV, AVI.`,
    };
  }

  const ext = file.name ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  if (!ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      message: `Invalid video file extension (${ext || "none"}). Allowed extensions: .mp4, .webm, .mov, .avi`,
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      message: `Video size exceeds ${maxSizeMB} MB limit.`,
    };
  }

  return { valid: true };
};

export const validateDocumentFile = (file, options = {}) => {
  if (!file) return { valid: false, message: "No document provided" };
  const maxSizeMB = options.maxSizeMB || 25;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!file.mimetype || !ALLOWED_DOC_TYPES.has(file.mimetype.toLowerCase())) {
    return {
      valid: false,
      message: `Invalid document type (${file.mimetype || "unknown"}). Allowed formats: PDF, Word, Excel, TXT, ZIP.`,
    };
  }

  const ext = file.name ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  if (!ALLOWED_DOC_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      message: `Invalid document file extension (${ext || "none"}). Allowed extensions: .pdf, .doc, .docx, .xls, .xlsx, .txt, .zip`,
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      message: `Document size exceeds ${maxSizeMB} MB limit.`,
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

