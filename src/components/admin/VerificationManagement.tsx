import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  FileText,
  TrendingUp,
  Users,
  AlertCircle,
  Loader2,
  Download,
  ExternalLink,
  MoreVertical,
  Trash2,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { toast } from "sonner";
import {
  getVerificationRequests,
  getRequestDetails,
  approveVerification,
  rejectVerification,
  getVerificationAnalytics,
  getDocumentDownloadUrl,
  deleteVerificationRequest,
} from "../../lib/api/verification";
import { resetCustomerKyc } from "../../lib/api/verification";
import type {
  VerificationRequest,
  VerificationAnalytics,
} from "../../types/verification";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

export const VerificationManagement: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [analytics, setAnalytics] = useState<VerificationAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [requestToDelete, setRequestToDelete] =
    useState<VerificationRequest | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filter, page, emailSearch]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await getVerificationRequests(
        filter === "all" ? undefined : filter,
        page,
        20,
        emailSearch || undefined
      );

      if ((response as any).error) {
        const err = (response as any).error;
        console.error("Failed to load verification requests:", err);
        toast.error(
          err.message || err.error || "Failed to load verification requests"
        );
        // Ensure we don't crash the UI if the request fails
        setRequests([]);
        setTotalPages(1);
        return;
      }

      const data = (response as any).data;
      setRequests(data?.requests ?? []);
      setTotalPages(data?.pagination?.totalPages ?? 1);
    } catch (error: any) {
      toast.error("Failed to load verification requests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await getVerificationAnalytics();

      if ((response as any).error) {
        const err = (response as any).error;
        console.error("Failed to load analytics:", err);
        // Don't toast repeatedly here to avoid noise; just log it
        setAnalytics(null);
        return;
      }

      setAnalytics((response as any).data ?? null);
    } catch (error: any) {
      console.error("Failed to load analytics:", error);
    }
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      toast.info("Generating download link...");
      const response = await getDocumentDownloadUrl(documentId);

      if (response.data?.url) {
        // Open in new tab
        window.open(response.data.url, "_blank");
        toast.success("Document opened in new tab");
      } else {
        throw new Error("No download URL received");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to view document");
      console.error(error);
    }
  };

  const handleDownloadDocument = async (
    documentId: string,
    fileName: string
  ) => {
    try {
      toast.info("Preparing download...");
      const response = await getDocumentDownloadUrl(documentId);

      if (response.data?.url) {
        // Download file
        const link = document.createElement("a");
        link.href = response.data.url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started");
      } else {
        throw new Error("No download URL received");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to download document");
      console.error(error);
    }
  };

  const handleViewDetails = async (requestId: string) => {
    try {
      const response = await getRequestDetails(requestId);
      setSelectedRequest(response.data);
      setShowDetailModal(true);
    } catch (error: any) {
      toast.error("Failed to load request details");
    }
  };

  const handleApprove = async (requestId: string) => {
    if (
      !confirm("Are you sure you want to approve this verification request?")
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await approveVerification(requestId);
      toast.success("Verification approved successfully");
      setShowDetailModal(false);
      await loadRequests();
      await loadAnalytics();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to approve verification"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      await rejectVerification(selectedRequest.id, rejectionReason);
      toast.success("Verification rejected");
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectionReason("");
      await loadRequests();
      await loadAnalytics();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to reject verification"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (request: VerificationRequest) => {
    setRequestToDelete(request);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteVerificationRequest(requestToDelete.id);
      toast.success("Verification request deleted successfully");
      setShowDeleteDialog(false);
      setRequestToDelete(null);
      await loadRequests();
      await loadAnalytics();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to delete verification request"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetKyc = async (customerId: string) => {
    if (
      !confirm(
        "Reset KYC for this customer? They will be required to resubmit verification."
      )
    ) {
      return;
    }
    try {
      setActionLoading(true);
      const resp = await resetCustomerKyc(customerId);
      if ((resp as any).error) {
        throw new Error(
          (resp as any).error?.message ||
            (resp as any).error?.error ||
            "Failed to reset KYC"
        );
      }
      toast.success("Customer KYC reset successfully");
      await loadRequests();
      await loadAnalytics();
    } catch (error: any) {
      toast.error(error.message || "Failed to reset KYC");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "pending":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case "pending_review":
        return <Eye className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "pending_review":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Animated Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 p-8 shadow-2xl">
        {/* Animated background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <Shield className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <FileText className="h-16 w-16 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                Verification Management
              </h2>
              <p className="text-purple-100 text-lg">
                Review and manage customer verification requests •{" "}
                {analytics
                  ? `${analytics.summary.total} total requests`
                  : "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-blue-50/30">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Total Requests
              </CardTitle>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                {analytics.summary.total}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  All verification requests
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-yellow-50/30">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Pending
              </CardTitle>
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-yellow-900 bg-clip-text text-transparent">
                {analytics.summary.pending}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Awaiting review</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-green-50/30">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Approved
              </CardTitle>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-green-900 bg-clip-text text-transparent">
                {analytics.summary.approved}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Successfully verified
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-purple-50/30">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/30 to-violet-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Approval Rate
              </CardTitle>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
                {analytics.summary.approvalRate.toFixed(1)}%
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Success rate</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Search and Filter Section */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Search by customer email..."
                value={emailSearch}
                onChange={(e) => {
                  setEmailSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Filter by customer ID or request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
            </div>
            <Select
              value={filter}
              onValueChange={(value) => {
                setFilter(value);
                if (value === "all" && emailSearch) {
                  setEmailSearch("");
                }
                if (value === "all" && searchTerm) {
                  setSearchTerm("");
                }
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[220px] border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="All Requests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Requests Table */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Verification Requests
              </CardTitle>
              <CardDescription className="mt-1">
                {loading
                  ? "Loading..."
                  : `${filteredRequests.length} of ${requests.length} requests`}
              </CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                <p className="text-gray-600 font-medium ml-4">
                  Loading verification requests...
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-gray-100">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="text-gray-500 font-medium">
                    No verification requests found
                  </div>
                  <div className="text-sm text-gray-400">
                    {searchTerm || emailSearch || filter !== "all"
                      ? "Try adjusting your search or filters"
                      : "No verification requests available"}
                  </div>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700">
                      Request ID
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Customer Email
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Customer ID
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Type
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Documents
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Submitted
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="hover:bg-purple-50/30 transition-colors duration-150"
                    >
                      <TableCell className="font-mono text-sm text-gray-900">
                        {request.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {(request as any).customerEmail || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">
                        {request.customerId.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 capitalize">
                        {request.customerType.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {request.documents.length} docs
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <Badge
                            className={`${getStatusColor(
                              request.status
                            )} border`}
                          >
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(request.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResetKyc(request.customerId)}
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Reset KYC
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(request)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="text-sm font-medium text-gray-700">
                Page <span className="text-purple-600 font-bold">{page}</span>{" "}
                of{" "}
                <span className="text-purple-600 font-bold">{totalPages}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 hover:bg-purple-50"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 hover:bg-purple-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        {selectedRequest && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-lg flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <DialogTitle className="text-xl text-white">
                  Verification Request Details
                </DialogTitle>
              </div>
              <DialogDescription className="text-purple-100 mt-2">
                Request ID: {selectedRequest.id.substring(0, 8)}...
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Request ID</p>
                  <p className="font-mono text-sm">{selectedRequest.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer ID</p>
                  <p className="font-mono text-sm">
                    {selectedRequest.customerId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Type</p>
                  <p className="capitalize">
                    {selectedRequest.customerType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      selectedRequest.status
                    )}`}
                  >
                    {selectedRequest.status.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p>
                    {new Date(selectedRequest.submittedAt).toLocaleString()}
                  </p>
                </div>
                {selectedRequest.completedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p>
                      {new Date(selectedRequest.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedRequest.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800">
                    Rejection Reason:
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Documents ({selectedRequest.documents.length})
                </h3>
                <div className="space-y-3">
                  {selectedRequest.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium capitalize">
                              {doc.documentType.replace("_", " ")}
                            </p>
                            <p className="text-sm text-gray-600">
                              {doc.fileName}
                            </p>
                            {doc.confidence && (
                              <p className="text-sm text-gray-600 mt-1">
                                Confidence: {doc.confidence}%
                              </p>
                            )}
                            {doc.failureReason && (
                              <p className="text-sm text-red-600 mt-1">
                                Reason: {doc.failureReason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              doc.status
                            )}`}
                          >
                            {doc.status}
                          </span>
                          <button
                            onClick={() => handleViewDocument(doc.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View document"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadDocument(doc.id, doc.fileName)
                            }
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedRequest.status === "pending" ||
              selectedRequest.status === "in_progress" ? (
                <div className="flex gap-3 pt-4 border-t border-gray-200 flex-shrink-0">
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={actionLoading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    variant="destructive"
                    className="flex-1 shadow-lg"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject
                  </Button>
                </div>
              ) : null}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Enhanced Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader className="bg-gradient-to-r from-red-600 via-red-600 to-red-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <XCircle className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl text-white">
                Reject Verification
              </DialogTitle>
            </div>
            <DialogDescription className="text-red-100 mt-2">
              Please provide a reason for rejecting this verification request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="border-gray-200 focus:border-red-300 focus:ring-red-200"
            />
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading}
                variant="destructive"
                className="flex-1 shadow-lg"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Verification Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this verification request?
              {requestToDelete && (
                <span className="block mt-2 text-sm">
                  <strong>Request ID:</strong>{" "}
                  {requestToDelete.id.substring(0, 8)}...
                  <br />
                  <strong>Customer:</strong>{" "}
                  {(requestToDelete as any).customerEmail ||
                    requestToDelete.customerId.substring(0, 8) + "..."}
                </span>
              )}
              <span className="block mt-2 text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
