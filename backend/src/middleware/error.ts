import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error & { statusCode?: number; status?: number },
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test';

  res.status(statusCode).json({
    error: isProduction 
      ? 'An unexpected database or server error occurred.' 
      : err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack })
  });
};
