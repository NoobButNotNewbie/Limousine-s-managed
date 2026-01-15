function errorHandler(err, req, res, _next) {
  if (err.code && err.httpStatus) {
    return res.status(err.httpStatus).json({
      error: err.code,
      message: err.message,
    });
  }

  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR' });
}

module.exports = errorHandler;