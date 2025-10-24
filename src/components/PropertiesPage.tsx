import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { getUnits, createUnit, deleteUnit } from '../lib/api/units';
import { archiveProperty, deleteProperty } from '../lib/api/properties';
import { Switch } from "./ui/switch";
import { getMaintenanceRequests } from '../lib/api/maintenance';
import { getOwnerDashboardOverview } from '../lib/api';
import { getPaymentStats } from '../lib/api/payments';
import { formatCurrency } from '../lib/currency';
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
  Trash2,
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
  onViewProperty?: (propertyId: string) => void;
  onEditProperty?: (propertyId: string) => void;
}

export function PropertiesPage({ user, onBack, onAddProperty, onNavigateToAddProperty, properties, onUpdateProperty, onViewProperty, onEditProperty }: PropertiesPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [unitsData, setUnitsData] = useState<any[]>([]);
  const [unitView, setUnitView] = useState<'list' | 'add'>('list');
  const [unitSaving, setUnitSaving] = useState(false);
  const [unitForm, setUnitForm] = useState<any>({
    propertyId: '',
    unitNumber: '',
    type: '',
    floor: '',
    bedrooms: '',
    bathrooms: '',
    size: '',
    monthlyRent: '',
    securityDeposit: '',
    status: 'vacant',
    rentFrequency: 'monthly',
    serviceCharge: '',
    cautionFee: '',
    legalFee: '',
    agentCommission: '',
    agreementFee: '',
    electricityMeter: '',
    prepaidMeter: false,
    wasteFee: '',
    estateDues: '',
    waterSource: 'public',
    parkingAvailable: true
  });
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [financialStats, setFinancialStats] = useState<{ gross?: number; net?: number; expenses?: number; capRate?: number }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPropertyDeleteDialog, setShowPropertyDeleteDialog] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [uRes, mRes, dRes, pStats] = await Promise.all([
          getUnits(),
          getMaintenanceRequests(),
          getOwnerDashboardOverview(),
          getPaymentStats()
        ]);
        if (!uRes.error && Array.isArray(uRes.data)) setUnitsData(uRes.data);
        if (!mRes.error && Array.isArray(mRes.data)) setMaintenanceData(mRes.data);
        if (!dRes.error && dRes.data?.recentActivity) setRecentActivity(dRes.data.recentActivity);
        if (!pStats.error && pStats.data) {
          const gross = Number(pStats.data.totalCollected || 0);
          const expenses = Number(pStats.data.byType?.find((t: any) => t.type === 'expense')?._sum?.amount || 0) || 0;
          const net = gross - expenses;
          // Approximate cap rate: (annualized net) / sum of property market values (not modeled) → fallback to occupancy-based proxy
          const capRate = properties.length > 0 ? Math.round(((net * 12) / Math.max(1, properties.length)) * 10) / 10 : 0;
          setFinancialStats({ gross, net, expenses, capRate });
        }
      } catch (e: any) {
        // Non-blocking: show a toast once
        toast.error('Failed to load units or maintenance data');
      }
    })();
  }, [properties.length]);

  // Handle delete unit
  const handleDeleteUnit = async () => {
    if (!unitToDelete) return;
    
    try {
      setIsDeleting(true);
      const res = await deleteUnit(unitToDelete.id);
      
      if ((res as any).error) {
        throw new Error((res as any).error.error || 'Failed to delete unit');
      }
      
      toast.success('Unit deleted successfully');
      setShowDeleteDialog(false);
      setUnitToDelete(null);
      
      // Refresh units list
      const uRes = await getUnits();
      if (!uRes.error && Array.isArray(uRes.data)) {
        setUnitsData(uRes.data);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete unit');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate portfolio metrics from properties
  const portfolioMetrics = {
    totalProperties: properties.length,
    totalUnits: properties.reduce((sum, p) => sum + (p._count?.units || p.totalUnits || 0), 0),
    occupiedUnits: properties.reduce((sum, p) => sum + (p.occupiedUnits || 0), 0),
    vacantUnits: properties.reduce((sum, p) => {
      const total = p._count?.units || p.totalUnits || 0;
      const occ = p.occupiedUnits || 0;
      return sum + Math.max(total - occ, 0);
    }, 0),
    totalRevenue: properties.reduce((sum, p) => sum + (p.totalMonthlyIncome || 0), 0),
    avgOccupancy: properties.length > 0 ? 
      properties.reduce((sum, p) => sum + (p.occupancyRate ?? (((p.occupiedUnits || 0) / ((p._count?.units || p.totalUnits || 1))) * 100)), 0) / properties.length : 0,
    maintenanceRequests: maintenanceData.length
  };

  const maintenanceRequests = maintenanceData;

  const units = unitsData.map(u => ({
    id: u.id,
    propertyId: u.propertyId,
    unit: u.unitNumber,
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms,
    sqft: u.size,
    rent: u.monthlyRent,
    deposit: u.securityDeposit,
    status: u.status,
    tenant: u.leases?.[0]?.users?.name || null,
    leaseStart: u.leases?.[0]?.startDate ? new Date(u.leases[0].startDate).toISOString().split('T')[0] : null,
    leaseEnd: u.leases?.[0]?.endDate ? new Date(u.leases[0].endDate).toISOString().split('T')[0] : null,
    moveInDate: u.leases?.[0]?.signedAt ? new Date(u.leases[0].signedAt).toISOString().split('T')[0] : null,
    phoneNumber: u.leases?.[0]?.users?.phone || null,
    email: u.leases?.[0]?.users?.email || null
  }));

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

  const handlePropertyAction = async (action: string, propertyId: string) => {
    try {
      switch (action) {
        case 'view': {
          if (onViewProperty) {
            onViewProperty(propertyId);
          }
          break;
        }
        case 'edit': {
          if (onEditProperty) {
            onEditProperty(propertyId);
          }
          break;
        }
        case 'duplicate': {
          const property = properties.find(p => p.id === propertyId);
          if (property && onAddProperty) {
            const duplicatedProperty = {
              ...property,
              id: Date.now(),
              name: `${property.name} (Copy)`,
              occupiedUnits: 0,
              monthlyRevenue: 0,
              occupancyRate: 0
            } as any;
            onAddProperty(duplicatedProperty);
            toast.success('Property duplicated successfully');
          }
          break;
        }
        case 'archive': {
          // Call backend API to archive property
          const response = await archiveProperty(propertyId);
          if ((response as any).error) {
            throw new Error((response as any).error);
          }
          toast.success('Property archived successfully');
          
          // Refresh properties list if callback provided
          if (onUpdateProperty) {
            onUpdateProperty(propertyId as any, { status: 'archived' });
          }
          break;
        }
        case 'delete': {
          // Show confirmation dialog
          const property = properties.find(p => p.id === propertyId);
          if (property) {
            setPropertyToDelete(property);
            setShowPropertyDeleteDialog(true);
          }
          break;
        }
        default:
          break;
      }
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  };

  const handleConfirmDeleteProperty = async () => {
    if (!propertyToDelete) return;
    
    try {
      setIsDeleting(true);
      const response = await deleteProperty(propertyToDelete.id);
      
      if ((response as any).error) {
        throw new Error((response as any).error);
      }
      
      toast.success('Property deleted successfully');
      setShowPropertyDeleteDialog(false);
      setPropertyToDelete(null);
      
      // Refresh the properties list by removing the deleted property
      if (onUpdateProperty) {
        // Trigger a refresh by calling parent's update callback
        window.location.reload(); // Or better: call a refresh function from parent
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete property');
    } finally {
      setIsDeleting(false);
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
                    <div className="text-2xl font-bold">{formatCurrency(Number(portfolioMetrics.totalRevenue) || 0, user?.baseCurrency || 'USD')}</div>
                    <p className="text-xs text-muted-foreground">
                      {properties.length > 1 && properties.some(p => p.currency !== (user?.baseCurrency || 'USD')) && 
                        <span className="text-orange-600 mr-2">Multi-currency · </span>
                      }
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
                              <p className="text-sm text-gray-600">{property.occupiedUnits ?? 0}/{property._count?.units ?? property.totalUnits ?? 0} units</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(Number(property.totalMonthlyIncome) || 0, property.currency || 'NGN')}</p>
                            <p className="text-sm text-gray-600">{(((property.occupiedUnits ?? 0) / ((property._count?.units ?? property.totalUnits ?? 1))) * 100).toFixed(1)}% occupied</p>
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
                      {recentActivity.length === 0 ? (
                        <div className="text-sm text-gray-500">No recent activity.</div>
                      ) : (
                        recentActivity.map((log: any) => (
                          <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm">[{log.entity}] {log.action}: {log.description}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      )}
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
                        {Array.isArray(property.images) && property.images.length > 0 ? (
                          <img 
                            src={property.images[0]} 
                            alt={property.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            No image
                          </div>
                        )}
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handlePropertyAction('delete', property.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Property
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Units:</span>
                            <span>{property.occupiedUnits ?? 0}/{property._count?.units ?? property.totalUnits ?? 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Occupancy:</span>
                            <span className="font-medium">{(
                              property.occupancyRate ?? (
                                ((property.occupiedUnits ?? 0) / ((property._count?.units ?? property.totalUnits ?? 0) || 1)) * 100
                              )
                            ).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Monthly Revenue:</span>
                            <span className="font-medium text-green-600">{formatCurrency(Number(property.totalMonthlyIncome) || 0, property.currency || 'NGN')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Manager:</span>
                            <span>{property.property_managers?.[0]?.users?.name ?? 'Unassigned'}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center space-x-2">
                          {(Array.isArray(property.features) ? property.features : []).slice(0, 3).map((feature: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {(Array.isArray(property.features) ? property.features : []).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(property.features as any[]).length - 3} more
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
                                  {Array.isArray(property.images) && property.images.length > 0 ? (
                                    <img 
                                      src={property.images[0]} 
                                      alt={property.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                      No image
                                    </div>
                                  )}
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
                            <TableCell>{property.occupiedUnits ?? 0}/{property._count?.units ?? property.totalUnits ?? 0}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span>{(((property.occupiedUnits ?? 0) / ((property._count?.units ?? property.totalUnits ?? 1))) * 100).toFixed(1)}%</span>
                                <Progress value={(((property.occupiedUnits ?? 0) / ((property._count?.units ?? property.totalUnits ?? 1))) * 100)} className="w-16 h-2" />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(Number(property.totalMonthlyIncome) || 0, property.currency || 'NGN')}
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
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handlePropertyAction('delete', property.id)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Property
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
                      <Button onClick={() => setUnitView('add')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Unit
                      </Button>
                    </div>

                    {unitView === 'list' && (
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
                                  <Button variant="outline" size="sm" title="View unit">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" title="Edit unit">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setUnitToDelete(unit);
                                      setShowDeleteDialog(true);
                                    }}
                                    title="Delete unit"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
              {unitView === 'add' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Unit</CardTitle>
                    <CardDescription>Create a unit under one of your properties.</CardDescription>
                  </CardHeader>
                  <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium" htmlFor="propertyId">Property</label>
                      <Select value={unitForm.propertyId} onValueChange={(v) => setUnitForm({ ...unitForm, propertyId: v })}>
                        <SelectTrigger id="propertyId">
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="unitNumber">Unit Number</label>
                        <Input id="unitNumber" value={unitForm.unitNumber} onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })} placeholder="A101" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="type">Type</label>
                        <Input id="type" value={unitForm.type} onChange={(e) => setUnitForm({ ...unitForm, type: e.target.value })} placeholder="2-bedroom" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="bedrooms">Bedrooms</label>
                        <Input id="bedrooms" type="number" value={unitForm.bedrooms} onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })} placeholder="2" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="bathrooms">Bathrooms</label>
                        <Input id="bathrooms" type="number" value={unitForm.bathrooms} onChange={(e) => setUnitForm({ ...unitForm, bathrooms: e.target.value })} placeholder="1" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="floor">Floor</label>
                        <Input id="floor" type="number" value={unitForm.floor} onChange={(e) => setUnitForm({ ...unitForm, floor: e.target.value })} placeholder="3" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="size">Size (sqft)</label>
                        <Input id="size" type="number" value={unitForm.size} onChange={(e) => setUnitForm({ ...unitForm, size: e.target.value })} placeholder="900" />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium" htmlFor="monthlyRent">Rent (NGN)</label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Frequency</span>
                            <Select value={unitForm.rentFrequency} onValueChange={(v) => setUnitForm({ ...unitForm, rentFrequency: v })}>
                              <SelectTrigger className="h-8 w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="annual">Annual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Input id="monthlyRent" type="number" value={unitForm.monthlyRent} onChange={(e) => setUnitForm({ ...unitForm, monthlyRent: e.target.value })} placeholder="1200000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="securityDeposit">Security Deposit</label>
                        <Input id="securityDeposit" type="number" value={unitForm.securityDeposit} onChange={(e) => setUnitForm({ ...unitForm, securityDeposit: e.target.value })} placeholder="500" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="status">Status</label>
                        <Select value={unitForm.status} onValueChange={(v) => setUnitForm({ ...unitForm, status: v })}>
                          <SelectTrigger id="status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vacant">Vacant</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="serviceCharge">Service Charge (NGN)</label>
                        <Input id="serviceCharge" type="number" value={unitForm.serviceCharge} onChange={(e) => setUnitForm({ ...unitForm, serviceCharge: e.target.value })} placeholder="0" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="cautionFee">Caution Fee (NGN)</label>
                        <Input id="cautionFee" type="number" value={unitForm.cautionFee} onChange={(e) => setUnitForm({ ...unitForm, cautionFee: e.target.value })} placeholder="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="legalFee">Legal Fee (NGN)</label>
                        <Input id="legalFee" type="number" value={unitForm.legalFee} onChange={(e) => setUnitForm({ ...unitForm, legalFee: e.target.value })} placeholder="0" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="agentCommission">Agency Fee (NGN)</label>
                        <Input id="agentCommission" type="number" value={unitForm.agentCommission} onChange={(e) => setUnitForm({ ...unitForm, agentCommission: e.target.value })} placeholder="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="agreementFee">Agreement Fee (NGN)</label>
                        <Input id="agreementFee" type="number" value={unitForm.agreementFee} onChange={(e) => setUnitForm({ ...unitForm, agreementFee: e.target.value })} placeholder="0" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="wasteFee">Waste Management (NGN)</label>
                        <Input id="wasteFee" type="number" value={unitForm.wasteFee} onChange={(e) => setUnitForm({ ...unitForm, wasteFee: e.target.value })} placeholder="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="estateDues">Estate Dues (NGN)</label>
                        <Input id="estateDues" type="number" value={unitForm.estateDues} onChange={(e) => setUnitForm({ ...unitForm, estateDues: e.target.value })} placeholder="0" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="electricityMeter">Electricity Meter No.</label>
                        <Input id="electricityMeter" value={unitForm.electricityMeter} onChange={(e) => setUnitForm({ ...unitForm, electricityMeter: e.target.value })} placeholder="Prepaid meter no." />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Prepaid Meter</label>
                        <Switch checked={unitForm.prepaidMeter} onCheckedChange={(v) => setUnitForm({ ...unitForm, prepaidMeter: v })} />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="waterSource">Water Source</label>
                        <Select value={unitForm.waterSource} onValueChange={(v) => setUnitForm({ ...unitForm, waterSource: v })}>
                          <SelectTrigger id="waterSource">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="borehole">Borehole</SelectItem>
                            <SelectItem value="well">Well</SelectItem>
                            <SelectItem value="tanker">Tanker Supply</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Parking Available</label>
                      <Switch checked={unitForm.parkingAvailable} onCheckedChange={(v) => setUnitForm({ ...unitForm, parkingAvailable: v })} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setUnitView('list')}>Cancel</Button>
                    <Button disabled={unitSaving} onClick={async () => {
                      try {
                        if (!unitForm.propertyId || !unitForm.unitNumber || !unitForm.type || !unitForm.monthlyRent) {
                          toast.error('Please fill required fields');
                          return;
                        }
                        setUnitSaving(true);
                        const payload: any = {
                          propertyId: unitForm.propertyId,
                          unitNumber: unitForm.unitNumber,
                          type: unitForm.type,
                          floor: unitForm.floor ? Number(unitForm.floor) : undefined,
                          bedrooms: unitForm.bedrooms ? Number(unitForm.bedrooms) : undefined,
                          bathrooms: unitForm.bathrooms ? Number(unitForm.bathrooms) : undefined,
                          size: unitForm.size ? Number(unitForm.size) : undefined,
                          monthlyRent: Number(unitForm.monthlyRent),
                          securityDeposit: unitForm.securityDeposit ? Number(unitForm.securityDeposit) : undefined,
                          status: unitForm.status,
                          features: {
                            nigeria: {
                              rentFrequency: unitForm.rentFrequency,
                              serviceCharge: unitForm.serviceCharge ? Number(unitForm.serviceCharge) : undefined,
                              cautionFee: unitForm.cautionFee ? Number(unitForm.cautionFee) : undefined,
                              legalFee: unitForm.legalFee ? Number(unitForm.legalFee) : undefined,
                              agentCommission: unitForm.agentCommission ? Number(unitForm.agentCommission) : undefined,
                              agreementFee: unitForm.agreementFee ? Number(unitForm.agreementFee) : undefined,
                              electricityMeter: unitForm.electricityMeter || undefined,
                              prepaidMeter: unitForm.prepaidMeter,
                              wasteFee: unitForm.wasteFee ? Number(unitForm.wasteFee) : undefined,
                              estateDues: unitForm.estateDues ? Number(unitForm.estateDues) : undefined,
                              waterSource: unitForm.waterSource,
                              parkingAvailable: unitForm.parkingAvailable
                            }
                          }
                        };
                        const res = await createUnit(payload);
                        if ((res as any).error) throw new Error((res as any).error.error || 'Failed to create unit');
                        toast.success('Unit created');
                        setUnitView('list');
                        setUnitForm({ propertyId: '', unitNumber: '', type: '', floor: '', bedrooms: '', bathrooms: '', size: '', monthlyRent: '', securityDeposit: '', status: 'vacant' });
                        const uRes = await getUnits();
                        if (!uRes.error && Array.isArray(uRes.data)) setUnitsData(uRes.data);
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to create unit');
                      } finally {
                        setUnitSaving(false);
                      }
                    }}>Save Unit</Button>
                  </div>
                  </CardContent>
                </Card>
              )}
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
                    <div className="text-2xl font-bold">{formatCurrency(Number(financialStats.gross) || 0, user?.baseCurrency || 'USD')}</div>
                    <p className="text-xs text-muted-foreground">Live collected this period</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(Number(financialStats.net) || 0, user?.baseCurrency || 'USD')}</div>
                    <p className="text-xs text-muted-foreground">Gross minus operating expenses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(Number(financialStats.expenses) || 0, user?.baseCurrency || 'USD')}</div>
                    <p className="text-xs text-muted-foreground">Sum of expense-type payments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cap Rate</CardTitle>
                    <Percent className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(Number(financialStats.capRate) || 0).toLocaleString()}%</div>
                    <p className="text-xs text-muted-foreground">Approximation</p>
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
                            {formatCurrency(Number(property.totalMonthlyIncome) || 0, property.currency || 'NGN')}
                          </TableCell>
                          <TableCell className="text-red-600">
                            {formatCurrency(0, property.currency || 'NGN')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(Number(property.totalMonthlyIncome) || 0, property.currency || 'NGN')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{0}%</span>
                              {false ? (
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-blue-600">
                            {(Number(property.totalMonthlyIncome) || 0).toLocaleString()}
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
                        {maintenanceRequests.map((request: any) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{request.property?.name || '—'}</p>
                                <p className="text-sm text-gray-600">Unit {request.unit?.unitNumber || '—'}</p>
                              </div>
                            </TableCell>
                            <TableCell>{request.title}</TableCell>
                            <TableCell>{request.reportedBy?.name || '—'}</TableCell>
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
                                <span className="text-sm">{request.assignedTo?.name}</span>
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
                            <TableCell>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}</TableCell>
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

      {/* Details modal removed per request; navigation handled by onViewProperty */}

      {/* Delete Unit Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this unit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {unitToDelete && (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Unit Number</span>
                  <span className="font-medium">{unitToDelete.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Property</span>
                  <span className="font-medium">
                    {properties.find(p => p.id === unitToDelete.propertyId)?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <Badge variant={unitToDelete.status === 'occupied' ? 'default' : 'secondary'}>
                    {unitToDelete.status}
                  </Badge>
                </div>
                {unitToDelete.tenant && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Tenant</span>
                    <span className="font-medium">{unitToDelete.tenant}</span>
                  </div>
                )}
              </div>

              {unitToDelete.status === 'occupied' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Warning: Unit is occupied</p>
                      <p className="mt-1">This unit has an active tenant. Make sure to handle the lease properly before deleting.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">This action is permanent</p>
                    <p className="mt-1">All unit data, including history and records, will be permanently deleted.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setUnitToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUnit}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Unit
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Property Confirmation Dialog */}
      <Dialog open={showPropertyDeleteDialog} onOpenChange={setShowPropertyDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this property? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {propertyToDelete && (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Property Name</span>
                  <span className="font-medium">{propertyToDelete.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Location</span>
                  <span className="font-medium">{propertyToDelete.city}, {propertyToDelete.state}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Units</span>
                  <span className="font-medium">{propertyToDelete.totalUnits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <Badge variant={propertyToDelete.status === 'active' ? 'default' : 'secondary'}>
                    {propertyToDelete.status}
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
                    <p className="mt-2 text-xs font-medium">
                      Note: Properties with active leases cannot be deleted. Please end all active leases first.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowPropertyDeleteDialog(false);
                setPropertyToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteProperty}
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
}

