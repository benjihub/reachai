/**
 * Global error handler middleware
 */
export const errorHandler = (err, c) => {
  console.error('Error:', err);

  return c.json({
    success: false,
    error: err.message || 'Internal server error'
  }, 500);
};
