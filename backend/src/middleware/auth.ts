import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'arenaflow_super_secret_jwt_key_2026_xyz';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'director' | 'security' | 'guest_services';
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authentication Required: No token provided.' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Authentication Required: Token format must be Bearer <token>.' });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Authentication Failed: Invalid or expired token.' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication Required: User session not found.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: `Access Denied: Role '${req.user.role}' is unauthorized for this action.` });
      return;
    }

    next();
  };
};
