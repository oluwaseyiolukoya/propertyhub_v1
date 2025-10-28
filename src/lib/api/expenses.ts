import { apiClient } from '../api-client';

export interface Expense {
  id: string;
  propertyId: string;
  unitId?: string | null;
  category: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  dueDate?: string | null;
  status: string;
  paidDate?: string | null;
  paymentMethod?: string | null;
  recordedBy: string;
  recordedByRole: string;
  receipt?: string | null;
  notes?: string | null;
  requiresApproval: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  visibleToManager: boolean;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    name: string;
    currency?: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
  } | null;
  recorder?: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface ExpenseStats {
  totalAmount: number;
  totalCount: number;
  byCategory: Array<{
    category: string;
    _sum: {
      amount: number | null;
    };
    _count: number;
  }>;
  byStatus: Array<{
    status: string;
    _sum: {
      amount: number | null;
    };
    _count: number;
  }>;
  byProperty?: Array<{
    propertyId: string;
    propertyName: string;
    currency: string;
    totalAmount: number;
    count: number;
  }>;
}

export interface CreateExpenseData {
  propertyId: string;
  unitId?: string;
  category: string;
  description: string;
  amount: number;
  currency?: string;
  date?: string;
  dueDate?: string;
  status?: string;
  paymentMethod?: string;
  receipt?: string;
  notes?: string;
  visibleToManager?: boolean;
}

export interface UpdateExpenseData {
  category?: string;
  description?: string;
  amount?: number;
  currency?: string;
  date?: string;
  dueDate?: string;
  status?: string;
  paidDate?: string;
  paymentMethod?: string;
  receipt?: string;
  notes?: string;
  visibleToManager?: boolean;
}

// Get all expenses
export const getExpenses = async (params?: {
  propertyId?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return apiClient.get<{ data: Expense[] }>('/api/expenses', params as any);
};

// Get single expense
export const getExpense = async (id: string) => {
  return apiClient.get<{ data: Expense }>(`/api/expenses/${id}`);
};

// Create expense
export const createExpense = async (data: CreateExpenseData) => {
  return apiClient.post<{ data: Expense }>('/api/expenses', data);
};

// Update expense
export const updateExpense = async (id: string, data: UpdateExpenseData) => {
  return apiClient.put<{ data: Expense }>(`/api/expenses/${id}`, data);
};

// Delete expense
export const deleteExpense = async (id: string) => {
  return apiClient.delete<{ message: string }>(`/api/expenses/${id}`);
};

// Get expense statistics
export const getExpenseStats = async (params?: {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return apiClient.get<ExpenseStats>('/api/expenses/stats/overview', params as any);
};

// Approve expense (owner only)
export const approveExpense = async (id: string) => {
  return apiClient.post<{ data: Expense }>(`/api/expenses/${id}/approve`);
};

// Expense categories
export const EXPENSE_CATEGORIES = [
  { value: 'maintenance', label: 'Maintenance & Repairs' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'property_tax', label: 'Property Tax' },
  { value: 'management_fee', label: 'Management Fee' },
  { value: 'leasing_fee', label: 'Leasing Fee' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'security', label: 'Security' },
  { value: 'waste_management', label: 'Waste Management' },
  { value: 'legal', label: 'Legal Fees' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'advertising', label: 'Advertising & Marketing' },
  { value: 'other', label: 'Other' }
];

// Expense statuses
export const EXPENSE_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' }
];

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'other', label: 'Other' }
];

