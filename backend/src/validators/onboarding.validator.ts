import { z } from 'zod';

// Base application schema
export const baseApplicationSchema = z.object({
  applicationType: z.enum(['property-owner', 'property-manager', 'tenant']),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  // Address
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('Nigeria'),
  // Plan selection
  selectedPlanId: z.string().optional(),
  selectedBillingCycle: z.enum(['monthly', 'annual']).optional(),
  referralSource: z.string().optional(),
  // Flexible catch-all for non-critical UI fields
  metadata: z.record(z.any()).optional(),
});

// Property Owner specific fields
export const propertyOwnerSchema = baseApplicationSchema.extend({
  applicationType: z.literal('property-owner'),
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.enum(['individual', 'company', 'partnership']),
  numberOfProperties: z.number().int().min(1, 'Must have at least 1 property'),
  totalUnits: z.number().int().min(1, 'Must have at least 1 unit'),
  website: z.string().url().optional().or(z.literal('')),
  taxId: z.string().optional(),
});

// Property Manager specific fields
export const propertyManagerSchema = baseApplicationSchema.extend({
  applicationType: z.literal('property-manager'),
  managementCompany: z.string().min(2, 'Management company name is required'),
  yearsOfExperience: z.number().int().min(0).max(100),
  licenseNumber: z.string().optional(),
  propertiesManaged: z.number().int().min(0),
});

// Tenant specific fields
export const tenantSchema = baseApplicationSchema.extend({
  applicationType: z.literal('tenant'),
  currentlyRenting: z.enum(['yes', 'no', 'looking']),
  moveInDate: z.string().datetime().optional(),
  employmentStatus: z.enum(['employed', 'self-employed', 'student', 'unemployed', 'retired']).optional(),
});

// Union type for all application types
export const applicationSchema = z.discriminatedUnion('applicationType', [
  propertyOwnerSchema,
  propertyManagerSchema,
  tenantSchema,
]);

// Admin review schema
export const reviewApplicationSchema = z.object({
  reviewStatus: z.enum(['pending', 'in_progress', 'completed']).optional(),
  reviewNotes: z.string().optional(),
});

// Admin approve schema
export const approveApplicationSchema = z.object({
  planId: z.string().optional(),
  billingCycle: z.enum(['monthly', 'annual']).optional(),
  trialDays: z.number().int().min(0).max(90).default(14),
  notes: z.string().optional(),
});

// Admin reject schema
export const rejectApplicationSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  message: z.string().optional(),
});

// Request info schema
export const requestInfoSchema = z.object({
  requestedInfo: z.array(z.string()).min(1, 'At least one item must be requested'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// Query filters schema
export const applicationFiltersSchema = z.object({
  status: z.enum(['pending', 'under_review', 'info_requested', 'approved', 'rejected', 'activated']).optional(),
  applicationType: z.enum(['property-owner', 'property-manager', 'tenant']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

// Type exports
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type PropertyOwnerInput = z.infer<typeof propertyOwnerSchema>;
export type PropertyManagerInput = z.infer<typeof propertyManagerSchema>;
export type TenantInput = z.infer<typeof tenantSchema>;
export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;
export type ApproveApplicationInput = z.infer<typeof approveApplicationSchema>;
export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;
export type RequestInfoInput = z.infer<typeof requestInfoSchema>;
export type ApplicationFilters = z.infer<typeof applicationFiltersSchema>;

