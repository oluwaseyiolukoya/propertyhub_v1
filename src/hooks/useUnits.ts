/**
 * React Query Hook for Units
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUnits, createUnit, updateUnit, deleteUnit } from "../lib/api/units";

/**
 * Fetch all units with caching
 */
export function useUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await getUnits();
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a new unit
 */
export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unitData: any) => {
      const response = await createUnit(unitData);
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

/**
 * Update an existing unit
 */
export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await updateUnit(id, data);
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

/**
 * Delete a unit
 */
export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteUnit(id);
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

