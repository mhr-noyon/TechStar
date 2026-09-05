export function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.code === "23505") {
    return res.status(409).json({ success: false, message: "Duplicate value" });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : "Internal server error",
  });
}