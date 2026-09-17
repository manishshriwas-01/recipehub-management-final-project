const errorMiddleware = (err, req, res, next) => {
  console.error("========== API ERROR ==========");
console.error("Method:", req.method);
console.error("URL:", req.originalUrl);
console.error("Error name:", err.name);
console.error("Error message:", err.message);
console.error("Error code:", err.code);
console.error("Error stack:", err.stack);
console.error("================================");

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid recipe ID",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export default errorMiddleware;