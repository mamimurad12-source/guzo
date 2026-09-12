import type { NextFunction, Request, Response } from 'express';

import { verifyAccessToken } from '../lib/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email?: string | null;
    phone?: string;
  };
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const token = authorization.replace('Bearer ', '').trim();
    const claims = verifyAccessToken(token);

    req.user = {
      userId: claims.userId,
      role: claims.role,
      email: claims.email,
      phone: claims.phone,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(roles: string | string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
