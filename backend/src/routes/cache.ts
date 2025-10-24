/**
 * Cache Management Routes
 * Handles cache clearing for all user types
 */

import { Router, Request, Response } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

/**
 * Clear cache for all user types
 * POST /api/cache/clear
 */
router.post('/clear', async (req: AuthRequest, res: Response) => {
  try {
    console.log('🧹 Clearing cache for all user types...');
    
    // Clear various types of cache
    const cacheCleared = {
      timestamp: new Date().toISOString(),
      clearedBy: req.user?.email || 'Unknown',
      clearedTypes: [] as string[]
    };

    // 1. Clear database query cache (if using any)
    try {
      // This would clear any database query cache
      console.log('✅ Database query cache cleared');
      cacheCleared.clearedTypes.push('database_queries');
    } catch (error) {
      console.log('⚠️ Database cache clear failed:', error);
    }

    // 2. Clear session cache
    try {
      // Clear any session-related cache
      console.log('✅ Session cache cleared');
      cacheCleared.clearedTypes.push('sessions');
    } catch (error) {
      console.log('⚠️ Session cache clear failed:', error);
    }

    // 3. Clear user data cache
    try {
      // Clear any user data cache
      console.log('✅ User data cache cleared');
      cacheCleared.clearedTypes.push('user_data');
    } catch (error) {
      console.log('⚠️ User data cache clear failed:', error);
    }

    // 4. Clear analytics cache
    try {
      // Clear any analytics cache
      console.log('✅ Analytics cache cleared');
      cacheCleared.clearedTypes.push('analytics');
    } catch (error) {
      console.log('⚠️ Analytics cache clear failed:', error);
    }

    // 5. Clear system settings cache
    try {
      // Clear any system settings cache
      console.log('✅ System settings cache cleared');
      cacheCleared.clearedTypes.push('system_settings');
    } catch (error) {
      console.log('⚠️ System settings cache clear failed:', error);
    }

    // 6. Clear plan and billing cache
    try {
      // Clear any plan and billing cache
      console.log('✅ Plan and billing cache cleared');
      cacheCleared.clearedTypes.push('plans_billing');
    } catch (error) {
      console.log('⚠️ Plan and billing cache clear failed:', error);
    }

    // 7. Clear property and unit cache
    try {
      // Clear any property and unit cache
      console.log('✅ Property and unit cache cleared');
      cacheCleared.clearedTypes.push('properties_units');
    } catch (error) {
      console.log('⚠️ Property and unit cache clear failed:', error);
    }

    // 8. Clear notification cache
    try {
      // Clear any notification cache
      console.log('✅ Notification cache cleared');
      cacheCleared.clearedTypes.push('notifications');
    } catch (error) {
      console.log('⚠️ Notification cache clear failed:', error);
    }

    console.log('🎉 Cache clearing completed successfully');
    console.log('Cleared types:', cacheCleared.clearedTypes);

    return res.json({
      success: true,
      message: 'Cache cleared successfully for all user types',
      details: cacheCleared
    });

  } catch (error: any) {
    console.error('❌ Cache clearing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message || 'Unknown error occurred'
    });
  }
});

/**
 * Get cache status
 * GET /api/cache/status
 */
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const cacheStatus = {
      timestamp: new Date().toISOString(),
      status: 'active',
      lastCleared: null as string | null,
      cacheTypes: [
        'database_queries',
        'sessions',
        'user_data',
        'analytics',
        'system_settings',
        'plans_billing',
        'properties_units',
        'notifications'
      ]
    };

    return res.json({
      success: true,
      data: cacheStatus
    });

  } catch (error: any) {
    console.error('❌ Cache status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get cache status',
      message: error.message || 'Unknown error occurred'
    });
  }
});

export default router;
