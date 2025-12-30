import prisma from '../lib/db';

// ============================================
// Types & Interfaces
// ============================================

export interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  netCashFlow: number;
  inflowBreakdown: {
    clientPayments: number;
    loans: number;
    equity: number;
    grants: number;
    other: number;
  };
  outflowBreakdown: {
    labor: number;
    materials: number;
    equipment: number;
    permits: number;
    professionalFees: number;
    contingency: number;
    other: number;
  };
}

export interface Period {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly';

// ============================================
// Helper Functions
// ============================================

/**
 * Generate time periods based on start/end dates and period type
 */
export function generatePeriods(
  startDate: Date,
  endDate: Date,
  periodType: PeriodType = 'monthly'
): Period[] {
  const periods: Period[] = [];

  // For monthly periods, always start from the first day of the month
  let current: Date;
  if (periodType === 'monthly') {
    current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    current.setHours(0, 0, 0, 0);
  } else {
    current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
  }

  while (current <= endDate) {
    let periodStart: Date;
    let periodEnd: Date;
    let key: string;
    let label: string;

    switch (periodType) {
      case 'daily':
        periodStart = new Date(current);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(current);
        periodEnd.setHours(23, 59, 59, 999);
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        current.setDate(current.getDate() + 1);
        break;

      case 'weekly':
        periodStart = new Date(current);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(current);
        periodEnd.setDate(periodEnd.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        key = `${current.getFullYear()}-W${getWeekNumber(current)}`;
        label = `Week ${getWeekNumber(current)}`;
        current.setDate(current.getDate() + 7);
        break;

      case 'monthly':
        // Set period start to first day of current month
        periodStart = new Date(current.getFullYear(), current.getMonth(), 1);
        periodStart.setHours(0, 0, 0, 0);

        // Set period end to last day of current month
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        periodEnd.setHours(23, 59, 59, 999);

        // If period end is beyond endDate, cap it
        if (periodEnd > endDate) {
          periodEnd = new Date(endDate);
        }

        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        label = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        // Move to first day of next month for next iteration
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        current.setHours(0, 0, 0, 0);
        break;

      case 'quarterly':
        periodStart = new Date(current);
        periodStart.setHours(0, 0, 0, 0);
        const quarter = Math.floor(current.getMonth() / 3);
        periodEnd = new Date(current.getFullYear(), (quarter + 1) * 3, 0);
        periodEnd.setHours(23, 59, 59, 999);
        key = `${current.getFullYear()}-Q${quarter + 1}`;
        label = `Q${quarter + 1} ${current.getFullYear()}`;
        current.setMonth((quarter + 1) * 3);
        break;

      default:
        throw new Error(`Invalid period type: ${periodType}`);
    }

    if (periodEnd > endDate) {
      periodEnd = new Date(endDate);
    }

    // Only add period if it overlaps with the date range
    if (periodStart <= endDate && periodEnd >= startDate) {
      periods.push({ key, label, start: periodStart, end: periodEnd });
    }

    // Break if we've passed the end date
    if (periodEnd >= endDate) break;
  }

  return periods;
}

/**
 * Get week number of the year
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get period key for a given date
 */
export function getPeriodKey(date: Date | null, periodType: PeriodType): string {
  if (!date) return '';

  const d = new Date(date);

  switch (periodType) {
    case 'daily':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    case 'weekly':
      return `${d.getFullYear()}-W${getWeekNumber(d)}`;

    case 'monthly':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    case 'quarterly':
      const quarter = Math.floor(d.getMonth() / 3);
      return `${d.getFullYear()}-Q${quarter + 1}`;

    default:
      return '';
  }
}

// ============================================
// Main Cash Flow Calculation
// ============================================

/**
 * Calculate real cash flow from actual funding and expenses
 */
export async function calculateProjectCashFlow(
  projectId: string,
  startDate: Date,
  endDate: Date,
  periodType: PeriodType = 'monthly'
): Promise<CashFlowData[]> {
  console.log(`📊 Calculating cash flow for project ${projectId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  try {
    // 1. Fetch funding (inflow) - only received funding
    // First, get all received funding for the project to see what we have
    const allReceivedFunding = await prisma.project_funding.findMany({
      where: {
        projectId,
        status: 'received'
      },
      select: {
        id: true,
        amount: true,
        receivedDate: true,
        expectedDate: true,
        createdAt: true,
        fundingType: true
      }
    });

    console.log(`💰 Total received funding records: ${allReceivedFunding.length}`);
    if (allReceivedFunding.length > 0) {
      console.log(`📋 Funding details:`, allReceivedFunding.map(f => ({
        id: f.id,
        amount: f.amount,
        receivedDate: f.receivedDate,
        expectedDate: f.expectedDate,
        createdAt: f.createdAt
      })));
    }

    // Filter funding that falls within the date range
    // Use receivedDate if available, otherwise fallback to expectedDate or createdAt
    const funding = allReceivedFunding.filter(fund => {
      const dateToUse = fund.receivedDate || fund.expectedDate || fund.createdAt;
      if (!dateToUse) {
        console.log(`⚠️ Funding ${fund.id} has no date (receivedDate: ${fund.receivedDate}, expectedDate: ${fund.expectedDate}, createdAt: ${fund.createdAt})`);
        return false;
      }
      const date = new Date(dateToUse);
      // Normalize dates to start of day for comparison
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      const isInRange = normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
      if (!isInRange) {
        console.log(`⚠️ Funding ${fund.id} (amount: ${fund.amount}) date ${normalizedDate.toISOString()} is outside range ${normalizedStart.toISOString()} to ${normalizedEnd.toISOString()}`);
      }
      return isInRange;
    });

    console.log(`📊 Funding within date range (${startDate.toISOString()} to ${endDate.toISOString()}): ${funding.length}`);
    if (funding.length > 0) {
      console.log(`✅ Funding to include:`, funding.map(f => ({
        id: f.id,
        amount: f.amount,
        date: f.receivedDate || f.expectedDate || f.createdAt
      })));
    } else if (allReceivedFunding.length > 0) {
      console.log(`❌ No funding in date range! All received funding dates:`, allReceivedFunding.map(f => ({
        id: f.id,
        amount: f.amount,
        receivedDate: f.receivedDate,
        expectedDate: f.expectedDate,
        createdAt: f.createdAt
      })));
    }

    // 2. Fetch expenses (outflow) - only paid expenses
    const expenses = await prisma.project_expenses.findMany({
      where: {
        projectId,
        paymentStatus: 'paid',
        paidDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { paidDate: 'asc' }
    });

    console.log(`💸 Found ${expenses.length} expense records`);

    // 3. Initialize periods
    const periods = generatePeriods(startDate, endDate, periodType);
    const cashFlowMap = new Map<string, CashFlowData>();
    const periodMap = new Map<string, Period>(); // Store period details for lookup

    periods.forEach(period => {
      cashFlowMap.set(period.key, {
        month: period.label,
        inflow: 0,
        outflow: 0,
        netCashFlow: 0,
        inflowBreakdown: {
          clientPayments: 0,
          loans: 0,
          equity: 0,
          grants: 0,
          other: 0
        },
        outflowBreakdown: {
          labor: 0,
          materials: 0,
          equipment: 0,
          permits: 0,
          professionalFees: 0,
          contingency: 0,
          other: 0
        }
      });
      periodMap.set(period.key, period); // Store period for lookup
    });

    console.log(`📅 Generated ${periods.length} periods:`, periods.map(p => `${p.key} (${p.label})`));

    // 4. Aggregate funding by period
    console.log(`🔄 Aggregating ${funding.length} funding records into periods...`);
    console.log(`📅 Available period keys:`, Array.from(cashFlowMap.keys()));

    funding.forEach(fund => {
      // Use receivedDate if available, otherwise fallback to expectedDate or createdAt
      const dateToUse = fund.receivedDate || fund.expectedDate || fund.createdAt;
      if (!dateToUse) {
        console.warn(`⚠️ Funding ${fund.id} has no date, skipping`);
        return; // Skip if no date available
      }

      const periodKey = getPeriodKey(dateToUse, periodType);
      const data = cashFlowMap.get(periodKey);

      if (data) {
        console.log(`✅ Adding funding ${fund.id} (amount: ${fund.amount}) to period ${periodKey} (${data.month})`);
        data.inflow += fund.amount;

        // Breakdown by funding type
        const fundingType = (fund.fundingType || '').toLowerCase();
        if (fundingType.includes('client') || fundingType.includes('payment')) {
          data.inflowBreakdown.clientPayments += fund.amount;
        } else if (fundingType.includes('loan') || fundingType.includes('bank')) {
          data.inflowBreakdown.loans += fund.amount;
        } else if (fundingType.includes('equity') || fundingType.includes('investment')) {
          data.inflowBreakdown.equity += fund.amount;
        } else if (fundingType.includes('grant')) {
          data.inflowBreakdown.grants += fund.amount;
        } else {
          data.inflowBreakdown.other += fund.amount;
        }
      } else {
        // Period key doesn't match - this shouldn't happen if date filtering is correct
        // But let's try to find the closest period or add to the first/last period
        console.warn(`⚠️ Funding ${fund.id} (amount: ${fund.amount}, date: ${dateToUse.toISOString()}) period key ${periodKey} not found in cashFlowMap`);
        console.warn(`   Available periods: ${Array.from(cashFlowMap.keys()).join(', ')}`);

        // Try to find the closest period by finding the period that contains this date
        let added = false;
        for (const [key, periodData] of cashFlowMap.entries()) {
          const period = periodMap.get(key);
          if (period && dateToUse >= period.start && dateToUse <= period.end) {
            console.log(`   ✅ Found matching period ${key} for date ${dateToUse.toISOString()}`);
            periodData.inflow += fund.amount;

            // Breakdown by funding type
            const fundingType = (fund.fundingType || '').toLowerCase();
            if (fundingType.includes('client') || fundingType.includes('payment')) {
              periodData.inflowBreakdown.clientPayments += fund.amount;
            } else if (fundingType.includes('loan') || fundingType.includes('bank')) {
              periodData.inflowBreakdown.loans += fund.amount;
            } else if (fundingType.includes('equity') || fundingType.includes('investment')) {
              periodData.inflowBreakdown.equity += fund.amount;
            } else if (fundingType.includes('grant')) {
              periodData.inflowBreakdown.grants += fund.amount;
            } else {
              periodData.inflowBreakdown.other += fund.amount;
            }

            added = true;
            break;
          }
        }

        if (!added) {
          // Last resort: add to the period that's closest to the date
          const sortedPeriods = Array.from(periodMap.values()).sort((a, b) => {
            const diffA = Math.abs(dateToUse.getTime() - a.start.getTime());
            const diffB = Math.abs(dateToUse.getTime() - b.start.getTime());
            return diffA - diffB;
          });
          if (sortedPeriods.length > 0) {
            const closestPeriod = sortedPeriods[0];
            const closestData = cashFlowMap.get(closestPeriod.key);
            if (closestData) {
              console.log(`   ⚠️ Adding to closest period ${closestPeriod.key} (${closestPeriod.label})`);
              closestData.inflow += fund.amount;

              // Breakdown by funding type
              const fundingType = (fund.fundingType || '').toLowerCase();
              if (fundingType.includes('client') || fundingType.includes('payment')) {
                closestData.inflowBreakdown.clientPayments += fund.amount;
              } else if (fundingType.includes('loan') || fundingType.includes('bank')) {
                closestData.inflowBreakdown.loans += fund.amount;
              } else if (fundingType.includes('equity') || fundingType.includes('investment')) {
                closestData.inflowBreakdown.equity += fund.amount;
              } else if (fundingType.includes('grant')) {
                closestData.inflowBreakdown.grants += fund.amount;
              } else {
                closestData.inflowBreakdown.other += fund.amount;
              }
            }
          }
        }
      }
    });

    // 5. Aggregate expenses by period
    expenses.forEach(expense => {
      const periodKey = getPeriodKey(expense.paidDate, periodType);
      const data = cashFlowMap.get(periodKey);

      if (data) {
        data.outflow += expense.totalAmount;

        // Breakdown by category
        const category = expense.category.toLowerCase();
        if (category.includes('labor') || category.includes('payroll')) {
          data.outflowBreakdown.labor += expense.totalAmount;
        } else if (category.includes('material')) {
          data.outflowBreakdown.materials += expense.totalAmount;
        } else if (category.includes('equipment')) {
          data.outflowBreakdown.equipment += expense.totalAmount;
        } else if (category.includes('permit') || category.includes('license')) {
          data.outflowBreakdown.permits += expense.totalAmount;
        } else if (category.includes('professional') || category.includes('fee') || category.includes('consultant')) {
          data.outflowBreakdown.professionalFees += expense.totalAmount;
        } else if (category.includes('contingency')) {
          data.outflowBreakdown.contingency += expense.totalAmount;
        } else {
          data.outflowBreakdown.other += expense.totalAmount;
        }
      }
    });

    // 6. Calculate net cash flow for all periods
    // Ensure we return ALL periods in order, even if they have no data
    const result = periods.map(period => {
      const data = cashFlowMap.get(period.key);
      if (data) {
        data.netCashFlow = data.inflow - data.outflow;
        return data;
      } else {
        // Return period with zero values if no data exists
        return {
          month: period.label,
          inflow: 0,
          outflow: 0,
          netCashFlow: 0,
          inflowBreakdown: {
            clientPayments: 0,
            loans: 0,
            equity: 0,
            grants: 0,
            other: 0
          },
          outflowBreakdown: {
            labor: 0,
            materials: 0,
            equipment: 0,
            permits: 0,
            professionalFees: 0,
            contingency: 0,
            other: 0
          }
        };
      }
    });

    console.log(`✅ Calculated cash flow for ${result.length} periods`);
    console.log(`📊 Periods in result:`, result.map(r => `${r.month} (inflow: ${r.inflow}, outflow: ${r.outflow})`));

    return result;

  } catch (error: any) {
    console.error('❌ Cash flow calculation error:', error);
    throw new Error(`Failed to calculate cash flow: ${error.message}`);
  }
}

// ============================================
// Snapshot Management
// ============================================

/**
 * Save or update a cash flow snapshot for faster future queries
 */
export async function saveCashFlowSnapshot(
  projectId: string,
  periodType: PeriodType,
  periodStart: Date,
  periodEnd: Date,
  cashFlowData: CashFlowData
): Promise<void> {
  try {
    await prisma.project_cash_flow_snapshots.upsert({
      where: {
        projectId_periodType_periodStart: {
          projectId,
          periodType,
          periodStart
        }
      },
      create: {
        projectId,
        periodType,
        periodStart,
        periodEnd,
        totalInflow: cashFlowData.inflow,
        totalOutflow: cashFlowData.outflow,
        netCashFlow: cashFlowData.netCashFlow,
        inflowByType: cashFlowData.inflowBreakdown,
        outflowByCategory: cashFlowData.outflowBreakdown,
        calculatedAt: new Date()
      },
      update: {
        totalInflow: cashFlowData.inflow,
        totalOutflow: cashFlowData.outflow,
        netCashFlow: cashFlowData.netCashFlow,
        inflowByType: cashFlowData.inflowBreakdown,
        outflowByCategory: cashFlowData.outflowBreakdown,
        calculatedAt: new Date()
      }
    });

    console.log(`✅ Saved snapshot for project ${projectId}, period ${periodType}, start ${periodStart.toISOString()}`);
  } catch (error: any) {
    console.error('❌ Failed to save snapshot:', error);
    throw error;
  }
}

/**
 * Save monthly snapshot for a specific month
 */
export async function saveMonthlySnapshot(
  projectId: string,
  year: number,
  month: number
): Promise<void> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  console.log(`📊 Saving monthly snapshot for project ${projectId}, ${year}-${month}`);

  const cashFlow = await calculateProjectCashFlow(
    projectId,
    startDate,
    endDate,
    'monthly'
  );

  if (cashFlow.length > 0) {
    await saveCashFlowSnapshot(
      projectId,
      'monthly',
      startDate,
      endDate,
      cashFlow[0]
    );
  }
}

/**
 * Get cash flow from snapshots (fast)
 */
export async function getCashFlowFromSnapshots(
  projectId: string,
  startDate: Date,
  endDate: Date,
  periodType: PeriodType = 'monthly'
): Promise<CashFlowData[]> {
  const snapshots = await prisma.project_cash_flow_snapshots.findMany({
    where: {
      projectId,
      periodType,
      periodStart: { gte: startDate },
      periodEnd: { lte: endDate }
    },
    orderBy: { periodStart: 'asc' }
  });

  return snapshots.map(snapshot => ({
    month: snapshot.periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    inflow: snapshot.totalInflow,
    outflow: snapshot.totalOutflow,
    netCashFlow: snapshot.netCashFlow,
    inflowBreakdown: (snapshot.inflowByType as any) || {
      clientPayments: 0,
      loans: 0,
      equity: 0,
      grants: 0,
      other: 0
    },
    outflowBreakdown: (snapshot.outflowByCategory as any) || {
      labor: 0,
      materials: 0,
      equipment: 0,
      permits: 0,
      professionalFees: 0,
      contingency: 0,
      other: 0
    }
  }));
}

/**
 * Calculate cumulative cash flow
 */
export async function calculateCumulativeCashFlow(
  projectId: string,
  startDate: Date,
  endDate: Date,
  periodType: PeriodType = 'monthly'
): Promise<CashFlowData[]> {
  const cashFlow = await calculateProjectCashFlow(projectId, startDate, endDate, periodType);

  let cumulativeInflow = 0;
  let cumulativeOutflow = 0;

  return cashFlow.map(data => {
    cumulativeInflow += data.inflow;
    cumulativeOutflow += data.outflow;

    return {
      ...data,
      netCashFlow: cumulativeInflow - cumulativeOutflow
    };
  });
}

// ============================================
// Backward Compatibility (for existing code)
// ============================================

/**
 * Legacy function that uses project_invoices (for backward compatibility)
 * This is the old implementation that will be deprecated
 */
export function calculateMonthlyCashFlowLegacy(invoices: any[], projectStartDate: Date | null): CashFlowData[] {
  const monthlyData: { [key: string]: { inflow: number; outflow: number } } = {};

  // Get last 6 months from today or project start date
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 5); // Last 6 months

  // If project started recently, use project start date
  if (projectStartDate && new Date(projectStartDate) > startDate) {
    startDate.setTime(new Date(projectStartDate).getTime());
  }

  // Initialize months
  const months = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' });
    months.push({ key: monthKey, name: monthName });
    monthlyData[monthKey] = { inflow: 0, outflow: 0 };
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Process invoices
  invoices.forEach(invoice => {
    const invoiceDate = invoice.paidDate || invoice.dueDate || invoice.createdAt;
    if (!invoiceDate) return;

    const date = new Date(invoiceDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (monthlyData[monthKey]) {
      // All invoices are outflow (payments to vendors)
      if (invoice.status === 'paid') {
        monthlyData[monthKey].outflow += invoice.amount;
      }

      // For demo purposes, simulate inflow as 120% of outflow
      if (invoice.status === 'paid' || invoice.status === 'approved') {
        monthlyData[monthKey].inflow += invoice.amount * 1.2;
      }
    }
  });

  // Convert to array format for charts
  return months.map(month => ({
    month: month.name,
    inflow: Math.round(monthlyData[month.key].inflow),
    outflow: Math.round(monthlyData[month.key].outflow),
    netCashFlow: Math.round(monthlyData[month.key].inflow - monthlyData[month.key].outflow),
    inflowBreakdown: {
      clientPayments: Math.round(monthlyData[month.key].inflow * 0.8),
      loans: Math.round(monthlyData[month.key].inflow * 0.2),
      equity: 0,
      grants: 0,
      other: 0
    },
    outflowBreakdown: {
      labor: Math.round(monthlyData[month.key].outflow * 0.4),
      materials: Math.round(monthlyData[month.key].outflow * 0.3),
      equipment: Math.round(monthlyData[month.key].outflow * 0.2),
      permits: Math.round(monthlyData[month.key].outflow * 0.05),
      professionalFees: Math.round(monthlyData[month.key].outflow * 0.05),
      contingency: 0,
      other: 0
    }
  }));
}












