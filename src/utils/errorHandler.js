import ApiError from "./ApiError.utils.js";

const errorHandler = (err, _, res, next) => {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  //basic response
  const response = {
    message: isApiError ? err.message : "Internal Server Error",
    errors: isApiError ? err.errors : [],
    success: false,
    data: null,
  };

  if ((process.env.NODE_ENV = "devlopment")) {
    response.debug = {
      stack: err.stack,
      type: err.name || "UnkownError",
      rawError: isApiError ? undefined : err,
    };
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
