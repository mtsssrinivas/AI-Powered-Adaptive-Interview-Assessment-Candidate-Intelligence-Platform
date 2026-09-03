import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthError } from '../utils/errors';
import { UserModel } from '../db/mongo/models/User.model';
import { inMemoryUserStore } from '../modules/auth/auth.service';

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AuthError('Authorization token required (Bearer <token>)'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUserPayload;

    // Verify user still exists in Mongo or in-memory fallback store
    let userExists = false;
    try {
      const doc = await UserModel.findById(decoded.id);
      if (doc) userExists = true;
    } catch {
      // ignore
    }

    if (!userExists && inMemoryUserStore.has(decoded.email)) {
      userExists = true;
    }

    if (!userExists) {
      next(new AuthError('User account no longer exists'));
      return;
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new AuthError('Authentication token has expired'));
      return;
    }
    next(new AuthError('Invalid or corrupted authentication token'));
  }
};
