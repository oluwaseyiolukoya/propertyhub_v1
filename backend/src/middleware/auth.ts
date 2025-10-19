import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    iat?: number;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = decoded;

    // Check if user's permissions have been updated since token was issued
    try {
      // Check if it's an internal admin user or a customer user
      let userRecord;
      
      // First check admins table (for Super Admin)
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id }
      });

      if (admin) {
        userRecord = admin;
      } else {
        // Check users table (for internal admin users and customer users)
        userRecord = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            updatedAt: true,
            role: true,
            permissions: true
          }
        });
      }

      if (userRecord) {
        // Check if the user record was updated after the token was issued
        const tokenIssuedAt = decoded.iat ? new Date(decoded.iat * 1000) : new Date();
        const userUpdatedAt = userRecord.updatedAt;

        // Add a grace period of 30 seconds to avoid triggering on lastLogin updates
        // during the login process itself
        const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds
        const timeSinceTokenIssued = Date.now() - tokenIssuedAt.getTime();

        if (userUpdatedAt && 
            userUpdatedAt > tokenIssuedAt && 
            timeSinceTokenIssued > GRACE_PERIOD_MS) {
          console.log('⚠️ User permissions updated. Forcing re-authentication.');
          return res.status(401).json({ 
            error: 'Your permissions have been updated. Please log in again.',
            code: 'PERMISSIONS_UPDATED'
          });
        }
      }
    } catch (dbError) {
      // If database check fails, continue with the request (fail open for availability)
      console.log('⚠️ Could not check user permissions update:', dbError);
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminOnly = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};


