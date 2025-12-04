import { Request } from 'express';

// Extend Express Request type
export interface AuthRequest extends Request {
  apiKey?: {
    id: string;
    name: string;
    permissions: string[];
  };
}

// Document types
export type DocumentType =
  | 'nin'
  | 'passport'
  | 'drivers_license'
  | 'voters_card'
  | 'utility_bill'
  | 'proof_of_address';

// Verification status
export type VerificationStatus =
  | 'pending'
  | 'in_progress'
  | 'verified'
  | 'failed'
  | 'rejected';

// Request status
export type RequestStatus =
  | 'pending'
  | 'in_progress'
  | 'approved'
  | 'rejected'
  | 'failed';

// Customer types
export type CustomerType =
  | 'property_owner'
  | 'developer'
  | 'property_manager'
  | 'tenant';

// Verification result from providers
export interface VerificationResult {
  success: boolean;
  status: 'verified' | 'failed' | 'pending';
  confidence: number; // 0-100
  referenceId: string;
  data?: any;
  error?: string;
}

// Provider interface
export interface VerificationProvider {
  name: string;
  verifyNIN(nin: string, firstName: string, lastName: string, dob: string): Promise<VerificationResult>;
  verifyPassport(passportNumber: string, firstName: string, lastName: string): Promise<VerificationResult>;
  verifyDriversLicense(licenseNumber: string, firstName: string, lastName: string): Promise<VerificationResult>;
  verifyVotersCard(vin: string, firstName: string, lastName: string): Promise<VerificationResult>;
  verifyDocument(documentType: string, fileUrl: string, metadata: any): Promise<VerificationResult>;
  checkStatus(referenceId: string): Promise<VerificationResult>;
}

// Job data
export interface VerificationJobData {
  documentId: string;
  priority?: number;
}

// API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

