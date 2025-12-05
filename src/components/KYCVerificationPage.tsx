/**
 * KYC Verification Page
 *
 * This component handles the mandatory KYC verification for new customers.
 * Users must upload at least 2 identity documents before accessing the dashboard.
 *
 * Following cursor rules:
 * - Proper state management (loading, error, success states)
 * - Clean URL parameters after processing
 * - Backend verification before granting access
 *
 * Brand Guidelines Applied:
 * - Primary Colors: Royal Purple (#7C3AED), Vibrant Violet (#A855F7), Deep Purple (#5B21B6)
 * - Typography: Inter font family
 * - Logo: Contrezz geometric building logo
 */

import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, Clock, FileText, AlertCircle, Loader2, Shield, LogOut, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import apiClient from '../lib/api-client';
import { sessionManager } from '../lib/sessionManager';

// Exact Contrezz logo from Figma Brand Guidelines
function ContrezztLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="4"
        y="16"
        width="12"
        height="20"
        rx="2"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <rect
        x="20"
        y="8"
        width="12"
        height="28"
        rx="2"
        fill="currentColor"
        fillOpacity="1"
      />
      <rect
        x="12"
        y="4"
        width="8"
        height="14"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.7"
      />
      <circle cx="10" cy="22" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="10" cy="28" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="26" cy="14" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="26" cy="20" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="26" cy="26" r="1.5" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

interface KYCVerificationPageProps {
  onVerificationComplete: () => void;
}

interface DocumentUpload {
  id: string;
  type: string;
  typeName: string;
  file: File | null;
  documentNumber: string;
  uploaded: boolean;
  uploading: boolean;
}

interface KYCStatus {
  kycStatus: string;
  kycFailureReason: string | null;
  requiresKyc: boolean;
  verificationDetails: any;
}

const DOCUMENT_TYPES = [
  { value: 'nin', label: 'National Identification Number (NIN)', requiresNumber: true, recommended: true },
  { value: 'passport', label: 'Passport Data Page', requiresNumber: true, recommended: false },
  { value: 'drivers_license', label: "Driver's License", requiresNumber: true, recommended: false },
  { value: 'voters_card', label: "Voter's Card", requiresNumber: true, recommended: false },
  { value: 'utility_bill', label: 'Utility Bill', requiresNumber: false, recommended: false },
  { value: 'proof_of_address', label: 'Proof of Address', requiresNumber: false, recommended: false },
];

export const KYCVerificationPage: React.FC<KYCVerificationPageProps> = ({ onVerificationComplete }) => {
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { id: '1', type: '', typeName: '', file: null, documentNumber: '', uploaded: false, uploading: false },
    { id: '2', type: '', typeName: '', file: null, documentNumber: '', uploaded: false, uploading: false },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(60);

  useEffect(() => {
    loadKYCStatus();
  }, []);

  // Auto-refresh every minute when verification is in progress
  useEffect(() => {
    if (kycStatus?.kycStatus !== 'in_progress') {
      return;
    }

    // Reset countdown when entering in_progress state
    setAutoRefreshCountdown(60);

    // Countdown timer (updates every second)
    const countdownInterval = setInterval(() => {
      setAutoRefreshCountdown((prev) => {
        if (prev <= 1) {
          return 60; // Reset after reaching 0
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      console.log('[KYC] Auto-refreshing verification status...');
      loadKYCStatus();
    }, 60000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(refreshInterval);
    };
  }, [kycStatus?.kycStatus]);

  const loadKYCStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/verification/kyc/status');

      if (response.error) {
        throw new Error(response.error.message || 'Failed to load KYC status');
      }

      const data = response.data;
      setKycStatus(data);

      // If already verified, complete immediately
      // Valid completed statuses: 'approved', 'verified', 'manually_verified', 'owner_approved'
      if (data.kycStatus === 'approved' ||
          data.kycStatus === 'verified' ||
          data.kycStatus === 'manually_verified' ||
          data.kycStatus === 'owner_approved') {
        toast.success('Your identity verification is complete!');
        setTimeout(() => onVerificationComplete(), 1000);
        return;
      }

      // If in progress, load existing request
      // BUT: If rejected, don't reuse the old request (user needs to create new one)
      if (data.verificationDetails?.requestId && data.kycStatus !== 'rejected') {
        setRequestId(data.verificationDetails.requestId);
      } else if (data.kycStatus === 'rejected') {
        // Clear old request ID so user can create a new request
        setRequestId(null);
        console.log('[KYC] Previous request was rejected, user can create new request');
      }
    } catch (error: any) {
      console.error('[KYC] Failed to load status:', error);
      toast.error('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = () => {
    setDocuments([
      ...documents,
      {
        id: Date.now().toString(),
        type: '',
        typeName: '',
        file: null,
        documentNumber: '',
        uploaded: false,
        uploading: false
      },
    ]);
  };

  const handleRemoveDocument = (id: string) => {
    if (documents.length <= 2) {
      toast.error('You must upload at least 2 documents');
      return;
    }
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const handleDocumentTypeChange = (id: string, type: string) => {
    const typeName = DOCUMENT_TYPES.find(t => t.value === type)?.label || '';
    setDocuments(documents.map(doc =>
      doc.id === id ? { ...doc, type, typeName } : doc
    ));
  };

  const handleFileChange = (id: string, file: File | null) => {
    setDocuments(documents.map(doc =>
      doc.id === id ? { ...doc, file } : doc
    ));
  };

  const handleDocumentNumberChange = (id: string, documentNumber: string) => {
    setDocuments(documents.map(doc =>
      doc.id === id ? { ...doc, documentNumber } : doc
    ));
  };

  const handleSubmit = async () => {
    try {
      // Validate: at least 2 documents
      const validDocuments = documents.filter(doc => doc.type && doc.file);
      if (validDocuments.length < 2) {
        toast.error('Please upload at least 2 documents');
        return;
      }

      // Validate: document numbers for types that require them
      for (const doc of validDocuments) {
        const docType = DOCUMENT_TYPES.find(t => t.value === doc.type);
        if (docType?.requiresNumber && !doc.documentNumber) {
          toast.error(`Please enter the document number for ${docType.label}`);
          return;
        }
      }

      setSubmitting(true);

      // Step 1: Submit KYC request if not already created OR if previous was rejected
      let currentRequestId = requestId;
      const isRejected = kycStatus?.kycStatus === 'rejected';

      if (!currentRequestId || isRejected) {
        console.log('[KYC] Submitting KYC request...', isRejected ? '(resubmission after rejection)' : '(new request)');
        const submitResponse = await apiClient.post('/api/verification/kyc/submit', {});

        if (submitResponse.error) {
          throw new Error(submitResponse.error.message || 'Failed to submit KYC request');
        }

        currentRequestId = submitResponse.data.requestId;
        setRequestId(currentRequestId);
        console.log('[KYC] Request created:', currentRequestId);

        // Reset uploaded status for all documents (for resubmission)
        if (isRejected) {
          setDocuments(docs => docs.map(d => ({ ...d, uploaded: false, uploading: false })));
        }
      }

      // Step 2: Upload each document
      for (const doc of validDocuments) {
        if (doc.uploaded) continue;

        console.log('[KYC] Uploading document:', doc.type);

        setDocuments(docs => docs.map(d =>
          d.id === doc.id ? { ...d, uploading: true } : d
        ));

        const formData = new FormData();
        formData.append('document', doc.file!);
        formData.append('requestId', currentRequestId!);
        formData.append('documentType', doc.type);
        if (doc.documentNumber) {
          formData.append('documentNumber', doc.documentNumber);
        }

        const uploadResponse = await apiClient.post('/api/verification/upload', formData);

        if (uploadResponse.error) {
          throw new Error(`Failed to upload ${doc.typeName}: ${uploadResponse.error.message}`);
        }

        setDocuments(docs => docs.map(d =>
          d.id === doc.id ? { ...d, uploaded: true, uploading: false } : d
        ));

        console.log('[KYC] Document uploaded:', doc.type);
      }

      toast.success('Documents uploaded successfully! Verification in progress...');

      // Reload status to check verification result
      await loadKYCStatus();

    } catch (error: any) {
      console.error('[KYC] Submit error:', error);
      toast.error(error.message || 'Failed to submit documents');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50/20">
        <div className="text-center">
          <div className="bg-gradient-to-br from-purple-600 to-violet-500 p-4 rounded-2xl inline-block mb-6 shadow-lg shadow-purple-200">
            <ContrezztLogo className="w-12 h-12 text-white" />
          </div>
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // Show status-specific screens
  if (kycStatus?.kycStatus === 'pending_review') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50/20">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-violet-500 p-2 rounded-xl">
              <ContrezztLogo className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Contrezz</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full shadow-xl border-0 shadow-purple-100/50">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-lg shadow-amber-100">
                <Clock className="h-10 w-10 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Documents Under Review</CardTitle>
              <CardDescription className="text-base">
                Your documents are being reviewed by our admin team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                <p className="text-sm text-amber-900">
                  Your identity verification documents have been submitted and are currently under review by our admin team.
                  You will receive an email notification once the review is complete.
                </p>
                {kycStatus.kycFailureReason && (
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-sm font-semibold text-amber-900">Review Note:</p>
                    <p className="text-sm text-amber-800 mt-1">{kycStatus.kycFailureReason}</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 text-center">
                This usually takes 24-48 hours. Thank you for your patience.
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  sessionManager.clearSessionManually();
                  window.location.href = '/';
                }}
                className="w-full text-gray-600 hover:text-purple-700 hover:bg-purple-50 mt-4"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out and Continue Later
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (kycStatus?.kycStatus === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50/20">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-violet-500 p-2 rounded-xl">
              <ContrezztLogo className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Contrezz</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full shadow-xl border-0 shadow-purple-100/50">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center shadow-lg shadow-red-100">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Verification Rejected</CardTitle>
              <CardDescription className="text-base">
                Your identity verification was not approved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-5">
                <p className="text-sm font-semibold text-red-900 mb-2">Rejection Reason:</p>
                <p className="text-sm text-red-800">
                  {kycStatus.kycFailureReason || 'Your documents did not meet our verification requirements.'}
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-5">
                <p className="text-sm font-medium text-purple-900 mb-2">
                  Please ensure your documents are:
                </p>
                <ul className="text-sm text-purple-800 mt-2 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span>Clear and legible</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span>Valid and not expired</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span>Show your full name and photo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span>Match the information you provided</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => {
                  setKycStatus(null);
                  setRequestId(null);
                  setDocuments([
                    { id: '1', type: '', typeName: '', file: null, documentNumber: '', uploaded: false, uploading: false },
                    { id: '2', type: '', typeName: '', file: null, documentNumber: '', uploaded: false, uploading: false },
                  ]);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg shadow-purple-200 h-12"
              >
                Retry Verification
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  sessionManager.clearSessionManually();
                  window.location.href = '/';
                }}
                className="w-full text-gray-600 hover:text-purple-700 hover:bg-purple-50 mt-2"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out and Continue Later
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (kycStatus?.kycStatus === 'in_progress') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50/20">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-violet-500 p-2 rounded-xl">
              <ContrezztLogo className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Contrezz</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full shadow-xl border-0 shadow-purple-100/50">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center shadow-lg shadow-purple-100">
                <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Verification In Progress</CardTitle>
              <CardDescription className="text-base">
                We're verifying your identity documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-5">
                <p className="text-sm text-purple-900">
                  Your documents are being verified with our identity verification provider.
                  This process usually takes a few minutes.
                </p>
              </div>
              <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span>Auto-refreshing in <span className="font-semibold text-purple-600">{autoRefreshCountdown}</span> second{autoRefreshCountdown !== 1 ? 's' : ''}</span>
              </div>
              <Button
                onClick={() => {
                  loadKYCStatus();
                  setAutoRefreshCountdown(60);
                }}
                variant="outline"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
              >
                Refresh Now
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  sessionManager.clearSessionManually();
                  window.location.href = '/';
                }}
                className="w-full text-gray-600 hover:text-purple-700 hover:bg-purple-50 mt-2"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out and Continue Later
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main upload form
  const uploadedCount = documents.filter(doc => doc.uploaded).length;
  const totalCount = documents.filter(doc => doc.type && doc.file).length;
  const canSubmit = totalCount >= 2 && !submitting;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50/20">
      {/* Header - matching Property Owner Dashboard style */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-violet-500 p-2.5 rounded-xl shadow-lg shadow-purple-200">
              <ContrezztLogo className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">Contrezz</span>
              <p className="text-xs text-gray-500">Property Management</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
            Identity Verification
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 shadow-purple-100/50 overflow-hidden">
            <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-violet-600 text-white py-8">
              <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-white">Identity Verification</CardTitle>
              <CardDescription className="text-base mt-2 text-purple-100">
                Complete your KYC verification to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 md:p-8">
              {/* Instructions */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-5">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Requirements
                </h3>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Upload <strong>at least 2 valid identity documents</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span><strong>National Identification Number (NIN)</strong> is strongly recommended</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Ensure documents are clear, legible, and not expired</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Accepted formats: JPEG, PNG, PDF (max 10MB per file)</span>
                  </li>
                </ul>
              </div>

              {/* Progress */}
              {submitting && (
                <div className="space-y-2 bg-purple-50 rounded-xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700 font-medium">Uploading documents...</span>
                    <span className="text-purple-900 font-semibold">{uploadedCount} / {totalCount}</span>
                  </div>
                  <Progress value={(uploadedCount / totalCount) * 100} className="h-2" />
                </div>
              )}

              {/* Document Upload Forms */}
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <Card key={doc.id} className="border-2 border-gray-200 hover:border-purple-200 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-700">{index + 1}</span>
                          </div>
                          <h4 className="font-semibold text-lg text-gray-900">Document {index + 1}</h4>
                        </div>
                        {documents.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDocument(doc.id)}
                            disabled={submitting}
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Document Type */}
                        <div>
                          <Label className="text-gray-700 font-medium">Document Type *</Label>
                          <Select
                            value={doc.type}
                            onValueChange={(value) => handleDocumentTypeChange(doc.id, value)}
                            disabled={doc.uploaded || submitting}
                          >
                            <SelectTrigger className="mt-1.5 border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label} {type.recommended && <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">Recommended</Badge>}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Document Number (if required) */}
                        {doc.type && DOCUMENT_TYPES.find(t => t.value === doc.type)?.requiresNumber && (
                          <div>
                            <Label className="text-gray-700 font-medium">Document Number *</Label>
                            <Input
                              type="text"
                              value={doc.documentNumber}
                              onChange={(e) => handleDocumentNumberChange(doc.id, e.target.value)}
                              placeholder="Enter document number"
                              disabled={doc.uploaded || submitting}
                              className="mt-1.5 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            />
                          </div>
                        )}

                        {/* File Upload */}
                        <div>
                          <Label className="text-gray-700 font-medium">Upload Document *</Label>
                          <div className="mt-2">
                            {doc.file ? (
                              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50/30 rounded-xl border border-gray-200">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-900 block">{doc.file.name}</span>
                                    <span className="text-xs text-gray-500">{(doc.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                  </div>
                                </div>
                                {!doc.uploaded && !submitting && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileChange(doc.id, null)}
                                    className="text-gray-500 hover:text-purple-700"
                                  >
                                    Change
                                  </Button>
                                )}
                                {doc.uploaded && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="text-sm font-medium">Uploaded</span>
                                  </div>
                                )}
                                {doc.uploading && (
                                  <div className="flex items-center gap-2 text-purple-600">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="text-sm font-medium">Uploading...</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all ${doc.type ? 'border-purple-300 hover:bg-purple-50 hover:border-purple-400' : 'border-gray-300 bg-gray-50 cursor-not-allowed'}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-3 ${doc.type ? 'bg-purple-100' : 'bg-gray-200'}`}>
                                    <Upload className={`h-6 w-6 ${doc.type ? 'text-purple-600' : 'text-gray-400'}`} />
                                  </div>
                                  <p className={`text-sm font-medium ${doc.type ? 'text-purple-700' : 'text-gray-500'}`}>
                                    {doc.type ? 'Click to upload or drag and drop' : 'Select document type first'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">JPEG, PNG, PDF (max 10MB)</p>
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/jpeg,image/png,application/pdf"
                                  onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)}
                                  disabled={!doc.type || submitting}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add More Button */}
              {documents.length < 6 && (
                <Button
                  variant="outline"
                  onClick={handleAddDocument}
                  disabled={submitting}
                  className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-300"
                >
                  + Add Another Document
                </Button>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg shadow-purple-200 rounded-xl font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading Documents...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Submit for Verification
                    {totalCount < 2 && <span className="ml-2 text-purple-200">({2 - totalCount} more required)</span>}
                  </>
                )}
              </Button>

              {/* Sign Out and Continue Later */}
              <Button
                variant="ghost"
                onClick={() => {
                  sessionManager.clearSessionManually();
                  window.location.href = '/';
                }}
                disabled={submitting}
                className="w-full text-gray-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out and Continue Later
              </Button>

              {/* Help Text */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <Shield className="h-4 w-4 text-gray-400" />
                <span>Your documents are encrypted and stored securely. We only use them for identity verification purposes.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
          <p>© 2025 Contrezz. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

