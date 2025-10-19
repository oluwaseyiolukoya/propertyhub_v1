import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { toast } from "sonner";
import { 
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  MoreHorizontal,
  Plus,
  MapPin,
  Calendar,
  Home,
  Bed,
  Bath,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
  FileText,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Percent,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Archive,
  ExternalLink,
  Zap,
  Shield,
  Droplets,
  Target,
  Settings
} from 'lucide-react';

interface PropertiesPageProps {
  user: any;
  onBack: () => void;
  onAddProperty?: (propertyData: any) => void;
  onNavigateToAddProperty?: () => void;
  properties: any[];
  onUpdateProperty?: (propertyId: number, updates: any) => void;
}

export function PropertiesPage({ user, onBack, onAddProperty, onNavigateToAddProperty, properties, onUpdateProperty }: PropertiesPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Calculate portfolio metrics from properties
  const portfolioMetrics = {
    totalProperties: properties.length,
    totalUnits: properties.reduce((sum, p) => sum + (p.totalUnits || p.units || 0), 0),
    occupiedUnits: properties.reduce((sum, p) => sum + (p.occupiedUnits || p.occupied || 0), 0),
    vacantUnits: properties.reduce((sum, p) => sum + (p.vacantUnits || (p.units - p.occupied) || 0), 0),
    totalRevenue: properties.reduce((sum, p) => sum + (p.monthlyRevenue || 0), 0),
    avgOccupancy: properties.length > 0 ? 
      properties.reduce((sum, p) => sum + (p.occupancyRate || ((p.occupied || 0) / (p.units || 1) * 100)), 0) / properties.length : 0,
    maintenanceRequests: properties.reduce((sum, p) => sum + (p.maintenanceRequests || 0), 0)
  };

  const maintenanceRequests = [
    {
      id: 1,
      propertyId: 1,
      propertyName: "Sunset Apartments",
      unit: "4B",
      tenant: "John Smith",
      issue: "Leaking faucet in kitchen",
      priority: "medium",
      status: "in-progress",
      requestDate: "2024-03-20",
      assignedTo: "Plumbing Pro Services",
      estimatedCost: 125
    },
    {
      id: 2,
      propertyId: 2,
      propertyName: "Riverside Complex",
      unit: "12A",
      tenant: "Maria Garcia",
      issue: "Air conditioning not working",
      priority: "high",
      status: "pending",
      requestDate: "2024-03-21",
      assignedTo: null,
      estimatedCost: 450
    },
    {
      id: 3,
      propertyId: 1,
      propertyName: "Sunset Apartments",
      unit: "7C",
      tenant: "Robert Johnson",
      issue: "Garbage disposal replacement",
      priority: "low",
      status: "scheduled",
      requestDate: "2024-03-19",
      assignedTo: "Fix-It Fast",
      estimatedCost: 280
    }
  ];

  const units = [
    {
      id: 1,
      propertyId: 1,
      unit: "1A",
      bedrooms: 2,
      bathrooms: 1,
      sqft: 850,
      rent: 875,
      deposit: 1750,
      status: "occupied",
      tenant: "Alice Johnson",
      leaseStart: "2024-01-01",
      leaseEnd: "2024-12-31",
      moveInDate: "2024-01-01",
      phoneNumber: "(555) 111-2222",
      email: "alice@email.com"
    },
    {
      id: 2,
      propertyId: 1,
      unit: "1B",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 650,
      rent: 725,
      deposit: 1450,
      status: "vacant",
      tenant: null,
      leaseStart: null,
      leaseEnd: null,
      moveInDate: null,
      phoneNumber: null,
      email: null
    },
    {
      id: 3,
      propertyId: 1,
      unit: "2A",
      bedrooms: 2,
      bathrooms: 2,
      sqft: 950,
      rent: 950,
      deposit: 1900,
      status: "occupied",
      tenant: "Bob Wilson",
      leaseStart: "2023-08-15",
      leaseEnd: "2024-08-14",
      moveInDate: "2023-08-15",
      phoneNumber: "(555) 333-4444",
      email: "bob@email.com"
    }
  ];

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-yellow-600" />;
      case 'vacant':
        return <Home className="h-4 w-4 text-gray-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'maintenance':
        return 'secondary';
      case 'vacant':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getUnitStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'text-green-600';
      case 'vacant':
        return 'text-yellow-600';
      case 'maintenance':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handlePropertyAction = (action: string, propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    
    switch (action) {
      case 'view':
        toast.info('View property details - coming soon');
        break;
      case 'edit':
        toast.info('Edit property - coming soon');
        break;
      case 'duplicate':
        if (property && onAddProperty) {
          const duplicatedProperty = {
            ...property,
            id: Date.now(),
            name: `${property.name} (Copy)`,
            occupiedUnits: 0,
            monthlyRevenue: 0,
            occupancyRate: 0
          };
          onAddProperty(duplicatedProperty);
          toast.success('Property duplicated successfully');
        }
        break;
      case 'archive':
        if (onUpdateProperty) {
          onUpdateProperty(propertyId, { status: 'archived' });
          toast.success('Property archived');
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={onBack} className="mr-4">
                ← Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Properties</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={onNavigateToAddProperty}>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="units">Units</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Portfolio Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{portfolioMetrics.totalProperties}</div>
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
                    <div className="text-2xl font-bold">{portfolioMetrics.avgOccupancy.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {portfolioMetrics.occupiedUnits}/{portfolioMetrics.totalUnits} units occupied
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${portfolioMetrics.totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      +8.2% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Maintenance Requests</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{portfolioMetrics.maintenanceRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      1 high priority
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Property Performance Summary */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Performance</CardTitle>
                    <CardDescription>Revenue and occupancy by property</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {properties.map((property) => (
                        <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{property.name}</h4>
                              <p className="text-sm text-gray-600">{property.occupied}/{property.units} units</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${property.monthlyRevenue.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{((property.occupied / property.units) * 100).toFixed(1)}% occupied</p>
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
                        <div>
                          <p className="text-sm font-medium">Lease renewed at Park View Towers</p>
                          <p className="text-xs text-gray-600">Unit 12A - 1 year extension</p>
                          <p className="text-xs text-gray-400">2 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Wrench className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Maintenance request at Sunset Apartments</p>
                          <p className="text-xs text-gray-600">Unit 4B - Leaking faucet</p>
                          <p className="text-xs text-gray-400">4 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 border rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Rent payment received</p>
                          <p className="text-xs text-gray-600">Riverside Complex - Unit 8C</p>
                          <p className="text-xs text-gray-400">1 day ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Home className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Unit became available</p>
                          <p className="text-xs text-gray-600">Garden Homes - Unit 3A</p>
                          <p className="text-xs text-gray-400">2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common property management tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-20 flex-col" onClick={onNavigateToAddProperty}>
                      <Plus className="h-6 w-6 mb-2" />
                      Add Property
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Users className="h-6 w-6 mb-2" />
                      Find Tenants
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Wrench className="h-6 w-6 mb-2" />
                      Schedule Maintenance
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <FileText className="h-6 w-6 mb-2" />
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Search & Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1">
                      <Input
                        placeholder="Search properties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
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
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        Grid
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                      >
                        List
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Properties Grid/List View */}
              {viewMode === 'grid' ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((property) => (
                    <Card key={property.id} className="overflow-hidden">
                      <div className="h-48 bg-gray-200 relative">
                        <img 
                          src={property.images[0]} 
                          alt={property.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant={getStatusBadge(property.status)}>
                            {property.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{property.name}</h3>
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {property.address}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePropertyAction('view', property.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePropertyAction('edit', property.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Property
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handlePropertyAction('duplicate', property.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePropertyAction('archive', property.id)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Units:</span>
                            <span>{property.occupied}/{property.units}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Occupancy:</span>
                            <span className="font-medium">{((property.occupied / property.units) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Monthly Revenue:</span>
                            <span className="font-medium text-green-600">${property.monthlyRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Manager:</span>
                            <span>{property.manager}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center space-x-2">
                          {property.features.slice(0, 3).map((feature: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {property.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{property.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mt-4 flex space-x-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handlePropertyAction('view', property.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handlePropertyAction('edit', property.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead>Occupancy</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Manager</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProperties.map((property) => (
                          <TableRow key={property.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-lg bg-gray-200 overflow-hidden">
                                  <img 
                                    src={property.images[0]} 
                                    alt={property.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-medium">{property.name}</p>
                                  <p className="text-sm text-gray-600">{property.propertyType}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{property.address}</p>
                                <p className="text-xs text-gray-600">{property.city}, {property.state}</p>
                              </div>
                            </TableCell>
                            <TableCell>{property.occupied}/{property.units}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span>{((property.occupied / property.units) * 100).toFixed(1)}%</span>
                                <Progress value={(property.occupied / property.units) * 100} className="w-16 h-2" />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              ${property.monthlyRevenue.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{property.manager}</p>
                                <p className="text-xs text-gray-600">{property.managerPhone}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(property.status)}
                                <Badge variant={getStatusBadge(property.status)}>
                                  {property.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handlePropertyAction('view', property.id)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handlePropertyAction('edit', property.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handlePropertyAction('duplicate', property.id)}>
                                      <Copy className="mr-2 h-4 w-4" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePropertyAction('archive', property.id)}>
                                      <Archive className="mr-2 h-4 w-4" />
                                      Archive
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Other tabs with full implementation */}
            <TabsContent value="units" className="space-y-6">
              {/* Units Overview */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{portfolioMetrics.totalUnits}</div>
                    <p className="text-xs text-muted-foreground">Across all properties</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Occupied</CardTitle>
                    <Users className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{portfolioMetrics.occupiedUnits}</div>
                    <p className="text-xs text-muted-foreground">{((portfolioMetrics.occupiedUnits / portfolioMetrics.totalUnits) * 100).toFixed(1)}% occupied</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vacant</CardTitle>
                    <Home className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{portfolioMetrics.vacantUnits}</div>
                    <p className="text-xs text-muted-foreground">Available for rent</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Rent</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$772</div>
                    <p className="text-xs text-muted-foreground">Per unit per month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Units Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Unit Management</CardTitle>
                  <CardDescription>Manage individual units across all properties</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Input placeholder="Search units..." className="w-64" />
                        <Select defaultValue="all">
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Units</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="vacant">Vacant</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Unit
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Rent</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Lease</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {units.map((unit) => {
                          const property = properties.find(p => p.id === unit.propertyId);
                          return (
                            <TableRow key={unit.id}>
                              <TableCell>{property?.name}</TableCell>
                              <TableCell className="font-medium">{unit.unit}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2 text-sm">
                                  <div className="flex items-center space-x-1">
                                    <Bed className="h-3 w-3" />
                                    <span>{unit.bedrooms}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Bath className="h-3 w-3" />
                                    <span>{unit.bathrooms}</span>
                                  </div>
                                  <span>{unit.sqft} sqft</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">${unit.rent}</TableCell>
                              <TableCell>
                                {unit.tenant ? (
                                  <div>
                                    <p className="font-medium">{unit.tenant}</p>
                                    <p className="text-xs text-gray-600">{unit.phoneNumber}</p>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">Vacant</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {unit.leaseEnd ? (
                                  <div className="text-sm">
                                    <p>Expires: {unit.leaseEnd}</p>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">No lease</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={unit.status === 'occupied' ? 'default' : 'secondary'}
                                  className={getUnitStatusColor(unit.status)}
                                >
                                  {unit.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financials" className="space-y-6">
              {/* Financial Overview */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Income</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$125,960</div>
                    <p className="text-xs text-muted-foreground">+8.2% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$90,810</div>
                    <p className="text-xs text-muted-foreground">After expenses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$25,100</div>
                    <p className="text-xs text-muted-foreground">19.9% of gross income</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cap Rate</CardTitle>
                    <Percent className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">6.9%</div>
                    <p className="text-xs text-muted-foreground">Portfolio average</p>
                  </CardContent>
                </Card>
              </div>

              {/* Property Financial Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Financial Performance</CardTitle>
                  <CardDescription>Revenue, expenses, and profitability by property</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Gross Rent</TableHead>
                        <TableHead>Expenses</TableHead>
                        <TableHead>Net Income</TableHead>
                        <TableHead>Cap Rate</TableHead>
                        <TableHead>Cash Flow</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{property.name}</p>
                              <p className="text-sm text-gray-600">{property.totalUnits} units</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            ${property.financials.grossRent.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-red-600">
                            ${property.financials.expenses.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${property.financials.netIncome.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{property.financials.capRate}%</span>
                              {property.financials.capRate > 7 ? (
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-blue-600">
                            ${property.financials.cashFlow.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Expense Breakdown */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Categories</CardTitle>
                    <CardDescription>Monthly operating expenses breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4 text-blue-600" />
                          <span>Maintenance & Repairs</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$8,500</p>
                          <p className="text-sm text-gray-600">33.9%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span>Insurance</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$4,200</p>
                          <p className="text-sm text-gray-600">16.7%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span>Property Management</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$3,800</p>
                          <p className="text-sm text-gray-600">15.1%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span>Utilities</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$3,200</p>
                          <p className="text-sm text-gray-600">12.7%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <span>Legal & Administrative</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$2,100</p>
                          <p className="text-sm text-gray-600">8.4%</p>
                        </div>
                      </div>
                      
                      <div className="h-px bg-gray-200 my-4" />
                      
                      <div className="flex items-center justify-between font-medium">
                        <span>Total Monthly Expenses</span>
                        <span>$25,100</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Financial Trends</CardTitle>
                    <CardDescription>6-month performance overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Revenue Growth</span>
                          <div className="flex items-center space-x-1 text-green-600">
                            <ArrowUpRight className="h-4 w-4" />
                            <span className="text-sm font-medium">+12.4%</span>
                          </div>
                        </div>
                        <Progress value={84} className="h-2" />
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Occupancy Rate</span>
                          <div className="flex items-center space-x-1 text-green-600">
                            <ArrowUpRight className="h-4 w-4" />
                            <span className="text-sm font-medium">+3.2%</span>
                          </div>
                        </div>
                        <Progress value={92} className="h-2" />
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Operating Efficiency</span>
                          <div className="flex items-center space-x-1 text-green-600">
                            <ArrowUpRight className="h-4 w-4" />
                            <span className="text-sm font-medium">+5.7%</span>
                          </div>
                        </div>
                        <Progress value={78} className="h-2" />
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Maintenance Costs</span>
                          <div className="flex items-center space-x-1 text-red-600">
                            <ArrowUpRight className="h-4 w-4" />
                            <span className="text-sm font-medium">+8.1%</span>
                          </div>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-6">
              {/* Maintenance Overview */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                    <Wrench className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{maintenanceRequests.length}</div>
                    <p className="text-xs text-muted-foreground">Across all properties</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {maintenanceRequests.filter(r => r.priority === 'high').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Urgent attention needed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$285</div>
                    <p className="text-xs text-muted-foreground">Per request</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">4.2h</div>
                    <p className="text-xs text-muted-foreground">Average response</p>
                  </CardContent>
                </Card>
              </div>

              {/* Maintenance Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Requests</CardTitle>
                  <CardDescription>Track and manage property maintenance across your portfolio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Input placeholder="Search requests..." className="w-64" />
                        <Select defaultValue="all">
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select defaultValue="all">
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Request
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property & Unit</TableHead>
                          <TableHead>Issue</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenanceRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{request.propertyName}</p>
                                <p className="text-sm text-gray-600">Unit {request.unit}</p>
                              </div>
                            </TableCell>
                            <TableCell>{request.issue}</TableCell>
                            <TableCell>{request.tenant}</TableCell>
                            <TableCell>
                              <Badge variant={getPriorityBadge(request.priority)}>
                                {request.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {request.assignedTo ? (
                                <span className="text-sm">{request.assignedTo}</span>
                              ) : (
                                <span className="text-gray-500">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {request.estimatedCost ? (
                                <span className="font-medium">${request.estimatedCost}</span>
                              ) : (
                                <span className="text-gray-500">TBD</span>
                              )}
                            </TableCell>
                            <TableCell>{request.requestDate}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Maintenance</CardTitle>
                  <CardDescription>Upcoming preventive maintenance and inspections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">HVAC Inspection - Sunset Apartments</h4>
                          <p className="text-sm text-gray-600">Annual inspection due</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">March 25, 2024</p>
                        <p className="text-xs text-gray-600">2 days</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Droplets className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Plumbing Check - Riverside Complex</h4>
                          <p className="text-sm text-gray-600">Quarterly maintenance</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">March 28, 2024</p>
                        <p className="text-xs text-gray-600">5 days</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <div>
                          <h4 className="font-medium">Fire Safety Inspection - Park View Towers</h4>
                          <p className="text-sm text-gray-600">Annual safety check</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">April 2, 2024</p>
                        <p className="text-xs text-gray-600">10 days</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              {/* Report Overview */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
                    <FileText className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">47</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Financial Reports</CardTitle>
                    <BarChart3 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">Monthly P&L statements</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Occupancy Reports</CardTitle>
                    <PieChart className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">Weekly occupancy tracking</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Maintenance Reports</CardTitle>
                    <LineChart className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">15</div>
                    <p className="text-xs text-muted-foreground">Work order summaries</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Report Generation */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                  <CardDescription>Create detailed reports for your properties</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-4 border rounded-lg text-center">
                      <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium">Financial Report</h4>
                      <p className="text-sm text-gray-600 mt-1">Income, expenses, and profitability analysis</p>
                      <Button variant="outline" className="mt-3 w-full" onClick={() => toast.success('Generating financial report...')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg text-center">
                      <PieChart className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium">Occupancy Report</h4>
                      <p className="text-sm text-gray-600 mt-1">Vacancy rates and rental performance</p>
                      <Button variant="outline" className="mt-3 w-full" onClick={() => toast.success('Generating occupancy report...')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg text-center">
                      <LineChart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-medium">Maintenance Report</h4>
                      <p className="text-sm text-gray-600 mt-1">Work orders and maintenance costs</p>
                      <Button variant="outline" className="mt-3 w-full" onClick={() => toast.success('Generating maintenance report...')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg text-center">
                      <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <h4 className="font-medium">Tenant Report</h4>
                      <p className="text-sm text-gray-600 mt-1">Tenant demographics and lease analysis</p>
                      <Button variant="outline" className="mt-3 w-full" onClick={() => toast.success('Generating tenant report...')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg text-center">
                      <Activity className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <h4 className="font-medium">Portfolio Performance</h4>
                      <p className="text-sm text-gray-600 mt-1">Overall portfolio metrics and trends</p>
                      <Button variant="outline" className="mt-3 w-full" onClick={() => toast.success('Generating portfolio report...')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg text-center">
                      <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <h4 className="font-medium">Market Analysis</h4>
                      <p className="text-sm text-gray-600 mt-1">Market comparisons and pricing analysis</p>
                      <Button variant="outline" className="mt-3 w-full" onClick={() => toast.success('Generating market analysis...')}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reports</CardTitle>
                  <CardDescription>Previously generated reports and downloads</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">March 2024 Financial Report</TableCell>
                        <TableCell>
                          <Badge variant="outline">Financial</Badge>
                        </TableCell>
                        <TableCell>All Properties</TableCell>
                        <TableCell>March 21, 2024</TableCell>
                        <TableCell>2.3 MB</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => toast.success('Downloading report...')}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toast.info('Opening report in new tab...')}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell className="font-medium">Q1 2024 Occupancy Analysis</TableCell>
                        <TableCell>
                          <Badge variant="outline">Occupancy</Badge>
                        </TableCell>
                        <TableCell>Portfolio</TableCell>
                        <TableCell>March 20, 2024</TableCell>
                        <TableCell>1.8 MB</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => toast.success('Downloading report...')}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toast.info('Opening report in new tab...')}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell className="font-medium">Sunset Apartments Maintenance Summary</TableCell>
                        <TableCell>
                          <Badge variant="outline">Maintenance</Badge>
                        </TableCell>
                        <TableCell>Sunset Apartments</TableCell>
                        <TableCell>March 19, 2024</TableCell>
                        <TableCell>0.9 MB</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => toast.success('Downloading report...')}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toast.info('Opening report in new tab...')}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Report Scheduling */}
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Reports</CardTitle>
                  <CardDescription>Automatically generate and deliver reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Monthly Financial Report</h4>
                          <p className="text-sm text-gray-600">Generated on the 1st of each month</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">Active</Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-green-600" />
                        <div>
                          <h4 className="font-medium">Weekly Occupancy Update</h4>
                          <p className="text-sm text-gray-600">Generated every Monday</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">Active</Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Set up automatic report generation and email delivery</p>
                      <Button onClick={() => toast.info('Report scheduling coming soon...')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

