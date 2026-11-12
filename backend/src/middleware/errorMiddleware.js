// Central error handler. Controllers call next(error) and end up here.
// Known PostgreSQL error codes are turned into clear 4xx responses.
const PG_ERRORS = {
  "23505": { status: 409, message: "A record with this value already exists" }, // unique_violation
  "23503": { status: 409, message: "This record is referenced by other data" }, // foreign_key_violation
  "23514": { status: 400, message: "Value violates a database rule" },          // check_violation
  "22P02": { status: 400, message: "Invalid input format" },                    // e.g. /products/abc
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const pgError = PG_ERRORS[err.code];

  if (pgError) {
    return res.status(pgError.status).json({
      success: false,
      message: pgError.message,
    });
  }

  // Malformed JSON body sent by the client
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON in request body",
    });
  }

  const statusCode = err.statusCode || err.status || 500;

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    // Don't leak internal error details to clients in production.
    message:
      statusCode >= 500 && process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
