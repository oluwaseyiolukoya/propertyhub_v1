import React, { useState, useEffect } from "react";
import { publicAdminApi } from "../../../lib/api/publicAdminApi";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import {
  Mail,
  Phone,
  Building2,
  User,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { canEditContent } from "../../../lib/utils/adminPermissions";

interface Submission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  subject?: string;
  message: string;
  status: string;
  priority: string;
  adminNotes?: string;
  createdAt: string;
  metadata?: {
    customFields?: {
      inquiryType?: string;
    };
    [key: string]: any;
  };
}

export function ContactUsSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    closed: 0,
  });
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    search: "",
    page: 1,
    limit: 20,
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    status: "",
    priority: "",
    adminNotes: "",
  });

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await publicAdminApi.forms.getContactUs({
        status:
          debouncedFilters.status && debouncedFilters.status !== "all"
            ? debouncedFilters.status
            : undefined,
        priority:
          debouncedFilters.priority && debouncedFilters.priority !== "all"
            ? debouncedFilters.priority
            : undefined,
        search: debouncedFilters.search || undefined,
        page: debouncedFilters.page,
        limit: debouncedFilters.limit,
      });

      if (response.success) {
        setSubmissions(response.data.submissions);
        setPagination(response.data.pagination);
        setStats(response.data.stats);
      } else {
        toast.error("Failed to load submissions");
      }
    } catch (error: any) {
      console.error("Error loading submissions:", error);
      toast.error(error.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input (but not status/priority/page changes)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters((prev) => ({
        ...prev,
        search: filters.search,
        page: 1, // Reset page to 1 when search changes
      }));
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Immediately update filters for status/priority/page (no debounce needed)
  useEffect(() => {
    if (filters.status !== debouncedFilters.status ||
        filters.priority !== debouncedFilters.priority ||
        filters.page !== debouncedFilters.page) {
      setDebouncedFilters((prev) => ({
        ...prev,
        status: filters.status,
        priority: filters.priority,
        page: filters.page,
      }));
    }
  }, [filters.status, filters.priority, filters.page]);

  // Load submissions when debounced filters change
  useEffect(() => {
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters]);

  const handleView = (submission: Submission) => {
    setSelectedSubmission(submission);
    setViewDialogOpen(true);
  };

  const handleEdit = (submission: Submission) => {
    setSelectedSubmission(submission);
    setEditData({
      status: submission.status,
      priority: submission.priority,
      adminNotes: submission.adminNotes || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSubmission) return;

    try {
      const response = await publicAdminApi.forms.updateContactUs(
        selectedSubmission.id,
        editData
      );

      if (response.success) {
        toast.success("Submission updated successfully");
        setEditDialogOpen(false);
        loadSubmissions();
      } else {
        toast.error("Failed to update submission");
      }
    } catch (error: any) {
      console.error("Error updating submission:", error);
      toast.error(error.message || "Failed to update submission");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) {
      return;
    }

    try {
      const response = await publicAdminApi.forms.deleteContactUs(id);

      if (response.success) {
        toast.success("Submission deleted successfully");
        loadSubmissions();
      } else {
        toast.error("Failed to delete submission");
      }
    } catch (error: any) {
      console.error("Error deleting submission:", error);
      toast.error(error.message || "Failed to delete submission");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      new: "bg-blue-500",
      contacted: "bg-yellow-500",
      qualified: "bg-green-500",
      closed: "bg-gray-500",
    };
    return (
      <Badge className={variants[status] || "bg-gray-500"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      low: "bg-gray-500",
      normal: "bg-blue-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    };
    return (
      <Badge className={variants[priority] || "bg-gray-500"}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
          <p className="text-gray-500 mt-1">Manage contact form submissions</p>
        </div>
        <Button onClick={loadSubmissions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600">New</div>
          <div className="text-2xl font-bold text-blue-900">{stats.new}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-600">Contacted</div>
          <div className="text-2xl font-bold text-yellow-900">
            {stats.contacted}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600">Qualified</div>
          <div className="text-2xl font-bold text-green-900">
            {stats.qualified}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Closed</div>
          <div className="text-2xl font-bold text-gray-900">{stats.closed}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Label className="text-xs text-gray-500 mb-1">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, company, subject..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
                className="pl-10"
              />
            </div>
          </div>
          <div className="min-w-[150px]">
            <Label className="text-xs text-gray-500 mb-1">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[150px]">
            <Label className="text-xs text-gray-500 mb-1">Priority</Label>
            <Select
              value={filters.priority}
              onValueChange={(value) =>
                setFilters({ ...filters, priority: value, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            No submissions found
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.name}
                    </TableCell>
                    <TableCell>{submission.email}</TableCell>
                    <TableCell>
                      {submission.subject || (
                        <span className="text-gray-400 italic">No subject</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>
                      {getPriorityBadge(submission.priority)}
                    </TableCell>
                    <TableCell>{formatDate(submission.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEditContent() ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(submission)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(submission.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">View only</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} submissions
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFilters({ ...filters, page: filters.page - 1 })
                    }
                    disabled={filters.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFilters({ ...filters, page: filters.page + 1 })
                    }
                    disabled={filters.page >= pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Us Submission Details</DialogTitle>
            <DialogDescription>
              View full submission information
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {selectedSubmission.name}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedSubmission.email}</span>
                  </div>
                </div>
                {selectedSubmission.phone && (
                  <div>
                    <Label className="text-xs text-gray-500">Phone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedSubmission.phone}</span>
                    </div>
                  </div>
                )}
                {selectedSubmission.company && (
                  <div>
                    <Label className="text-xs text-gray-500">Company</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{selectedSubmission.company}</span>
                    </div>
                  </div>
                )}
                {selectedSubmission.jobTitle && (
                  <div>
                    <Label className="text-xs text-gray-500">Job Title</Label>
                    <div className="mt-1">{selectedSubmission.jobTitle}</div>
                  </div>
                )}
                {selectedSubmission.subject && (
                  <div>
                    <Label className="text-xs text-gray-500">Subject</Label>
                    <div className="mt-1">{selectedSubmission.subject}</div>
                  </div>
                )}
                {selectedSubmission.metadata?.customFields?.inquiryType && (
                  <div>
                    <Label className="text-xs text-gray-500">
                      Inquiry Type
                    </Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="capitalize">
                        {selectedSubmission.metadata.customFields.inquiryType}
                      </Badge>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedSubmission.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Priority</Label>
                  <div className="mt-1">
                    {getPriorityBadge(selectedSubmission.priority)}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Message</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-gray-400 mb-2" />
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedSubmission.message}
                  </p>
                </div>
              </div>
              {selectedSubmission.adminNotes && (
                <div>
                  <Label className="text-xs text-gray-500">Admin Notes</Label>
                  <div className="mt-1 p-3 bg-yellow-50 rounded-lg text-sm">
                    {selectedSubmission.adminNotes}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Submitted</Label>
                <div className="mt-1 text-sm text-gray-600">
                  {formatDate(selectedSubmission.createdAt)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedSubmission && canEditContent() && (
              <Button onClick={() => handleEdit(selectedSubmission)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {canEditContent() && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Submission</DialogTitle>
              <DialogDescription>
                Update submission status and notes
              </DialogDescription>
            </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select
                value={editData.status}
                onValueChange={(value) =>
                  setEditData({ ...editData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={editData.priority}
                onValueChange={(value) =>
                  setEditData({ ...editData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Admin Notes</Label>
              <Textarea
                value={editData.adminNotes}
                onChange={(e) =>
                  setEditData({ ...editData, adminNotes: e.target.value })
                }
                placeholder="Add internal notes..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
