import { apiClient } from "../api-client";

export interface FinancialOverview {
  totalRevenue: number;
  netOperatingIncome: number;
  portfolioCapRate: number;
  operatingMargin: number;
  occupancyRate: number;
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  estimatedExpenses: number;
  annualRevenue: number;
  annualNOI: number;
  totalPropertyValue: number;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

export interface PropertyPerformance {
  id: string;
  name: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  currency: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyExpenses: number;
  annualExpenses: number;
  monthlyNOI: number;
  annualNOI: number;
  propertyValue: number;
  purchasePrice: number | null;
  currentValue: number | null;
  capRate: number;
  roi: number;
  cashFlow: number;
  avgRent: number;
  insurancePremium: number;
  propertyTaxes: number;
}

export const getFinancialOverview = async (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  return apiClient.get<FinancialOverview>(
    "/api/financial/overview",
    params as any
  );
};

export const getMonthlyRevenue = async (
  months: number = 12,
  propertyId?: string
) => {
  return apiClient.get<MonthlyRevenueData[]>("/api/financial/monthly-revenue", {
    months,
    ...(propertyId && propertyId !== "all" ? { propertyId } : {}),
  } as any);
};

export const getPropertyPerformance = async () => {
  return apiClient.get<PropertyPerformance[]>(
    "/api/financial/property-performance"
  );
};
