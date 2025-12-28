/**
 * Tax Calculation API
 * Implements Nigeria Tax Reform 2026 calculations
 */

import { apiClient } from '../api-client';

export interface TaxSettings {
  id: string;
  customerId: string;
  taxpayerType: 'individual' | 'company';
  taxIdentificationNumber?: string;
  annualRentPaid?: number;
  rentReliefAmount?: number;
  otherIncomeSources?: any;
  landUseChargeRate?: number;
  stampDutyRate?: number;
  defaultTaxYear: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxCalculation {
  id: string;
  propertyId?: string;
  customerId: string;
  taxYear: number;
  calculationType: string;
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
  withholdingTax: number;
  totalTaxLiability: number;
  propertySalePrice?: number;
  propertyPurchasePrice?: number;
  capitalGain?: number;
  calculationDate: string;
  notes?: string;
  isFinalized: boolean;
  finalizedAt?: string;
  properties?: {
    id: string;
    name: string;
    address?: string;
  };
}

export interface TaxCalculationInput {
  propertyId?: string;
  taxYear: number;
  // Property-specific fields only (no personal income/rent relief)
  rentalIncome?: number; // Auto-fetched rental income from payment transactions (cash basis)
  otherDeductions?: number; // Property expenses
  propertySalePrice?: number; // For CGT calculation
  propertyPurchasePrice?: number; // For CGT calculation
  costOfImprovements?: number; // NTA 2025 - CGT
  disposalCosts?: number; // NTA 2025 - CGT
  isPrimaryResidence?: boolean; // NTA 2025 - CGT exemption
  propertyTaxes?: number; // Property taxes from expenses
  // Stamp Duty (NTA 2025)
  stampDutyValue?: number;
  stampDutyType?: 'lease' | 'sale';
  leaseDuration?: number;
  // Land Use Charge (NTA 2025)
  lucState?: string;
  lucUsageType?: 'owner_occupied' | 'rented_residential' | 'commercial';
  lucPaymentDate?: string;
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

export interface TaxCalculationResponse {
  success: boolean;
  calculation: {
    id: string;
  } & TaxCalculationResult;
}

export interface TaxHistoryResponse {
  calculations: TaxCalculation[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Calculate tax for a property or portfolio
 */
export const calculateTax = async (
  input: TaxCalculationInput
): Promise<TaxCalculationResponse> => {
  return apiClient.post<TaxCalculationResponse>('/api/tax/calculate', input);
};

/**
 * Get tax settings for current customer
 */
export const getTaxSettings = async (): Promise<{ settings: TaxSettings }> => {
  return apiClient.get<{ settings: TaxSettings }>('/api/tax/settings');
};

/**
 * Update tax settings
 */
export const updateTaxSettings = async (
  settings: Partial<TaxSettings>
): Promise<{ success: boolean; settings: TaxSettings }> => {
  return apiClient.put<{ success: boolean; settings: TaxSettings }>(
    '/api/tax/settings',
    settings
  );
};

/**
 * Get tax calculation history
 */
export const getTaxHistory = async (params?: {
  taxYear?: number;
  propertyId?: string;
  limit?: number;
  offset?: number;
}): Promise<TaxHistoryResponse> => {
  return apiClient.get<TaxHistoryResponse>('/api/tax/history', params as any);
};

/**
 * Get a specific tax calculation
 */
export const getTaxCalculation = async (
  id: string
): Promise<{ calculation: TaxCalculation }> => {
  return apiClient.get<{ calculation: TaxCalculation }>(
    `/api/tax/calculations/${id}`
  );
};

/**
 * Finalize a tax calculation
 */
export const finalizeTaxCalculation = async (
  id: string,
  notes?: string
): Promise<{ success: boolean; calculation: TaxCalculation }> => {
  return apiClient.post<{ success: boolean; calculation: TaxCalculation }>(
    `/api/tax/calculations/${id}/finalize`,
    { notes }
  );
};

/**
 * Delete a tax calculation
 */
export const deleteTaxCalculation = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/api/tax/calculations/${id}`
  );
};

/**
 * Auto-fetch tax calculation data from database
 */
export const autoFetchTaxData = async (params: {
  taxYear?: number;
  propertyId?: string;
}): Promise<ApiResponse<{
  annualRentPaid: number;
  otherIncome: number;
  rentalIncome?: number; // Revenue from financial reports
  otherDeductions: number; // Expenses from financial reports
  expenseBreakdown?: Array<{ category: string; amount: number }>;
  propertyPurchasePrice?: number;
  propertySalePrice?: number;
}>> => {
  const queryParams = new URLSearchParams();
  if (params.taxYear) queryParams.append('taxYear', params.taxYear.toString());
  if (params.propertyId) queryParams.append('propertyId', params.propertyId);

  return apiClient.get(
    `/api/tax/auto-fetch?${queryParams.toString()}`
  );
};

