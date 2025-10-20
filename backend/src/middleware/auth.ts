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
            customerId: true, // Need this to check if internal admin
            updatedAt: true,
            role: true,
            permissions: true
          }
        });
      }

      if (userRecord) {
        // Only check permissions updates for CUSTOMER USERS
        // Skip check for:
        // 1. Super Admins from admins table (admin is not null)
        // 2. Internal admin users from users table (customerId is null)
        const isFromUsersTable = !admin;
        const isInternalAdmin = isFromUsersTable && userRecord.customerId === null;
        const isCustomerUser = isFromUsersTable && userRecord.customerId !== null;
        
        // Only apply permissions update check for customer users
        if (isCustomerUser) {
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
        } else if (isInternalAdmin) {
          console.log('✅ Internal admin - skipping permissions update check');
        } else {
          console.log('✅ Super admin - skipping permissions update check');
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
    
    if (!userId) {
      console.log('❌ Admin check failed: No user ID in request');
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // DATABASE CHECK ONLY - No mock/JWT fallbacks
    // Check if user is a Super Admin (from admins table)
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        role: true
      }
    });

    if (admin) {
      // Enforce active status for Super Admins
      if (admin.isActive === false) {
        console.log('❌ Admin access denied: Super Admin inactive -', admin.email);
        return res.status(403).json({ error: 'Account is inactive' });
      }
      // Super Admin has access
      console.log('✅ Admin access granted: Super Admin -', admin.email);
      return next();
    }

    // Check if user is an Internal Admin User (from users table with customerId = null)
    const internalUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        customerId: true,
        email: true,
        role: true,
        isActive: true,
        status: true
      }
    });

    if (internalUser && internalUser.customerId === null) {
      // Enforce active status for internal admin
      if (internalUser.isActive === false || (internalUser.status && internalUser.status !== 'active')) {
        console.log('❌ Admin access denied: Internal Admin inactive -', internalUser.email);
        return res.status(403).json({ error: 'Account is inactive' });
      }
      // Internal Admin User has access
      console.log('✅ Admin access granted: Internal Admin -', internalUser.email, '(Role:', internalUser.role + ')');
      return next();
    }

    // Not an admin
    console.log('❌ Admin access denied: User ID', userId, 'is not an admin');
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  } catch (error) {
    console.error('❌ Admin check error:', error);
    return res.status(500).json({ error: 'Authorization check failed. Please try again.' });
  }
};


