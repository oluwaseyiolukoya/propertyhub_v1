import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  File as FileIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import { getMaintenanceRequests, getMaintenanceRequest, createMaintenanceRequest, replyMaintenanceRequest } from '../lib/api/maintenance';
import { initializeSocket, isConnected, subscribeToMaintenanceEvents, unsubscribeFromMaintenanceEvents } from '../lib/socket';
import { apiClient } from '../lib/api-client';
import { FileUpload } from './FileUpload';
import { UploadedFile } from '../lib/api/uploads';

const TenantMaintenanceRequests: React.FC = () => {
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [replyNote, setReplyNote] = useState('');
  const [tenantLease, setTenantLease] = useState<{ propertyId?: string; unitId?: string } | null>(null);
  const [newRequest, setNewRequest] = useState({
    title: '',
    category: '',
    priority: 'medium',
    description: '',
    images: [] as string[]
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [replyFiles, setReplyFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    const loadLease = async () => {
      try {
        const res = await apiClient.get<any>('/api/tenant/lease');
        if (res.data) {
          setTenantLease({ propertyId: res.data.properties?.id, unitId: res.data.units?.id });
        }
      } catch {}
    };
    loadLease();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await getMaintenanceRequests();
      if (!res.error && Array.isArray(res.data)) {
        setTickets(res.data);
      } else if (res.error) {
        toast.error(res.error.error || 'Failed to load maintenance requests');
      }
    } catch {
      toast.error('Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // Realtime updates for maintenance
    try {
      const token = localStorage.getItem('auth_token') || '';
      if (token && !isConnected()) initializeSocket(token);
    } catch {}
    subscribeToMaintenanceEvents({
      onCreated: () => fetchTickets(),
      onUpdated: async (data: any) => {
        fetchTickets();
        // If the updated ticket is currently open, refresh its details
        if (selectedRequest && data?.id === selectedRequest.id) {
          try {
            const refreshResp = await getMaintenanceRequest(data.id);
            if (!refreshResp.error && refreshResp.data) {
              setSelectedRequest(refreshResp.data);
            }
          } catch {}
        }
      }
    });
    return () => {
      unsubscribeFromMaintenanceEvents();
    };
  }, [selectedRequest]);

  const categories = [
    "Plumbing",
    "Electrical",
    "HVAC",
    "Appliances",
    "Flooring",
    "Windows/Doors",
    "Pest Control",
    "Security",
    "Other"
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) =>
    (status || '')
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const formatPriority = (p: string) =>
    (p || '').charAt(0).toUpperCase() + (p || '').slice(1);

  const handleSubmitRequest = async () => {
    if (!tenantLease?.propertyId) {
      toast.error('No active lease found');
      return;
    }

    try {
      const resp = await createMaintenanceRequest({
        propertyId: tenantLease.propertyId,
        unitId: tenantLease.unitId,
        title: newRequest.title,
        description: newRequest.description,
        category: newRequest.category,
        priority: newRequest.priority,
        images: uploadedFiles.map(f => ({ url: f.url, originalName: f.originalName, mimetype: f.mimetype, size: f.size })),
      });

      if (resp.error) {
        toast.error(resp.error.error || 'Failed to submit request');
      } else {
        toast.success('Maintenance request submitted successfully');
    setShowNewRequestDialog(false);
        setNewRequest({ title: '', category: '', priority: 'medium', description: '', images: [] });
        setUploadedFiles([]);
        fetchTickets();
      }
    } catch {
      toast.error('Failed to submit request');
    }
  };

  const handleViewTicket = async (ticket: any) => {
    setLoadingDetails(true);
    setSelectedRequest(ticket); // Set immediately for UI feedback
    try {
      const resp = await getMaintenanceRequest(ticket.id);
      if (resp.error) {
        toast.error(resp.error.error || 'Failed to load ticket details');
        setSelectedRequest(null);
      } else {
        setSelectedRequest(resp.data);
      }
    } catch {
      toast.error('Failed to load ticket details');
      setSelectedRequest(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleReply = async () => {
    if (!selectedRequest) return;
    if (!replyNote.trim()) return;

    try {
      const resp = await replyMaintenanceRequest(selectedRequest.id, {
        note: replyNote.trim(),
        attachments: replyFiles && replyFiles.length > 0 ? replyFiles : undefined
      });

      if (resp.error) {
        toast.error(resp.error.error || 'Failed to send reply');
      } else {
        toast.success('Reply sent');
        setReplyNote('');
        setReplyFiles([]);
        // Refresh the full ticket details to get the latest updates
        const refreshResp = await getMaintenanceRequest(selectedRequest.id);
        if (!refreshResp.error && refreshResp.data) {
          setSelectedRequest(refreshResp.data);
        }
      }
    } catch {
      toast.error('Failed to send reply');
    }
  };

  const activeRequests = tickets.filter((r: any) => r.status !== 'completed' && r.status !== 'cancelled');
  const completedRequests = tickets.filter((r: any) => r.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Maintenance Requests</h1>
          <p className="text-muted-foreground">Submit and track maintenance requests</p>
        </div>
        <Button onClick={() => setShowNewRequestDialog(!showNewRequestDialog)}>
          <Plus className="h-4 w-4 mr-2" />
          {showNewRequestDialog ? 'Cancel' : 'New Request'}
        </Button>
      </div>

      {/* New Request Form */}
      {showNewRequestDialog && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Maintenance Request</CardTitle>
            <CardDescription>
              Describe the issue and we'll get it taken care of
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={newRequest.title}
                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={newRequest.category} onValueChange={(value) => setNewRequest({ ...newRequest, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newRequest.priority} onValueChange={(value) => setNewRequest({ ...newRequest, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide details about the maintenance issue..."
                rows={4}
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
                <Label>Photos/Videos (Optional - Max 5 files, 10MB each)</Label>
                <FileUpload
                  onFilesUploaded={(files) => setUploadedFiles(prev => [...prev, ...files])}
                  existingFiles={uploadedFiles}
                  onRemoveFile={(file) => setUploadedFiles(prev => prev.filter(f => f.filename !== file.filename))}
                  maxFiles={5}
                  maxSize={10}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={!newRequest.title || !newRequest.category || !newRequest.description}
            >
              Submit Request
            </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Pending or in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
            {tickets.filter((r: any) => r.status === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Appointments set
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
            {tickets.filter((r: any) => r.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeRequests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Requests</CardTitle>
              <CardDescription>Tickets that are pending or in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRequests.map((request) => (
                      <TableRow key={request.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell>{request.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityColor(request.priority)}>
                            {formatPriority(request.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(request.status)}>
                            {formatStatus(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{request.assignedTo?.name || '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewTicket(request)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">No active requests</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Requests</CardTitle>
              <CardDescription>Recently completed maintenance work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell>{request.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(request.status)}>
                            {formatStatus(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.completedAt ? new Date(request.completedAt).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewTicket(request)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {completedRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">No completed requests</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Requests</CardTitle>
              <CardDescription>Complete history of your maintenance requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell>{request.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityColor(request.priority)}>
                            {formatPriority(request.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(request.status)}>
                            {formatStatus(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{request.assignedTo?.name || '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewTicket(request)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tickets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">No requests</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      <Dialog open={selectedRequest !== null} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-xl mb-2">{selectedRequest.title}</DialogTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getStatusColor(selectedRequest.status)}>
                        {selectedRequest.status}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(selectedRequest.priority)}>
                        {selectedRequest.priority}
                      </Badge>
                      <Badge variant="outline">{selectedRequest.category}</Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                </div>

                {Array.isArray(selectedRequest.images) && selectedRequest.images.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Attachments</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedRequest.images.map((img: any, idx: number) => {
                        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                        const raw = typeof img === 'string' ? img : (img?.url || '');
                        const fullUrl = (raw || '').startsWith('http') ? raw : `${base}${raw}`;
                        const name = typeof img === 'string' ? (raw.split('/').pop() || 'Attachment') : (img?.originalName || 'Attachment');
                        const isImage = (typeof img === 'object' && img?.mimetype ? img.mimetype.startsWith('image/') : /\.(png|jpe?g|gif|webp)$/i.test(raw));
                        if (isImage) {
                          return (
                            <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer" className="block">
                              <img
                                src={fullUrl}
                                alt={name}
                                className="h-32 w-full object-cover rounded border"
                              />
                            </a>
                          );
                        }
                        // Non-image (e.g., PDF) → show link with icon
                        return (
                          <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-sm text-blue-600 hover:underline">
                            <FileIcon className="h-4 w-4" />
                            <span className="truncate">{name}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date Submitted</p>
                    <p className="text-sm font-medium">{selectedRequest.dateSubmitted}</p>
                  </div>
                  {selectedRequest.dateScheduled && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Scheduled Date</p>
                      <p className="text-sm font-medium">{selectedRequest.dateScheduled}</p>
                    </div>
                  )}
                  {selectedRequest.dateCompleted && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Completed Date</p>
                      <p className="text-sm font-medium">{selectedRequest.dateCompleted}</p>
                    </div>
                  )}
                  {selectedRequest.assignedTo && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                      <p className="text-sm font-medium">{selectedRequest.assignedTo}</p>
                    </div>
                  )}
                  {selectedRequest.estimatedTime && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Estimated Time</p>
                      <p className="text-sm font-medium">{selectedRequest.estimatedTime}</p>
                    </div>
                  )}
                </div>

                {selectedRequest.completionNotes && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Completion Notes</h4>
                    <p className="text-sm text-green-800">{selectedRequest.completionNotes}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-3">Updates & Activity</h4>
                  <div className="space-y-3">
                    {(selectedRequest.updates || []).map((update: any, index: number) => (
                      <div key={index} className="flex space-x-3 pb-3 border-b last:border-0">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{update?.updatedBy?.name || 'Update'}</p>
                            <p className="text-xs text-muted-foreground">{new Date(update.createdAt).toLocaleString()}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{update.note || update.message}</p>
                          {Array.isArray(update.attachments) && update.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {update.attachments.map((file: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${file.url || file}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  {file.originalName || 'Attachment'}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Reply attachments and box */}
                    <div className="space-y-2">
                      <FileUpload
                        onFilesUploaded={(files) => setReplyFiles(prev => [...prev, ...files])}
                        existingFiles={replyFiles}
                        onRemoveFile={(file) => setReplyFiles(prev => prev.filter(f => f.filename !== file.filename))}
                        maxFiles={3}
                        maxSize={10}
                      />
                      <div className="flex items-start space-x-2">
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyNote}
                          onChange={(e) => setReplyNote(e.target.value)}
                          rows={2}
                        />
                        <Button onClick={handleReply} disabled={!replyNote.trim()}>Send</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantMaintenanceRequests;


