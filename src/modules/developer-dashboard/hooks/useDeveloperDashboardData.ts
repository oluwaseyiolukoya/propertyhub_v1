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
  InvoiceStatus,
  VendorType,
  VendorStatus,
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
      // Transform invoices from Prisma format to ProjectInvoice interface
      const transformedData = {
        ...response.data,
        invoices: Array.isArray(response.data.invoices)
          ? response.data.invoices.map((inv: any) => ({
              id: inv.id,
              projectId: inv.projectId,
              vendorId: inv.vendorId || undefined,
              invoiceNumber: inv.invoiceNumber,
              description: inv.description,
              category: inv.category,
              amount: Number(inv.amount),
              currency: inv.currency || 'NGN',
              status: inv.status as InvoiceStatus,
              dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : undefined,
              paidDate: inv.paidDate ? new Date(inv.paidDate).toISOString().split('T')[0] : undefined,
              paymentMethod: inv.paymentMethod || undefined,
              approvedBy: inv.approvedBy || undefined,
              approvedAt: inv.approvedAt ? new Date(inv.approvedAt).toISOString() : undefined,
              attachments: Array.isArray(inv.attachments) ? inv.attachments : undefined,
              notes: inv.notes || undefined,
              createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: inv.updatedAt ? new Date(inv.updatedAt).toISOString() : new Date().toISOString(),
              vendor: inv.vendor ? {
                id: inv.vendor.id,
                customerId: inv.vendor.customerId,
                name: inv.vendor.name,
                contactPerson: inv.vendor.contactPerson || undefined,
                email: inv.vendor.email || undefined,
                phone: inv.vendor.phone || undefined,
                address: inv.vendor.address || undefined,
                vendorType: inv.vendor.vendorType as VendorType,
                specialization: inv.vendor.specialization || undefined,
                rating: inv.vendor.rating || undefined,
                totalContracts: inv.vendor.totalContracts || 0,
                totalValue: Number(inv.vendor.totalValue) || 0,
                currency: inv.vendor.currency || 'NGN',
                status: inv.vendor.status as VendorStatus,
                notes: inv.vendor.notes || undefined,
                createdAt: inv.vendor.createdAt ? new Date(inv.vendor.createdAt).toISOString() : new Date().toISOString(),
                updatedAt: inv.vendor.updatedAt ? new Date(inv.vendor.updatedAt).toISOString() : new Date().toISOString(),
              } : undefined,
            }))
          : [],
      };

      console.log('✅ [useProjectDashboard] Transformed invoices:', transformedData.invoices.length);
      setData(transformedData);
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

