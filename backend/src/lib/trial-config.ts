/**
 * Trial Configuration Helper
 * Centralized trial duration management using Trial plan
 */

import prisma from './db';

/**
 * Get trial duration from Trial plan
 * Falls back to 14 days if Trial plan not found or not configured
 */
export async function getTrialDuration(): Promise<number> {
  try {
    // Find Trial plan (monthlyPrice = 0)
    const trialPlan = await prisma.plans.findFirst({
      where: { monthlyPrice: 0 },
      select: { trialDurationDays: true }
    });

    if (trialPlan && trialPlan.trialDurationDays) {
      console.log(`[Trial Config] Using trial duration from plan: ${trialPlan.trialDurationDays} days`);
      return trialPlan.trialDurationDays;
    }

    // Fallback to default
    console.log('[Trial Config] Trial plan not found or not configured, using default: 14 days');
    return 14;
  } catch (error) {
    console.error('[Trial Config] Error fetching trial duration:', error);
    // Fallback to default on error
    return 14;
  }
}

/**
 * Calculate trial end date from now
 */
export async function calculateTrialEndDate(): Promise<Date> {
  const durationDays = await getTrialDuration();
  return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
}

/**
 * Calculate trial end date from a specific start date
 */
export async function calculateTrialEndDateFrom(startDate: Date): Promise<Date> {
  const durationDays = await getTrialDuration();
  return new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
}

