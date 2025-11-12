import { useState, useEffect, useCallback } from 'react';
import {
  getPortfolioOverview,
  getProjects,
  getProjectDashboard,
  getBudgetLineItems,
  getProjectInvoices,
  getVendors,
} from '../services/developerDashboard.api';
import type {
  DeveloperProject,
  PortfolioOverview,
  ProjectDashboardData,
  BudgetLineItem,
  ProjectInvoice,
  ProjectVendor,
  ProjectFilters,
  ProjectSortOptions,
} from '../types';

// ============================================
// Portfolio Overview Hook
// ============================================

export const usePortfolioOverview = () => {
  const [data, setData] = useState<PortfolioOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getPortfolioOverview();
    if (response.success && response.data) {
      setData(response.data);
    } else {
      setError(response.error || 'Failed to load portfolio overview');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// ============================================
// Projects List Hook
// ============================================

export const useProjects = (
  filters?: ProjectFilters,
  sort?: ProjectSortOptions,
  page: number = 1,
  limit: number = 10
) => {
  const [data, setData] = useState<DeveloperProject[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stringify objects to avoid infinite loops from reference changes
  const filtersStr = JSON.stringify(filters);
  const sortStr = JSON.stringify(sort);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getProjects(filters, sort, page, limit);
    if (response.success && response.data) {
      setData(response.data.data);
      setPagination(response.data.pagination);
    } else {
      setError(response.error || 'Failed to load projects');
    }
    setLoading(false);
  }, [filtersStr, sortStr, page, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, pagination, loading, error, refetch: fetchData };
};

// ============================================
// Project Dashboard Hook
// ============================================

export const useProjectDashboard = (projectId: string | null) => {
  const [data, setData] = useState<ProjectDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const response = await getProjectDashboard(projectId);
    if (response.success && response.data) {
      setData(response.data);
    } else {
      setError(response.error || 'Failed to load project dashboard');
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// ============================================
// Budget Line Items Hook
// ============================================

export const useBudgetLineItems = (projectId: string | null) => {
  const [data, setData] = useState<BudgetLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const response = await getBudgetLineItems(projectId);
    if (response.success && response.data) {
      setData(response.data);
    } else {
      setError(response.error || 'Failed to load budget line items');
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// ============================================
// Project Invoices Hook
// ============================================

export const useProjectInvoices = (projectId: string | null) => {
  const [data, setData] = useState<ProjectInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const response = await getProjectInvoices(projectId);
    if (response.success && response.data) {
      setData(response.data);
    } else {
      setError(response.error || 'Failed to load invoices');
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// ============================================
// Vendors Hook
// ============================================

export const useVendors = () => {
  const [data, setData] = useState<ProjectVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getVendors();
    if (response.success && response.data) {
      setData(response.data);
    } else {
      setError(response.error || 'Failed to load vendors');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// ============================================
// Utility Hooks
// ============================================

export const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

