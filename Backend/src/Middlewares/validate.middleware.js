// Express Validation Middleware using Zod Schemas

export const validateBody = (schema) => (req, res, next) => {
  try {
    const parsedBody = schema.parse(req.body);
    req.body = parsedBody;
    next();
  } catch (error) {
    if (error.errors && error.errors.length > 0) {
      const issue = error.errors[0];
      const errorMessage = issue.message || "Invalid input data";
      return res.status(400).json({
        success: false,
        message: `Validation Error: ${errorMessage}`,
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
    if (error.errors && error.errors.length > 0) {
      const issue = error.errors[0];
      const errorMessage = issue.message || "Invalid parameter format";
      return res.status(400).json({
        success: false,
        message: `Validation Error: ${errorMessage}`,
      });
    }
    return res.status(400).json({
      success: false,
      message: "Invalid URL parameter format",
    });
  }
};
