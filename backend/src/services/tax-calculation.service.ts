/**
 * Tax Calculation Service
 * Implements Nigeria Tax Act (NTA) 2025 calculations
 * Effective January 1, 2026
 *
 * Features:
 * - Progressive Personal Income Tax (PIT) - 6 brackets, exempt up to ₦800,000
 * - Capital Gains Tax (CGT) - with primary residence exemption
 * - Stamp Duty - for lease and sale agreements
 * - Land Use Charge (LUC) - state-specific property tax
 * - Property-specific tax calculations using financial reports data
 */

import prisma from '../lib/db';

// Progressive tax brackets for NTA 2025 (Nigeria Tax Act 2025)
// Effective January 1, 2026
const TAX_BRACKETS = [
  { min: 0, max: 800000, rate: 0 },              // First ₦800,000 - 0% (Tax-Free)
  { min: 800001, max: 3000000, rate: 0.15 },     // Next ₦2,200,000 - 15%
  { min: 3000001, max: 12000000, rate: 0.18 },   // Next ₦9,000,000 - 18%
  { min: 12000001, max: 25000000, rate: 0.21 },  // Next ₦13,000,000 - 21%
  { min: 25000001, max: 50000000, rate: 0.23 },  // Next ₦25,000,000 - 23%
  { min: 50000001, max: Infinity, rate: 0.25 },  // Above ₦50,000,000 - 25%
];

export interface TaxCalculationInput {
  customerId: string;
  propertyId?: string; // Required for property-specific calculations
  taxYear: number;
  rentalIncome?: number; // Auto-fetched from payment transactions (cash basis) - preferred over lease calculation
  otherIncome?: number; // Not used in property-specific calculations
  annualRentPaid?: number; // Not used in property-specific calculations
  otherDeductions?: number; // Property expenses
  propertySalePrice?: number; // For CGT calculation
  propertyPurchasePrice?: number; // For CGT calculation
  costOfImprovements?: number; // For CGT calculation (optional)
  disposalCosts?: number; // For CGT calculation (optional)
  isPrimaryResidence?: boolean; // For CGT exemption
  propertyTaxes?: number; // Land Use Charge, etc.
}

export interface TaxCalculationResult {
  totalRentalIncome: number;
  otherIncome: number;
  totalIncome: number;
  rentRelief: number;
  otherDeductions: number;
  totalDeductions: number;
  taxableIncome: number;
  personalIncomeTax: number;
  capitalGainsTax: number;
  propertyTaxes: number;
  stampDuty: number; // NTA 2025
  landUseCharge: number; // NTA 2025
  withholdingTax: number;
  totalTaxLiability: number;
  breakdown: {
    incomeBreakdown: {
      rentalIncome: number;
      otherIncome: number;
    };
    deductionBreakdown: {
      rentRelief: number;
      otherDeductions: number;
    };
    taxBreakdown: {
      personalIncomeTax: number;
      capitalGainsTax: number;
      propertyTaxes: number;
      stampDuty: number; // NTA 2025
      landUseCharge: number; // NTA 2025
      withholdingTax: number;
    };
    taxBrackets: Array<{
      bracket: string;
      income: number;
      rate: number;
      tax: number;
    }>;
  };
}

/**
 * Calculate Stamp Duty (NTA 2025)
 * Calculates duty required to legalize lease and sale agreements
 */
export function calculateStampDuty(
  value: number,
  agreementType: 'lease' | 'sale',
  leaseDuration?: number
): number {
  // Exemption: < ₦10 million
  if (value < 10000000) {
    return 0;
  }

  if (agreementType === 'sale') {
    // Sales Agreements: Flat rate of 0.78% of total property value
    return Math.round(value * 0.0078 * 100) / 100;
  }

  // Lease Agreements
  const totalLeaseValue = value * (leaseDuration || 1);

  if (leaseDuration && leaseDuration < 7) {
    // Short-term (< 7 years): 0.78% of total lease value
    return Math.round(totalLeaseValue * 0.0078 * 100) / 100;
  } else if (leaseDuration && leaseDuration >= 8 && leaseDuration <= 21) {
    // Long-term (8–21 years): 3% of total lease value
    return Math.round(totalLeaseValue * 0.03 * 100) / 100;
  }

  // Default to short-term rate if duration not specified
  return Math.round(totalLeaseValue * 0.0078 * 100) / 100;
}

/**
 * Calculate Land Use Charge (NTA 2025)
 * State-specific property tax with early payment discount
 */
export function calculateLandUseCharge(
  propertyValue: number,
  usageType: 'owner_occupied' | 'rented_residential' | 'commercial',
  state: string,
  paymentDate?: Date
): number {
  // State-specific rates (example: Lagos 2025)
  const rates: Record<string, Record<string, number>> = {
    lagos: {
      owner_occupied: 0.00076,      // 0.076%
      rented_residential: 0.0076,   // 0.76%
      commercial: 0.0076,            // 0.76%
    },
    // Add other states as needed
    // Default to Lagos rates if state not found
  };

  const stateRates = rates[state.toLowerCase()] || rates.lagos;
  const rate = stateRates[usageType] || 0.0076; // Default to 0.76%

  // LUC Owed = Property Market Value × Applicable Rate
  let lucOwed = propertyValue * rate;

  // Early payment discount: 15% if paid within first 30 days of fiscal year
  if (paymentDate) {
    const fiscalYearStart = new Date(paymentDate.getFullYear(), 0, 1);
    const daysDiff = Math.floor(
      (paymentDate.getTime() - fiscalYearStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 30) {
      lucOwed = lucOwed * 0.85; // 15% discount
    }
  }

  return Math.round(lucOwed * 100) / 100;
}

/**
 * Calculate progressive personal income tax
 * Applies NTA 2025 tax brackets (6 brackets)
 * Effective January 1, 2026
 */
export function calculateProgressiveTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  let totalTax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of TAX_BRACKETS) {
    if (remainingIncome <= 0) break;

    const bracketMin = bracket.min;
    const bracketMax = bracket.max === Infinity ? remainingIncome + bracketMin : bracket.max;
    const bracketSize = bracketMax - bracketMin + 1;

    const incomeInBracket = Math.min(remainingIncome, bracketSize);

    if (incomeInBracket > 0) {
      totalTax += incomeInBracket * bracket.rate;
      remainingIncome -= incomeInBracket;
    }
  }

  return Math.round(totalTax * 100) / 100; // Round to 2 decimal places
}

/**
 * Get tax bracket breakdown for visualization
 */
export function getTaxBracketBreakdown(taxableIncome: number): Array<{
  bracket: string;
  income: number;
  rate: number;
  tax: number;
}> {
  if (taxableIncome <= 0) return [];

  const breakdown: Array<{ bracket: string; income: number; rate: number; tax: number }> = [];
  let remainingIncome = taxableIncome;

  for (const bracket of TAX_BRACKETS) {
    if (remainingIncome <= 0) break;

    const bracketMin = bracket.min;
    const bracketMax = bracket.max === Infinity ? remainingIncome + bracketMin : bracket.max;
    const bracketSize = bracketMax - bracketMin + 1;

    const incomeInBracket = Math.min(remainingIncome, bracketSize);

    if (incomeInBracket > 0) {
      const tax = incomeInBracket * bracket.rate;
      breakdown.push({
        bracket: bracket.max === Infinity
          ? `Above ₦${bracketMin.toLocaleString()}`
          : `₦${bracketMin.toLocaleString()} - ₦${bracketMax.toLocaleString()}`,
        income: incomeInBracket,
        rate: bracket.rate * 100,
        tax: Math.round(tax * 100) / 100,
      });
      remainingIncome -= incomeInBracket;
    }
  }

  return breakdown;
}

/**
 * Calculate Capital Gains Tax
 * For individuals: aligned with progressive rates (15-25%)
 * For companies: 30%
 */
export function calculateCapitalGainsTax(
  capitalGain: number,
  taxpayerType: 'individual' | 'company' = 'individual',
  isPrimaryResidence: boolean = false
): number {
  if (capitalGain <= 0) return 0;

  // Primary residence exemption (NTA 2025)
  if (isPrimaryResidence) {
    return 0;
  }

  if (taxpayerType === 'company') {
    return Math.round(capitalGain * 0.30 * 100) / 100; // 30% for companies (NTA 2025)
  }

  // For individuals, use progressive PIT rates (NTA 2025)
  return calculateProgressiveTax(capitalGain);
}

/**
 * Calculate rental income from active leases
 * Handles both monthly and annual rent frequencies
 */
export async function calculateRentalIncome(
  customerId: string,
  propertyId: string | undefined,
  taxYear: number
): Promise<number> {
  const yearStart = new Date(taxYear, 0, 1);
  const yearEnd = new Date(taxYear, 11, 31, 23, 59, 59);

  // Build where clause
  const where: any = {
    properties: {
      customerId,
      ...(propertyId ? { id: propertyId } : {}),
    },
    status: 'active',
    OR: [
      // Lease spans the entire year
      {
        AND: [
          { startDate: { lte: yearEnd } },
          { OR: [{ endDate: null }, { endDate: { gte: yearStart } }] },
        ],
      },
    ],
  };

  const leases = await prisma.leases.findMany({
    where,
    include: {
      properties: {
        select: {
          id: true,
          features: true,
        },
      },
    },
  });

  let totalAnnualIncome = 0;

  for (const lease of leases) {
    // Get rent frequency from property features
    let propertyFeatures = lease.properties.features;
    if (typeof propertyFeatures === 'string') {
      try {
        propertyFeatures = JSON.parse(propertyFeatures);
      } catch {
        propertyFeatures = {};
      }
    }

    const rentFrequency =
      (propertyFeatures as any)?.nigeria?.rentFrequency ||
      (propertyFeatures as any)?.rentFrequency ||
      'monthly';

    const monthlyRent = lease.monthlyRent || 0;

    // Calculate income for the tax year
    const leaseStart = new Date(lease.startDate);
    const leaseEnd = lease.endDate ? new Date(lease.endDate) : yearEnd;

    const effectiveStart = leaseStart > yearStart ? leaseStart : yearStart;
    const effectiveEnd = leaseEnd < yearEnd ? leaseEnd : yearEnd;

    if (effectiveStart <= effectiveEnd) {
      if (rentFrequency === 'annual' || rentFrequency === 'yearly') {
        // Annual rent - calculate proportion of year
        const daysInYear = 365;
        const daysActive = Math.ceil(
          (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        const proportion = daysActive / daysInYear;
        totalAnnualIncome += monthlyRent * proportion; // monthlyRent is actually annual rent
      } else {
        // Monthly rent - calculate number of months
        const monthsActive = Math.ceil(
          (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        totalAnnualIncome += monthlyRent * monthsActive;
      }
    }
  }

  return Math.round(totalAnnualIncome * 100) / 100;
}

/**
 * Calculate property taxes (Land Use Charge, Stamp Duty, etc.)
 */
export async function calculatePropertyTaxes(
  propertyId: string,
  taxYear: number
): Promise<number> {
  // Get property expenses categorized as "Property Tax"
  // For tax purposes, use paidDate (when expense was paid) to determine the tax year
  const allPropertyTaxExpenses = await prisma.expenses.findMany({
    where: {
      propertyId,
      category: 'Property Tax',
      status: { in: ['paid', 'pending'] },
    },
    select: {
      amount: true,
      date: true,
      paidDate: true,
    },
  });

  // Filter by tax year using paidDate (or date if paidDate is null)
  const propertyTaxesForYear = allPropertyTaxExpenses.filter((expense) => {
    const expenseDate = expense.paidDate || expense.date;
    if (!expenseDate) return false;
    const expenseYear = new Date(expenseDate).getFullYear();
    return expenseYear === taxYear;
  });

  const totalPropertyTaxes = propertyTaxesForYear.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );

  return Math.round(totalPropertyTaxes * 100) / 100;
}

/**
 * Main tax calculation function
 */
export async function calculateAnnualTax(
  input: TaxCalculationInput
): Promise<TaxCalculationResult> {
  // 1. Use provided rental income (from payment transactions - cash basis) if available
  // Otherwise, calculate from active leases (accrual basis) as fallback
  let rentalIncome: number;
  if (input.rentalIncome !== undefined && input.rentalIncome !== null) {
    // Use auto-fetched rental income from payment transactions (preferred - cash basis)
    rentalIncome = input.rentalIncome;
    console.log('[Tax Calculation] Using provided rental income (cash basis):', rentalIncome);
  } else {
    // Fallback: Calculate from active leases (accrual basis)
    rentalIncome = await calculateRentalIncome(
      input.customerId,
      input.propertyId,
      input.taxYear
    );
    console.log('[Tax Calculation] Calculated rental income from leases (accrual basis):', rentalIncome);
  }

  // 2. Calculate total income (property-specific only)
  // Note: We focus on property income only, not personal income
  const totalIncome = rentalIncome;

  // 3. Calculate total deductions (property expenses only)
  const propertyExpenses = input.otherDeductions || 0;
  const totalDeductions = propertyExpenses;

  // 4. Calculate taxable income (Rental Income - Property Expenses)
  const taxableIncome = Math.max(0, totalIncome - totalDeductions);

  // 6. Apply progressive tax rates
  const personalIncomeTax = calculateProgressiveTax(taxableIncome);

  // 7. Calculate withholding tax (10% on rental income)
  const withholdingTax = Math.round(rentalIncome * 0.10 * 100) / 100;

  // 8. Calculate property taxes from expenses (if property-specific)
  const propertyTaxes = input.propertyId
    ? await calculatePropertyTaxes(input.propertyId, input.taxYear)
    : input.propertyTaxes || 0;

  // 9. Calculate Capital Gains Tax (if applicable)
  // NTA 2025: Total Allowable Costs = Purchase Price + Improvements + Disposal Costs
  let capitalGainsTax = 0;
  let capitalGain = 0;
  if (input.propertySalePrice && input.propertyPurchasePrice) {
    // Total Allowable Costs = Purchase Price + Improvements + Disposal Costs
    const totalAllowableCosts =
      input.propertyPurchasePrice +
      (input.costOfImprovements || 0) +
      (input.disposalCosts || 0);

    // Chargeable Gain = Sales Proceeds - Total Allowable Costs
    capitalGain = input.propertySalePrice - totalAllowableCosts;

    if (capitalGain > 0) {
      // Get taxpayer type and property type from settings
      const taxSettings = await prisma.tax_settings.findUnique({
        where: { customerId: input.customerId },
      });
      const taxpayerType = (taxSettings?.taxpayerType as 'individual' | 'company') || 'individual';

      // Check if property is primary residence (exempt from CGT)
      const isPrimaryResidence = input.isPrimaryResidence || false;

      capitalGainsTax = calculateCapitalGainsTax(
        capitalGain,
        taxpayerType,
        isPrimaryResidence
      );
    }
  }

  // 10. Calculate Stamp Duty (NTA 2025) - if applicable
  let stampDuty = 0;
  if (input.stampDutyValue && input.stampDutyType) {
    stampDuty = calculateStampDuty(
      input.stampDutyValue,
      input.stampDutyType,
      input.leaseDuration
    );
  }

  // 11. Calculate Land Use Charge (NTA 2025) - if applicable
  let landUseCharge = 0;
  if (input.propertyId && input.lucState && input.lucUsageType) {
    const property = await prisma.properties.findFirst({
      where: { id: input.propertyId },
      select: { currentValue: true },
    });

    if (property?.currentValue) {
      landUseCharge = calculateLandUseCharge(
        property.currentValue,
        input.lucUsageType,
        input.lucState,
        input.lucPaymentDate
      );
    }
  }

  // 12. Total tax liability (NTA 2025)
  const totalTaxLiability =
    personalIncomeTax +
    capitalGainsTax +
    propertyTaxes +
    stampDuty +
    landUseCharge +
    withholdingTax;

  // 13. Get tax bracket breakdown
  const taxBrackets = getTaxBracketBreakdown(taxableIncome);

  return {
    totalRentalIncome: rentalIncome,
    otherIncome: 0, // Not used in property-specific calculations
    totalIncome,
    rentRelief: 0, // Not used in property-specific calculations
    otherDeductions: propertyExpenses,
    totalDeductions,
    taxableIncome,
    personalIncomeTax,
    capitalGainsTax,
    propertyTaxes,
    stampDuty, // NTA 2025
    landUseCharge, // NTA 2025
    withholdingTax,
    totalTaxLiability: Math.round(totalTaxLiability * 100) / 100,
    breakdown: {
      incomeBreakdown: {
        rentalIncome,
        otherIncome: 0,
      },
      deductionBreakdown: {
        rentRelief: 0,
        otherDeductions: propertyExpenses,
      },
      taxBreakdown: {
        personalIncomeTax,
        capitalGainsTax,
        propertyTaxes,
        stampDuty, // NTA 2025
        landUseCharge, // NTA 2025
        withholdingTax,
      },
      taxBrackets,
    },
  };
}

