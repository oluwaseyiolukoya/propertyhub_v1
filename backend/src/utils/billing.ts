/**
 * Billing utility functions
 */

/**
 * Calculate the next payment date based on subscription start date and billing cycle
 *
 * For new subscriptions: next payment is exactly 1 month/1 year from start date
 * For renewals: next payment is 1 month/1 year from the current payment date
 *
 * @param subscriptionStartDate - The date when subscription started (or last payment date for renewals)
 * @param billingCycle - 'monthly' or 'annual'/'yearly'
 * @param currentNextPaymentDate - Optional existing next payment date (ignored if in the past)
 * @param isNewSubscription - If true, calculates from start date. If false, calculates from now (renewal)
 */
export function calculateNextPaymentDate(
  subscriptionStartDate: Date | null | undefined,
  billingCycle: string,
  currentNextPaymentDate?: Date | null,
  isNewSubscription: boolean = false
): Date | null {
  if (!subscriptionStartDate) {
    return null;
  }

  const now = new Date();
  const startDate = new Date(subscriptionStartDate);

  // For new subscriptions, always calculate from the start date
  // For renewals, calculate from the start date (which should be updated to payment date)
  let nextPayment = new Date(startDate);

  if (billingCycle === 'monthly') {
    // Add exactly 1 month from the start date
    nextPayment.setMonth(nextPayment.getMonth() + 1);

    // If the calculated date is in the past (shouldn't happen for new subscriptions),
    // keep adding months until it's in the future
    while (nextPayment <= now && !isNewSubscription) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
  } else if (billingCycle === 'annual' || billingCycle === 'yearly') {
    // Add exactly 1 year from the start date
    nextPayment.setFullYear(nextPayment.getFullYear() + 1);

    // If the calculated date is in the past (shouldn't happen for new subscriptions),
    // keep adding years until it's in the future
    while (nextPayment <= now && !isNewSubscription) {
      nextPayment.setFullYear(nextPayment.getFullYear() + 1);
    }
  } else {
    // Default to monthly if cycle is unknown
    nextPayment.setMonth(nextPayment.getMonth() + 1);
    while (nextPayment <= now && !isNewSubscription) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
  }

  return nextPayment;
}

/**
 * Get days until next payment
 */
export function getDaysUntilPayment(nextPaymentDate: Date | null): number | null {
  if (!nextPaymentDate) {
    return null;
  }

  const now = new Date();
  const next = new Date(nextPaymentDate);
  const diffTime = next.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format next payment date for display
 */
export function formatNextPaymentDate(nextPaymentDate: Date | null): string {
  if (!nextPaymentDate) {
    return 'N/A';
  }

  const daysUntil = getDaysUntilPayment(nextPaymentDate);
  const date = new Date(nextPaymentDate);
  const formatted = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (daysUntil === null) {
    return formatted;
  }

  if (daysUntil < 0) {
    return `${formatted} (Overdue)`;
  } else if (daysUntil === 0) {
    return `${formatted} (Today)`;
  } else if (daysUntil === 1) {
    return `${formatted} (Tomorrow)`;
  } else if (daysUntil <= 7) {
    return `${formatted} (${daysUntil} days)`;
  } else {
    return formatted;
  }
}

/**
 * Update next payment date for all active customers
 * This can be run as a cron job
 */
export async function updateAllNextPaymentDates(prisma: any) {
  try {
    const customers = await prisma.customers.findMany({
      where: {
        status: {
          in: ['active', 'trial'],
        },
        subscriptionStartDate: {
          not: null,
        },
      },
      select: {
        id: true,
        subscriptionStartDate: true,
        billingCycle: true,
        nextPaymentDate: true,
      },
    });

    console.log(`📅 Updating next payment dates for ${customers.length} customers...`);

    let updated = 0;
    for (const customer of customers) {
      const nextPaymentDate = calculateNextPaymentDate(
        customer.subscriptionStartDate,
        customer.billingCycle,
        customer.nextPaymentDate
      );

      if (nextPaymentDate) {
        await prisma.customers.update({
          where: { id: customer.id },
          data: { nextPaymentDate },
        });
        updated++;
      }
    }

    console.log(`✅ Updated ${updated} customer next payment dates`);
    return { updated, total: customers.length };
  } catch (error) {
    console.error('❌ Error updating next payment dates:', error);
    throw error;
  }
}

