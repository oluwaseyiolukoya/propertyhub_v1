import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Async handler wrapper that catches errors and forwards them to Express error handling
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 * Place this at the end of middleware chain
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[ErrorHandler]', err.message);
  console.error(err.stack);

  // Check if response has already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
};

