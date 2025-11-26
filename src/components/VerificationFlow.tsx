import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, Clock, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  startVerification,
  uploadVerificationDocument,
  getVerificationStatus
} from '../lib/api/verification';
import type { DocumentType, DocumentTypeInfo, VerificationStatus } from '../types/verification';

const DOCUMENT_TYPES: DocumentTypeInfo[] = [
  {
    value: 'nin',
    label: 'National Identity Number (NIN)',
    requiresNumber: true,
    description: 'Your 11-digit National Identity Number',
    placeholder: '12345678901'
  },
  {
    value: 'passport',
    label: 'International Passport',
    requiresNumber: true,
    description: 'Your passport number',
    placeholder: 'A12345678'
  },
  {
    value: 'drivers_license',
    label: "Driver's License",
    requiresNumber: true,
    description: 'Your driver\'s license number',
    placeholder: 'ABC123456789'
  },
  {
    value: 'voters_card',
    label: "Voter's Card",
    requiresNumber: true,
    description: 'Your Voter Identification Number (VIN)',
    placeholder: '90F5B00000000000'
  },
  {
    value: 'utility_bill',
    label: 'Utility Bill',
    requiresNumber: false,
    description: 'Recent utility bill (electricity, water, or gas) - not older than 3 months'
  },
  {
    value: 'proof_of_address',
    label: 'Proof of Address',
    requiresNumber: false,
    description: 'Bank statement or official document showing your address'
  }
];

export const VerificationFlow: React.FC = () => {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await getVerificationStatus();
      setVerificationStatus(response.data);

      if (response.data.requestId && response.data.status === 'pending') {
        setRequestId(response.data.requestId);
      }
    } catch (error: any) {
      console.error('Failed to load verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      const response = await startVerification();
      setRequestId(response.data.requestId);
      toast.success('Verification started! Please upload your documents.');
      await loadVerificationStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start verification');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Only JPEG, PNG, and PDF files are allowed');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !selectedType || !requestId) return;

    const selectedDocType = DOCUMENT_TYPES.find(d => d.value === selectedType);

    // Validate required fields
    if (selectedDocType?.requiresNumber && !documentNumber) {
      toast.error('Document number is required');
      return;
    }

    if (selectedDocType?.requiresNumber && (!firstName || !lastName)) {
      toast.error('First name and last name are required');
      return;
    }

    if (selectedType === 'nin' && !dob) {
      toast.error('Date of birth is required for NIN verification');
      return;
    }

    try {
      setUploading(true);

      const metadata = selectedDocType?.requiresNumber ? {
        firstName,
        lastName,
        dob: dob || undefined
      } : undefined;

      await uploadVerificationDocument(
        requestId,
        file,
        selectedType as DocumentType,
        documentNumber || undefined,
        metadata
      );

      toast.success('Document uploaded successfully! Verification in progress...');

      // Reset form
      setFile(null);
      setSelectedType('');
      setDocumentNumber('');
      setFirstName('');
      setLastName('');
      setDob('');

      // Reload status
      await loadVerificationStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show status if verification exists
  if (verificationStatus && verificationStatus.status !== 'not_started') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold mb-4">Identity Verification Status</h2>

          <div className="flex items-center gap-3 mb-6">
            {getStatusIcon(verificationStatus.status)}
            <div>
              <p className="font-semibold text-lg capitalize">{verificationStatus.status.replace('_', ' ')}</p>
              <p className="text-sm text-gray-600">
                {verificationStatus.submittedAt && `Submitted: ${new Date(verificationStatus.submittedAt).toLocaleDateString()}`}
              </p>
            </div>
          </div>

          {verificationStatus.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Rejection Reason:</strong> {verificationStatus.rejectionReason}
              </p>
            </div>
          )}

          {verificationStatus.documents && verificationStatus.documents.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg mb-3">Uploaded Documents</h3>
              {verificationStatus.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium capitalize">{doc.documentType.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">{doc.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.confidence && (
                      <span className="text-sm text-gray-600">
                        {doc.confidence}% confidence
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {verificationStatus.status === 'pending' && requestId && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-4">
                You can upload additional documents below:
              </p>
              <button
                onClick={() => setRequestId(requestId)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Upload More Documents →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show upload form if verification started
  if (requestId) {
    const selectedDocType = DOCUMENT_TYPES.find(d => d.value === selectedType);

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold mb-6">Upload Verification Documents</h2>

          <div className="space-y-6">
            {/* Document Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type *
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select document type</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {selectedDocType && (
                <p className="mt-2 text-sm text-gray-600">{selectedDocType.description}</p>
              )}
            </div>

            {/* Document Number (if required) */}
            {selectedDocType?.requiresNumber && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Number *
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder={selectedDocType.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {selectedType === 'nin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </>
            )}

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF up to 10MB
                  </p>
                  {file && (
                    <p className="text-sm text-green-600 font-medium">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || !selectedType || uploading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Upload Document
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show start button
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Identity Verification</h2>
          <p className="text-gray-600">
            Verify your identity to access all features and build trust with your clients.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
          <h3 className="font-semibold mb-3">Required Documents:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Government-issued ID (NIN, Passport, Driver's License, or Voter's Card)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Proof of address (Utility bill or Bank statement - not older than 3 months)</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Start Verification
        </button>
      </div>
    </div>
  );
};

