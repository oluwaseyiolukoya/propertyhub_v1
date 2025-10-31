/**
 * Session Manager - Simple session management
 * 
 * Since we're using localStorage, sessions naturally persist across page refreshes.
 * This manager provides a simple interface for session management.
 */

import { removeAuthToken } from './api-client';
import { safeStorage } from './safeStorage';

class SessionManager {
  private static instance: SessionManager;
  private isClearing = false;

  private constructor() {
    // No complex event listeners needed - localStorage handles persistence
    console.log('🔐 Session manager initialized - sessions will persist across page refreshes');
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Clear session data
   */
  private clearSession(): void {
    if (this.isClearing) return;
    
    this.isClearing = true;
    try {
      removeAuthToken();
      console.log('🔐 Session cleared - user will need to log in again');
    } catch (error) {
      console.error('Error clearing session:', error);
    } finally {
      this.isClearing = false;
    }
  }

  /**
   * Manually clear session (for logout)
   */
  public clearSessionManually(): void {
    this.clearSession();
  }

  /**
   * Check if session exists
   */
  public hasSession(): boolean {
    return !!safeStorage.getItem('auth_token');
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Export for manual session management
export const clearSessionOnBrowserClose = () => {
  sessionManager.clearSessionManually();
};
