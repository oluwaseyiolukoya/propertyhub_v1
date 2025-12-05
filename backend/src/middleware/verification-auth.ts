import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/verification';
import prisma from '../lib/db';

/**
 * Authenticate API key from request headers
 * Expects: X-API-Key header
 */
export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required. Please provide X-API-Key header.'
      });
    }

    // Lookup API key in database
    const keyRecord = await prisma.api_keys.findUnique({
      where: { key: apiKey },
    });

    if (!keyRecord) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    if (!keyRecord.isActive) {
      return res.status(401).json({
        success: false,
        error: 'API key is inactive'
      });
    }

    // Check expiration
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'API key has expired'
      });
    }

    // Update last used timestamp (fire and forget)
    prisma.api_keys.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    }).catch(err => console.error('Failed to update API key lastUsedAt:', err));

    // Attach API key info to request
    req.apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
      permissions: keyRecord.permissions as string[]
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Require admin permissions
 * Must be used after authenticateApiKey
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const permissions = req.apiKey.permissions || [];

  if (!permissions.includes('admin')) {
    return res.status(403).json({
      success: false,
      error: 'Admin permissions required'
    });
  }

  next();
};

/**
 * Require specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const permissions = req.apiKey.permissions || [];

    if (!permissions.includes(permission) && !permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: `Permission '${permission}' required`
      });
    }

    next();
  };
};

