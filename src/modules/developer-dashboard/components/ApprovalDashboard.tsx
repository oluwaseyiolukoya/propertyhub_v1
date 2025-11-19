import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Filter,
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { toast } from 'sonner';
import {
  getPendingApprovals,
  approveInvoice,
  rejectInvoice,
  getApprovalStats,
  type PendingApproval,
  type ApprovalStats,
} from '../../../lib/api/approvals';

export const ApprovalDashboard: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'createdDate'>('dueDate');

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);

  // Form states
  const [approveComments, setApproveComments] = useState('');
  const [rejectComments, setRejectComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [sortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [approvalsRes, statsRes] = await Promise.all([
        getPendingApprovals({ sort: sortBy, limit: 50 }),
        getApprovalStats(),
      ]);

      if (approvalsRes.data) {
        setPendingApprovals(approvalsRes.data.data || []);
      }

      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error loading approval data:', error);
      toast.error('Failed to load approval data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;

    setSubmitting(true);
    try {
      const response = await approveInvoice(selectedApproval.id, {
        comments: approveComments,
      });

      if (response.error) {
        toast.error(response.error.message || 'Failed to approve invoice');
        return;
      }

      toast.success('Invoice approved successfully!');
      setShowApproveModal(false);
      setSelectedApproval(null);
      setApproveComments('');
      loadData();
    } catch (error) {
      console.error('Error approving invoice:', error);
      toast.error('Failed to approve invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !rejectComments) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);
    try {
      const response = await rejectInvoice(selectedApproval.id, {
        comments: rejectComments,
        reason: rejectReason,
      });

      if (response.error) {
        toast.error(response.error.message || 'Failed to reject invoice');
        return;
      }

      toast.success('Invoice rejected');
      setShowRejectModal(false);
      setSelectedApproval(null);
      setRejectComments('');
      setRejectReason('');
      loadData();
    } catch (error) {
      console.error('Error rejecting invoice:', error);
      toast.error('Failed to reject invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const openApproveModal = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setShowApproveModal(true);
  };

  const openRejectModal = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setShowRejectModal(true);
  };

  const openDetailModal = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setShowDetailModal(true);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getUrgencyBadge = (hoursRemaining?: number) => {
    if (!hoursRemaining) return null;

    if (hoursRemaining < 0) {
      return <Badge className="bg-red-500">Overdue</Badge>;
    } else if (hoursRemaining < 6) {
      return <Badge className="bg-orange-500">Due Soon</Badge>;
    } else if (hoursRemaining < 24) {
      return <Badge className="bg-yellow-500">Due Today</Badge>;
    }
    return <Badge className="bg-green-500">On Track</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approval data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Approval Dashboard</h2>
          <p className="text-gray-600 mt-1">Review and approve pending invoices</p>
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="createdDate">Created Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApprovals}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalApprovals > 0
                  ? `${Math.round((stats.approved / stats.totalApprovals) * 100)}% approval rate`
                  : '0% approval rate'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg. Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageApprovalTime.toFixed(1)}h</div>
              <p className="text-xs text-gray-500 mt-1">Average approval time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals ({pendingApprovals.length})</CardTitle>
          <CardDescription>Invoices waiting for your approval</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">All caught up!</p>
              <p className="text-gray-500 text-sm mt-1">No pending approvals at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {approval.invoice.invoiceNumber}
                        </h4>
                        {getUrgencyBadge(approval.hoursRemaining)}
                        <Badge variant="outline">Level {approval.level}</Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(approval.invoice.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Vendor</p>
                          <p className="font-semibold text-gray-900">
                            {approval.invoice.vendor?.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Category</p>
                          <p className="font-semibold text-gray-900 capitalize">
                            {approval.invoice.category}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Due</p>
                          <p className="font-semibold text-gray-900">
                            {approval.dueAt ? formatDate(approval.dueAt) : 'No deadline'}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        {approval.invoice.description}
                      </p>

                      {approval.invoice.project && (
                        <p className="text-xs text-gray-500">
                          Project: {approval.invoice.project.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailModal(approval)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => openApproveModal(approval)}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openRejectModal(approval)}
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Statistics by Level */}
      {stats && stats.byLevel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Approval Level</CardTitle>
            <CardDescription>Average approval time and success rate per level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byLevel.map((level) => (
                <div key={level.level} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{level.name}</h4>
                    <Badge>Level {level.level}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Avg. Time</p>
                      <p className="font-semibold">{level.averageTime.toFixed(1)}h</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Approved</p>
                      <p className="font-semibold text-green-600">{level.approved}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Rejected</p>
                      <p className="font-semibold text-red-600">{level.rejected}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pending</p>
                      <p className="font-semibold text-orange-600">{level.pending}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Invoice</DialogTitle>
            <DialogDescription>
              You are about to approve invoice {selectedApproval?.invoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedApproval.invoice.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-semibold">
                    {selectedApproval.invoice.vendor?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-semibold capitalize">
                    {selectedApproval.invoice.category}
                  </span>
                </div>
              </div>
              <div>
                <Label htmlFor="approveComments">Comments (Optional)</Label>
                <Textarea
                  id="approveComments"
                  value={approveComments}
                  onChange={(e) => setApproveComments(e.target.value)}
                  placeholder="Add any comments about this approval..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveModal(false);
                setApproveComments('');
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Approving...' : 'Approve Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Invoice</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting invoice {selectedApproval?.invoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4 py-4">
              <div className="bg-red-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedApproval.invoice.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-semibold">
                    {selectedApproval.invoice.vendor?.name || 'N/A'}
                  </span>
                </div>
              </div>
              <div>
                <Label htmlFor="rejectReason">Reason</Label>
                <Select value={rejectReason} onValueChange={setRejectReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pricing_issue">Pricing Issue</SelectItem>
                    <SelectItem value="budget_exceeded">Budget Exceeded</SelectItem>
                    <SelectItem value="unauthorized">Unauthorized Purchase</SelectItem>
                    <SelectItem value="duplicate">Duplicate Invoice</SelectItem>
                    <SelectItem value="incorrect_details">Incorrect Details</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rejectComments">Comments *</Label>
                <Textarea
                  id="rejectComments"
                  value={rejectComments}
                  onChange={(e) => setRejectComments(e.target.value)}
                  placeholder="Explain why you are rejecting this invoice..."
                  rows={4}
                  required
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectComments('');
                setRejectReason('');
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting || !rejectComments}
            >
              {submitting ? 'Rejecting...' : 'Reject Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedApproval?.invoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Number</Label>
                  <p className="font-semibold">{selectedApproval.invoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="font-semibold text-lg">
                    {formatCurrency(selectedApproval.invoice.amount)}
                  </p>
                </div>
                <div>
                  <Label>Vendor</Label>
                  <p className="font-semibold">
                    {selectedApproval.invoice.vendor?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="font-semibold capitalize">
                    {selectedApproval.invoice.category}
                  </p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="font-semibold">
                    {formatDate(selectedApproval.invoice.createdAt)}
                  </p>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <p className="font-semibold">
                    {selectedApproval.dueAt ? formatDate(selectedApproval.dueAt) : 'No deadline'}
                  </p>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-gray-700 mt-1">{selectedApproval.invoice.description}</p>
              </div>
              {selectedApproval.invoice.project && (
                <div>
                  <Label>Project</Label>
                  <p className="font-semibold">{selectedApproval.invoice.project.name}</p>
                </div>
              )}
              <div>
                <Label>Approval Level</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge>Level {selectedApproval.level}</Badge>
                  {selectedApproval.levelName && (
                    <span className="text-sm text-gray-600">{selectedApproval.levelName}</span>
                  )}
                </div>
              </div>
              {selectedApproval.workflow && (
                <div>
                  <Label>Workflow</Label>
                  <p className="font-semibold">{selectedApproval.workflow.name}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setShowDetailModal(false);
                if (selectedApproval) openApproveModal(selectedApproval);
              }}
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDetailModal(false);
                if (selectedApproval) openRejectModal(selectedApproval);
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

