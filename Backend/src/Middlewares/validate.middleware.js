// Express Validation Middleware using Zod Schemas

export const validateBody = (schema) => (req, res, next) => {
  try {
    const parsedBody = schema.parse(req.body);
    req.body = parsedBody;
    next();
  } catch (error) {
    console.error("❌ Zod Validation Error (Body):", error.errors || error.issues || error);
    const errors = error.errors || error.issues || [];
    if (errors.length > 0) {
      const issue = errors[0];
      const fieldPath = issue.path.join(".");
      const errorMessage = issue.message || "Invalid input data";
      return res.status(400).json({
        success: false,
        message: fieldPath ? `Validation Error (${fieldPath}): ${errorMessage}` : `Validation Error: ${errorMessage}`,
      });
    }
    return res.status(400).json({
      success: false,
      message: "Invalid request payload format",
    });
  }
};

export const validateParams = (schema) => (req, res, next) => {
  try {
    const parsedParams = schema.parse(req.params);
    req.params = parsedParams;
    next();
  } catch (error) {
    console.error("❌ Zod Validation Error (Params):", error.errors || error.issues || error);
    const errors = error.errors || error.issues || [];
    if (errors.length > 0) {
      const issue = errors[0];
      const fieldPath = issue.path.join(".");
      const errorMessage = issue.message || "Invalid parameter format";
      return res.status(400).json({
        success: false,
        message: fieldPath ? `Validation Error (${fieldPath}): ${errorMessage}` : `Validation Error: ${errorMessage}`,
      });
    }
    return res.status(400).json({
      success: false,
      message: "Invalid URL parameter format",
    });
  }
};
