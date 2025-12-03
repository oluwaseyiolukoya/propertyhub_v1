/**
 * React Query Hooks for Financial Data
 */

import { useQuery } from "@tanstack/react-query";
import {
  getFinancialOverview,
  getMonthlyRevenue,
  getPropertyPerformance,
} from "../lib/api/financial";

/**
 * Fetch financial overview
 */
export function useFinancialOverview() {
  return useQuery({
    queryKey: ["financial", "overview"],
    queryFn: async () => {
      const response = await getFinancialOverview();
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Fetch monthly revenue data for charts
 */
export function useMonthlyRevenue(months: number = 12) {
  return useQuery({
    queryKey: ["financial", "monthly-revenue", months],
    queryFn: async () => {
      const response = await getMonthlyRevenue(months);
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Fetch property performance data
 */
export function usePropertyPerformance() {
  return useQuery({
    queryKey: ["financial", "property-performance"],
    queryFn: async () => {
      const response = await getPropertyPerformance();
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

