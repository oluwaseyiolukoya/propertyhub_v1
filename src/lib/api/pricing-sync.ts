import { apiClient } from '../api-client';

/**
 * Sync pricing plans from code to database
 */
export async function syncPricingPlans() {
  try {
    const response = await apiClient.post('/api/pricing-sync/sync', {});
    return response;
  } catch (error) {
    console.error('Error syncing pricing plans:', error);
    throw error;
  }
}

/**
 * Get all pricing plans from database with modification status
 */
export async function getPricingPlansFromDB() {
  try {
    const response = await apiClient.get('/api/pricing-sync/plans');
    return response;
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    throw error;
  }
}

/**
 * Restore a plan to its canonical version from code
 */
export async function restorePlanToCanonical(planId: string) {
  try {
    const response = await apiClient.post(`/api/pricing-sync/restore/${planId}`, {});
    return response;
  } catch (error) {
    console.error('Error restoring plan:', error);
    throw error;
  }
}

/**
 * Export plan as TypeScript code
 */
export async function exportPlanToCode(planId: string) {
  try {
    const response = await apiClient.get(`/api/pricing-sync/export/${planId}`);
    return response;
  } catch (error) {
    console.error('Error exporting plan:', error);
    throw error;
  }
}

/**
 * Get comparison between database and code versions
 */
export async function getPlansComparison() {
  try {
    const response = await apiClient.get('/api/pricing-sync/comparison');
    return response;
  } catch (error) {
    console.error('Error getting comparison:', error);
    throw error;
  }
}

/**
 * Verify if database plans match code (detailed diagnostic)
 */
export async function verifyPlansSync() {
  try {
    const response = await apiClient.get('/api/pricing-sync/verify');
    return response;
  } catch (error) {
    console.error('Error verifying plans:', error);
    throw error;
  }
}

