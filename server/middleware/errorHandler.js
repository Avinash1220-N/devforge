/**
 * Centralized Express Error Handling Middleware.
 * Formats errors into a unified JSON format:
 * { success: false, message: "Error text" }
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err.message || err);

  const statusCode = err.status || res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred',
    // Expose error stacks only during local development checks
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
