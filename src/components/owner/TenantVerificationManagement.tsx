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
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Tenant Verification</h1>
              <p className="text-purple-100 mt-1">Review and approve tenant KYC submissions</p>
            </div>
          </div>
          <Button
            onClick={() => { loadTenants(); loadAnalytics(); }}
            className="bg-white text-[#7C3AED] hover:bg-purple-50 shadow-md"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{analytics.summary.total}</p>
                  <p className="text-sm text-gray-600 font-medium mt-1">Total Tenants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-md">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{analytics.summary.pendingReview}</p>
                  <p className="text-sm text-gray-600 font-medium mt-1">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-md">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{analytics.summary.ownerApproved}</p>
                  <p className="text-sm text-gray-600 font-medium mt-1">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl shadow-md">
                  <ShieldAlert className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{analytics.summary.ownerRejected}</p>
                  <p className="text-sm text-gray-600 font-medium mt-1">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-3 rounded-xl shadow-md">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{analytics.summary.verified}</p>
                  <p className="text-sm text-gray-600 font-medium mt-1">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-md">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{analytics.summary.approvalRate}%</p>
                  <p className="text-sm text-gray-600 font-medium mt-1">Approval Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-[#7C3AED] shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#7C3AED]" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setFilter(option.value); setPage(1); }}
                  className={filter === option.value
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md hover:shadow-lg border-0'
                    : 'border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]'
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant List */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center p-12">
              <div className="bg-purple-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-10 w-10 text-[#7C3AED]" />
              </div>
              <p className="text-gray-900 font-semibold text-lg">No tenants found</p>
              <p className="text-gray-500 text-sm mt-2">
                {filter !== 'all' ? 'Try changing the filter' : 'Add tenants to see their verification status'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#111827] hover:bg-[#111827]">
                    <TableHead className="w-[250px] text-white font-semibold">Tenant</TableHead>
                    <TableHead className="text-white font-semibold">Property / Unit</TableHead>
                    <TableHead className="text-white font-semibold">Contact</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                    <TableHead className="text-white font-semibold">Date</TableHead>
                    <TableHead className="text-right text-white font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant, index) => (
                    <TableRow
                      key={tenant.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-[#7C3AED]/5 transition-colors`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-purple-100">
                            <AvatarImage src={tenant.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white font-semibold">
                              {getInitials(tenant.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{tenant.name}</p>
                            <p className="text-xs text-gray-500">{tenant.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.property ? (
                          <div className="text-sm">
                            <p className="font-semibold text-gray-900">{tenant.property.name}</p>
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
                          <span className="text-sm text-gray-700">{tenant.phone}</span>
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
                        <span className="text-sm text-gray-600 font-medium">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-purple-100">
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-lg">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(tenant.id)}
                              className="cursor-pointer"
                            >
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
                                  className="text-green-600 cursor-pointer"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    handleViewDetails(tenant.id);
                                    setTimeout(() => setShowRejectModal(true), 300);
                                  }}
                                  className="text-red-600 cursor-pointer"
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
                                className="cursor-pointer"
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
                              className="text-red-600 cursor-pointer"
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
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]"
              >
                Previous
              </Button>
              <span className="text-sm font-semibold text-gray-700">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -mx-6 -mt-6 px-6 py-4 rounded-t-xl">
            <DialogTitle className="text-white text-xl">Tenant Verification Details</DialogTitle>
            <DialogDescription className="text-purple-100">
              Review tenant KYC information and take action
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6 mt-4">
              {/* Tenant Info */}
              <div className="flex items-center gap-4 bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border-2 border-purple-200">
                <Avatar className="h-16 w-16 border-2 border-purple-300">
                  <AvatarImage src={selectedTenant.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white text-xl font-bold">
                    {getInitials(selectedTenant.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{selectedTenant.name}</h3>
                  <p className="text-gray-600 font-medium">{selectedTenant.email}</p>
                  {selectedTenant.phone && (
                    <p className="text-gray-600">{selectedTenant.phone}</p>
                  )}
                </div>
                <div className="ml-auto">
                  {getStatusBadge(selectedTenant.kycStatus, selectedTenant.ownerApprovalStatus)}
                </div>
              </div>

              {/* Property Info */}
              {selectedTenant.property && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900">Property Information</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <p className="text-gray-500 text-xs font-semibold mb-1">Property</p>
                      <p className="font-bold text-gray-900">{selectedTenant.property.name}</p>
                    </div>
                    {selectedTenant.unit && (
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <p className="text-gray-500 text-xs font-semibold mb-1">Unit</p>
                        <p className="font-bold text-gray-900">{selectedTenant.unit.unitNumber}</p>
                      </div>
                    )}
                    <div className="bg-white p-3 rounded-lg border border-blue-200 col-span-2">
                      <p className="text-gray-500 text-xs font-semibold mb-1">Address</p>
                      <p className="font-bold text-gray-900">{selectedTenant.property.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* KYC Status */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-2 rounded-lg">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">KYC Status</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <p className="text-gray-500 text-xs font-semibold mb-1">KYC Status</p>
                    <p className="font-bold text-gray-900 capitalize">{selectedTenant.kycStatus?.replace('_', ' ') || 'Pending'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <p className="text-gray-500 text-xs font-semibold mb-1">Owner Approval</p>
                    <p className="font-bold text-gray-900 capitalize">{selectedTenant.ownerApprovalStatus}</p>
                  </div>
                  {selectedTenant.kycLastAttemptAt && (
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <p className="text-gray-500 text-xs font-semibold mb-1">Last Submission</p>
                      <p className="font-bold text-gray-900">
                        {new Date(selectedTenant.kycLastAttemptAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedTenant.ownerReviewedAt && (
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <p className="text-gray-500 text-xs font-semibold mb-1">Reviewed At</p>
                      <p className="font-bold text-gray-900">
                        {new Date(selectedTenant.ownerReviewedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {selectedTenant.kycFailureReason && (
                  <div className="mt-4 p-3 bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-xl">
                    <p className="text-sm text-red-800 font-medium">
                      <strong className="font-bold">Rejection Reason:</strong> {selectedTenant.kycFailureReason}
                    </p>
                  </div>
                )}

                {selectedTenant.ownerNotes && (
                  <div className="mt-4 p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800 font-medium">
                      <strong className="font-bold">Owner Notes:</strong> {selectedTenant.ownerNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Documents */}
              {selectedTenant.documents && selectedTenant.documents.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900">
                      Uploaded Documents ({selectedTenant.documents.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {selectedTenant.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-white border-2 border-green-200 rounded-xl hover:border-green-400 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                            <FileText className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {getDocumentTypeLabel(doc.documentType)}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {doc.fileName} • {formatFileSize(doc.fileSize)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              doc.status === 'verified'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : doc.status === 'rejected'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }
                          >
                            {doc.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(doc)}
                            disabled={downloadingDocId === doc.id}
                            className="h-8 w-8 p-0 hover:bg-green-100"
                          >
                            {downloadingDocId === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                            ) : (
                              <ExternalLink className="h-4 w-4 text-green-600" />
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
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500 p-2 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-900">Documents not yet available</p>
                      <p className="text-sm text-amber-700 mt-1">
                        The tenant is in the process of uploading their verification documents.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedTenant.ownerApprovalStatus === 'pending' && selectedTenant.kycStatus === 'in_progress' && (
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectModal(true)}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => setShowApproveModal(true)}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}

              {(selectedTenant.ownerApprovalStatus === 'rejected' || selectedTenant.kycStatus === 'rejected') && (
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowResubmitModal(true)}
                    className="border-purple-300 text-[#7C3AED] hover:bg-purple-50 hover:border-[#7C3AED]"
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
        <DialogContent className="border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-green-600 to-green-700 -mx-6 -mt-6 px-6 py-4 rounded-t-xl">
            <DialogTitle className="text-white text-xl">Approve Tenant KYC</DialogTitle>
            <DialogDescription className="text-green-100">
              Confirm approval of {selectedTenant?.name}'s identity verification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Notes (Optional)
              </label>
              <Textarea
                placeholder="Add any notes..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
                className="border-gray-300 focus:border-green-500 focus:ring-green-500 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
              className="border-gray-300 hover:border-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md"
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
        <DialogContent className="border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-red-600 to-red-700 -mx-6 -mt-6 px-6 py-4 rounded-t-xl">
            <DialogTitle className="text-white text-xl">Reject Tenant KYC</DialogTitle>
            <DialogDescription className="text-red-100">
              Please provide a reason for rejecting {selectedTenant?.name}'s verification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
                className="border-gray-300 focus:border-red-500 focus:ring-red-500 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              className="border-gray-300 hover:border-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionReason.trim() || actionLoading}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md"
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
        <DialogContent className="border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -mx-6 -mt-6 px-6 py-4 rounded-t-xl">
            <DialogTitle className="text-white text-xl">Request KYC Resubmission</DialogTitle>
            <DialogDescription className="text-purple-100">
              Ask {selectedTenant?.name} to resubmit their KYC documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Instructions (Optional)
              </label>
              <Textarea
                placeholder="Explain what needs to be corrected..."
                value={resubmitReason}
                onChange={(e) => setResubmitReason(e.target.value)}
                rows={4}
                className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowResubmitModal(false)}
              className="border-gray-300 hover:border-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestResubmit}
              disabled={actionLoading}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
            >
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
        <DialogContent className="border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-red-600 to-red-700 -mx-6 -mt-6 px-6 py-4 rounded-t-xl">
            <DialogTitle className="text-white text-xl">Delete Verification Request</DialogTitle>
            <DialogDescription className="text-red-100">
              This will delete {tenantToDelete?.name}'s verification request and reset their KYC status.
              The tenant will need to submit a new verification request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 p-2 rounded-lg mt-0.5">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-amber-900">Warning</p>
                  <p className="text-sm text-amber-700 mt-1">
                    This action will permanently delete all uploaded documents and verification history for this tenant.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Reason (Optional)
              </label>
              <Textarea
                placeholder="Reason for deletion..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="border-gray-300 focus:border-red-500 focus:ring-red-500 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setTenantToDelete(null);
                setDeleteReason('');
              }}
              className="border-gray-300 hover:border-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteVerification}
              disabled={actionLoading}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md"
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

