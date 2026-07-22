// Centralized Express Error Handling Middleware to prevent Information Leakage

export const errorHandler = (err, req, res, next) => {
  // Log full error details & stack trace on backend console for debugging
  console.error("🔥 [Unhandled Server Error]:", err.stack || err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  return res.status(statusCode).json({
    success: false,
    message: "An unexpected internal error occurred. Please try again later.",
  });
};
