// ============================================
// Property Developer Dashboard Types
// ============================================

export type ProjectStage = 'planning' | 'design' | 'pre-construction' | 'construction' | 'completion';
export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'cancelled';
export type ProjectType = 'residential' | 'commercial' | 'mixed-use' | 'infrastructure';

export type BudgetStatus = 'pending' | 'in-progress' | 'completed' | 'overrun';
export type BudgetCategory =
  | 'labor'
  | 'materials'
  | 'equipment'
  | 'permits'
  | 'professional-fees'
  | 'contingency'
  | 'utilities'
  | 'insurance'
  | 'other';

export type InvoiceStatus = 'pending' | 'approved' | 'paid' | 'rejected';
export type VendorType = 'contractor' | 'supplier' | 'consultant' | 'subcontractor';
export type VendorStatus = 'active' | 'inactive' | 'blacklisted';

export type ForecastType = 'completion-date' | 'budget' | 'cash-flow';
export type MilestoneStatus = 'pending' | 'in-progress' | 'completed' | 'delayed';

// ============================================
// Core Interfaces
// ============================================

export interface DeveloperProject {
  id: string;
  customerId: string;
  developerId: string;
  name: string;
  description?: string;
  projectType: ProjectType;
  stage: ProjectStage;
  status: ProjectStatus;
  startDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  location?: string;
  city?: string;
  state?: string;
  country: string;
  totalBudget: number;
  actualSpend: number;
  currency: string;
  progress: number; // 0-100
  coverImage?: string;
  images?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;

  // Computed fields
  variance?: number;
  variancePercent?: number;
  daysRemaining?: number;
  isOverBudget?: boolean;
  isDelayed?: boolean;
}

export interface BudgetLineItem {
  id: string;
  projectId: string;
  category: BudgetCategory;
  subcategory?: string;
  description: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  status: BudgetStatus;
  notes?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectVendor {
  id: string;
  customerId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  vendorType: VendorType;
  specialization?: string;
  rating?: number; // 0-5
  totalContracts: number;
  totalValue: number;
  currency: string;
  status: VendorStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInvoice {
  id: string;
  projectId: string;
  vendorId?: string;
  invoiceNumber: string;
  description: string;
  category: BudgetCategory;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  approvedBy?: string;
  approvedAt?: string;
  attachments?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  vendor?: ProjectVendor;
}

export interface ProjectForecast {
  id: string;
  projectId: string;
  forecastDate: string;
  forecastType: ForecastType;
  predictedValue?: number;
  predictedDate?: string;
  confidence?: number; // 0-100
  methodology?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  targetDate: string;
  completedDate?: string;
  status: MilestoneStatus;
  progress: number; // 0-100
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Dashboard Data Interfaces
// ============================================

export interface PortfolioOverview {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalActualSpend: number;
  totalVariance: number;
  variancePercent: number;
  averageProgress: number;
  projectsOnTrack: number;
  projectsDelayed: number;
  projectsOverBudget: number;
  currency: string;
}

export interface ProjectDashboardData {
  project: DeveloperProject;
  budgetLineItems: BudgetLineItem[];
  invoices: ProjectInvoice[];
  forecasts: ProjectForecast[];
  milestones: ProjectMilestone[];
  alerts: ProjectAlert[];

  // Aggregated data
  budgetByCategory: CategorySpend[];
  spendTrend: SpendTrendData[];
  cashFlowForecast: CashFlowData[];
}

export interface CategorySpend {
  category: BudgetCategory;
  planned: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export interface SpendTrendData {
  date: string;
  planned: number;
  actual: number;
}

export interface CashFlowData {
  month: string;
  projected: number;
  actual?: number;
}

export interface ProjectAlert {
  id: string;
  type: 'budget-overrun' | 'schedule-delay' | 'pending-approval' | 'milestone-due' | 'payment-due';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  projectId: string;
  entityId?: string;
  createdAt: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateProjectRequest {
  name: string;
  description?: string;
  projectType: ProjectType;
  stage?: ProjectStage;
  startDate?: string;
  estimatedEndDate?: string;
  location?: string;
  city?: string;
  state?: string;
  totalBudget: number;
  currency?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  projectType?: ProjectType;
  stage?: ProjectStage;
  status?: ProjectStatus;
  startDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  location?: string;
  city?: string;
  state?: string;
  totalBudget?: number;
  actualSpend?: number;
  progress?: number;
}

export interface CreateBudgetLineItemRequest {
  category: BudgetCategory;
  subcategory?: string;
  description: string;
  plannedAmount: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateBudgetLineItemRequest {
  category?: BudgetCategory;
  subcategory?: string;
  description?: string;
  plannedAmount?: number;
  actualAmount?: number;
  status?: BudgetStatus;
  notes?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateInvoiceRequest {
  vendorId?: string;
  invoiceNumber: string;
  description: string;
  category: BudgetCategory;
  amount: number;
  dueDate?: string;
  notes?: string;
}

export interface CreateVendorRequest {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  vendorType: VendorType;
  specialization?: string;
  notes?: string;
}

// ============================================
// Filter & Sort Types
// ============================================

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus[];
  stage?: ProjectStage[];
  projectType?: ProjectType[];
  city?: string[];
  state?: string[];
  startDateFrom?: string;
  startDateTo?: string;
  budgetMin?: number;
  budgetMax?: number;
}

export interface ProjectSortOptions {
  field: 'name' | 'startDate' | 'totalBudget' | 'actualSpend' | 'progress' | 'variance' | 'createdAt';
  order: 'asc' | 'desc';
}

// ============================================
// Chart Data Types
// ============================================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface BudgetVsActualChartData {
  categories: string[];
  planned: number[];
  actual: number[];
}

// ============================================
// Utility Types
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

