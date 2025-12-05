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
  File as FileIcon,
  AlertCircle,
  Eye,
  Sparkles,
  CheckCircle
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
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'scheduled': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] p-6 md:p-8 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Maintenance Requests</h1>
              <p className="text-white/80 font-medium mt-1">Submit and track your maintenance requests</p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewRequestDialog(!showNewRequestDialog)}
            size="lg"
            className={showNewRequestDialog
              ? "bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold shadow-lg border border-white/30 transition-all duration-200"
              : "bg-white hover:bg-gray-50 text-[#7C3AED] font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            }
          >
            <Plus className="h-5 w-5 mr-2" />
            {showNewRequestDialog ? 'Cancel' : 'New Request'}
          </Button>
        </div>
      </div>

      {/* New Request Form */}
      {showNewRequestDialog && (
        <Card className="border-0 shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 backdrop-blur-sm p-3 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-xl font-bold">Submit Maintenance Request</CardTitle>
                <CardDescription className="text-white/80 font-medium">
                  Describe the issue and we'll get it taken care of
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  className="h-11 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Category *</Label>
                  <Select value={newRequest.category} onValueChange={(value) => setNewRequest({ ...newRequest, category: value })}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20">
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
                  <Label htmlFor="priority" className="text-sm font-semibold text-gray-700">Priority</Label>
                  <Select value={newRequest.priority} onValueChange={(value) => setNewRequest({ ...newRequest, priority: value })}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                          Low
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          High
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about the maintenance issue..."
                  rows={4}
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Photos/Videos (Optional - Max 5 files, 10MB each)</Label>
                <FileUpload
                  onFilesUploaded={(files) => setUploadedFiles(prev => [...prev, ...files])}
                  existingFiles={uploadedFiles}
                  onRemoveFile={(file) => setUploadedFiles(prev => prev.filter(f => f.filename !== file.filename))}
                  maxFiles={5}
                  maxSize={10}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => setShowNewRequestDialog(false)}
                  className="border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitRequest}
                  disabled={!newRequest.title || !newRequest.category || !newRequest.description}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 group-hover:from-orange-500/10 group-hover:to-amber-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-semibold text-gray-700">Active</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-gray-900">{activeRequests.length}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Pending requests
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-semibold text-gray-700">Scheduled</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 p-2.5 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-gray-900">
              {tickets.filter((r: any) => r.status === 'scheduled').length}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Appointments set
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-semibold text-gray-700">In Progress</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
              <Wrench className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-gray-900">
              {tickets.filter((r: any) => r.status === 'in_progress').length}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-semibold text-gray-700">Completed</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2.5 shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-gray-900">{completedRequests.length}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm p-1.5 border border-gray-200 shadow-lg rounded-xl h-auto flex-wrap">
          <TabsTrigger
            value="active"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <Clock className="h-4 w-4 mr-2" />
            Active ({activeRequests.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed ({completedRequests.length})
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            All Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 shadow-lg shadow-orange-500/25">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Active Requests</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Tickets that are pending or in progress</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activeRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gradient-to-br from-green-100 to-emerald-100 p-6 mb-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                  <p className="text-gray-500 text-center max-w-sm">You don't have any active maintenance requests. Click "New Request" if you need help with something.</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="font-semibold text-gray-700">Title</TableHead>
                        <TableHead className="font-semibold text-gray-700">Category</TableHead>
                        <TableHead className="font-semibold text-gray-700">Priority</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700">Created</TableHead>
                        <TableHead className="font-semibold text-gray-700">Assigned To</TableHead>
                        <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeRequests.map((request) => (
                        <TableRow key={request.id} className="cursor-pointer hover:bg-purple-50/50 transition-colors border-b border-gray-100">
                          <TableCell className="font-semibold text-gray-900">{request.title}</TableCell>
                          <TableCell className="text-gray-600">{request.category}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(request.priority) + ' font-semibold border'}>
                              {formatPriority(request.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(request.status) + ' font-semibold border'}>
                              {formatStatus(request.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-gray-600">{request.assignedTo?.name || '—'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTicket(request)}
                              className="text-[#7C3AED] hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] font-semibold"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2.5 shadow-lg shadow-green-500/25">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Completed Requests</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Recently completed maintenance work</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {completedRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gradient-to-br from-gray-100 to-slate-100 p-6 mb-4">
                    <Wrench className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Completed Requests</h3>
                  <p className="text-gray-500 text-center max-w-sm">Completed maintenance requests will appear here.</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="font-semibold text-gray-700">Title</TableHead>
                        <TableHead className="font-semibold text-gray-700">Category</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700">Completed</TableHead>
                        <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedRequests.map((request) => (
                        <TableRow key={request.id} className="hover:bg-green-50/50 transition-colors border-b border-gray-100">
                          <TableCell className="font-semibold text-gray-900">{request.title}</TableCell>
                          <TableCell className="text-gray-600">{request.category}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(request.status) + ' font-semibold border'}>
                              {formatStatus(request.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">{request.completedAt ? new Date(request.completedAt).toLocaleDateString() : '—'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTicket(request)}
                              className="text-[#7C3AED] hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] font-semibold"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-2.5 shadow-lg shadow-purple-500/25">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">All Requests</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Complete history of your maintenance requests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 p-6 mb-4">
                    <Wrench className="h-12 w-12 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Requests Yet</h3>
                  <p className="text-gray-500 text-center max-w-sm mb-4">You haven't submitted any maintenance requests yet.</p>
                  <Button
                    onClick={() => setShowNewRequestDialog(true)}
                    className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your First Request
                  </Button>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="font-semibold text-gray-700">Title</TableHead>
                        <TableHead className="font-semibold text-gray-700">Category</TableHead>
                        <TableHead className="font-semibold text-gray-700">Priority</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700">Created</TableHead>
                        <TableHead className="font-semibold text-gray-700">Assigned To</TableHead>
                        <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((request) => (
                        <TableRow key={request.id} className="hover:bg-purple-50/50 transition-colors border-b border-gray-100">
                          <TableCell className="font-semibold text-gray-900">{request.title}</TableCell>
                          <TableCell className="text-gray-600">{request.category}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(request.priority) + ' font-semibold border'}>
                              {formatPriority(request.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(request.status) + ' font-semibold border'}>
                              {formatStatus(request.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-gray-600">{request.assignedTo?.name || '—'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTicket(request)}
                              className="text-[#7C3AED] hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] font-semibold"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      <Dialog open={selectedRequest !== null} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto border-0 shadow-2xl">
          {selectedRequest && (
            <>
              <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -m-6 mb-0 p-6 rounded-t-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold text-white mb-3">{selectedRequest.title}</DialogTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getStatusColor(selectedRequest.status) + ' font-semibold shadow-sm'}>
                        {selectedRequest.status}
                      </Badge>
                      <Badge className={getPriorityColor(selectedRequest.priority) + ' font-semibold shadow-sm'}>
                        {selectedRequest.priority}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 font-semibold backdrop-blur-sm">{selectedRequest.category}</Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                    Description
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedRequest.description}</p>
                </div>

                {Array.isArray(selectedRequest.images) && selectedRequest.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                      Attachments
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedRequest.images.map((img: any, idx: number) => {
                        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                        const raw = typeof img === 'string' ? img : (img?.url || '');
                        const fullUrl = (raw || '').startsWith('http') ? raw : `${base}${raw}`;
                        const name = typeof img === 'string' ? (raw.split('/').pop() || 'Attachment') : (img?.originalName || 'Attachment');
                        const isImage = (typeof img === 'object' && img?.mimetype ? img.mimetype.startsWith('image/') : /\.(png|jpe?g|gif|webp)$/i.test(raw));
                        if (isImage) {
                          return (
                            <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer" className="block group">
                              <img
                                src={fullUrl}
                                alt={name}
                                className="h-32 w-full object-cover rounded-xl border-2 border-gray-200 group-hover:border-[#7C3AED] transition-colors shadow-sm group-hover:shadow-md"
                              />
                            </a>
                          );
                        }
                        // Non-image (e.g., PDF) → show link with icon
                        return (
                          <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-sm text-[#7C3AED] hover:text-[#5B21B6] font-medium p-3 bg-purple-50 rounded-lg border border-purple-100 hover:border-purple-300 transition-colors">
                            <FileIcon className="h-4 w-4" />
                            <span className="truncate">{name}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Date Submitted</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.dateSubmitted}</p>
                  </div>
                  {selectedRequest.dateScheduled && (
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-1">Scheduled Date</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.dateScheduled}</p>
                    </div>
                  )}
                  {selectedRequest.dateCompleted && (
                    <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-xs text-green-600 font-semibold mb-1">Completed Date</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.dateCompleted}</p>
                    </div>
                  )}
                  {selectedRequest.assignedTo && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold mb-1">Assigned To</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.assignedTo?.name || selectedRequest.assignedTo}</p>
                    </div>
                  )}
                  {selectedRequest.estimatedTime && (
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                      <p className="text-xs text-orange-600 font-semibold mb-1">Estimated Time</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.estimatedTime}</p>
                    </div>
                  )}
                </div>

                {selectedRequest.completionNotes && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Completion Notes
                    </h4>
                    <p className="text-sm text-green-800 leading-relaxed">{selectedRequest.completionNotes}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                    Updates & Activity
                  </h4>
                  <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                    {(selectedRequest.updates || []).map((update: any, index: number) => (
                      <div key={index} className="flex space-x-3 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                        <div className="rounded-full bg-[#7C3AED]/10 p-2 h-fit">
                          <MessageSquare className="h-4 w-4 text-[#7C3AED]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900">{update?.updatedBy?.name || 'Update'}</p>
                            <p className="text-xs text-gray-500 font-medium">{new Date(update.createdAt).toLocaleString()}</p>
                          </div>
                          <p className="text-sm text-gray-700">{update.note || update.message}</p>
                          {Array.isArray(update.attachments) && update.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {update.attachments.map((file: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${file.url || file}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#7C3AED] hover:text-[#5B21B6] font-medium bg-purple-50 px-2 py-1 rounded-md border border-purple-200 hover:border-purple-300 transition-colors"
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
                    <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                      <Label className="text-sm font-semibold text-gray-700">Add a Reply</Label>
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
                          className="border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
                        />
                        <Button
                          onClick={handleReply}
                          disabled={!replyNote.trim()}
                          className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50"
                        >
                          Send
                        </Button>
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


