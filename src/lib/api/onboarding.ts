import { apiClient } from '../api-client';

export interface OnboardingApplicationData {
  applicationType: 'property-owner' | 'property-manager' | 'tenant';
  name: string;
  email: string;
  phone?: string;

  // Property Owner fields
  companyName?: string;
  businessType?: 'individual' | 'company' | 'partnership';
  numberOfProperties?: number;
  totalUnits?: number;
  website?: string;
  taxId?: string;

  // Property Manager fields
  managementCompany?: string;
  yearsOfExperience?: number;
  licenseNumber?: string;
  propertiesManaged?: number;

  // Tenant fields
  currentlyRenting?: 'yes' | 'no' | 'looking';
  moveInDate?: string;
  employmentStatus?: 'employed' | 'self-employed' | 'student' | 'unemployed' | 'retired';

  // Address
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  // Plan selection
  selectedPlanId?: string;
  selectedBillingCycle?: 'monthly' | 'annual';
  referralSource?: string;
  // Additional UI-only fields bundled for admin visibility
  metadata?: Record<string, any>;
}

export interface OnboardingApplicationResponse {
  success: boolean;
  message: string;
  data: {
    applicationId: string;
    status: string;
    estimatedReviewTime: string;
    submittedAt: string;
  };
}

export interface ApplicationStatusResponse {
  success: boolean;
  data: {
    status: string;
    submittedAt: string;
    message: string;
    estimatedReviewTime?: string | null;
  };
}

export interface OnboardingErrorResponse {
  success: false;
  error: string;
  details?: any[];
}

/**
 * Submit a new onboarding application
 */
export async function submitOnboardingApplication(
  data: OnboardingApplicationData
): Promise<OnboardingApplicationResponse> {
  try {
    console.log('[Onboarding API] Submitting application:', {
      email: data.email,
      type: data.applicationType,
    });

    const response = await apiClient.post('/api/onboarding/apply', data, { suppressAuthRedirect: true });

    if (response.error) {
      const message = response.error.message || response.error.error || 'Failed to submit application';
      console.error('[Onboarding API] Submission failed:', message);
      throw new Error(message);
    }

    console.log('[Onboarding API] Application submitted successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('[Onboarding API] Submission error:', error);

    if (error?.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error?.message) {
      throw new Error(error.message);
    }
    throw new Error('Network error. Please check your connection and try again.');
  }
}

/**
 * Check application status by email
 */
export async function checkApplicationStatus(
  email: string
): Promise<ApplicationStatusResponse> {
  try {
    console.log('[Onboarding API] Checking status for:', email);

    const response = await apiClient.get(`/api/onboarding/status/${encodeURIComponent(email)}`, undefined, { suppressAuthRedirect: true });

    if (response.error) {
      const message = response.error.message || response.error.error || 'Failed to check status';
      console.error('[Onboarding API] Status check failed:', message);
      throw new Error(message);
    }

    return response.data;
  } catch (error: any) {
    console.error('[Onboarding API] Status check error:', error);

    if (error?.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error?.message) {
      throw new Error(error.message);
    }
    throw new Error('Network error. Please check your connection and try again.');
  }
}

