import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Wrench, Clock, CheckCircle, AlertTriangle, Plus, Search, Filter, File as FileIcon, Upload, X, Loader2, User, Building2, Home } from 'lucide-react';
import { toast } from 'sonner';
import {
  getMaintenanceRequests,
  getMaintenanceRequest,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  assignMaintenanceRequest,
  completeMaintenanceRequest,
  replyMaintenanceRequest,
  uploadMaintenanceFiles
} from '../lib/api/maintenance';
import { initializeSocket, isConnected, subscribeToMaintenanceEvents, unsubscribeFromMaintenanceEvents } from '../lib/socket';
import { apiClient } from '../lib/api-client';

interface Property {
  id: string;
  name: string;
  address?: string;
  units?: Unit[];
}

interface Unit {
  id: string;
  unitNumber: string;
  type?: string;
  propertyId?: string;
  status?: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  unitId?: string;
  unitNumber?: string;
  propertyId?: string;
  propertyName?: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface MaintenanceTicketsProps {
  properties?: any[];
}

export const MaintenanceTickets: React.FC<MaintenanceTicketsProps> = ({ properties: propProperties = [] }) => {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data for creating tickets
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Create ticket form state
  const [newTicket, setNewTicket] = useState({
    propertyId: '',
    unitId: '',
    tenantId: '',
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    preferredTime: '',
    images: [] as string[]
  });
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Fetch maintenance requests
  useEffect(() => {
    fetchMaintenanceRequests();
  }, [statusFilter, priorityFilter, propertyFilter, categoryFilter]);

  // Fetch properties, tenants, and managers on mount
  useEffect(() => {
    fetchPropertiesWithUnits();
    fetchTenantsFromLeases();
    fetchManagers();
  }, []);

  // Update units when property is selected in form (only occupied units)
  useEffect(() => {
    if (newTicket.propertyId) {
      // Always fetch units from the property details endpoint
      // since the properties list doesn't include full unit data
      fetchUnitsForProperty(newTicket.propertyId);
      // Reset unit and tenant selection when property changes
      setNewTicket(prev => ({ ...prev, unitId: '', tenantId: '' }));
    } else {
      setUnits([]);
    }
  }, [newTicket.propertyId]);

  // Realtime maintenance updates for manager/owner
  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      if (token && !isConnected()) initializeSocket(token);
    } catch {}
    subscribeToMaintenanceEvents({
      onCreated: () => fetchMaintenanceRequests(),
      onUpdated: () => fetchMaintenanceRequests()
    });
    return () => {
      unsubscribeFromMaintenanceEvents();
    };
  }, []);

  // Fetch properties with units
  const fetchPropertiesWithUnits = async () => {
    try {
      // Use passed properties if available
      if (propProperties && propProperties.length > 0) {
        const mappedProperties = propProperties.map((p: any) => ({
          id: p.id,
          name: p.name,
          address: p.address,
          units: p.units || []
        }));
        setProperties(mappedProperties);
        return;
      }

      // Otherwise fetch from API
      const response = await apiClient.get<any[]>('/api/properties');
      if (response.data) {
        setProperties(response.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          address: p.address,
          units: p.units || []
        })));
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  // Fetch units for a specific property (only occupied units)
  const fetchUnitsForProperty = async (propertyId: string) => {
    try {
      // Fetch the full property details which includes units
      const response = await apiClient.get<any>(`/api/properties/${propertyId}`);
      if (response.data && response.data.units) {
        // Filter to only show occupied units for maintenance requests
        const occupiedUnits = response.data.units
          .filter((u: any) => u.status === 'occupied')
          .map((u: any) => ({
            id: u.id,
            unitNumber: u.unitNumber,
            type: u.type,
            propertyId: u.propertyId,
            status: u.status
          }));
        setUnits(occupiedUnits);
      }
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  };

  // Fetch tenants from leases
  const fetchTenantsFromLeases = async () => {
    try {
      const response = await apiClient.get<any[]>('/api/leases');
      if (response.data) {
        const tenantsFromLeases = response.data
          .filter((lease: any) => lease.users && lease.status === 'active')
          .map((lease: any) => ({
            id: lease.users.id,
            name: lease.users.name,
            email: lease.users.email,
            phone: lease.users.phone,
            unitId: lease.unitId,
            unitNumber: lease.units?.unitNumber,
            propertyId: lease.propertyId,
            propertyName: lease.properties?.name
          }));
        setTenants(tenantsFromLeases);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    }
  };

  // Fetch managers
  const fetchManagers = async () => {
    try {
      const response = await apiClient.get<any[]>('/api/property-managers');
      if (response.data) {
        setManagers(response.data.map((m: any) => ({
          id: m.id || m.managerId,
          name: m.name || m.users?.name,
          email: m.email || m.users?.email,
          phone: m.phone || m.users?.phone
        })));
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  };

  // Get tenants filtered by selected property/unit
  const getFilteredTenants = () => {
    if (!newTicket.propertyId) return tenants;

    let filtered = tenants.filter(t => t.propertyId === newTicket.propertyId);

    if (newTicket.unitId) {
      filtered = filtered.filter(t => t.unitId === newTicket.unitId);
    }

    return filtered;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files and get URLs
  const uploadFiles = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    setUploadingFiles(true);
    try {
      const result = await uploadMaintenanceFiles(selectedFiles);
      return result.files || [];
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload files');
      return [];
    } finally {
      setUploadingFiles(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewTicket({
      propertyId: '',
      unitId: '',
      tenantId: '',
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      preferredTime: '',
      images: []
    });
    setSelectedFiles([]);
  };

  const fetchMaintenanceRequests = async () => {
    try {
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter.toLowerCase().replace(' ', '_');
      if (priorityFilter !== 'all') filters.priority = priorityFilter.toLowerCase();
      if (propertyFilter !== 'all') filters.propertyId = propertyFilter;
      if (categoryFilter !== 'all') filters.category = categoryFilter.toLowerCase();
      if (searchTerm) filters.search = searchTerm;

      const response = await getMaintenanceRequests(filters);

      if (response.error) {
        toast.error(response.error.error || 'Failed to load maintenance requests');
      } else if (response.data) {
        // Transform API data to match component format
        const transformedTickets = response.data.map((req: any) => ({
          id: req.id,
          ticketNumber: req.ticketNumber || req.id,
          title: req.title,
          description: req.description,
          tenant: req.reportedBy?.name || 'Unknown',
          unit: req.unit?.unitNumber || 'N/A',
          property: req.property?.name || 'Unknown Property',
          propertyId: req.propertyId,
          unitId: req.unitId,
          priority: req.priority.charAt(0).toUpperCase() + req.priority.slice(1),
          status: req.status.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          category: req.category.charAt(0).toUpperCase() + req.category.slice(1),
          createdDate: new Date(req.createdAt).toISOString().split('T')[0],
          preferredTime: req.preferredSchedule ? new Date(req.preferredSchedule).toLocaleString() : 'Anytime',
          assignedTo: req.assignedTo?.name || null,
          assignedToId: req.assignedToId,
          scheduledDate: req.scheduledDate,
          completedAt: req.completedAt,
          estimatedCost: req.estimatedCost,
          actualCost: req.actualCost,
          photos: req.images || [],
          notes: req.notes || req.updates || []
        }));
        setTickets(transformedTickets);
      }
    } catch (error) {
      toast.error('Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    // Validation
    if (!newTicket.propertyId) {
      toast.error('Please select a property');
      return;
    }
    if (!newTicket.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!newTicket.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!newTicket.category) {
      toast.error('Please select a category');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload files first if any
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        imageUrls = await uploadFiles();
      }

      const response = await createMaintenanceRequest({
        propertyId: newTicket.propertyId,
        unitId: newTicket.unitId || undefined,
        title: newTicket.title,
        description: newTicket.description,
        category: newTicket.category.toLowerCase(),
        priority: newTicket.priority.toLowerCase(),
        images: imageUrls,
        preferredSchedule: newTicket.preferredTime || undefined
      });

      if (response.error) {
        toast.error(response.error.error || 'Failed to create maintenance request');
      } else {
        toast.success('Maintenance request created successfully');
        setShowAddTicket(false);
        resetForm();
        fetchMaintenanceRequests();
      }
    } catch (error) {
      toast.error('Failed to create maintenance request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await updateMaintenanceRequest(ticketId, {
        status: newStatus.toLowerCase().replace(' ', '_')
      });

      if (response.error) {
        toast.error(response.error.error || 'Failed to update status');
      } else {
        toast.success('Status updated successfully');
        fetchMaintenanceRequests();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssignTicket = async (ticketId: string, assignedToId: string, notes: string) => {
    try {
      const response = await assignMaintenanceRequest(ticketId, {
        assignedToId,
        notes
      });

      if (response.error) {
        toast.error(response.error.error || 'Failed to assign ticket');
      } else {
        toast.success('Ticket assigned successfully');
        fetchMaintenanceRequests();
      }
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

  const handleCompleteTicket = async (ticketId: string, actualCost?: number, notes?: string) => {
    try {
      const response = await completeMaintenanceRequest(ticketId, {
        actualCost,
        completionNotes: notes
      });

      if (response.error) {
        toast.error(response.error.error || 'Failed to complete ticket');
      } else {
        toast.success('Ticket completed successfully');
        fetchMaintenanceRequests();
      }
    } catch (error) {
      toast.error('Failed to complete ticket');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
      case 'Urgent': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'destructive';
      case 'In Progress': return 'secondary';
      case 'Completed': return 'default';
      case 'On Hold':
      case 'Scheduled': return 'outline';
      default: return 'secondary';
    }
  };

  // Get unique properties for filter dropdown
  const uniqueProperties = properties.length > 0
    ? properties
    : Array.from(new Set(tickets.map(t => ({ id: t.propertyId, name: t.property }))));

  // Filter tickets based on search and filters
  const filterTickets = (ticketsList: any[]) => {
    return ticketsList.filter(ticket => {
      const matchesSearch =
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesProperty = propertyFilter === 'all' || ticket.property === propertyFilter;
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesProperty && matchesCategory;
    });
  };

  // Apply filters
  const filteredTickets = filterTickets(tickets);
  const activeTickets = filterTickets(tickets.filter(t => t.status !== 'Completed'));
  const completedTickets = filterTickets(tickets.filter(t => t.status === 'Completed'));

  // Load full details when a ticket is selected
  useEffect(() => {
    (async () => {
      if (!selectedTicket?.id) return;
      try {
        const resp = await getMaintenanceRequest(selectedTicket.id);
        if ((resp as any).data) {
          const req: any = (resp as any).data;
          setSelectedTicket((prev: any) => ({
            ...(prev || {}),
            tenant: req.reportedBy?.name || prev?.tenant,
            unit: req.unit?.unitNumber || prev?.unit,
            property: req.property?.name || prev?.property,
            photos: Array.isArray(req.images) ? req.images : (prev?.photos || []),
            updates: req.updates || prev?.updates,
            assignedTo: req.assignedTo?.name || prev?.assignedTo
          }));
        }
      } catch {}
    })();
  }, [selectedTicket?.id]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Maintenance Tickets</h2>
          <p className="text-gray-600 mt-1">Manage maintenance requests and work orders</p>
        </div>

        <Button onClick={() => setShowAddTicket(true)} className="bg-gray-900 hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={showAddTicket} onOpenChange={(open) => {
        setShowAddTicket(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Maintenance Ticket</DialogTitle>
            <DialogDescription>
              Create a new maintenance request for a property or tenant
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Property & Unit Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Location
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="property">Property *</Label>
                  <Select
                    value={newTicket.propertyId}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, propertyId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit (Optional)</Label>
                  <Select
                    value={newTicket.unitId || 'none'}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, unitId: value === 'none' ? '' : value }))}
                    disabled={!newTicket.propertyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific unit</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          Unit {unit.unitNumber} {unit.type ? `(${unit.type})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tenant Selection (Optional) */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Tenant (Optional)
              </h3>
              <div className="grid gap-2">
                <Label htmlFor="tenant">Select Tenant</Label>
                <Select
                  value={newTicket.tenantId || 'none'}
                  onValueChange={(value) => setNewTicket(prev => ({ ...prev, tenantId: value === 'none' ? '' : value }))}
                  disabled={!newTicket.propertyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific tenant</SelectItem>
                    {getFilteredTenants().map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} {tenant.unitNumber ? `(Unit ${tenant.unitNumber})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Select a tenant if this request is on their behalf
                </p>
              </div>
            </div>

            {/* Issue Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Issue Details
              </h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Issue Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the issue"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the maintenance issue..."
                    rows={4}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={newTicket.category}
                      onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="appliances">Appliances</SelectItem>
                        <SelectItem value="structural">Structural</SelectItem>
                        <SelectItem value="pest_control">Pest Control</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="general">General Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            Urgent
                          </span>
                        </SelectItem>
                        <SelectItem value="high">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            High
                          </span>
                        </SelectItem>
                        <SelectItem value="medium">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-yellow-500" />
                            Medium
                          </span>
                        </SelectItem>
                        <SelectItem value="low">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Low
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="preferredTime">Preferred Schedule (Optional)</Label>
                  <Input
                    id="preferredTime"
                    type="datetime-local"
                    value={newTicket.preferredTime}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, preferredTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Attachments (Optional)
              </h3>
              <div className="grid gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,application/pdf,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Images, PDFs, or videos (max 5 files, 10MB each)
                    </p>
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700 truncate max-w-[200px]">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddTicket(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={isSubmitting || uploadingFiles}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {isSubmitting || uploadingFiles ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingFiles ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tickets Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{tickets.filter(t => t.status === 'Open').length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{tickets.filter(t => t.status === 'In Progress').length}</div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Wrench className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{tickets.filter(t => t.priority === 'High').length}</div>
            <p className="text-xs text-muted-foreground">
              Urgent issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{tickets.filter(t => t.status === 'Completed').length}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ticket ID, title, tenant, or unit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {uniqueProperties.map((property) => (
                    <SelectItem key={property.id || property} value={property.id || property.name || property}>
                      {property.name || property}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="Appliances">Appliances</SelectItem>
                  <SelectItem value="General">General Maintenance</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || propertyFilter !== 'all' || categoryFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setPropertyFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="w-full md:w-auto"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Tickets</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Maintenance Tickets ({activeTickets.length})</CardTitle>
              <CardDescription>
                Tickets that need attention or are currently being worked on
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Tenant/Unit</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-mono text-sm">{ticket.ticketNumber || ticket.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.tenant}</p>
                            <p className="text-sm text-gray-500">{ticket.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.createdDate}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeTickets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <Search className="h-8 w-8 text-gray-400" />
                            <p className="font-medium">No active tickets found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </TableCell>
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
              <CardTitle>Completed Tickets ({completedTickets.length})</CardTitle>
              <CardDescription>
                Recently completed maintenance work
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Tenant/Unit</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">{ticket.ticketNumber || ticket.id}</TableCell>
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.tenant}</p>
                            <p className="text-sm text-gray-500">{ticket.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>{ticket.assignedTo || 'Unassigned'}</TableCell>
                        <TableCell>{ticket.createdDate}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {completedTickets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <Search className="h-8 w-8 text-gray-400" />
                            <p className="font-medium">No completed tickets found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </TableCell>
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
              <CardTitle>All Maintenance Tickets ({filteredTickets.length})</CardTitle>
              <CardDescription>
                Complete history of all maintenance requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Tenant/Unit</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">{ticket.ticketNumber || ticket.id}</TableCell>
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.tenant}</p>
                            <p className="text-sm text-gray-500">{ticket.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.createdDate}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTickets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <Search className="h-8 w-8 text-gray-400" />
                            <p className="font-medium">No tickets found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) { setSelectedTicket(null); setReviewNote(''); } }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedTicket.title}</DialogTitle>
                <DialogDescription>
                  Ticket {selectedTicket.ticketNumber || selectedTicket.id} • {selectedTicket.category}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Status: {selectedTicket.status}</Badge>
                  <Badge variant="outline">Priority: {selectedTicket.priority}</Badge>
                  {selectedTicket.property && <Badge variant="outline">Property: {selectedTicket.property}</Badge>}
                  {selectedTicket.unit && <Badge variant="outline">Unit: {selectedTicket.unit}</Badge>}
                </div>

                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {/* Attachments from initial ticket (photos/images) */}
                {Array.isArray((selectedTicket as any).photos) && (selectedTicket as any).photos.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-1">Attachments</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(selectedTicket as any).photos.map((img: any, idx: number) => {
                        const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';
                        const raw = typeof img === 'string' ? img : (img?.url || '');
                        const fullUrl = (raw || '').startsWith('http') ? raw : `${base}${raw}`;
                        const name = typeof img === 'string' ? (raw.split('/').pop() || 'Attachment') : (img?.originalName || 'Attachment');
                        const isImage = (typeof img === 'object' && img?.mimetype ? img.mimetype.startsWith('image/') : /\.(png|jpe?g|gif|webp)$/i.test(raw));
                        if (isImage) {
                          return (
                            <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={fullUrl} alt={name} className="h-32 w-full object-cover rounded border" />
                            </a>
                          );
                        }
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

                {/* Tenant & Assignment Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 border rounded p-3">
                  <div>
                    <p className="text-xs text-gray-500">Reported By</p>
                    <p className="font-medium">{selectedTicket.tenant}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="font-medium">{selectedTicket.createdDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="font-medium">{selectedTicket.assignedTo || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Preferred Time</p>
                    <p className="font-medium">{selectedTicket.preferredTime || 'Anytime'}</p>
                  </div>
                </div>

                {/* Assign to Manager */}
                {selectedTicket.status !== 'Completed' && (
                  <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900">Assign Ticket</h4>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label htmlFor="assignTo" className="text-sm text-blue-800">Assign to Manager</Label>
                        <Select
                          value={selectedTicket.assignedToId || 'none'}
                          onValueChange={(value) => {
                            setSelectedTicket((prev: any) => ({
                              ...prev,
                              assignedToId: value === 'none' ? null : value
                            }));
                          }}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {managers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name} ({manager.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!selectedTicket.assignedToId || selectedTicket.assignedToId === 'none') {
                            toast.error('Please select a manager to assign');
                            return;
                          }
                          const res = await assignMaintenanceRequest(selectedTicket.id, {
                            assignedToId: selectedTicket.assignedToId,
                            notes: `Assigned by owner`
                          });
                          if ((res as any).error) {
                            toast.error((res as any).error.error || 'Failed to assign');
                          } else {
                            toast.success('Ticket assigned successfully');
                            fetchMaintenanceRequests();
                            // Update local state
                            const assignedManager = managers.find(m => m.id === selectedTicket.assignedToId);
                            setSelectedTicket((prev: any) => ({
                              ...prev,
                              assignedTo: assignedManager?.name || 'Assigned'
                            }));
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex flex-wrap gap-2">
                  <Label className="w-full text-sm font-medium mb-1">Update Status</Label>
                  <Select
                    value={selectedTicket.status.toLowerCase().replace(' ', '_')}
                    onValueChange={async (value) => {
                      const res = await updateMaintenanceRequest(selectedTicket.id, { status: value });
                      if ((res as any).error) {
                        toast.error((res as any).error.error || 'Failed to update status');
                      } else {
                        toast.success('Status updated');
                        fetchMaintenanceRequests();
                        setSelectedTicket((prev: any) => ({
                          ...prev,
                          status: value.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedTicket.status !== 'Completed' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={async () => {
                        const res = await completeMaintenanceRequest(selectedTicket.id, {});
                        if ((res as any).error) {
                          toast.error((res as any).error.error || 'Failed to complete');
                        } else {
                          toast.success('Ticket marked as completed');
                          fetchMaintenanceRequests();
                          setSelectedTicket((prev: any) => ({
                            ...prev,
                            status: 'Completed'
                          }));
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Completed
                    </Button>
                  )}
                </div>

                {/* Updates & Activity */}
                {Array.isArray((selectedTicket as any).updates) && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Updates</h4>
                    <div className="space-y-3">
                      {(selectedTicket as any).updates.map((u: any, idx: number) => (
                        <div key={idx} className="border-b pb-2 last:border-0">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{u?.updatedBy?.name || 'Update'}</span>
                            <span className="text-gray-500">{u?.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</span>
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">{u?.note}</div>
                          {Array.isArray(u?.attachments) && u.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {u.attachments.map((f: any, i: number) => {
                                const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';
                                const href = typeof f === 'string' ? (f.startsWith('http') ? f : `${base}${f}`) : ((f?.url || '').startsWith('http') ? f.url : `${base}${f?.url || ''}`);
                                const label = typeof f === 'string' ? 'Attachment' : (f.originalName || 'Attachment');
                                return (
                                  <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                    {label}
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manager/Owner Review (reply) */}
                <div className="space-y-2">
                  <h4 className="font-medium">Add Manager/Owner Review</h4>
                  <Textarea rows={3} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Write a short review or note for the tenant (visible in ticket updates)" />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={async () => {
                      if (!reviewNote.trim()) return;
                      const res = await replyMaintenanceRequest(selectedTicket.id, { note: reviewNote.trim() });
                      if ((res as any).error) { toast.error((res as any).error.error || 'Failed to add review'); return; }
                      toast.success('Review added');
                      setReviewNote('');
                      // Reload details
                      try {
                        const d = await getMaintenanceRequest(selectedTicket.id);
                        if ((d as any).data) {
                          const req: any = (d as any).data;
                          setSelectedTicket((prev: any) => ({
                            ...prev,
                            updates: req.updates || prev?.updates || []
                          }));
                        }
                      } catch {}
                    }}>Submit Review</Button>
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
