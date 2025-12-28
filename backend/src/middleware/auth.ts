import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    customerId?: string | null;
    iat?: number;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔐 Auth middleware called for:', req.method, req.path);
    // Support Authorization header or token passed via query (for iframe/download use-cases)
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token && typeof req.query.token === 'string') {
      token = req.query.token as string;
    }

    if (!token) {
      console.log('❌ Auth failed: No token provided for', req.method, req.path);
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('🔑 Verifying token for:', req.method, req.path);

    // Fail fast if JWT_SECRET is not configured (security best practice)
    if (!process.env.JWT_SECRET) {
      console.error('❌ CRITICAL: JWT_SECRET environment variable is not set');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Authentication service is not properly configured'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    req.user = decoded;
    console.log('✅ Auth success:', decoded.role, decoded.email, 'accessing', req.method, req.path);

    // Check if session is revoked
    try {
      const session = await prisma.sessions.findFirst({
        where: {
          token,
          userId: decoded.id
        },
        select: {
          isActive: true,
          expiresAt: true
        }
      });

      if (session) {
        // Session exists in database - check if it's active
        if (!session.isActive) {
          console.log('❌ Session revoked for user:', decoded.email);
          return res.status(401).json({
            error: 'Your session has been revoked. Please log in again.',
            code: 'SESSION_REVOKED'
          });
        }

        // Check if session expired
        if (session.expiresAt && session.expiresAt < new Date()) {
          console.log('❌ Session expired for user:', decoded.email);
          return res.status(401).json({
            error: 'Your session has expired. Please log in again.',
            code: 'SESSION_EXPIRED'
          });
        }

        // Update last active time
        await prisma.sessions.update({
          where: { token },
          data: { lastActive: new Date() }
        }).catch(err => console.warn('Failed to update session lastActive:', err));
      }
      // If session doesn't exist, allow (for backward compatibility with old tokens)
    } catch (sessionError) {
      console.warn('⚠️ Session check failed:', sessionError);
      // Don't block request if session check fails
    }

    // Optional: feature-flagged permissions change invalidation (disabled by default)
    // We rely on /api/auth/validate-session for authoritative checks (role/status/isActive)
    if (process.env.ENABLE_PERMISSIONS_UPDATE_CHECK === 'true') {
      try {
        // Check users table (all users including internal admins are stored here)
        const userRecord = await prisma.users.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            customerId: true,
            updatedAt: true,
            role: true,
            permissions: true,
            customer_users: {
              select: {
                customerId: true,
                role: true,
                isActive: true,
              }
            }
          }
        });

        if (userRecord) {
          const isInternalAdmin = userRecord.customerId === null;
          const membership = Array.isArray((userRecord as any).customer_users) ? (userRecord as any).customer_users[0] : null;
          const isCustomerUser = !!membership || userRecord.customerId !== null;

          // Enrich req.user from membership when present
          if (membership && req.user) {
            req.user.customerId = membership.customerId;
            req.user.role = membership.role || req.user.role;
          } else if (req.user) {
            req.user.customerId = (userRecord as any).customerId ?? null;
          }

          if (isCustomerUser) {
            const tokenIssuedAt = decoded.iat ? new Date(decoded.iat * 1000) : new Date();
            const userUpdatedAt = userRecord.updatedAt;
            const GRACE_PERIOD_MS = 30 * 1000;
            const timeSinceTokenIssued = Date.now() - tokenIssuedAt.getTime();

            if (
              userUpdatedAt &&
              userUpdatedAt > tokenIssuedAt &&
              timeSinceTokenIssued > GRACE_PERIOD_MS
            ) {
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
        console.log('⚠️ Could not check user permissions update:', dbError);
      }
    }

    next();
  } catch (error: any) {
    console.log('❌ Auth failed: Invalid token for', req.method, req.path);
    console.log('❌ Token error details:', error.name, error.message);
    console.log('❌ Token value (first 20 chars):', req.headers.authorization?.substring(0, 27));
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

    // DATABASE CHECK - All users (including internal admins) are in the users table
    // Internal admins have customerId = null and admin-type roles
    let internalUser: any = null;
    try {
      internalUser = await prisma.users.findUnique({
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
    } catch (e: any) {
      console.warn('⚠️ User admin lookup skipped (users table issue or missing):', e?.message || e);
      internalUser = null;
    }

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

    // Final fallback: trust JWT role when DB is unavailable
    const roleFromToken = (req.user as any)?.role?.toLowerCase?.() || '';
    if (roleFromToken.includes('admin') || roleFromToken === 'super_admin') {
      console.log('✅ Admin access granted via token fallback role:', roleFromToken);
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


