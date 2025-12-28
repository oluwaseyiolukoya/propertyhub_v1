import express, { Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireFeature } from '../middleware/feature-access.middleware';
import { calculateAnnualTax, TaxCalculationInput } from '../services/tax-calculation.service';
import prisma from '../lib/db';

const router = express.Router();

// Apply authentication and feature access to all routes
router.use(authMiddleware);
router.use(requireFeature('tax_calculator'));

/**
 * POST /api/tax/calculate
 * Calculate tax for a property
 */
router.post('/calculate', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const {
      taxYear,
      propertyId,
      rentalIncome, // Use auto-fetched rental income from payment transactions
      otherIncome,
      annualRentPaid,
      otherDeductions,
      propertySalePrice,
      propertyPurchasePrice,
      costOfImprovements,
      disposalCosts,
      isPrimaryResidence,
      propertyTaxes,
      // Stamp Duty (NTA 2025)
      stampDutyValue,
      stampDutyType,
      leaseDuration,
      // Land Use Charge (NTA 2025)
      lucState,
      lucUsageType,
      lucPaymentDate,
    } = req.body;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!taxYear) {
      return res.status(400).json({
        error: 'Tax year is required',
        message: 'Please provide a tax year for the calculation',
      });
    }

    const currentYear = new Date().getFullYear();
    if (taxYear < 2020 || taxYear > currentYear + 1) {
      return res.status(400).json({
        error: 'Invalid tax year',
        message: `Tax year must be between 2020 and ${currentYear + 1}`,
      });
    }

    // If propertyId is provided, verify it belongs to the customer
    if (propertyId) {
      const property = await prisma.properties.findFirst({
        where: {
          id: propertyId,
          customerId,
        },
      });

      if (!property) {
        return res.status(404).json({
          error: 'Property not found',
          message: 'The specified property does not exist or does not belong to you',
        });
      }
    }

    // Prepare calculation input
    const input: TaxCalculationInput = {
      customerId,
      propertyId,
      taxYear: parseInt(taxYear),
      rentalIncome: rentalIncome ? parseFloat(rentalIncome) : undefined, // Use auto-fetched rental income
      otherIncome: otherIncome ? parseFloat(otherIncome) : undefined,
      annualRentPaid: annualRentPaid ? parseFloat(annualRentPaid) : undefined,
      otherDeductions: otherDeductions ? parseFloat(otherDeductions) : undefined,
      propertySalePrice: propertySalePrice ? parseFloat(propertySalePrice) : undefined,
      propertyPurchasePrice: propertyPurchasePrice
        ? parseFloat(propertyPurchasePrice)
        : undefined,
      costOfImprovements: costOfImprovements ? parseFloat(costOfImprovements) : undefined,
      disposalCosts: disposalCosts ? parseFloat(disposalCosts) : undefined,
      isPrimaryResidence: isPrimaryResidence === true || isPrimaryResidence === 'true',
      propertyTaxes: propertyTaxes ? parseFloat(propertyTaxes) : undefined,
      // Stamp Duty (NTA 2025)
      stampDutyValue: stampDutyValue ? parseFloat(stampDutyValue) : undefined,
      stampDutyType: stampDutyType as 'lease' | 'sale' | undefined,
      leaseDuration: leaseDuration ? parseInt(leaseDuration) : undefined,
      // Land Use Charge (NTA 2025)
      lucState: lucState as string | undefined,
      lucUsageType: lucUsageType as 'owner_occupied' | 'rented_residential' | 'commercial' | undefined,
      lucPaymentDate: lucPaymentDate ? new Date(lucPaymentDate) : undefined,
    };

    // Calculate tax
    const result = await calculateAnnualTax(input);

    // Calculate capital gain if sale/purchase prices provided
    let capitalGain: number | null = null;
    if (input.propertySalePrice && input.propertyPurchasePrice) {
      const totalCost =
        (input.propertyPurchasePrice || 0) +
        (input.costOfImprovements || 0) +
        (input.disposalCosts || 0);
      capitalGain = input.propertySalePrice - totalCost;
    }

    // Save calculation to database (update if exists, create if not)
    // Note: taxBreakdown is stored in notes as JSON string (prefixed with "BREAKDOWN:") since schema doesn't have a dedicated field
    // This allows us to distinguish between breakdown data and user-entered notes
    const breakdownJson = JSON.stringify(result.breakdown);

    // Check if calculation already exists (using unique constraint fields)
    const existingCalculation = await prisma.tax_calculations.findFirst({
      where: {
        customerId,
        taxYear: input.taxYear,
        calculationType: 'annual',
        propertyId: propertyId || null,
      },
    });

    const calculationData = {
        totalRentalIncome: result.totalRentalIncome,
        otherIncome: result.otherIncome,
        totalIncome: result.totalIncome,
        rentRelief: result.rentRelief,
        otherDeductions: result.otherDeductions,
        totalDeductions: result.totalDeductions,
        taxableIncome: result.taxableIncome,
        personalIncomeTax: result.personalIncomeTax,
        capitalGainsTax: result.capitalGainsTax || 0,
        propertyTaxes: result.propertyTaxes,
        withholdingTax: result.withholdingTax,
        totalTaxLiability: result.totalTaxLiability,
        notes: `BREAKDOWN:${breakdownJson}`, // Prefix with "BREAKDOWN:" to identify it
        // Store CGT details if applicable
        propertySalePrice: input.propertySalePrice || null,
        propertyPurchasePrice: input.propertyPurchasePrice || null,
        capitalGain: capitalGain && capitalGain > 0 ? capitalGain : null,
    };

    const now = new Date();
    let calculation;
    if (existingCalculation) {
      // Update existing calculation (preserve isFinalized status if already finalized)
      // Update calculationDate to show when it was last generated
      calculation = await prisma.tax_calculations.update({
        where: { id: existingCalculation.id },
        data: {
          ...calculationData,
          calculationDate: now, // Update date to show when report was last generated
          // Don't update isFinalized if it's already finalized
          isFinalized: existingCalculation.isFinalized,
        },
      });
    } else {
      // Create new calculation
      calculation = await prisma.tax_calculations.create({
        data: {
          propertyId: propertyId || null,
          customerId,
          taxYear: input.taxYear,
          calculationType: 'annual',
          calculationDate: now, // Explicitly set generation date
          ...calculationData,
          isFinalized: false,
        },
      });
    }

    res.json({
      success: true,
      calculation: {
        id: calculation.id,
        ...result,
      },
    });
  } catch (error: any) {
    console.error('[Tax Calculate] Error:', error);
    res.status(500).json({
      error: 'Calculation failed',
      details: error.message,
    });
  }
});

/**
 * GET /api/tax/auto-fetch
 * Auto-fetch tax calculation data from financial reports
 * Fetches revenue and expenses using the same logic as financial reports
 */
router.get('/auto-fetch', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const userId = req.user?.id;
    const { taxYear, propertyId } = req.query;

    if (!customerId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    const year = taxYear ? parseInt(taxYear as string) : new Date().getFullYear();
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    // Verify property belongs to user (same logic as Expenses page)
    // Expenses page uses ownerId to find properties, so we do the same for consistency
    const userProperties = await prisma.properties.findMany({
      where: {
        ownerId: userId, // Same as Expenses page - uses ownerId
      },
      select: { id: true },
    });

    const userPropertyIds = userProperties.map((p) => p.id);

    // Verify the selected property belongs to the user
    if (!userPropertyIds.includes(propertyId as string)) {
      return res.status(404).json({
        error: 'Property not found',
        message: 'The selected property does not belong to you or does not exist'
      });
    }

    // Fetch property details with units and leases
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId as string,
        ownerId: userId, // Verify ownership using ownerId (same as Expenses page)
      },
      include: {
        units: {
          select: {
            id: true,
            monthlyRent: true,
            status: true,
            features: true,
          },
        },
        leases: {
          where: {
            status: 'active',
            // Get all active leases - we'll filter by year in code
            // This ensures we don't miss leases that span the tax year
          },
          select: {
            id: true,
            unitId: true,
            monthlyRent: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({
        error: 'Property not found',
        message: 'The selected property does not belong to you or does not exist'
      });
    }

    // Auto-fetch property purchase/sale prices
    const propertyPurchasePrice = property.purchasePrice || undefined;
    const propertySalePrice = property.currentValue || undefined;

    // ============================================
    // FETCH REVENUE - FROM ACTUAL PAYMENT TRANSACTIONS
    // ============================================
    // Use actual payments from the Payments table (same as Payments page)
    // This ensures revenue is based on when payments were actually received (cash basis accounting)
    // For tax purposes, revenue is recognized when payment is received (paidAt date)

    // Query payments for this property within the tax year
    // Only count completed/successful rent payments (not subscriptions)

    // First, check all payments for this property (for debugging)
    const allPropertyPayments = await prisma.payments.findMany({
      where: {
        propertyId: propertyId as string,
      },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        paidAt: true,
        customerId: true,
      },
      take: 10, // Limit for debugging
    });

    console.log('[Tax Auto-Fetch] All payments for property (first 10):', allPropertyPayments.length);
    allPropertyPayments.forEach((p: any, idx: number) => {
      console.log(`  Payment ${idx + 1}: amount=${p.amount}, type=${p.type}, status=${p.status}, customerId=${p.customerId}, paidAt=${p.paidAt}`);
    });
    console.log('[Tax Auto-Fetch] User customerId:', customerId);
    console.log('[Tax Auto-Fetch] Property customerId:', property.customerId);

    // Query payments for the property
    // Note: We include payments for both user's customerId and property's customerId because:
    // 1. Property ownership is already verified (lines 223-239)
    // 2. Payments might be associated with property.customerId or user's customerId
    // 3. For tax purposes, we need all payments for the property regardless of which customerId they have
    // Security is ensured by property ownership verification above
    const paymentCustomerIds = property.customerId && property.customerId !== customerId
      ? [customerId, property.customerId]
      : [customerId];

    const payments = await prisma.payments.findMany({
      where: {
        propertyId: propertyId as string,
        customerId: { in: paymentCustomerIds }, // Include payments for both customerIds if different
        type: 'rent', // Only rent payments (exclude subscriptions)
        status: { in: ['completed', 'success'] }, // Only successful payments
        paidAt: {
          gte: yearStart, // Payment date within tax year
          lte: yearEnd,
        },
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        paidAt: true,
        type: true,
        status: true,
        customerId: true, // Include for debugging
      },
    });

    // Calculate total revenue from actual payments ONLY
    // For tax purposes, we MUST use cash basis accounting - only count actual payments received
    // No fallback to unit-based calculations as they don't reflect actual payments for the selected year
    let finalAnnualRevenue = payments.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0);

    let revenueSource = payments.length > 0 ? 'payment_transactions' : 'none';

    // IMPORTANT: For tax calculations, we ONLY use actual payment transactions (cash basis)
    // We do NOT use fallback calculations from occupied units because:
    // 1. Tax accounting requires cash basis (revenue when payment is received)
    // 2. Current unit occupancy doesn't reflect historical year occupancy
    // 3. Fallback would show incorrect revenue for past/future years
    // If no payments exist for the selected year, revenue is 0 (correct for tax purposes)

    if (finalAnnualRevenue === 0) {
      console.log('[Tax Auto-Fetch] No payments found for year', year, '- returning 0 revenue (cash basis accounting).');
      console.log('[Tax Auto-Fetch] This is correct for tax purposes - revenue is only recognized when payment is received.');
      finalAnnualRevenue = 0;
      revenueSource = 'none';
    }

    // Enhanced debug logging
    console.log('========================================');
    console.log('[Tax Auto-Fetch] Property:', property.name);
    console.log('[Tax Auto-Fetch] Property ID:', property.id);
    console.log('[Tax Auto-Fetch] Year:', year);
    console.log('[Tax Auto-Fetch] Year Range:', yearStart.toISOString(), 'to', yearEnd.toISOString());
    console.log('[Tax Auto-Fetch] Revenue source:', revenueSource, '(cash basis accounting - only actual payments)');
    console.log('[Tax Auto-Fetch] Payments found:', payments.length);
    console.log('[Tax Auto-Fetch] Final annual revenue:', finalAnnualRevenue);
    console.log('[Tax Auto-Fetch] Note: Using cash basis - only payments with paidAt date in', year, 'are counted');

    // Log payment details for debugging
    if (payments.length > 0) {
      console.log('[Tax Auto-Fetch] Payment details:');
      payments.forEach((payment: any, idx: number) => {
        console.log(`  Payment ${idx + 1}: id=${payment.id}, amount=${payment.amount}, paidAt=${payment.paidAt}, status=${payment.status}, customerId=${payment.customerId}`);
      });
    } else {
      console.log('[Tax Auto-Fetch] No payments found for this property in', year);
      console.log('[Tax Auto-Fetch] Query filters:');
      console.log('  - propertyId:', propertyId);
      console.log('  - customerId filter:', paymentCustomerIds.length > 1 ? paymentCustomerIds : paymentCustomerIds[0]);
      console.log('  - type: rent');
      console.log('  - status: [completed, success]');
      console.log('  - paidAt range:', yearStart.toISOString(), 'to', yearEnd.toISOString());
      console.log('[Tax Auto-Fetch] Checking if property has units/leases for reference...');
      console.log('[Tax Auto-Fetch] Total units:', (property.units || []).length);
      console.log('[Tax Auto-Fetch] Occupied units:', (property.units || []).filter((u: any) => u.status === 'occupied').length);
      console.log('[Tax Auto-Fetch] Active leases:', (property.leases || []).length);

      // Additional diagnostic: Check all payments for this property (without year/status filters)
      const allPropertyPayments = await prisma.payments.findMany({
        where: {
          propertyId: propertyId as string,
          type: 'rent',
          customerId: { in: paymentCustomerIds },
        },
        select: {
          id: true,
          amount: true,
          paidAt: true,
          status: true,
          customerId: true,
        },
        take: 10,
        orderBy: { paidAt: 'desc' },
      });
      console.log('[Tax Auto-Fetch] All rent payments for property (last 10, any status/date):', allPropertyPayments.length);
      if (allPropertyPayments.length > 0) {
        console.log('[Tax Auto-Fetch] Sample payments (for debugging):');
        allPropertyPayments.forEach((p: any, idx: number) => {
          const paidYear = p.paidAt ? new Date(p.paidAt).getFullYear() : 'N/A';
          console.log(`  Payment ${idx + 1}: amount=${p.amount}, status=${p.status}, paidAt=${p.paidAt} (year: ${paidYear}), customerId=${p.customerId}`);
        });
      }
    }

    // ============================================
    // FETCH EXPENSES FROM EXPENSES PAGE LOGIC
    // ============================================
    // Get expenses using the EXACT same logic as the Expenses page
    // This ensures consistency - expenses shown in Tax Calculator match Expenses page
    // For tax purposes, use paidDate (when expense was paid) to determine year

    // Build where clause matching Expenses page logic exactly
    // Expenses page filters by: propertyId IN [user's property IDs]
    const expenseWhereClause: any = {
      propertyId: { in: userPropertyIds }, // Only expenses for user's properties (same as Expenses page)
      category: { not: 'Property Tax' }, // Property Tax is separate
      status: { in: ['paid', 'pending'] }, // Only paid or pending expenses (same as Expenses page)
    };

    // Additional filter: Only expenses for the selected property
    // This narrows down to the specific property selected in the calculator
    expenseWhereClause.propertyId = propertyId as string;

    const allExpenses = await prisma.expenses.findMany({
      where: expenseWhereClause,
      select: {
        id: true,
        amount: true,
        category: true,
        date: true,
        paidDate: true,
        status: true,
        propertyId: true,
      },
    });

    // Filter expenses by tax year using paidDate (or date if paidDate is null)
    // This matches financial report logic - expenses are counted when paid
    const expensesForYear = allExpenses.filter((expense) => {
      const expenseDate = expense.paidDate || expense.date;
      if (!expenseDate) return false;
      const expenseYear = new Date(expenseDate).getFullYear();
      return expenseYear === year;
    });

    // Calculate total expenses (same as financial reports)
    const propertyExpenses = expensesForYear.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );

    // Group by category for breakdown
    const categoryMap = new Map<string, number>();
    expensesForYear.forEach((exp) => {
      const category = exp.category || 'Uncategorized';
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + (exp.amount || 0));
    });

    const expenseBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Final debug logging - Expense summary
    console.log('[Tax Auto-Fetch] Total expenses found:', allExpenses.length);
    console.log('[Tax Auto-Fetch] Expenses for year:', expensesForYear.length);
    console.log('[Tax Auto-Fetch] Property expenses calculated:', propertyExpenses);
    console.log('[Tax Auto-Fetch] Expense breakdown:', expenseBreakdown);

    // Calculate final values for response
    const rentalIncome = Math.round(finalAnnualRevenue * 100) / 100;
    const otherDeductions = Math.round(propertyExpenses * 100) / 100;

    console.log('[Tax Auto-Fetch] Response - rentalIncome:', rentalIncome);
    console.log('[Tax Auto-Fetch] Response - otherDeductions:', otherDeductions);
    console.log('========================================');

    res.json({
      success: true,
      data: {
        annualRentPaid: 0, // Not used in property-specific calculations
        otherIncome: 0, // Not used in property-specific calculations
        // Revenue from financial reports (using same logic as property performance)
        rentalIncome,
        // Expenses from financial reports
        otherDeductions,
        expenseBreakdown, // Breakdown by category
        propertyPurchasePrice,
        propertySalePrice,
      },
    });
  } catch (error: any) {
    console.error('[Tax Auto-Fetch] Error:', error);
    res.status(500).json({
      error: 'Failed to auto-fetch tax data from financial reports',
      details: error.message,
    });
  }
});

/**
 * GET /api/tax/settings
 * Get tax settings for current customer
 */
router.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let settings = await prisma.tax_settings.findUnique({
      where: { customerId },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.tax_settings.create({
        data: {
          customerId,
          taxpayerType: 'individual',
          defaultTaxYear: new Date().getFullYear(),
        },
      });
    }

    res.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('[Tax Settings] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch tax settings',
      details: error.message,
    });
  }
});

/**
 * PUT /api/tax/settings
 * Update tax settings for current customer
 */
router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const { taxpayerType, taxIdentificationNumber, defaultTaxYear } = req.body;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await prisma.tax_settings.upsert({
      where: { customerId },
      update: {
        taxpayerType,
        taxIdentificationNumber,
        defaultTaxYear,
      },
      create: {
        customerId,
        taxpayerType: taxpayerType || 'individual',
        taxIdentificationNumber,
        defaultTaxYear: defaultTaxYear || new Date().getFullYear(),
      },
    });

    res.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('[Tax Settings Update] Error:', error);
    res.status(500).json({
      error: 'Failed to update tax settings',
      details: error.message,
    });
  }
});

/**
 * GET /api/tax/history
 * Get tax calculation history
 */
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const { limit = 50, offset = 0, propertyId, taxYear } = req.query;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const where: any = { customerId };
    if (propertyId) {
      where.propertyId = propertyId;
    }
    if (taxYear) {
      where.taxYear = parseInt(taxYear as string);
    }

    const [calculations, total] = await Promise.all([
      prisma.tax_calculations.findMany({
        where,
        orderBy: { calculationDate: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          properties: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.tax_calculations.count({ where }),
    ]);

    res.json({
      success: true,
      calculations: calculations.map((calc) => ({
        id: calc.id,
        propertyId: calc.propertyId,
        propertyName: calc.properties?.name,
        taxYear: calc.taxYear,
        totalRentalIncome: calc.totalRentalIncome,
        totalExpenses: calc.otherDeductions,
        taxableIncome: calc.taxableIncome,
        totalTaxLiability: calc.totalTaxLiability,
        status: calc.isFinalized ? 'finalized' : 'draft',
        isFinalized: calc.isFinalized,
        calculationDate: calc.calculationDate, // Use calculationDate for consistency
        createdAt: calc.calculationDate, // Keep createdAt for backward compatibility
        finalizedAt: calc.finalizedAt,
        properties: calc.properties, // Include full properties object
      })),
      total,
    });
  } catch (error: any) {
    console.error('[Tax History] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch tax history',
      details: error.message,
    });
  }
});

/**
 * GET /api/tax/calculations/:id
 * Get a specific tax calculation
 */
router.get('/calculations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const { id } = req.params;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const calculation = await prisma.tax_calculations.findFirst({
      where: {
        id,
        customerId,
      },
      include: {
        properties: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!calculation) {
      return res.status(404).json({ error: 'Calculation not found' });
    }

    // Parse taxBreakdown from notes (stored as JSON string with "BREAKDOWN:" prefix)
    let taxBreakdown: any = null;
    let userNotes: string | null = calculation.notes;

    if (calculation.notes && calculation.notes.startsWith('BREAKDOWN:')) {
      try {
        const breakdownStr = calculation.notes.replace('BREAKDOWN:', '');
        taxBreakdown = JSON.parse(breakdownStr);
        userNotes = null; // No user notes if breakdown is stored
      } catch (e) {
        // If parsing fails, treat entire notes as user notes
        taxBreakdown = null;
        userNotes = calculation.notes;
      }
    }

    // Extract stamp duty and land use charge from taxBreakdown if available
    const stampDuty = taxBreakdown?.taxBreakdown?.stampDuty || 0;
    const landUseCharge = taxBreakdown?.taxBreakdown?.landUseCharge || 0;

    res.json({
      success: true,
      calculation: {
        id: calculation.id,
        propertyId: calculation.propertyId,
        propertyName: calculation.properties?.name,
        taxYear: calculation.taxYear,
        totalRentalIncome: calculation.totalRentalIncome,
        otherIncome: calculation.otherIncome,
        totalIncome: calculation.totalIncome,
        rentRelief: calculation.rentRelief,
        otherDeductions: calculation.otherDeductions,
        totalDeductions: calculation.totalDeductions,
        taxableIncome: calculation.taxableIncome,
        personalIncomeTax: calculation.personalIncomeTax,
        capitalGainsTax: calculation.capitalGainsTax,
        propertyTaxes: calculation.propertyTaxes,
        stampDuty, // NTA 2025
        landUseCharge, // NTA 2025
        withholdingTax: calculation.withholdingTax,
        totalTaxLiability: calculation.totalTaxLiability,
        taxBreakdown: taxBreakdown, // Parsed from notes
        status: calculation.isFinalized ? 'finalized' : 'draft',
        isFinalized: calculation.isFinalized,
        notes: userNotes, // User-entered notes (separate from breakdown)
        calculationDate: calculation.calculationDate, // Date when report was generated
        createdAt: calculation.calculationDate, // Keep for backward compatibility
        finalizedAt: calculation.finalizedAt,
      },
    });
  } catch (error: any) {
    console.error('[Tax Calculation Get] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch calculation',
      details: error.message,
    });
  }
});

/**
 * POST /api/tax/calculations/:id/finalize
 * Finalize a tax calculation
 */
router.post('/calculations/:id/finalize', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const { id } = req.params;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const calculation = await prisma.tax_calculations.updateMany({
      where: {
        id,
        customerId,
      },
      data: {
        isFinalized: true,
        finalizedAt: new Date(),
      },
    });

    if (calculation.count === 0) {
      return res.status(404).json({ error: 'Calculation not found' });
    }

    res.json({
      success: true,
      message: 'Calculation finalized successfully',
    });
  } catch (error: any) {
    console.error('[Tax Calculation Finalize] Error:', error);
    res.status(500).json({
      error: 'Failed to finalize calculation',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/tax/calculations/:id
 * Delete a tax calculation
 */
router.delete('/calculations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    const { id } = req.params;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const calculation = await prisma.tax_calculations.deleteMany({
      where: {
        id,
        customerId,
      },
    });

    if (calculation.count === 0) {
      return res.status(404).json({ error: 'Calculation not found' });
    }

    res.json({
      success: true,
      message: 'Calculation deleted successfully',
    });
  } catch (error: any) {
    console.error('[Tax Calculation Delete] Error:', error);
    res.status(500).json({
      error: 'Failed to delete calculation',
      details: error.message,
    });
  }
});

export default router;
