import React, { useState, useEffect } from 'react';
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
import { formatCurrency, getSmartBaseCurrency } from '../lib/currency';
import { deleteProperty } from '../lib/api/properties';
import { getUnits } from '../lib/api/units';
import { getManagerAnalytics } from '../lib/api/dashboard';
import { usePersistentState } from '../lib/usePersistentState';
import { 
  Plus, Edit, Eye, MapPin, Home, Users, Search, Filter, 
  MoreHorizontal, Building2, DollarSign, TrendingUp, 
  Wrench, Phone, Mail, Calendar, Bed, Bath, SquareFoot,
  AlertCircle, AlertTriangle, CheckCircle, Clock, LayoutGrid, List,
  Download, Upload, Settings, Key, Star, Copy,
  Archive, Trash2, ExternalLink, ChevronRight,
  TrendingDown, Activity, Target, FileText,
  BarChart3, PieChart, Zap, Droplets, Wifi, Thermometer
} from 'lucide-react';

interface PropertyManagementProps {
  assignedPropertyIds?: string[];
  isManagerView?: boolean;
  properties?: any[]; // Real properties from database
  user?: any; // Current user information
}

export const PropertyManagement = ({ assignedPropertyIds = [], isManagerView = false, properties: propProperties, user }: PropertyManagementProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = usePersistentState('property-management-tab', 'overview');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Calculate smart base currency based on properties
  const smartBaseCurrency = getSmartBaseCurrency(propProperties || []);
  
  // Unit search and filter state
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [unitStatusFilter, setUnitStatusFilter] = useState('all');
  const [unitPropertyFilter, setUnitPropertyFilter] = useState('all');
  
  // Units data state
  const [units, setUnits] = useState<any[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  
  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // Mock properties as fallback
  const mockProperties = [
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
      currency: 'USD',
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
      currency: 'NGN',
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
      currency: 'GBP',
      yearBuilt: 2015,
      manager: 'Mike Wilson',
      maintenanceRequests: 5,
      features: ['Parking', 'Yard', 'Pet-Friendly'],
      rating: 4.2
    }
  ];

  // Use real properties from backend if available, otherwise use mock data
  const enrichedProperties = (propProperties && propProperties.length > 0 ? propProperties : mockProperties).map(prop => {
    // Use backend-calculated values when available
    const totalUnits = prop._count?.units || prop.totalUnits || 0;
    const occupiedUnits = prop.occupiedUnits || 0;
    
    // Use totalMonthlyIncome from backend (already calculated), fallback to monthlyRevenue
    const monthlyRevenue = prop.totalMonthlyIncome || prop.monthlyRevenue || 0;
    
    return {
      ...prop,
      totalUnits,
      occupiedUnits,
      monthlyRevenue,
      maintenanceRequests: prop.maintenanceRequests || 0,
      currency: prop.currency || 'NGN',
      image: prop.coverImage || prop.image // Map coverImage to image for consistency
    };
  });

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
    ? enrichedProperties.filter(property => assignedPropertyIds.includes(property.id.toString()))
    : enrichedProperties;

  // Fetch units for manager's assigned properties
  useEffect(() => {
    const fetchUnits = async () => {
      // Create a stable reference for property IDs
      const propertyIds = properties.map(p => p.id);
      
      if (propertyIds.length === 0) {
        setUnits([]);
        setLoadingUnits(false);
        return;
      }

      try {
        setLoadingUnits(true);
        console.log('🔄 Fetching units for properties...');
        
        // Fetch all units
        const response = await getUnits();
        
        if (response.error) {
          console.error('Failed to fetch units:', response.error);
          toast.error('Failed to load units');
          setUnits([]);
        } else if (response.data) {
          if (isManagerView) {
            // Filter units to only show those from assigned properties
            const filteredUnits = response.data.filter((unit: any) => 
              propertyIds.includes(unit.propertyId)
            );
            
            console.log('✅ Loaded units for manager:', {
              total: response.data.length,
              filtered: filteredUnits.length,
              assignedPropertyIds: propertyIds
            });
            
            setUnits(filteredUnits);
          } else {
            // For owners, show all units
            console.log('✅ Loaded all units for owner:', response.data.length);
            setUnits(response.data);
          }
        }
      } catch (error) {
        console.error('Error fetching units:', error);
        toast.error('Failed to load units');
        setUnits([]);
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propProperties, isManagerView, assignedPropertyIds.length]);

  // Fetch analytics data when Analytics tab is active
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (activeTab !== 'analytics') return;
      
      try {
        setLoadingAnalytics(true);
        console.log('📊 Fetching analytics data...');
        
        const response = await getManagerAnalytics();
        
        if (response.error) {
          console.error('Failed to fetch analytics:', response.error);
          toast.error('Failed to load analytics');
          setAnalyticsData(null);
        } else if (response.data) {
          console.log('✅ Analytics data loaded:', response.data);
          setAnalyticsData(response.data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics');
        setAnalyticsData(null);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, [activeTab]);

  // Check if current user can edit a specific property
  const canEditProperty = (property: any): boolean => {
    // Property owners and admins can always edit
    if (!isManagerView || user?.role === 'owner' || user?.role === 'admin' || user?.role === 'super_admin') {
      return true;
    }

    // For managers, check if they have edit permissions for this property
    if (isManagerView && property.property_managers) {
      const managerAssignment = property.property_managers.find(
        (pm: any) => pm.managerId === user?.id && pm.isActive
      );
      
      console.log('🔐 Checking edit permissions for property:', property.name, {
        managerId: user?.id,
        assignment: managerAssignment,
        permissions: managerAssignment?.permissions
      });
      
      // Check if permissions object has canEdit flag
      if (managerAssignment?.permissions) {
        return managerAssignment.permissions.canEdit === true;
      }
    }

    // By default, managers cannot edit
    return false;
  };

  // Check if current user can delete a specific property
  const canDeleteProperty = (property: any): boolean => {
    // Property owners and admins can always delete
    if (!isManagerView || user?.role === 'owner' || user?.role === 'admin' || user?.role === 'super_admin') {
      return true;
    }

    // For managers, check if they have delete permissions for this property
    if (isManagerView && property.property_managers) {
      const managerAssignment = property.property_managers.find(
        (pm: any) => pm.managerId === user?.id && pm.isActive
      );
      
      // Check if permissions object has canDelete flag
      if (managerAssignment?.permissions) {
        return managerAssignment.permissions.canDelete === true;
      }
    }

    // By default, managers cannot delete
    return false;
  };

  // Handle delete property
  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    
    try {
      setIsDeleting(true);
      const response = await deleteProperty(propertyToDelete.id);
      
      if ((response as any).error) {
        // Extract the error message from the error object
        const errorMessage = (response as any).error.error || (response as any).error.message || 'Failed to delete property';
        throw new Error(errorMessage);
      }
      
      toast.success(`Property "${propertyToDelete.name}" deleted successfully`);
      setShowDeleteDialog(false);
      setPropertyToDelete(null);
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete property');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get units for a specific property from real data
  const getUnitsForProperty = (propertyId: string | number) => {
    return units.filter(unit => unit.propertyId === propertyId || unit.propertyId === String(propertyId));
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
                <div className="text-2xl font-semibold">{formatCurrency(portfolioMetrics.totalRevenue, smartBaseCurrency)}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  {properties.length > 1 && properties.some(p => p.currency !== smartBaseCurrency) && 
                    <span className="text-orange-600 mr-2">Multi-currency</span>
                  }
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
                        <p className="font-medium text-green-600">{formatCurrency(property.monthlyRevenue, property.currency || 'NGN')}</p>
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
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500 mb-1">Units</p>
                          <p className="font-semibold text-gray-900">{property.occupiedUnits}/{property.totalUnits}</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="text-xs text-blue-600 mb-1">Occupancy</p>
                          <p className="font-semibold text-blue-900">
                            {property.totalUnits > 0 ? Math.round((property.occupiedUnits / property.totalUnits) * 100) : 0}%
                          </p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-xs text-green-600 mb-1">Revenue</p>
                          <p className="font-semibold text-green-900 text-sm">
                            {formatCurrency(property.monthlyRevenue, property.currency)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 items-center justify-between">
                        {/* Permission badges */}
                        {isManagerView && (
                          <div className="flex gap-1 flex-wrap">
                            {canEditProperty(property) && (
                              <Badge variant="secondary" className="text-xs">Can Edit</Badge>
                            )}
                            {canDeleteProperty(property) && (
                              <Badge variant="destructive" className="text-xs">Can Delete</Badge>
                            )}
                            {!canEditProperty(property) && !canDeleteProperty(property) && (
                              <Badge variant="outline" className="text-xs">View Only</Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Three-dot menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 ml-auto"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Property Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => setSelectedProperty(property)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            {canEditProperty(property) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    toast.info('Edit property feature coming soon');
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Property
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {canDeleteProperty(property) && (
                              <>
                                <DropdownMenuSeparator />
                                {!isManagerView && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      toast.info('Archive feature coming soon');
                                    }}
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setPropertyToDelete(property);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Property
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Properties List View */}
          {viewMode === 'list' && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredProperties.map((property) => (
                    <div key={property.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                          <ImageWithFallback 
                            src={property.image}
                            alt={property.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Property Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{property.name}</h3>
                              <p className="text-sm text-gray-500 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {property.address}, {property.city}
                              </p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(property.status)}>
                              {property.status}
                            </Badge>
                          </div>
                          
                          {/* Metrics */}
                          <div className="flex gap-4 mt-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-gray-100 rounded">
                                <Home className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Units</p>
                                <p className="font-semibold text-sm">{property.occupiedUnits}/{property.totalUnits}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-100 rounded">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-blue-600">Occupancy</p>
                                <p className="font-semibold text-sm text-blue-900">
                                  {property.totalUnits > 0 ? Math.round((property.occupiedUnits / property.totalUnits) * 100) : 0}%
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-green-100 rounded">
                                <DollarSign className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-xs text-green-600">Monthly Revenue</p>
                                <p className="font-semibold text-sm text-green-900">
                                  {formatCurrency(property.monthlyRevenue, property.currency)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Permission badges for managers */}
                          {isManagerView && (
                            <div className="flex gap-2 mt-3">
                              {canEditProperty(property) && (
                                <Badge variant="secondary" className="text-xs">Can Edit</Badge>
                              )}
                              {canDeleteProperty(property) && (
                                <Badge variant="destructive" className="text-xs">Can Delete</Badge>
                              )}
                              {!canEditProperty(property) && !canDeleteProperty(property) && (
                                <Badge variant="outline" className="text-xs">View Only</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Three-dot menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Property Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => setSelectedProperty(property)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            {canEditProperty(property) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    toast.info('Edit property feature coming soon');
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Property
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {canDeleteProperty(property) && (
                              <>
                                <DropdownMenuSeparator />
                                {!isManagerView && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      toast.info('Archive feature coming soon');
                                    }}
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setPropertyToDelete(property);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Property
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
              {loadingUnits ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading units...</p>
                  </div>
                </div>
              ) : units.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">No units found</p>
                  <p className="text-sm text-gray-500 mt-1">Units will appear here once properties have units assigned to them.</p>
                </div>
              ) : (
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
                            const unitNumber = unit.unitNumber || unit.id || '';
                            const tenantName = unit.tenant || (unit.leases && unit.leases[0]?.users?.name) || '';
                            const matchesSearch = 
                              unitNumber.toString().toLowerCase().includes(unitSearchTerm.toLowerCase()) ||
                              tenantName.toLowerCase().includes(unitSearchTerm.toLowerCase());
                            const matchesStatus = 
                              unitStatusFilter === 'all' || 
                              unit.status.toLowerCase() === unitStatusFilter.toLowerCase();
                            return matchesSearch && matchesStatus;
                          })
                          .map(unit => {
                            const unitNumber = unit.unitNumber || unit.id;
                            const tenantName = unit.tenant || (unit.leases && unit.leases[0]?.users?.name) || '';
                            const unitSize = unit.size || unit.sqft || '-';
                            const monthlyRent = unit.monthlyRent || unit.rent || 0;
                            
                            return (
                              <TableRow key={`${property.id}-${unit.id}`}>
                                <TableCell className="font-medium">{unitNumber}</TableCell>
                                <TableCell>{property.name}</TableCell>
                                <TableCell>{unit.floor || '-'}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                      <Bed className="h-3 w-3" />
                                      {unit.bedrooms || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Bath className="h-3 w-3" />
                                      {unit.bathrooms || 0}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>{unitSize}</TableCell>
                                <TableCell>{formatCurrency(monthlyRent, property.currency || 'USD')}</TableCell>
                                <TableCell>{tenantName || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(unit.status)}>
                                    {unit.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                      )}
                  </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {loadingAnalytics ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading analytics...</p>
              </div>
            </div>
          ) : analyticsData ? (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rent</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {formatCurrency(analyticsData.averageRent, user?.baseCurrency || 'USD')}
                    </div>
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
                    <div className="text-2xl font-semibold">{analyticsData.tenantRetention}%</div>
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
                    <div className="text-2xl font-semibold">{analyticsData.avgDaysVacant}</div>
                    <p className="text-xs text-muted-foreground">
                      {analyticsData.avgDaysVacant < 30 ? 'Below market average' : 'Above market average'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No analytics data available</p>
              </div>
            </div>
          )}

          {analyticsData && !loadingAnalytics && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Property</CardTitle>
                  <CardDescription>Monthly comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.revenueByProperty && analyticsData.revenueByProperty.length > 0 ? (
                    <div className="space-y-4">
                      {analyticsData.revenueByProperty.map((property: any) => (
                        <div key={property.id}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">{property.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(property.revenue, property.currency)}
                            </span>
                          </div>
                          <Progress value={property.percentage} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No revenue data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Unit Distribution</CardTitle>
                  <CardDescription>By bedroom count</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.unitDistribution && analyticsData.unitDistribution.length > 0 ? (
                    <div className="space-y-4">
                      {analyticsData.unitDistribution.map((dist: any) => (
                        <div key={dist.bedrooms}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">
                              {dist.bedrooms === 'Studio' ? 'Studio' : `${dist.bedrooms} Bedroom${parseInt(dist.bedrooms) > 1 ? 's' : ''}`}
                            </span>
                            <span className="text-sm text-muted-foreground">{dist.count} units</span>
                          </div>
                          <Progress value={dist.percentage} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No unit distribution data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Property Details Dialog */}
      {selectedProperty && (
        <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedProperty.name}</DialogTitle>
              <DialogDescription className="flex items-center text-base">
                <MapPin className="h-4 w-4 mr-1" />
                {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.postalCode}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Property Image */}
              {selectedProperty.coverImage && (
                <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-200">
                  <ImageWithFallback 
                    src={selectedProperty.coverImage || selectedProperty.image}
                    alt={selectedProperty.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Home className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold">{selectedProperty.totalUnits}</p>
                      <p className="text-sm text-gray-500">Total Units</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold">{selectedProperty.occupiedUnits}</p>
                      <p className="text-sm text-gray-500">Occupied</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold">
                        {selectedProperty.totalUnits > 0 
                          ? Math.round((selectedProperty.occupiedUnits / selectedProperty.totalUnits) * 100) 
                          : 0}%
                      </p>
                      <p className="text-sm text-gray-500">Occupancy</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <p className="text-lg font-bold">
                        {formatCurrency(selectedProperty.monthlyRevenue, selectedProperty.currency)}
                      </p>
                      <p className="text-sm text-gray-500">Monthly Revenue</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Property Details Tabs */}
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Property Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500">Property Type</Label>
                        <p className="font-medium">{selectedProperty.propertyType || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Status</Label>
                        <div>
                          <Badge variant={getStatusBadgeVariant(selectedProperty.status)}>
                            {selectedProperty.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-500">Year Built</Label>
                        <p className="font-medium">{selectedProperty.yearBuilt || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Total Area</Label>
                        <p className="font-medium">{selectedProperty.totalArea ? `${selectedProperty.totalArea.toLocaleString()} sq ft` : 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Floors</Label>
                        <p className="font-medium">{selectedProperty.floors || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Parking Spaces</Label>
                        <p className="font-medium">{selectedProperty.parking || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Lot Size</Label>
                        <p className="font-medium">{selectedProperty.lotSize ? `${selectedProperty.lotSize.toLocaleString()} sq ft` : 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Average Rent</Label>
                        <p className="font-medium">
                          {selectedProperty.avgRent 
                            ? formatCurrency(selectedProperty.avgRent, selectedProperty.currency)
                            : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedProperty.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedProperty.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedProperty.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedProperty.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Financial Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500">Purchase Price</Label>
                        <p className="font-medium">
                          {selectedProperty.purchasePrice 
                            ? formatCurrency(selectedProperty.purchasePrice, selectedProperty.currency)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Current Value</Label>
                        <p className="font-medium">
                          {selectedProperty.currentValue 
                            ? formatCurrency(selectedProperty.currentValue, selectedProperty.currency)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Property Taxes</Label>
                        <p className="font-medium">
                          {selectedProperty.propertyTaxes 
                            ? formatCurrency(selectedProperty.propertyTaxes, selectedProperty.currency)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Service Charge</Label>
                        <p className="font-medium">
                          {selectedProperty.serviceCharge 
                            ? formatCurrency(selectedProperty.serviceCharge, selectedProperty.currency)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Security Deposit</Label>
                        <p className="font-medium">
                          {selectedProperty.securityDeposit 
                            ? formatCurrency(selectedProperty.securityDeposit, selectedProperty.currency)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Application Fee</Label>
                        <p className="font-medium">
                          {selectedProperty.applicationFee 
                            ? formatCurrency(selectedProperty.applicationFee, selectedProperty.currency)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Caution Fee</Label>
                        <p className="font-medium">
                          {selectedProperty.cautionFee 
                            ? formatCurrency(selectedProperty.cautionFee, selectedProperty.currency)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Legal Fee</Label>
                        <p className="font-medium">
                          {selectedProperty.legalFee 
                            ? formatCurrency(selectedProperty.legalFee, selectedProperty.currency)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Agent Commission</Label>
                        <p className="font-medium">
                          {selectedProperty.agentCommission 
                            ? formatCurrency(selectedProperty.agentCommission, selectedProperty.currency)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Agreement Fee</Label>
                        <p className="font-medium">
                          {selectedProperty.agreementFee 
                            ? formatCurrency(selectedProperty.agreementFee, selectedProperty.currency)
                            : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {(selectedProperty.insuranceProvider || selectedProperty.insurancePolicyNumber) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Insurance Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-500">Insurance Provider</Label>
                          <p className="font-medium">{selectedProperty.insuranceProvider || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Policy Number</Label>
                          <p className="font-medium">{selectedProperty.insurancePolicyNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Premium</Label>
                          <p className="font-medium">
                            {selectedProperty.insurancePremium 
                              ? formatCurrency(selectedProperty.insurancePremium, selectedProperty.currency)
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Expiration Date</Label>
                          <p className="font-medium">
                            {selectedProperty.insuranceExpiration 
                              ? new Date(selectedProperty.insuranceExpiration).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Property Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedProperty.features && Array.isArray(selectedProperty.features) && selectedProperty.features.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedProperty.features.map((feature: string, index: number) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No features listed</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Unit Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedProperty.unitFeatures && Array.isArray(selectedProperty.unitFeatures) && selectedProperty.unitFeatures.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedProperty.unitFeatures.map((feature: string, index: number) => (
                            <Badge key={index} variant="outline" className="px-3 py-1">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No unit features listed</p>
                      )}
                    </CardContent>
                  </Card>

                  {selectedProperty.images && Array.isArray(selectedProperty.images) && selectedProperty.images.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Property Images</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {selectedProperty.images.map((image: string, index: number) => (
                            <div key={index} className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                              <ImageWithFallback 
                                src={image}
                                alt={`${selectedProperty.name} - Image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setSelectedProperty(null)}>
                Close
              </Button>
              {canEditProperty(selectedProperty) && (
                <Button onClick={() => {
                  // TODO: Navigate to edit property page or open edit dialog
                  toast.info('Edit property feature coming soon');
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Property
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Property Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this property? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {propertyToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="font-medium text-lg">{propertyToDelete.name}</p>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {propertyToDelete.address}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {propertyToDelete.totalUnits} units
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {propertyToDelete.occupiedUnits} occupied
                  </Badge>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Warning:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>All units associated with this property will be deleted</li>
                      <li>All lease records will be removed</li>
                      <li>All maintenance requests will be deleted</li>
                      <li>This action is permanent and cannot be reversed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setPropertyToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProperty}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Property
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
