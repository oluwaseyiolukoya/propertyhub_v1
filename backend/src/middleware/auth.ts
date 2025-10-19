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
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // First, check if this is a mock/dev admin based on role in JWT
    // (for development/testing before database is fully set up)
    if (userRole === 'super_admin' || userRole === 'admin') {
      return next();
    }

    // Then check database for actual admins
    try {
      // Check if user is a Super Admin (from admins table)
      const admin = await prisma.admin.findUnique({
        where: { id: userId }
      });

      if (admin) {
        // Super Admin has access
        return next();
      }

      // Check if user is an Internal Admin User (from users table with customerId = null)
      const internalUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { customerId: true }
      });

      if (internalUser && internalUser.customerId === null) {
        // Internal Admin User has access
        return next();
      }
    } catch (dbError) {
      // If database check fails, rely on JWT role (fail open for availability)
      console.log('⚠️ Database check failed in adminOnly, relying on JWT role');
      if (userRole === 'super_admin' || userRole === 'admin') {
        return next();
      }
    }

    // Not an admin
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
};


