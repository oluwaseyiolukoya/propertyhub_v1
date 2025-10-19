import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Mail, Phone, Calendar, Copy, Search, Filter } from 'lucide-react';
import { toast } from "sonner";

export const TenantManagement = () => {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');

  const [tenants, setTenants] = useState([
    {
      id: 'TEN001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      unit: 'A101',
      property: 'Sunset Apartments',
      leaseStart: '2024-01-01',
      leaseEnd: '2024-12-31',
      rent: 1200,
      status: 'Active',
      occupancyDate: '2024-01-01',
      apartmentId: 'APT001'
    },
    {
      id: 'TEN002',
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+1 (555) 234-5678',
      unit: 'A201',
      property: 'Sunset Apartments',
      leaseStart: '2023-09-01',
      leaseEnd: '2024-08-31',
      rent: 1500,
      status: 'Active',
      occupancyDate: '2023-09-01',
      apartmentId: 'APT002'
    },
    {
      id: 'TEN003',
      name: 'Lisa Wilson',
      email: 'lisa.wilson@email.com',
      phone: '+1 (555) 345-6789',
      unit: 'A202',
      property: 'Sunset Apartments',
      leaseStart: '2024-03-01',
      leaseEnd: '2025-02-28',
      rent: 1500,
      status: 'Payment Overdue',
      occupancyDate: '2024-03-01',
      apartmentId: 'APT003'
    }
  ]);

  const [showAddTenant, setShowAddTenant] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [newTenant, setNewTenant] = useState({
    name: '',
    email: '',
    phone: '',
    unit: '',
    property: '',
    leaseStart: '',
    leaseEnd: '',
    rent: '',
    occupancyDate: ''
  });

  const generateTenantCredentials = () => {
    const tenantId = `TEN${String(tenants.length + 1).padStart(3, '0')}`;
    const apartmentId = `APT${String(tenants.length + 1).padStart(3, '0')}`;
    return { tenantId, apartmentId };
  };

  const handleAddTenant = () => {
    const credentials = generateTenantCredentials();
    const tenant = {
      id: credentials.tenantId,
      apartmentId: credentials.apartmentId,
      ...newTenant,
      rent: parseFloat(newTenant.rent),
      status: 'Active'
    };
    setTenants([...tenants, tenant]);
    setNewTenant({
      name: '', email: '', phone: '', unit: '', property: '',
      leaseStart: '', leaseEnd: '', rent: '', occupancyDate: ''
    });
    setShowAddTenant(false);
    
    toast.success(`Tenant added successfully! Credentials: ${credentials.tenantId} / ${credentials.apartmentId}`);
  };

  const sendCredentialsEmail = (tenant: any) => {
    toast.success(`Credentials email sent to ${tenant.email}`);
  };

  const copyCredentials = (tenant: any) => {
    const credentials = `Tenant ID: ${tenant.id}\nApartment ID: ${tenant.apartmentId}`;
    navigator.clipboard.writeText(credentials);
    toast.success('Credentials copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Payment Overdue': return 'destructive';
      case 'Lease Ending': return 'secondary';
      case 'Pending': return 'outline';
      default: return 'secondary';
    }
  };

  // Get unique properties for filter dropdown
  const uniqueProperties = Array.from(new Set(tenants.map(t => t.property)));

  // Filter tenants based on search and filters
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    const matchesProperty = propertyFilter === 'all' || tenant.property === propertyFilter;
    
    return matchesSearch && matchesStatus && matchesProperty;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Tenant Management</h2>
          <p className="text-gray-600 mt-1">Manage tenants, leases, and assignments</p>
        </div>
        
        <Dialog open={showAddTenant} onOpenChange={setShowAddTenant}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
              <DialogDescription>
                Create a new tenant profile and assign them to a unit
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                    placeholder="Sarah Johnson"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                    placeholder="sarah@email.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rent">Monthly Rent</Label>
                  <Input
                    id="rent"
                    type="number"
                    value={newTenant.rent}
                    onChange={(e) => setNewTenant({...newTenant, rent: e.target.value})}
                    placeholder="1200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="property">Property</Label>
                  <Select onValueChange={(value) => setNewTenant({...newTenant, property: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sunset Apartments">Sunset Apartments</SelectItem>
                      <SelectItem value="Oak Street Condos">Oak Street Condos</SelectItem>
                      <SelectItem value="Pine View Townhomes">Pine View Townhomes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit/Apartment</Label>
                  <Input
                    id="unit"
                    value={newTenant.unit}
                    onChange={(e) => setNewTenant({...newTenant, unit: e.target.value})}
                    placeholder="A101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="occupancy">Occupancy Date</Label>
                  <Input
                    id="occupancy"
                    type="date"
                    value={newTenant.occupancyDate}
                    onChange={(e) => setNewTenant({...newTenant, occupancyDate: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="leaseStart">Lease Start</Label>
                  <Input
                    id="leaseStart"
                    type="date"
                    value={newTenant.leaseStart}
                    onChange={(e) => setNewTenant({...newTenant, leaseStart: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="leaseEnd">Lease End</Label>
                  <Input
                    id="leaseEnd"
                    type="date"
                    value={newTenant.leaseEnd}
                    onChange={(e) => setNewTenant({...newTenant, leaseEnd: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddTenant(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTenant}>
                Add Tenant & Generate Credentials
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, unit, or tenant ID..."
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
                  <SelectItem key={property} value={property}>
                    {property}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Payment Overdue">Payment Overdue</SelectItem>
                <SelectItem value="Lease Ending">Lease Ending</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants ({filteredTenants.length})</CardTitle>
          <CardDescription>
            View and manage all tenant information and credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Lease Period</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credentials</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-gray-500">{tenant.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {tenant.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {tenant.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.unit}</p>
                        <p className="text-sm text-gray-500">{tenant.property}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {tenant.leaseStart}
                        </div>
                        <div className="text-gray-500">to {tenant.leaseEnd}</div>
                      </div>
                    </TableCell>
                    <TableCell>₦{tenant.rent}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCredentials(tenant)}
                          className="h-8 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendCredentialsEmail(tenant)}
                          className="h-8 px-2"
                        >
                          <Mail className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTenant(tenant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <Search className="h-8 w-8 text-gray-400" />
                        <p className="font-medium">No tenants found</p>
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
    </div>
  );
};

