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
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Wrench, Clock, CheckCircle, AlertTriangle, Plus, Search, Filter, File as FileIcon, Upload, X, Loader2, User, Building2, Home, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
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
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Wrench className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Maintenance Tickets</h1>
            </div>
            <p className="text-purple-100 text-lg">Manage maintenance requests and work orders</p>
          </div>
          <Button
            onClick={() => setShowAddTicket(true)}
            className="bg-white text-[#7C3AED] hover:bg-purple-50 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={showAddTicket} onOpenChange={(open) => {
        setShowAddTicket(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -m-6 mb-0 p-6 rounded-t-lg">
            <DialogTitle className="text-2xl text-white">Create Maintenance Ticket</DialogTitle>
            <DialogDescription className="text-purple-100">
              Create a new maintenance request for a property or tenant
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4 px-6">
            {/* Property & Unit Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-[#7C3AED]/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-[#7C3AED]" />
                </div>
                Location Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="property" className="text-sm font-semibold text-gray-700">Property *</Label>
                  <Select
                    value={newTicket.propertyId}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, propertyId: value }))}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                  <Label htmlFor="unit" className="text-sm font-semibold text-gray-700">Unit (Optional)</Label>
                  <Select
                    value={newTicket.unitId || 'none'}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, unitId: value === 'none' ? '' : value }))}
                    disabled={!newTicket.propertyId}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                Tenant (Optional)
              </h3>
              <div className="grid gap-2">
                <Label htmlFor="tenant" className="text-sm font-semibold text-gray-700">Select Tenant</Label>
                <Select
                  value={newTicket.tenantId || 'none'}
                  onValueChange={(value) => setNewTicket(prev => ({ ...prev, tenantId: value === 'none' ? '' : value }))}
                  disabled={!newTicket.propertyId}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-amber-600" />
                </div>
                Issue Details
              </h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Issue Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the issue"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the maintenance issue..."
                    rows={4}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] resize-none"
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
                  <Label htmlFor="preferredTime" className="text-sm font-semibold text-gray-700">Preferred Schedule (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]",
                          !newTicket.preferredTime && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-[#7C3AED]" />
                        {newTicket.preferredTime
                          ? format(new Date(newTicket.preferredTime), "PPP 'at' p")
                          : <span>Pick a date and time</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl shadow-xl" align="start">
                      {/* Calendar Header */}
                      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] px-4 py-3 rounded-t-xl">
                        <p className="text-white font-semibold text-sm">Select Preferred Date & Time</p>
                      </div>
                      {/* Calendar Body */}
                      <div className="p-3 bg-white">
                        <CalendarComponent
                          mode="single"
                          selected={newTicket.preferredTime ? new Date(newTicket.preferredTime) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              // Preserve existing time or set to 9:00 AM if no time exists
                              const existingTime = newTicket.preferredTime
                                ? new Date(newTicket.preferredTime).toTimeString().slice(0, 5)
                                : '09:00';
                              const dateStr = format(date, 'yyyy-MM-dd');
                              setNewTicket(prev => ({ ...prev, preferredTime: `${dateStr}T${existingTime}` }));
                            } else {
                              setNewTicket(prev => ({ ...prev, preferredTime: '' }));
                            }
                          }}
                          initialFocus
                          classNames={{
                            caption_label: "text-gray-900 font-semibold",
                            nav_button: "border-gray-300 hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED]",
                            day_selected: "bg-[#7C3AED] text-white font-bold shadow-md hover:bg-[#6D28D9]",
                            day_today: "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                            day: "hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]",
                          }}
                        />
                        {/* Time Picker */}
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <Label htmlFor="time" className="text-xs font-semibold text-gray-700 mb-2 block">Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={newTicket.preferredTime ? new Date(newTicket.preferredTime).toTimeString().slice(0, 5) : '09:00'}
                            onChange={(e) => {
                              const dateStr = newTicket.preferredTime
                                ? format(new Date(newTicket.preferredTime), 'yyyy-MM-dd')
                                : format(new Date(), 'yyyy-MM-dd');
                              setNewTicket(prev => ({ ...prev, preferredTime: `${dateStr}T${e.target.value}` }));
                            }}
                            className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
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

          <DialogFooter className="border-t pt-6 mt-6 px-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddTicket(false);
                resetForm();
              }}
              disabled={isSubmitting}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={isSubmitting || uploadingFiles}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Open Tickets Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Open Tickets</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-red-600">{tickets.filter(t => t.status === 'Open').length}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting assignment</p>
          </CardContent>
        </Card>

        {/* In Progress Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">In Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-amber-600">{tickets.filter(t => t.status === 'In Progress').length}</div>
            <p className="text-xs text-gray-500 mt-1">Being worked on</p>
          </CardContent>
        </Card>

        {/* High Priority Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Wrench className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">High Priority</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-[#7C3AED]">{tickets.filter(t => t.priority === 'High').length}</div>
            <p className="text-xs text-gray-500 mt-1">Urgent issues</p>
          </CardContent>
        </Card>

        {/* Completed Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Completed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-600">{tickets.filter(t => t.status === 'Completed').length}</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Filter className="h-5 w-5 text-gray-700" />
            </div>
            <CardTitle className="text-lg text-gray-900">Search & Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                <Input
                  placeholder="Search by ticket ID, title, tenant, or unit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>

              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-full md:w-48 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                <SelectTrigger className="w-full md:w-40 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                <SelectTrigger className="w-full md:w-40 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                <SelectTrigger className="w-full md:w-48 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                  className="w-full md:w-auto border-gray-300 hover:bg-purple-50 hover:text-[#7C3AED] hover:border-[#7C3AED]"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white"
          >
            Active Tickets
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white"
          >
            Completed
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white"
          >
            All Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Active Maintenance Tickets ({activeTickets.length})</CardTitle>
                  <CardDescription className="text-gray-600">
                    Tickets that need attention or are currently being worked on
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-xl border-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Ticket ID
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Title
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tenant/Unit
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Priority
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Category
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Created
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTickets.map((ticket, index) => (
                      <TableRow
                        key={ticket.id}
                        className={`cursor-pointer hover:bg-[#7C3AED]/5 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
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
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Completed Tickets ({completedTickets.length})</CardTitle>
                  <CardDescription className="text-gray-600">
                    Recently completed maintenance work
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-xl border-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Ticket ID
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Title
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tenant/Unit
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Category
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Completed
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedTickets.map((ticket, index) => (
                      <TableRow
                        key={ticket.id}
                        className={`hover:bg-[#7C3AED]/5 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
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
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">All Maintenance Tickets ({filteredTickets.length})</CardTitle>
                  <CardDescription className="text-gray-600">
                    Complete history of all maintenance requests
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-xl border-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Ticket ID
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Title
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tenant/Unit
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Priority
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Created
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket, index) => (
                      <TableRow
                        key={ticket.id}
                        className={`hover:bg-[#7C3AED]/5 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto border-0 shadow-2xl">
          {selectedTicket && (
            <>
              <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -m-6 mb-0 p-6 rounded-t-lg">
                <DialogTitle className="text-2xl font-bold text-white">{selectedTicket.title}</DialogTitle>
                <DialogDescription className="text-white/80 font-medium">
                  Ticket {selectedTicket.ticketNumber || selectedTicket.id} • {selectedTicket.category}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold">Status: {selectedTicket.status}</Badge>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-semibold">Priority: {selectedTicket.priority}</Badge>
                  {selectedTicket.property && <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold">Property: {selectedTicket.property}</Badge>}
                  {selectedTicket.unit && <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 font-semibold">Unit: {selectedTicket.unit}</Badge>}
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                    Description
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                </div>

                {/* Attachments from initial ticket (photos/images) */}
                {Array.isArray((selectedTicket as any).photos) && (selectedTicket as any).photos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                      Attachments
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(selectedTicket as any).photos.map((img: any, idx: number) => {
                        const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';
                        const raw = typeof img === 'string' ? img : (img?.url || '');
                        const fullUrl = (raw || '').startsWith('http') ? raw : `${base}${raw}`;
                        const name = typeof img === 'string' ? (raw.split('/').pop() || 'Attachment') : (img?.originalName || 'Attachment');
                        const isImage = (typeof img === 'object' && img?.mimetype ? img.mimetype.startsWith('image/') : /\.(png|jpe?g|gif|webp)$/i.test(raw));
                        if (isImage) {
                          return (
                            <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer" className="block group">
                              <img src={fullUrl} alt={name} className="h-32 w-full object-cover rounded-xl border-2 border-gray-200 group-hover:border-[#7C3AED] transition-colors shadow-sm group-hover:shadow-md" />
                            </a>
                          );
                        }
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

                {/* Tenant & Assignment Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Reported By</p>
                    <p className="font-semibold text-gray-900">{selectedTicket.tenant}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Created</p>
                    <p className="font-semibold text-gray-900">{selectedTicket.createdDate}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold mb-1">Assigned To</p>
                    <p className="font-semibold text-gray-900">{selectedTicket.assignedTo || 'Unassigned'}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <p className="text-xs text-purple-600 font-semibold mb-1">Preferred Time</p>
                    <p className="font-semibold text-gray-900">{selectedTicket.preferredTime || 'Anytime'}</p>
                  </div>
                </div>

                {/* Assign to Manager */}
                {selectedTicket.status !== 'Completed' && (
                  <div className="space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assign Ticket
                    </h4>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label htmlFor="assignTo" className="text-sm text-blue-800 font-semibold">Assign to Manager</Label>
                        <Select
                          value={selectedTicket.assignedToId || 'none'}
                          onValueChange={(value) => {
                            setSelectedTicket((prev: any) => ({
                              ...prev,
                              assignedToId: value === 'none' ? null : value
                            }));
                          }}
                        >
                          <SelectTrigger className="bg-white border-blue-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20">
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
                        className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status Actions */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <Label className="w-full text-sm font-semibold text-gray-700 mb-3 block">Update Status</Label>
                  <div className="flex flex-wrap gap-3">
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
                      <SelectTrigger className="w-48 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20">
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
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/25"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>

                {/* Updates & Activity */}
                {Array.isArray((selectedTicket as any).updates) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                      Updates
                    </h4>
                    <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                      {(selectedTicket as any).updates.map((u: any, idx: number) => (
                        <div key={idx} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-semibold text-gray-900">{u?.updatedBy?.name || 'Update'}</span>
                            <span className="text-gray-500 font-medium text-xs">{u?.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</span>
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">{u?.note}</div>
                          {Array.isArray(u?.attachments) && u.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {u.attachments.map((f: any, i: number) => {
                                const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';
                                const href = typeof f === 'string' ? (f.startsWith('http') ? f : `${base}${f}`) : ((f?.url || '').startsWith('http') ? f.url : `${base}${f?.url || ''}`);
                                const label = typeof f === 'string' ? 'Attachment' : (f.originalName || 'Attachment');
                                return (
                                  <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-[#7C3AED] hover:text-[#5B21B6] font-medium bg-purple-50 px-2 py-1 rounded-md border border-purple-200 hover:border-purple-300 transition-colors">
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
                <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                    Add Manager/Owner Review
                  </h4>
                  <Textarea
                    rows={3}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Write a short review or note for the tenant (visible in ticket updates)"
                    className="border-purple-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 bg-white"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={async () => {
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
                      }}
                      className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25"
                    >
                      Submit Review
                    </Button>
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
