/**
 * Session Validator - Active Session Validation on User Interaction
 *
 * This validates the user's token against the database whenever they interact
 * with the page. If their role/permissions changed, they're immediately logged out.
 * If KYC verification is required, user is redirected to KYC page.
 *
 * Best Practice: Combines with Socket.io real-time notifications for 100% coverage
 */

import { apiClient } from './api-client';

interface ValidationResponse {
  valid: boolean;
  reason?: string;
  forceLogout?: boolean;
  requiresKyc?: boolean;
  kycStatus?: string | null;
}

let isValidating = false;
let lastValidationTime = 0;
const VALIDATION_COOLDOWN = 2000; // Only validate once every 2 seconds to avoid spam

/**
 * Validate current user session against database
 * Returns true if session is valid, false if user should be logged out
 */
export const validateSession = async (): Promise<ValidationResponse> => {
  try {
    // Don't validate too frequently
    const now = Date.now();
    if (now - lastValidationTime < VALIDATION_COOLDOWN) {
      return { valid: true };
    }

    // Don't run multiple validations simultaneously
    if (isValidating) {
      return { valid: true };
    }

    isValidating = true;
    lastValidationTime = now;

    // Suppress global 401 auto-redirect so we can handle it gracefully here
    const { data, error } = await apiClient.get<ValidationResponse>(
      '/api/auth/validate-session',
      undefined,
      { suppressAuthRedirect: true }
    );

    isValidating = false;

    if (error) {
      // Only force logout on 401 (unauthorized). Treat 403 (forbidden) as blocked action, not invalid session.
      if (error.statusCode === 401) {
        return {
          valid: false,
          reason: error.error || 'Session expired',
          forceLogout: true
        };
      }
      console.error('Session validation error (response):', error);
      return { valid: true };
    }

    // Default to valid if no data
    return data || { valid: true };
  } catch (error: any) {
    isValidating = false;

    // If we get 401 or 403, session is invalid
    if (error.status === 401) {
      return {
        valid: false,
        reason: error.message || 'Session expired',
        forceLogout: true
      };
    }

    // Network errors or other issues - don't force logout
    console.error('Session validation error:', error);
    return { valid: true }; // Fail open to avoid disrupting user
  }
};

/**
 * Setup click listener to validate session on any user interaction
 */
export const setupActiveSessionValidation = (
  onInvalidSession: (reason: string) => void,
  onRequiresKyc?: () => void
) => {
  // Validate on any click
  const handleClick = async () => {
    const result = await validateSession();

    if (!result.valid && result.forceLogout) {
      console.log('🔐 Session invalid - forcing logout:', result.reason);
      onInvalidSession(result.reason || 'Your account settings have changed');
      return;
    }

    // Check if KYC is required
    if (result.requiresKyc && onRequiresKyc) {
      console.log('🔐 KYC verification required - redirecting to verification page. Status:', result.kycStatus);
      onRequiresKyc();
    }
  };

  // Add event listener
  document.addEventListener('click', handleClick, true); // Use capture phase

  // Return cleanup function
  return () => {
    document.removeEventListener('click', handleClick, true);
  };
};

/**
 * Manually trigger session validation (for programmatic checks)
 */
export const checkSessionValidity = async (
  onInvalidSession: (reason: string) => void,
  onRequiresKyc?: () => void
) => {
  const result = await validateSession();

  if (!result.valid && result.forceLogout) {
    console.log('🔐 Session invalid - forcing logout:', result.reason);
    onInvalidSession(result.reason || 'Your account settings have changed');
    return false;
  }

  // Check if KYC is required
  if (result.requiresKyc && onRequiresKyc) {
    console.log('🔐 KYC verification required - redirecting to verification page. Status:', result.kycStatus);
    onRequiresKyc();
    return false;
  }

  return result.valid;
};

