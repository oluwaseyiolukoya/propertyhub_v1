/**
 * React Query Hook for Properties
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../lib/api/properties";

/**
 * Fetch all properties with caching
 */
export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await getProperties();
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a new property with optimistic updates
 */
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyData: any) => {
      const response = await createProperty(propertyData);
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

/**
 * Update an existing property
 */
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: any;
    }) => {
      const response = await updateProperty(id, data);
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

/**
 * Delete a property
 */
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteProperty(id);
      if (response.error) throw new Error(response.error.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

