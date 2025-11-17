import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Search,
  Eye,
  Mail,
  Phone,
  Calendar,
  Download,
  Trash2,
  User,
  MessageSquare,
  RefreshCw,
  Archive,
  MoreVertical,
} from 'lucide-react';
import { getAllSubmissions, getSubmissionById, updateSubmission, addResponse, deleteSubmission, permanentDeleteSubmission } from '../../../lib/api/landing-forms';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatTicketId } from '../../../lib/utils/ticketFormatter';

interface FormSubmissionsProps {
  formType: string;
  title: string;
  description: string;
}

export function FormSubmissions({ formType, title, description }: FormSubmissionsProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    page: 1,
    limit: 5,
  });
  const [showArchived, setShowArchived] = useState(false);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    loadSubmissions();
  }, [filters, formType, showArchived]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);

      // Clean filters - remove 'all' values and empty strings
      const cleanFilters: any = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          cleanFilters[key] = value;
        }
      });

      // Add formType if not 'all'
      if (formType && formType !== 'all') {
        cleanFilters.formType = formType;
      }

      // Add archived flag
      cleanFilters.showArchived = showArchived;

      console.log('🔍 Loading submissions with filters:', cleanFilters);

      const response = await getAllSubmissions(cleanFilters);

      console.log('📦 API Response:', response);
      console.log('📊 Response data:', response.data);
      console.log('✅ Submissions data:', response.data?.data);

      if (response.data?.data) {
        setSubmissions(response.data.data.submissions || []);
        setPagination(response.data.data.pagination);
        console.log('✅ Set submissions:', response.data.data.submissions?.length || 0);
      } else if (response.error) {
        console.error('❌ API Error:', response.error);
        toast.error(`Error: ${response.error.error || 'Failed to load submissions'}`);
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        setSubmissions([]);
      }
    } catch (error: any) {
      console.error('❌ Load error:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const response = await getSubmissionById(id);
      if (response.data?.data) {
        setSelectedSubmission(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      toast.error('Failed to load submission details');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateSubmission(id, { status: newStatus });
      toast.success('Status updated successfully');
      loadSubmissions();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAddResponse = async (content: string, responseType: string) => {
    if (!selectedSubmission) return;

    try {
      await addResponse(selectedSubmission.id, {
        responseType: responseType as any,
        content,
      });
      toast.success('Response added successfully');
      await handleViewDetails(selectedSubmission.id); // Reload details
    } catch (error) {
      toast.error('Failed to add response');
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this submission? This will remove it from the list.')) {
      return;
    }

    try {
      await deleteSubmission(id);
      toast.success('Submission archived successfully');
      setShowDetailModal(false);
      loadSubmissions(); // Reload the list
    } catch (error) {
      toast.error('Failed to archive submission');
    }
  };

  const handleUnarchive = async (id: string) => {
    if (!confirm('Are you sure you want to restore this submission?')) {
      return;
    }

    try {
      // Update the submission to clear deletedAt
      await updateSubmission(id, { status: selectedSubmission.status });
      toast.success('Submission restored successfully');
      setShowDetailModal(false);
      loadSubmissions(); // Reload the list
    } catch (error) {
      toast.error('Failed to restore submission');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('⚠️ WARNING: This will permanently delete this submission from the database. This action cannot be undone. Are you sure you want to continue?')) {
      return;
    }

    try {
      await permanentDeleteSubmission(id);
      toast.success('Submission permanently deleted');
      setShowDetailModal(false);
      loadSubmissions(); // Reload the list
    } catch (error) {
      toast.error('Failed to delete submission');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      spam: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      low: 'border-gray-300 text-gray-700',
      normal: 'border-blue-300 text-blue-700',
      high: 'border-orange-300 text-orange-700',
      urgent: 'border-red-300 text-red-700',
    };

    return (
      <Badge variant="outline" className={variants[priority] || 'border-gray-300'}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-4 w-4 mr-2" />
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSubmissions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or message..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters({ ...filters, priority: value, page: 1 })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No submissions found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>{formType === 'schedule_demo' ? 'Preferred Date/Time' : 'Subject'}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-mono text-sm font-semibold text-blue-600">
                        {submission.ticketNumber ? formatTicketId(submission.ticketNumber) : 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">{submission.name}</TableCell>
                      <TableCell>{submission.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {submission.formType === 'schedule_demo' && submission.preferredDate ? (
                          <div className="text-sm">
                            <div className="font-medium text-purple-600">
                              {format(new Date(submission.preferredDate), 'MMM d, yyyy')}
                            </div>
                            <div className="text-gray-500">{submission.preferredTime || 'Time not set'}</div>
                          </div>
                        ) : (
                          submission.subject || submission.message.substring(0, 50) + '...'
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell>{getPriorityBadge(submission.priority)}</TableCell>
                      <TableCell>{format(new Date(submission.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {showArchived ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(submission.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePermanentDelete(submission.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(submission.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} submissions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedSubmission && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
              <DialogDescription>
                Submitted on {format(new Date(selectedSubmission.createdAt), 'PPpp')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Ticket ID */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Label className="text-blue-900 font-semibold">Ticket ID</Label>
                <p className="mt-1 font-mono text-2xl font-bold text-blue-700">
                  {selectedSubmission.ticketNumber ? formatTicketId(selectedSubmission.ticketNumber) : 'N/A'}
                </p>
              </div>

              {/* Status and Priority */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Status</Label>
                  <Select
                    value={selectedSubmission.status}
                    onValueChange={(value) => handleStatusChange(selectedSubmission.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Priority</Label>
                  {getPriorityBadge(selectedSubmission.priority)}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="mt-1">{selectedSubmission.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="mt-1">{selectedSubmission.email}</p>
                </div>
                {selectedSubmission.phone && (
                  <div>
                    <Label>Phone</Label>
                    <p className="mt-1">{selectedSubmission.phone}</p>
                  </div>
                )}
                {selectedSubmission.company && (
                  <div>
                    <Label>Company</Label>
                    <p className="mt-1">{selectedSubmission.company}</p>
                  </div>
                )}
                {selectedSubmission.jobTitle && (
                  <div>
                    <Label>Job Title</Label>
                    <p className="mt-1">{selectedSubmission.jobTitle}</p>
                  </div>
                )}
              </div>

              {/* Schedule Demo Specific Fields */}
              {selectedSubmission.formType === 'schedule_demo' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Demo Schedule Preferences
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSubmission.preferredDate && (
                      <div>
                        <Label className="text-purple-900">Preferred Date</Label>
                        <p className="mt-1 font-medium">
                          {format(new Date(selectedSubmission.preferredDate), 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    {selectedSubmission.preferredTime && (
                      <div>
                        <Label className="text-purple-900">Preferred Time</Label>
                        <p className="mt-1 font-medium">{selectedSubmission.preferredTime}</p>
                      </div>
                    )}
                    {selectedSubmission.timezone && (
                      <div className="col-span-2">
                        <Label className="text-purple-900">Timezone</Label>
                        <p className="mt-1 text-sm text-gray-600">{selectedSubmission.timezone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subject (for contact forms) */}
              {selectedSubmission.subject && (
                <div>
                  <Label>Subject</Label>
                  <p className="mt-1 font-medium">{selectedSubmission.subject}</p>
                </div>
              )}

              {/* Message */}
              <div>
                <Label>Message</Label>
                <p className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {selectedSubmission.message}
                </p>
              </div>

              {/* Responses */}
              {selectedSubmission.responses && selectedSubmission.responses.length > 0 && (
                <div>
                  <Label>Response History</Label>
                  <div className="mt-2 space-y-2">
                    {selectedSubmission.responses.map((response: any) => (
                      <div key={response.id} className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">{response.respondedBy.name}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(response.createdAt), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm">{response.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                {selectedSubmission.formType === 'schedule_demo' && (
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                )}
                <div className="ml-auto">
                  {showArchived ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleUnarchive(selectedSubmission.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleArchive(selectedSubmission.id)}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

