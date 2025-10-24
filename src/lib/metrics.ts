export type ChurnWindow = {
  start: Date;
  end: Date;
};

export type CustomerLike = {
  id: string;
  status?: string;
  createdAt: string | Date;
  subscriptionStartDate?: string | Date | null;
  updatedAt?: string | Date;
  cancelledAt?: string | Date | null;
  mrr?: number | null;
};

// Returns customers that are considered "active" at a point in time
const isActiveAt = (c: CustomerLike, at: Date): boolean => {
  const status = (c.status || '').toLowerCase();
  if (status === 'active' || status === 'trial') return true;
  // If we have timestamps, use them conservatively
  const start = c.subscriptionStartDate ? new Date(c.subscriptionStartDate) : new Date(c.createdAt);
  const cancelled = c.cancelledAt ? new Date(c.cancelledAt) : undefined;
  if (start > at) return false;
  if (cancelled && cancelled <= at) return false;
  return true;
};

export function computeCustomerChurn(customers: CustomerLike[], window: ChurnWindow): { rate: number | null; lost: number; startCount: number } {
  if (!customers || customers.length === 0) return { rate: null, lost: 0, startCount: 0 };
  const startCount = customers.filter(c => isActiveAt(c, window.start)).length;
  if (startCount === 0) return { rate: null, lost: 0, startCount: 0 };

  // Lost if they were active at start but not active at end
  const lost = customers.filter(c => isActiveAt(c, window.start) && !isActiveAt(c, window.end)).length;
  const rate = Math.round((lost / startCount) * 1000) / 10; // one decimal
  return { rate, lost, startCount };
}

export function computeMRRChurn(customers: CustomerLike[], window: ChurnWindow): { rate: number | null; lostMRR: number; startMRR: number } {
  if (!customers || customers.length === 0) return { rate: null, lostMRR: 0, startMRR: 0 };

  const mrrAt = (at: Date) => customers
    .filter(c => isActiveAt(c, at))
    .reduce((sum, c) => sum + (c.mrr || 0), 0);

  const startMRR = mrrAt(window.start);
  const endMRR = mrrAt(window.end);
  if (startMRR <= 0) return { rate: null, lostMRR: 0, startMRR: 0 };

  const lostMRR = Math.max(startMRR - endMRR, 0);
  const rate = Math.round((lostMRR / startMRR) * 1000) / 10; // one decimal
  return { rate, lostMRR, startMRR };
}

export function lastNDaysWindow(days: number): ChurnWindow {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end };
}


