export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'info_requested'
  | 'approved'
  | 'rejected'
  | 'activated';

export type ApplicationType =
  | 'property-owner'
  | 'property-manager'
  | 'property-developer'
  | 'developer'
  | 'tenant';

export type ReviewStatus =
  | 'pending'
  | 'in_progress'
  | 'completed';

export type BusinessType =
  | 'individual'
  | 'company'
  | 'partnership';

export type BillingCycle =
  | 'monthly'
  | 'annual';

export type EmploymentStatus =
  | 'employed'
  | 'self-employed'
  | 'student'
  | 'unemployed'
  | 'retired';

export type CurrentlyRenting =
  | 'yes'
  | 'no'
  | 'looking';

export interface OnboardingApplication {
  id: string;
  applicationType: ApplicationType;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  businessType?: BusinessType | null;
  numberOfProperties?: number | null;
  totalUnits?: number | null;
  website?: string | null;
  taxId?: string | null;
  yearsOfExperience?: number | null;
  managementCompany?: string | null;
  licenseNumber?: string | null;
  propertiesManaged?: number | null;
  currentlyRenting?: CurrentlyRenting | null;
  moveInDate?: Date | null;
  employmentStatus?: EmploymentStatus | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  status: ApplicationStatus;
  reviewStatus?: ReviewStatus | null;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  activatedBy?: string | null;
  activatedAt?: Date | null;
  selectedPlanId?: string | null;
  selectedBillingCycle?: BillingCycle | null;
  customerId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  referralSource?: string | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationStats {
  pending: number;
  under_review: number;
  info_requested: number;
  approved: number;
  rejected: number;
  activated: number;
  total: number;
}

export interface ApplicationTimeline {
  action: string;
  timestamp: Date;
  actor: string;
  details?: string;
}

export interface ApplicationWithRelations extends OnboardingApplication {
  reviewer?: {
    id: string;
    name: string;
    email: string;
  } | null;
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
  activator?: {
    id: string;
    name: string;
    email: string;
  } | null;
  customer?: {
    id: string;
    company: string;
    email: string;
    status: string;
  } | null;
  plan?: {
    id: string;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
  } | null;
  timeline?: ApplicationTimeline[];
}

export interface PaginatedApplications {
  applications: ApplicationWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: ApplicationStats;
}

export interface ApprovalResult {
  success: boolean;
  customerId?: string;
  message: string;
}

export interface ActivationResult {
  success: boolean;
  temporaryPassword?: string;
  message: string;
  email?: string;
  name?: string;
  companyName?: string;
  applicationType?: string;
}

