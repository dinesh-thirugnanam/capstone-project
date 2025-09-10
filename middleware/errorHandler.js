const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Validation Error',
      error: errors.join(', ')
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Duplicate Field Value',
      error: `${field} already exists`
    });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Invalid ID Format',
      error: 'Invalid ID provided'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid Token',
      error: 'Token is not valid'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Token Expired',
      error: 'Token has expired'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    data: null,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Internal server error'
  });
};

module.exports = errorHandler;
