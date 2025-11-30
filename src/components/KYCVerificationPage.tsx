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
 */

import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, Clock, FileText, AlertCircle, Loader2, Shield, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import apiClient from '../lib/api-client';
import { sessionManager } from '../lib/sessionManager';

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

  useEffect(() => {
    loadKYCStatus();
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // Show status-specific screens
  if (kycStatus?.kycStatus === 'pending_review') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Documents Under Review</CardTitle>
            <CardDescription>
              Your documents are being reviewed by our admin team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                Your identity verification documents have been submitted and are currently under review by our admin team.
                You will receive an email notification once the review is complete.
              </p>
              {kycStatus.kycFailureReason && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-sm font-medium text-orange-900">Review Note:</p>
                  <p className="text-sm text-orange-800 mt-1">{kycStatus.kycFailureReason}</p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 text-center">
              This usually takes 24-48 hours. Thank you for your patience.
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                sessionManager.clearSessionManually();
                window.location.href = '/';
              }}
              className="w-full text-gray-600 hover:text-gray-800 mt-4"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out and Continue Later
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kycStatus?.kycStatus === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Verification Rejected</CardTitle>
            <CardDescription>
              Your identity verification was not approved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-900 mb-2">Rejection Reason:</p>
              <p className="text-sm text-red-800">
                {kycStatus.kycFailureReason || 'Your documents did not meet our verification requirements.'}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Please ensure your documents are:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                <li>Clear and legible</li>
                <li>Valid and not expired</li>
                <li>Show your full name and photo</li>
                <li>Match the information you provided</li>
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
              className="w-full"
            >
              Retry Verification
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                sessionManager.clearSessionManually();
                window.location.href = '/';
              }}
              className="w-full text-gray-600 hover:text-gray-800 mt-2"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out and Continue Later
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kycStatus?.kycStatus === 'in_progress') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Verification In Progress</CardTitle>
            <CardDescription>
              We're verifying your identity documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Your documents are being verified with our identity verification provider.
                This process usually takes a few minutes.
              </p>
            </div>
            <Button
              onClick={loadKYCStatus}
              variant="outline"
              className="w-full"
            >
              Refresh Status
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                sessionManager.clearSessionManually();
                window.location.href = '/';
              }}
              className="w-full text-gray-600 hover:text-gray-800 mt-2"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out and Continue Later
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main upload form
  const uploadedCount = documents.filter(doc => doc.uploaded).length;
  const totalCount = documents.filter(doc => doc.type && doc.file).length;
  const canSubmit = totalCount >= 2 && !submitting;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <CardTitle className="text-3xl">Identity Verification</CardTitle>
            <CardDescription className="text-base mt-2">
              Complete your KYC verification to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-900 mb-2">📋 Requirements:</h3>
              <ul className="text-sm text-indigo-800 space-y-1">
                <li>• Upload <strong>at least 2 valid identity documents</strong></li>
                <li>• <strong>National Identification Number (NIN)</strong> is strongly recommended</li>
                <li>• Ensure documents are clear, legible, and not expired</li>
                <li>• Accepted formats: JPEG, PNG, PDF (max 10MB per file)</li>
              </ul>
            </div>

            {/* Progress */}
            {submitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uploading documents...</span>
                  <span className="text-gray-900 font-medium">{uploadedCount} / {totalCount}</span>
                </div>
                <Progress value={(uploadedCount / totalCount) * 100} />
              </div>
            )}

            {/* Document Upload Forms */}
            <div className="space-y-4">
              {documents.map((doc, index) => (
                <Card key={doc.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-lg">Document {index + 1}</h4>
                      {documents.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDocument(doc.id)}
                          disabled={submitting}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Document Type */}
                      <div>
                        <Label>Document Type *</Label>
                        <Select
                          value={doc.type}
                          onValueChange={(value) => handleDocumentTypeChange(doc.id, value)}
                          disabled={doc.uploaded || submitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label} {type.recommended && '(Recommended)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Document Number (if required) */}
                      {doc.type && DOCUMENT_TYPES.find(t => t.value === doc.type)?.requiresNumber && (
                        <div>
                          <Label>Document Number *</Label>
                          <Input
                            type="text"
                            value={doc.documentNumber}
                            onChange={(e) => handleDocumentNumberChange(doc.id, e.target.value)}
                            placeholder="Enter document number"
                            disabled={doc.uploaded || submitting}
                          />
                        </div>
                      )}

                      {/* File Upload */}
                      <div>
                        <Label>Upload Document *</Label>
                        <div className="mt-2">
                          {doc.file ? (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-700">{doc.file.name}</span>
                              </div>
                              {!doc.uploaded && !submitting && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleFileChange(doc.id, null)}
                                >
                                  Change
                                </Button>
                              )}
                              {doc.uploaded && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                              {doc.uploading && (
                                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                              )}
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-500">JPEG, PNG, PDF (max 10MB)</p>
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
                className="w-full"
              >
                + Add Another Document
              </Button>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full h-12 text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading Documents...
                </>
              ) : (
                <>
                  Submit for Verification
                  {totalCount < 2 && ` (${2 - totalCount} more required)`}
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
              className="w-full text-gray-600 hover:text-gray-800"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out and Continue Later
            </Button>

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center">
              Your documents are encrypted and stored securely. We only use them for identity verification purposes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

