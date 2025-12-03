/**
 * React Query Hooks for Dashboard Data
 */

import { useQuery } from "@tanstack/react-query";
import {
  getOwnerDashboardOverview,
  getManagerDashboardOverview,
} from "../lib/api/dashboard";
import { getAccountInfo } from "../lib/api/auth";

/**
 * Fetch owner dashboard overview
 */
export function useOwnerDashboard() {
  return useQuery({
    queryKey: ["dashboard", "owner"],
    queryFn: async () => {
      const response = await getOwnerDashboardOverview();
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (dashboard data changes frequently)
  });
}

/**
 * Fetch manager dashboard overview
 */
export function useManagerDashboard() {
  return useQuery({
    queryKey: ["dashboard", "manager"],
    queryFn: async () => {
      const response = await getManagerDashboardOverview();
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch account info (plan, limits, usage)
 */
export function useAccountInfo() {
  return useQuery({
    queryKey: ["account", "info"],
    queryFn: async () => {
      const response = await getAccountInfo();
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (rarely changes)
  });
}

