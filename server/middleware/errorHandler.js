// Not Found Middleware
const notFound = (req, res, next) => {
  res.status(404);
  res.json({ message: `Not Found - ${req.originalUrl}` });
};

// General Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
