import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  Plus, Edit, Eye, MapPin, Home, Users, Search, Filter, 
  MoreHorizontal, Building2, DollarSign, TrendingUp, 
  Wrench, Phone, Mail, Calendar, Bed, Bath, SquareFoot,
  AlertCircle, CheckCircle, Clock, LayoutGrid, List,
  Download, Upload, Settings, Key, Star, Copy,
  Archive, Trash2, ExternalLink, ChevronRight,
  TrendingDown, Activity, Target, FileText,
  BarChart3, PieChart, Zap, Droplets, Wifi, Thermometer
} from 'lucide-react';

interface PropertyManagementProps {
  assignedPropertyIds?: string[];
  isManagerView?: boolean;
}

export const PropertyManagement = ({ assignedPropertyIds = [], isManagerView = false }: PropertyManagementProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  
  // Unit search and filter state
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [unitStatusFilter, setUnitStatusFilter] = useState('all');
  const [unitPropertyFilter, setUnitPropertyFilter] = useState('all');
  
  const [allProperties] = useState([
    {
      id: 1,
      name: 'Sunset Apartments',
      address: '123 Main St, Downtown',
      city: 'Metro City',
      state: 'CA',
      zip: '90210',
      totalUnits: 24,
      occupiedUnits: 20,
      type: 'Apartment Complex',
      status: 'Active',
      ownerId: 'po-001',
      image: 'https://images.unsplash.com/photo-1559329146-807aff9ff1fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDF8fHx8MTc2MDUyNTM1NHww&ixlib=rb-4.1.0&q=80&w=1080',
      monthlyRevenue: 24000,
      yearBuilt: 2018,
      manager: 'Sarah Johnson',
      maintenanceRequests: 3,
      features: ['Parking', 'Pool', 'Gym', 'Laundry'],
      rating: 4.5
    },
    {
      id: 2,
      name: 'Oak Street Condos',
      address: '456 Oak Street, Midtown',
      city: 'Metro City',
      state: 'CA',
      zip: '90211',
      totalUnits: 12,
      occupiedUnits: 10,
      type: 'Condominium',
      status: 'Active',
      ownerId: 'po-001',
      image: 'https://images.unsplash.com/photo-1619647787040-5583f41eb9b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb25kb21pbml1bSUyMGJ1aWxkaW5nfGVufDF8fHx8MTc2MDU4NzgzNXww&ixlib=rb-4.1.0&q=80&w=1080',
      monthlyRevenue: 18000,
      yearBuilt: 2020,
      manager: 'Mike Wilson',
      maintenanceRequests: 1,
      features: ['Parking', 'Security', 'Balcony'],
      rating: 4.8
    },
    {
      id: 3,
      name: 'Pine View Townhomes',
      address: '789 Pine Ave, Northside',
      city: 'Metro City',
      state: 'CA',
      zip: '90212',
      totalUnits: 8,
      occupiedUnits: 6,
      type: 'Townhouse',
      status: 'Maintenance',
      ownerId: 'po-001',
      image: 'https://images.unsplash.com/photo-1758936381804-586f7e4dbea1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNpZGVudGlhbCUyMHRvd25ob3VzZSUyMGNvbXBsZXh8ZW58MXx8fHwxNzYwNTg3ODM1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      monthlyRevenue: 12000,
      yearBuilt: 2015,
      manager: 'Mike Wilson',
      maintenanceRequests: 5,
      features: ['Parking', 'Yard', 'Pet-Friendly'],
      rating: 4.2
    }
  ]);

  const [newProperty, setNewProperty] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    totalUnits: '',
    type: '',
    status: 'Active',
    yearBuilt: '',
    manager: ''
  });

  const [newUnit, setNewUnit] = useState({
    unitNumber: '',
    floor: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    rent: '',
    deposit: '',
    status: 'Vacant'
  });

  // Filter properties based on manager assignments
  const properties = isManagerView 
    ? allProperties.filter(property => assignedPropertyIds.includes(property.id.toString()))
    : allProperties;

  // Mock units data
  const getUnitsForProperty = (propertyId: number) => {
    const units: Record<number, any[]> = {
      1: [
        { id: 'A101', floor: 1, bedrooms: 1, bathrooms: 1, sqft: 750, rent: 1200, deposit: 2400, tenant: 'Sarah Johnson', status: 'Occupied', leaseEnd: '2024-12-31', moveInDate: '2024-01-01' },
        { id: 'A102', floor: 1, bedrooms: 1, bathrooms: 1, sqft: 750, rent: 1200, deposit: 2400, tenant: null, status: 'Vacant', leaseEnd: null, moveInDate: null },
        { id: 'A201', floor: 2, bedrooms: 2, bathrooms: 2, sqft: 950, rent: 1500, deposit: 3000, tenant: 'Michael Brown', status: 'Occupied', leaseEnd: '2024-11-30', moveInDate: '2023-12-01' },
        { id: 'A202', floor: 2, bedrooms: 2, bathrooms: 2, sqft: 950, rent: 1500, deposit: 3000, tenant: 'Lisa Wilson', status: 'Occupied', leaseEnd: '2025-01-31', moveInDate: '2024-02-01' },
        { id: 'A301', floor: 3, bedrooms: 2, bathrooms: 2, sqft: 1000, rent: 1600, deposit: 3200, tenant: null, status: 'Vacant', leaseEnd: null, moveInDate: null },
      ],
      2: [
        { id: 'B301', floor: 3, bedrooms: 2, bathrooms: 2, sqft: 1100, rent: 1800, deposit: 3600, tenant: 'David Chen', status: 'Occupied', leaseEnd: '2024-10-15', moveInDate: '2023-10-15' },
        { id: 'B302', floor: 3, bedrooms: 2, bathrooms: 2, sqft: 1100, rent: 1800, deposit: 3600, tenant: null, status: 'Vacant', leaseEnd: null, moveInDate: null },
        { id: 'B401', floor: 4, bedrooms: 3, bathrooms: 2.5, sqft: 1300, rent: 2100, deposit: 4200, tenant: 'Anna Martinez', status: 'Occupied', leaseEnd: '2024-09-30', moveInDate: '2023-10-01' },
      ],
      3: [
        { id: 'TH01', floor: 2, bedrooms: 3, bathrooms: 2.5, sqft: 1400, rent: 2200, deposit: 4400, tenant: 'Emily Davis', status: 'Occupied', leaseEnd: '2024-08-31', moveInDate: '2023-09-01' },
        { id: 'TH02', floor: 2, bedrooms: 3, bathrooms: 2.5, sqft: 1400, rent: 2200, deposit: 4400, tenant: null, status: 'Maintenance', leaseEnd: null, moveInDate: null },
        { id: 'TH03', floor: 2, bedrooms: 3, bathrooms: 2.5, sqft: 1450, rent: 2300, deposit: 4600, tenant: 'James Taylor', status: 'Occupied', leaseEnd: '2025-03-31', moveInDate: '2024-04-01' },
      ]
    };
    return units[propertyId] || [];
  };

  // Calculate portfolio metrics
  const portfolioMetrics = {
    totalProperties: properties.length,
    totalUnits: properties.reduce((sum, p) => sum + p.totalUnits, 0),
    occupiedUnits: properties.reduce((sum, p) => sum + p.occupiedUnits, 0),
    vacantUnits: properties.reduce((sum, p) => sum + (p.totalUnits - p.occupiedUnits), 0),
    totalRevenue: properties.reduce((sum, p) => sum + p.monthlyRevenue, 0),
    avgOccupancy: properties.length > 0 ? 
      properties.reduce((sum, p) => sum + (p.occupiedUnits / p.totalUnits * 100), 0) / properties.length : 0,
    maintenanceRequests: properties.reduce((sum, p) => sum + p.maintenanceRequests, 0)
  };

  // Filter properties based on search and status
  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleAddProperty = () => {
    toast.success('Property added successfully');
    setShowAddProperty(false);
    setNewProperty({
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      totalUnits: '',
      type: '',
      status: 'Active',
      yearBuilt: '',
      manager: ''
    });
  };

  const handleAddUnit = () => {
    toast.success('Unit added successfully');
    setShowAddUnit(false);
    setNewUnit({
      unitNumber: '',
      floor: '',
      bedrooms: '',
      bathrooms: '',
      sqft: '',
      rent: '',
      deposit: '',
      status: 'Vacant'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'maintenance':
        return 'secondary';
      case 'occupied':
        return 'default';
      case 'vacant':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Property Management</h2>
          <p className="text-gray-600 mt-1">
            {isManagerView 
              ? `Managing ${properties.length} assigned properties`
              : "Manage your properties, units, and tenants"
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isManagerView && (
            <Button onClick={() => setShowAddProperty(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{portfolioMetrics.totalProperties}</div>
                <p className="text-xs text-muted-foreground">
                  {portfolioMetrics.totalUnits} total units
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{portfolioMetrics.avgOccupancy.toFixed(1)}%</div>
                <Progress value={portfolioMetrics.avgOccupancy} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">₦{portfolioMetrics.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  +8.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{portfolioMetrics.maintenanceRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Active requests
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Property Performance */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Performance</CardTitle>
                <CardDescription>Revenue and occupancy by property</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                          <ImageWithFallback 
                            src={property.image}
                            alt={property.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium">{property.name}</h4>
                          <p className="text-sm text-gray-600">{property.occupiedUnits}/{property.totalUnits} units occupied</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">₦{property.monthlyRevenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{((property.occupiedUnits / property.totalUnits) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across all properties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Lease renewed at Sunset Apartments</p>
                      <p className="text-xs text-gray-600">Unit A201 - 1 year extension</p>
                      <p className="text-xs text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Wrench className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">New maintenance request</p>
                      <p className="text-xs text-gray-600">Pine View Townhomes - TH02</p>
                      <p className="text-xs text-gray-400">4 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Rent payment received</p>
                      <p className="text-xs text-gray-600">Oak Street Condos - B301</p>
                      <p className="text-xs text-gray-400">1 day ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Home className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Unit became available</p>
                      <p className="text-xs text-gray-600">Sunset Apartments - A301</p>
                      <p className="text-xs text-gray-400">2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="vacant">Vacant</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Properties Grid - simplified for brevity */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 relative">
                    <ImageWithFallback 
                      src={property.image}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant={getStatusBadgeVariant(property.status)}>
                        {property.status}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {property.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Home className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">Total Units</p>
                            <p className="font-medium">{property.totalUnits}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">Occupied</p>
                            <p className="font-medium">{property.occupiedUnits}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedProperty(property)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Units
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by unit number, tenant name..."
                    value={unitSearchTerm}
                    onChange={(e) => setUnitSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={unitPropertyFilter} onValueChange={setUnitPropertyFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Properties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={unitStatusFilter} onValueChange={setUnitStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Units</CardTitle>
              <CardDescription>Manage individual units across all properties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Bed/Bath</TableHead>
                      <TableHead>Sq Ft</TableHead>
                      <TableHead>Rent</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties
                      .filter(property => 
                        unitPropertyFilter === 'all' || property.id.toString() === unitPropertyFilter
                      )
                      .flatMap(property => 
                        getUnitsForProperty(property.id)
                          .filter(unit => {
                            const matchesSearch = 
                              unit.id.toLowerCase().includes(unitSearchTerm.toLowerCase()) ||
                              (unit.tenant && unit.tenant.toLowerCase().includes(unitSearchTerm.toLowerCase()));
                            const matchesStatus = 
                              unitStatusFilter === 'all' || 
                              unit.status.toLowerCase() === unitStatusFilter.toLowerCase();
                            return matchesSearch && matchesStatus;
                          })
                          .map(unit => (
                            <TableRow key={`${property.id}-${unit.id}`}>
                              <TableCell className="font-medium">{unit.id}</TableCell>
                              <TableCell>{property.name}</TableCell>
                              <TableCell>{unit.floor}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1">
                                    <Bed className="h-3 w-3" />
                                    {unit.bedrooms}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Bath className="h-3 w-3" />
                                    {unit.bathrooms}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{unit.sqft}</TableCell>
                              <TableCell>₦{unit.rent}</TableCell>
                              <TableCell>{unit.tenant || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(unit.status)}>
                                  {unit.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rent</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">$1,467</div>
                <p className="text-xs text-muted-foreground">
                  Across all units
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tenant Retention</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">87%</div>
                <p className="text-xs text-muted-foreground">
                  12-month average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Days Vacant</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">14</div>
                <p className="text-xs text-muted-foreground">
                  Below market average
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Property</CardTitle>
                <CardDescription>Monthly comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.map((property) => (
                    <div key={property.id}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{property.name}</span>
                        <span className="text-sm text-muted-foreground">₦{property.monthlyRevenue.toLocaleString()}</span>
                      </div>
                      <Progress 
                        value={(property.monthlyRevenue / portfolioMetrics.totalRevenue) * 100} 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unit Distribution</CardTitle>
                <CardDescription>By bedroom count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">1 Bedroom</span>
                      <span className="text-sm text-muted-foreground">6 units</span>
                    </div>
                    <Progress value={35} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">2 Bedrooms</span>
                      <span className="text-sm text-muted-foreground">8 units</span>
                    </div>
                    <Progress value={47} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">3 Bedrooms</span>
                      <span className="text-sm text-muted-foreground">3 units</span>
                    </div>
                    <Progress value={18} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
