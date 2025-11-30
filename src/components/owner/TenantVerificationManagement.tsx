import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  Users,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Building2,
  Home,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getTenantVerifications,
  getTenantVerificationAnalytics,
  getTenantVerificationDetails,
  approveTenantKyc,
  rejectTenantKyc,
  requestKycResubmit,
  getTenantDocumentUrl,
  deleteTenantVerification,
  TenantVerification,
  TenantVerificationAnalytics,
  TenantVerificationDetails,
  VerificationDocument,
} from '../../lib/api/owner-verification';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

export const TenantVerificationManagement: React.FC = () => {
  const [tenants, setTenants] = useState<TenantVerification[]>([]);
  const [analytics, setAnalytics] = useState<TenantVerificationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<TenantVerificationDetails | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [resubmitReason, setResubmitReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [tenantToDelete, setTenantToDelete] = useState<TenantVerification | null>(null);

  useEffect(() => {
    loadTenants();
  }, [filter, page, searchTerm]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await getTenantVerifications(filter, page, 20, searchTerm);
      if (response.data) {
        setTenants(response.data.tenants || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      console.error('Failed to load tenant verifications:', error);
      toast.error('Failed to load tenant verifications');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await getTenantVerificationAnalytics();
      if (response.data) {
        setAnalytics(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleViewDetails = async (tenantId: string) => {
    try {
      const response = await getTenantVerificationDetails(tenantId);
      if (response.data?.tenant) {
        setSelectedTenant(response.data.tenant);
        setShowDetailModal(true);
      }
    } catch (error: any) {
      toast.error('Failed to load tenant details');
    }
  };

  const handleApprove = async () => {
    if (!selectedTenant) return;

    try {
      setActionLoading(true);
      const response = await approveTenantKyc(selectedTenant.id, approvalNotes);
      if (response.data?.success) {
        toast.success('Tenant KYC approved successfully');
        setShowApproveModal(false);
        setShowDetailModal(false);
        setApprovalNotes('');
        await loadTenants();
        await loadAnalytics();
      } else {
        toast.error(response.error?.message || 'Failed to approve');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve tenant KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTenant || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const response = await rejectTenantKyc(selectedTenant.id, rejectionReason);
      if (response.data?.success) {
        toast.success('Tenant KYC rejected');
        setShowRejectModal(false);
        setShowDetailModal(false);
        setRejectionReason('');
        await loadTenants();
        await loadAnalytics();
      } else {
        toast.error(response.error?.message || 'Failed to reject');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject tenant KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestResubmit = async () => {
    if (!selectedTenant) return;

    try {
      setActionLoading(true);
      const response = await requestKycResubmit(selectedTenant.id, resubmitReason);
      if (response.data?.success) {
        toast.success('Resubmission request sent to tenant');
        setShowResubmitModal(false);
        setShowDetailModal(false);
        setResubmitReason('');
        await loadTenants();
      } else {
        toast.error(response.error?.message || 'Failed to request resubmission');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to request resubmission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVerification = async () => {
    if (!tenantToDelete) return;

    try {
      setActionLoading(true);
      const response = await deleteTenantVerification(tenantToDelete.id, deleteReason);
      if (response.data?.success) {
        toast.success('Verification deleted. Tenant can now submit a new verification request.');
        setShowDeleteModal(false);
        setTenantToDelete(null);
        setDeleteReason('');
        await loadTenants();
        await loadAnalytics();
      } else {
        toast.error(response.error?.message || 'Failed to delete verification');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete verification');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string | null, ownerStatus: string) => {
    if (ownerStatus === 'approved' || status === 'verified' || status === 'owner_approved') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (ownerStatus === 'rejected' || status === 'rejected') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (status === 'in_progress') {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  const getStatusBadge = (status: string | null, ownerStatus: string) => {
    if (ownerStatus === 'approved' || status === 'verified' || status === 'owner_approved') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
    }
    if (ownerStatus === 'rejected' || status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
    }
    if (status === 'in_progress') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In Progress</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Pending</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewDocument = async (document: VerificationDocument) => {
    if (!selectedTenant) return;

    try {
      setDownloadingDocId(document.id);
      const response = await getTenantDocumentUrl(selectedTenant.id, document.id);

      // Handle nested url structure: response.data.url can be a string or an object with url property
      const urlData = response.data?.url;
      const documentUrl = typeof urlData === 'string' ? urlData : urlData?.url;

      if (documentUrl) {
        // Open in new tab
        window.open(documentUrl, '_blank');
      } else {
        toast.error('Failed to get document URL');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to view document');
    } finally {
      setDownloadingDocId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      passport: 'Passport',
      national_id: 'National ID',
      drivers_license: "Driver's License",
      voters_card: "Voter's Card",
      selfie: 'Selfie Photo',
      utility_bill: 'Utility Bill',
      bank_statement: 'Bank Statement',
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const filterOptions = [
    { value: 'all', label: 'All Tenants' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'owner_approved', label: 'Approved' },
    { value: 'owner_rejected', label: 'Rejected' },
    { value: 'verified', label: 'Verified' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Verification</h1>
          <p className="text-gray-600 mt-1">Review and approve tenant KYC submissions</p>
        </div>
        <Button onClick={() => { loadTenants(); loadAnalytics(); }} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.summary.total}</p>
                  <p className="text-xs text-gray-500">Total Tenants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.summary.pendingReview}</p>
                  <p className="text-xs text-gray-500">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.summary.ownerApproved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.summary.ownerRejected}</p>
                  <p className="text-xs text-gray-500">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.summary.verified}</p>
                  <p className="text-xs text-gray-500">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.summary.approvalRate}%</p>
                  <p className="text-xs text-gray-500">Approval Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setFilter(option.value); setPage(1); }}
                  className={filter === option.value ? 'bg-gray-900 text-white' : ''}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center p-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tenants found</p>
              <p className="text-gray-400 text-sm mt-1">
                {filter !== 'all' ? 'Try changing the filter' : 'Add tenants to see their verification status'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[250px]">Tenant</TableHead>
                    <TableHead>Property / Unit</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={tenant.avatar || undefined} />
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                              {getInitials(tenant.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{tenant.name}</p>
                            <p className="text-xs text-gray-500">{tenant.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.property ? (
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{tenant.property.name}</p>
                            {tenant.unit && (
                              <p className="text-xs text-gray-500">Unit {tenant.unit.unitNumber}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tenant.phone ? (
                          <span className="text-sm text-gray-600">{tenant.phone}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tenant.kycStatus, tenant.ownerApprovalStatus)}
                          {getStatusBadge(tenant.kycStatus, tenant.ownerApprovalStatus)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(tenant.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {tenant.ownerApprovalStatus === 'pending' && tenant.kycStatus === 'in_progress' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    handleViewDetails(tenant.id);
                                    setTimeout(() => setShowApproveModal(true), 300);
                                  }}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    handleViewDetails(tenant.id);
                                    setTimeout(() => setShowRejectModal(true), 300);
                                  }}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {(tenant.ownerApprovalStatus === 'rejected' || tenant.kycStatus === 'rejected') && (
                              <DropdownMenuItem
                                onClick={() => {
                                  handleViewDetails(tenant.id);
                                  setTimeout(() => setShowResubmitModal(true), 300);
                                }}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Request Resubmit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setTenantToDelete(tenant);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Verification
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tenant Verification Details</DialogTitle>
            <DialogDescription>
              Review tenant KYC information and take action
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6">
              {/* Tenant Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedTenant.avatar || undefined} />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xl">
                    {getInitials(selectedTenant.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedTenant.name}</h3>
                  <p className="text-gray-500">{selectedTenant.email}</p>
                  {selectedTenant.phone && (
                    <p className="text-gray-500">{selectedTenant.phone}</p>
                  )}
                </div>
                <div className="ml-auto">
                  {getStatusBadge(selectedTenant.kycStatus, selectedTenant.ownerApprovalStatus)}
                </div>
              </div>

              {/* Property Info */}
              {selectedTenant.property && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Property Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Property</p>
                      <p className="font-medium">{selectedTenant.property.name}</p>
                    </div>
                    {selectedTenant.unit && (
                      <div>
                        <p className="text-gray-500">Unit</p>
                        <p className="font-medium">{selectedTenant.unit.unitNumber}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">Address</p>
                      <p className="font-medium">{selectedTenant.property.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* KYC Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">KYC Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">KYC Status</p>
                    <p className="font-medium capitalize">{selectedTenant.kycStatus?.replace('_', ' ') || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Owner Approval</p>
                    <p className="font-medium capitalize">{selectedTenant.ownerApprovalStatus}</p>
                  </div>
                  {selectedTenant.kycLastAttemptAt && (
                    <div>
                      <p className="text-gray-500">Last Submission</p>
                      <p className="font-medium">
                        {new Date(selectedTenant.kycLastAttemptAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedTenant.ownerReviewedAt && (
                    <div>
                      <p className="text-gray-500">Reviewed At</p>
                      <p className="font-medium">
                        {new Date(selectedTenant.ownerReviewedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {selectedTenant.kycFailureReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {selectedTenant.kycFailureReason}
                    </p>
                  </div>
                )}

                {selectedTenant.ownerNotes && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Owner Notes:</strong> {selectedTenant.ownerNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Documents */}
              {selectedTenant.documents && selectedTenant.documents.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Uploaded Documents ({selectedTenant.documents.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTenant.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded">
                            <FileText className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {getDocumentTypeLabel(doc.documentType)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.fileName} • {formatFileSize(doc.fileSize)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              doc.status === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : doc.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {doc.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(doc)}
                            disabled={downloadingDocId === doc.id}
                            className="h-8 w-8 p-0"
                          >
                            {downloadingDocId === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Documents Message */}
              {(!selectedTenant.documents || selectedTenant.documents.length === 0) && selectedTenant.kycStatus === 'in_progress' && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">Documents not yet available</p>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    The tenant is in the process of uploading their verification documents.
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedTenant.ownerApprovalStatus === 'pending' && selectedTenant.kycStatus === 'in_progress' && (
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectModal(true)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => setShowApproveModal(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}

              {(selectedTenant.ownerApprovalStatus === 'rejected' || selectedTenant.kycStatus === 'rejected') && (
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowResubmitModal(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Request Resubmission
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Tenant KYC</DialogTitle>
            <DialogDescription>
              Confirm approval of {selectedTenant?.name}'s identity verification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add any notes (optional)..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Tenant KYC</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedTenant?.name}'s verification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionReason.trim() || actionLoading}
              variant="destructive"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resubmit Modal */}
      <Dialog open={showResubmitModal} onOpenChange={setShowResubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request KYC Resubmission</DialogTitle>
            <DialogDescription>
              Ask {selectedTenant?.name} to resubmit their KYC documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Explain what needs to be corrected (optional)..."
              value={resubmitReason}
              onChange={(e) => setResubmitReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResubmitModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestResubmit} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Verification Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Verification Request</DialogTitle>
            <DialogDescription>
              This will delete {tenantToDelete?.name}'s verification request and reset their KYC status.
              The tenant will need to submit a new verification request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Warning</p>
                  <p className="text-sm text-yellow-700">
                    This action will permanently delete all uploaded documents and verification history for this tenant.
                  </p>
                </div>
              </div>
            </div>
            <Textarea
              placeholder="Reason for deletion (optional)..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setTenantToDelete(null);
                setDeleteReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteVerification}
              disabled={actionLoading}
              variant="destructive"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantVerificationManagement;

