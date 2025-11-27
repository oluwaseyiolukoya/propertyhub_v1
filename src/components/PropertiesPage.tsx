import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { toast } from "sonner";
import { getUnits, createUnit, updateUnit, deleteUnit, getUnit } from '../lib/api/units';
import { archiveProperty, deleteProperty } from '../lib/api/properties';
import { Switch } from "./ui/switch";
import { getMaintenanceRequests } from '../lib/api/maintenance';
import { getOwnerDashboardOverview } from '../lib/api';
import { getPaymentStats } from '../lib/api/payments';
import { getFinancialOverview } from '../lib/api/financial';
import { formatCurrency, getSmartBaseCurrency } from '../lib/currency';
import { usePersistentState } from '../lib/usePersistentState';
import { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseStats, EXPENSE_CATEGORIES, EXPENSE_STATUSES, PAYMENT_METHODS, type Expense } from '../lib/api/expenses';
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
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
  const [activeTab, setActiveTab] = usePersistentState('properties-page-tab', 'overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Calculate smart base currency based on properties
  const smartBaseCurrency = getSmartBaseCurrency(properties);
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

  // Expense management states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseStats, setExpenseStats] = useState<any>(null);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState<any>({
    propertyId: '',
    unitId: 'none',
    category: '',
    description: '',
    amount: '',
    currency: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'pending',
    paymentMethod: '',
    notes: ''
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [showExpenseDeleteDialog, setShowExpenseDeleteDialog] = useState(false);

  // View and Edit Unit states
  const [showViewUnitDialog, setShowViewUnitDialog] = useState(false);
  const [showEditUnitDialog, setShowEditUnitDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [editingUnit, setEditingUnit] = useState(false);

  // Derived helpers for currently selected unit (view/edit)
  const selectedUnitNigeria =
    (selectedUnit &&
      selectedUnit.features &&
      (selectedUnit.features as any).nigeria) ||
    {};
  const selectedUnitCurrency =
    selectedUnit?.properties?.currency || "USD";

  useEffect(() => {
    (async () => {
      try {
        const [uRes, mRes, dRes, fRes, expRes, expStatsRes] = await Promise.all([
          getUnits(),
          getMaintenanceRequests(),
          getOwnerDashboardOverview(),
          getFinancialOverview(),
          getExpenses(),
          getExpenseStats()
        ]);
        if (!uRes.error && Array.isArray(uRes.data)) setUnitsData(uRes.data);
        if (!mRes.error && Array.isArray(mRes.data)) setMaintenanceData(mRes.data);
        if (!dRes.error && dRes.data?.recentActivity) setRecentActivity(dRes.data.recentActivity);
        if (!fRes.error && fRes.data) {
          // Use real financial data from backend
          const gross = Number(fRes.data.totalRevenue || 0);
          const expenses = Number(fRes.data.estimatedExpenses || 0);
          const net = Number(fRes.data.netOperatingIncome || 0);
          const capRate = Number(fRes.data.portfolioCapRate || 0);
          setFinancialStats({ gross, net, expenses, capRate });
        }
        if (!expRes.error && expRes.data?.data && Array.isArray(expRes.data.data)) {
          setExpenses(expRes.data.data);
        }
        if (!expStatsRes.error && expStatsRes.data) {
          setExpenseStats(expStatsRes.data);
        }
      } catch (e: any) {
        // Non-blocking: show a toast once
        toast.error('Failed to load financial data');
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

  // Handle view unit details
  const handleViewUnit = async (unit: any) => {
    try {
      const res = await getUnit(unit.id);
      if (res.error) {
        throw new Error(res.error.error || 'Failed to fetch unit details');
      }
      setSelectedUnit(res.data);
      setShowViewUnitDialog(true);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load unit details');
    }
  };

  // Handle edit unit
  const handleEditUnit = async (unit: any) => {
    try {
      const res = await getUnit(unit.id);
      if (res.error) {
        throw new Error(res.error.error || 'Failed to fetch unit details');
      }

      const data = res.data;
      // Newer units store Nigeria-specific fields inside features.nigeria
      const nigeriaFeatures = (data?.features && (data.features as any).nigeria) || {};

      // Populate form with unit data (prefer features.nigeria, fall back to top-level / property defaults)
      setUnitForm({
        propertyId: data.propertyId || '',
        unitNumber: data.unitNumber || '',
        type: data.type || '',
        floor: (data.floor ?? '').toString(),
        bedrooms: (data.bedrooms ?? '').toString(),
        bathrooms: (data.bathrooms ?? '').toString(),
        size: (data.size ?? '').toString(),
        monthlyRent: (data.monthlyRent ?? '').toString(),
        securityDeposit: (data.securityDeposit ??
          data.properties?.securityDeposit ??
          '').toString(),
        status: data.status || 'vacant',

        // Nigeria-specific features (saved in JSON)
        rentFrequency: nigeriaFeatures.rentFrequency || 'monthly',
        serviceCharge:
          nigeriaFeatures.serviceCharge?.toString() ??
          (data.properties?.serviceCharge != null
            ? String(data.properties.serviceCharge)
            : ''),
        cautionFee:
          nigeriaFeatures.cautionFee?.toString() ??
          (data.properties?.cautionFee != null
            ? String(data.properties.cautionFee)
            : ''),
        legalFee:
          nigeriaFeatures.legalFee?.toString() ??
          (data.properties?.legalFee != null
            ? String(data.properties.legalFee)
            : ''),
        agentCommission:
          nigeriaFeatures.agentCommission?.toString() ??
          (data.properties?.agentCommission != null
            ? String(data.properties.agentCommission)
            : ''),
        agreementFee:
          nigeriaFeatures.agreementFee?.toString() ??
          (data.properties?.agreementFee != null
            ? String(data.properties.agreementFee)
            : ''),
        electricityMeter:
          nigeriaFeatures.electricityMeter ??
          data.electricityMeter ??
          '',
        prepaidMeter:
          nigeriaFeatures.prepaidMeter ??
          data.prepaidMeter ??
          false,
        wasteFee: nigeriaFeatures.wasteFee?.toString() || '',
        estateDues: nigeriaFeatures.estateDues?.toString() || '',
        waterSource: nigeriaFeatures.waterSource || 'public',
        parkingAvailable:
          nigeriaFeatures.parkingAvailable ??
          data.parkingAvailable ??
          true,
      });

      setSelectedUnit(data);
      setShowEditUnitDialog(true);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load unit details');
    }
  };

  // Handle save edited unit
  const handleSaveEditedUnit = async () => {
    if (!selectedUnit) return;

    try {
      setEditingUnit(true);

      // Persist core scalar fields on the unit, and pack Nigeria‑specific
      // financial/utilities data into features.nigeria (same as Add Unit flow).
      const payload: any = {
        propertyId: unitForm.propertyId,
        unitNumber: unitForm.unitNumber,
        type: unitForm.type,
        floor: unitForm.floor ? Number(unitForm.floor) : null,
        bedrooms: unitForm.bedrooms ? Number(unitForm.bedrooms) : 0,
        bathrooms: unitForm.bathrooms ? Number(unitForm.bathrooms) : 0,
        size: unitForm.size ? Number(unitForm.size) : null,
        monthlyRent: unitForm.monthlyRent ? Number(unitForm.monthlyRent) : 0,
        securityDeposit: unitForm.securityDeposit
          ? Number(unitForm.securityDeposit)
          : null,
        status: unitForm.status,
        features: {
          nigeria: {
            rentFrequency: unitForm.rentFrequency,
            serviceCharge: unitForm.serviceCharge
              ? Number(unitForm.serviceCharge)
              : undefined,
            cautionFee: unitForm.cautionFee
              ? Number(unitForm.cautionFee)
              : undefined,
            legalFee: unitForm.legalFee
              ? Number(unitForm.legalFee)
              : undefined,
            agentCommission: unitForm.agentCommission
              ? Number(unitForm.agentCommission)
              : undefined,
            agreementFee: unitForm.agreementFee
              ? Number(unitForm.agreementFee)
              : undefined,
            electricityMeter: unitForm.electricityMeter || undefined,
            prepaidMeter: unitForm.prepaidMeter,
            wasteFee: unitForm.wasteFee
              ? Number(unitForm.wasteFee)
              : undefined,
            estateDues: unitForm.estateDues
              ? Number(unitForm.estateDues)
              : undefined,
            waterSource: unitForm.waterSource,
            parkingAvailable: unitForm.parkingAvailable,
          },
        },
      };

      const res = await updateUnit(selectedUnit.id, payload);

      if ((res as any).error) {
        throw new Error((res as any).error.error || 'Failed to update unit');
      }

      toast.success('Unit updated successfully');
      setShowEditUnitDialog(false);
      setSelectedUnit(null);

      // Refresh units list
      const uRes = await getUnits();
      if (!uRes.error && Array.isArray(uRes.data)) {
        setUnitsData(uRes.data);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update unit');
    } finally {
      setEditingUnit(false);
    }
  };

  // Expense Management Functions
  const loadExpenses = async () => {
    try {
      const [expRes, expStatsRes] = await Promise.all([
        getExpenses(),
        getExpenseStats()
      ]);
      if (!expRes.error && expRes.data?.data && Array.isArray(expRes.data.data)) {
        setExpenses(expRes.data.data);
      }
      if (!expStatsRes.error && expStatsRes.data) {
        setExpenseStats(expStatsRes.data);
      }
    } catch (error: any) {
      toast.error('Failed to load expenses');
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      propertyId: properties[0]?.id || '',
      unitId: 'none',
      category: '',
      description: '',
      amount: '',
      currency: properties[0]?.currency || 'NGN',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'pending',
      paymentMethod: '',
      notes: ''
    });
    setShowExpenseDialog(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      propertyId: expense.propertyId,
      unitId: expense.unitId || '',
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      currency: expense.currency,
      date: expense.date.split('T')[0],
      dueDate: expense.dueDate ? expense.dueDate.split('T')[0] : '',
      status: expense.status,
      paymentMethod: expense.paymentMethod || '',
      notes: expense.notes || ''
    });
    setShowExpenseDialog(true);
  };

  const handleSaveExpense = async () => {
    try {
      setExpenseSaving(true);

      if (!expenseForm.propertyId || !expenseForm.category || !expenseForm.description || !expenseForm.amount) {
        toast.error('Please fill in all required fields');
        return;
      }

      const expenseData = {
        propertyId: expenseForm.propertyId,
        unitId: expenseForm.unitId && expenseForm.unitId !== 'none' ? expenseForm.unitId : undefined,
        category: expenseForm.category,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        currency: expenseForm.currency,
        date: expenseForm.date,
        dueDate: expenseForm.dueDate || undefined,
        status: expenseForm.status,
        paymentMethod: expenseForm.paymentMethod || undefined,
        notes: expenseForm.notes || undefined
      };

      if (editingExpense) {
        const res = await updateExpense(editingExpense.id, expenseData);
        if (res.error) throw new Error(res.error);
        toast.success('Expense updated successfully');
      } else {
        const res = await createExpense(expenseData);
        if (res.error) throw new Error(res.error);
        toast.success('Expense created successfully');
      }

      setShowExpenseDialog(false);
      await loadExpenses();

      // Refresh financial overview
      const fRes = await getFinancialOverview();
      if (!fRes.error && fRes.data) {
        const gross = Number(fRes.data.totalRevenue || 0);
        const expenses = Number(fRes.data.estimatedExpenses || 0);
        const net = Number(fRes.data.netOperatingIncome || 0);
        const capRate = Number(fRes.data.portfolioCapRate || 0);
        setFinancialStats({ gross, net, expenses, capRate });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save expense');
    } finally {
      setExpenseSaving(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      setIsDeleting(true);
      const res = await deleteExpense(expenseToDelete.id);
      if (res.error) throw new Error(res.error);

      toast.success('Expense deleted successfully');
      setShowExpenseDeleteDialog(false);
      setExpenseToDelete(null);
      await loadExpenses();

      // Refresh financial overview
      const fRes = await getFinancialOverview();
      if (!fRes.error && fRes.data) {
        const gross = Number(fRes.data.totalRevenue || 0);
        const expenses = Number(fRes.data.estimatedExpenses || 0);
        const net = Number(fRes.data.netOperatingIncome || 0);
        const capRate = Number(fRes.data.portfolioCapRate || 0);
        setFinancialStats({ gross, net, expenses, capRate });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const statusObj = EXPENSE_STATUSES.find(s => s.value === status);
    return statusObj?.color || 'gray';
  };

  const getPropertyUnitsForExpense = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return [];
    return unitsData.filter(u => u.propertyId === propertyId);
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
        // Extract the error message from the error object
        const errorMessage = (response as any).error.error || (response as any).error.message || 'Failed to delete property';
        throw new Error(errorMessage);
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
                    <div className="text-2xl font-bold">{formatCurrency(Number(portfolioMetrics.totalRevenue) || 0, smartBaseCurrency)}</div>
                    <p className="text-xs text-muted-foreground">
                      {properties.length > 1 && properties.some(p => p.currency !== smartBaseCurrency) &&
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
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        unitsData.length > 0
                          ? unitsData.reduce((sum, u) => sum + (u.monthlyRent || 0), 0) / unitsData.length
                          : 0,
                        smartBaseCurrency
                      )}
                    </div>
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
                              <TableCell className="font-medium">{formatCurrency(unit.rent, property?.currency || 'USD')}</TableCell>
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
                                    <DropdownMenuLabel>Unit Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem onClick={() => handleViewUnit(unit)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => handleEditUnit(unit)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Unit
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      onClick={() => {
                                        setUnitToDelete(unit);
                                        setShowDeleteDialog(true);
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Unit
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
                          <label className="text-sm font-medium" htmlFor="monthlyRent">Rent</label>
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
                        <label className="text-sm font-medium" htmlFor="serviceCharge">Service Charge</label>
                        <Input id="serviceCharge" type="number" value={unitForm.serviceCharge} onChange={(e) => setUnitForm({ ...unitForm, serviceCharge: e.target.value })} placeholder="0" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="cautionFee">Caution Fee</label>
                        <Input id="cautionFee" type="number" value={unitForm.cautionFee} onChange={(e) => setUnitForm({ ...unitForm, cautionFee: e.target.value })} placeholder="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="legalFee">Legal Fee</label>
                        <Input id="legalFee" type="number" value={unitForm.legalFee} onChange={(e) => setUnitForm({ ...unitForm, legalFee: e.target.value })} placeholder="0" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="agentCommission">Agency Fee</label>
                        <Input id="agentCommission" type="number" value={unitForm.agentCommission} onChange={(e) => setUnitForm({ ...unitForm, agentCommission: e.target.value })} placeholder="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="agreementFee">Agreement Fee</label>
                        <Input id="agreementFee" type="number" value={unitForm.agreementFee} onChange={(e) => setUnitForm({ ...unitForm, agreementFee: e.target.value })} placeholder="0" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="wasteFee">Waste Management</label>
                        <Input id="wasteFee" type="number" value={unitForm.wasteFee} onChange={(e) => setUnitForm({ ...unitForm, wasteFee: e.target.value })} placeholder="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="estateDues">Estate Dues</label>
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
              <TooltipProvider>
                <div className="grid md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">Gross Income</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">How it's calculated:</p>
                            <p className="text-xs">Sum of all monthly rent from occupied units across all properties. This represents your total rental income before any expenses.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(Number(financialStats.gross) || 0, smartBaseCurrency)}</div>
                      <p className="text-xs text-muted-foreground">Live collected this period</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">How it's calculated:</p>
                            <p className="text-xs">Gross Income minus Operating Expenses. This is your Net Operating Income (NOI) - the actual profit from your rental operations.</p>
                            <p className="text-xs mt-1 italic">Formula: Gross Income - Operating Expenses</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(Number(financialStats.net) || 0, smartBaseCurrency)}</div>
                      <p className="text-xs text-muted-foreground">Gross minus operating expenses</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">How it's calculated:</p>
                            <p className="text-xs">Estimated at 30% of Gross Income, based on industry standards. This includes maintenance, property management fees, insurance, utilities, and other operational costs.</p>
                            <p className="text-xs mt-1 italic">Formula: Gross Income × 0.30</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(Number(financialStats.expenses) || 0, smartBaseCurrency)}</div>
                      <p className="text-xs text-muted-foreground">Sum of expense-type payments</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">Cap Rate</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">How it's calculated:</p>
                            <p className="text-xs">Capitalization Rate measures your return on investment. It's the annual Net Operating Income divided by the total property value, expressed as a percentage.</p>
                            <p className="text-xs mt-1 italic">Formula: (Annual NOI ÷ Total Property Value) × 100</p>
                            <p className="text-xs mt-1 text-yellow-600">Higher cap rates indicate better potential returns.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Percent className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(Number(financialStats.capRate) || 0).toLocaleString()}%</div>
                      <p className="text-xs text-muted-foreground">Approximation</p>
                    </CardContent>
                  </Card>
                </div>
              </TooltipProvider>

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
                          <p className="font-medium">{formatCurrency(8500, smartBaseCurrency)}</p>
                          <p className="text-sm text-gray-600">33.9%</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span>Insurance</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(4200, smartBaseCurrency)}</p>
                          <p className="text-sm text-gray-600">16.7%</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span>Property Management</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(3800, smartBaseCurrency)}</p>
                          <p className="text-sm text-gray-600">15.1%</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span>Utilities</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(3200, smartBaseCurrency)}</p>
                          <p className="text-sm text-gray-600">12.7%</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <span>Legal & Administrative</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(2100, smartBaseCurrency)}</p>
                          <p className="text-sm text-gray-600">8.4%</p>
                        </div>
                      </div>

                      <div className="h-px bg-gray-200 my-4" />

                      <div className="flex items-center justify-between font-medium">
                        <span>Total Monthly Expenses</span>
                        <span>{formatCurrency(25100, smartBaseCurrency)}</span>
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

              {/* Expense Management Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Expense Management</CardTitle>
                    <CardDescription>Track and manage property expenses</CardDescription>
                  </div>
                  <Button onClick={handleAddExpense}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Expense Statistics */}
                  {expenseStats && (
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatCurrency(expenseStats.totalAmount || 0, smartBaseCurrency)}</div>
                          <p className="text-xs text-muted-foreground">{expenseStats.totalCount || 0} transactions</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Paid</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(
                              expenseStats.byStatus?.find((s: any) => s.status === 'paid')?._sum?.amount || 0,
                              smartBaseCurrency
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {expenseStats.byStatus?.find((s: any) => s.status === 'paid')?._count || 0} expenses
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-yellow-600">
                            {formatCurrency(
                              expenseStats.byStatus?.find((s: any) => s.status === 'pending')?._sum?.amount || 0,
                              smartBaseCurrency
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {expenseStats.byStatus?.find((s: any) => s.status === 'pending')?._count || 0} expenses
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {expenseStats.byCategory && expenseStats.byCategory.length > 0
                              ? EXPENSE_CATEGORIES.find(c => c.value === expenseStats.byCategory[0].category)?.label || expenseStats.byCategory[0].category
                              : 'N/A'}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {expenseStats.byCategory && expenseStats.byCategory.length > 0
                              ? formatCurrency(expenseStats.byCategory[0]._sum?.amount || 0, smartBaseCurrency)
                              : '-'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Expense Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              No expenses recorded yet. Click "Add Expense" to get started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          expenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{expense.property?.name || 'Unknown'}</p>
                                  {expense.unit && (
                                    <p className="text-xs text-muted-foreground">Unit {expense.unit.unitNumber}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(expense.amount, expense.currency)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    expense.status === 'paid' ? 'default' :
                                    expense.status === 'pending' ? 'secondary' :
                                    expense.status === 'overdue' ? 'destructive' :
                                    'outline'
                                  }
                                >
                                  {expense.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => {
                                        setExpenseToDelete(expense);
                                        setShowExpenseDeleteDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
                    <div className="text-2xl font-bold">{formatCurrency(285, smartBaseCurrency)}</div>
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

      {/* View Unit Details Dialog */}
      <Dialog open={showViewUnitDialog} onOpenChange={setShowViewUnitDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Unit Details - {selectedUnit?.unitNumber}</DialogTitle>
            <DialogDescription>
              {selectedUnit?.properties?.name && (
                <span className="text-sm font-medium text-gray-700">
                  Property: {selectedUnit.properties.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedUnit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Basic Information</h4>
                  <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Unit Number:</span>
                      <span className="font-medium">{selectedUnit.unitNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">{selectedUnit.type || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Floor:</span>
                      <span className="font-medium">{selectedUnit.floor || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <Badge variant={selectedUnit.status === 'occupied' ? 'default' : 'secondary'}>
                        {selectedUnit.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Property Details</h4>
                  <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bedrooms:</span>
                      <span className="font-medium">{selectedUnit.bedrooms || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bathrooms:</span>
                      <span className="font-medium">{selectedUnit.bathrooms || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">{selectedUnit.size ? `${selectedUnit.size} sqft` : '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Financial Details</h4>
                  <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly Rent:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          selectedUnit.monthlyRent || 0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Security Deposit:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          selectedUnit.securityDeposit ||
                            selectedUnit.properties?.securityDeposit ||
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Service Charge:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).serviceCharge ??
                            selectedUnit.properties?.serviceCharge ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Application Fee:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).applicationFee ??
                            selectedUnit.properties?.applicationFee ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Additional Fees & Utilities</h4>
                  <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Caution Fee:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).cautionFee ??
                            selectedUnit.properties?.cautionFee ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Legal Fee:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).legalFee ??
                            selectedUnit.properties?.legalFee ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Agent Commission:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).agentCommission ??
                            selectedUnit.properties?.agentCommission ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Agreement Fee:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).agreementFee ??
                            selectedUnit.properties?.agreementFee ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Waste Management:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).wasteFee || 0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Estate Dues:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).estateDues || 0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Electricity Meter:</span>
                      <span className="font-medium">
                        {(selectedUnitNigeria as any).electricityMeter ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Prepaid Meter:</span>
                      <span className="font-medium">
                        {(selectedUnitNigeria as any).prepaidMeter
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Water Source:</span>
                      <span className="font-medium">
                        {(selectedUnitNigeria as any).waterSource
                          ? (selectedUnitNigeria as any).waterSource
                          : "Not specified"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Parking Available:</span>
                      <span className="font-medium">
                        {(selectedUnitNigeria as any).parkingAvailable
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewUnitDialog(false);
                    setSelectedUnit(null);
                  }}
                >
                  Close
                </Button>
                <Button onClick={() => {
                  setShowViewUnitDialog(false);
                  handleEditUnit(selectedUnit);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Unit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={showEditUnitDialog} onOpenChange={setShowEditUnitDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>
              Update unit information
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editUnitNumber">Unit Number</label>
                <Input
                  id="editUnitNumber"
                  value={unitForm.unitNumber}
                  onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                  placeholder="A101"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editType">Type</label>
                <Input
                  id="editType"
                  value={unitForm.type}
                  onChange={(e) => setUnitForm({ ...unitForm, type: e.target.value })}
                  placeholder="Apartment, Studio, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editFloor">Floor</label>
                <Input
                  id="editFloor"
                  type="number"
                  value={unitForm.floor}
                  onChange={(e) => setUnitForm({ ...unitForm, floor: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editBedrooms">Bedrooms</label>
                <Input
                  id="editBedrooms"
                  type="number"
                  value={unitForm.bedrooms}
                  onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editBathrooms">Bathrooms</label>
                <Input
                  id="editBathrooms"
                  type="number"
                  value={unitForm.bathrooms}
                  onChange={(e) => setUnitForm({ ...unitForm, bathrooms: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editSize">Size (sqft)</label>
                <Input
                  id="editSize"
                  type="number"
                  value={unitForm.size}
                  onChange={(e) => setUnitForm({ ...unitForm, size: e.target.value })}
                  placeholder="850"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editStatus">Status</label>
                <Select value={unitForm.status} onValueChange={(v) => setUnitForm({ ...unitForm, status: v })}>
                  <SelectTrigger id="editStatus">
                    <SelectValue placeholder="Select status" />
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
                <label className="text-sm font-medium" htmlFor="editMonthlyRent">Monthly Rent</label>
                <Input
                  id="editMonthlyRent"
                  type="number"
                  value={unitForm.monthlyRent}
                  onChange={(e) => setUnitForm({ ...unitForm, monthlyRent: e.target.value })}
                  placeholder="1200"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editSecurityDeposit">Security Deposit</label>
                <Input
                  id="editSecurityDeposit"
                  type="number"
                  value={unitForm.securityDeposit}
                  onChange={(e) => setUnitForm({ ...unitForm, securityDeposit: e.target.value })}
                  placeholder="2400"
                />
              </div>
            </div>

            {/* Additional Fees & Utilities - mirror Add Unit fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editServiceCharge">Service Charge</label>
                <Input
                  id="editServiceCharge"
                  type="number"
                  value={unitForm.serviceCharge}
                  onChange={(e) => setUnitForm({ ...unitForm, serviceCharge: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editCautionFee">Caution Fee</label>
                <Input
                  id="editCautionFee"
                  type="number"
                  value={unitForm.cautionFee}
                  onChange={(e) => setUnitForm({ ...unitForm, cautionFee: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editLegalFee">Legal Fee</label>
                <Input
                  id="editLegalFee"
                  type="number"
                  value={unitForm.legalFee}
                  onChange={(e) => setUnitForm({ ...unitForm, legalFee: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editAgentCommission">Agency Fee</label>
                <Input
                  id="editAgentCommission"
                  type="number"
                  value={unitForm.agentCommission}
                  onChange={(e) => setUnitForm({ ...unitForm, agentCommission: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editAgreementFee">Agreement Fee</label>
                <Input
                  id="editAgreementFee"
                  type="number"
                  value={unitForm.agreementFee}
                  onChange={(e) => setUnitForm({ ...unitForm, agreementFee: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editWasteFee">Waste Management</label>
                <Input
                  id="editWasteFee"
                  type="number"
                  value={unitForm.wasteFee}
                  onChange={(e) => setUnitForm({ ...unitForm, wasteFee: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editEstateDues">Estate Dues</label>
                <Input
                  id="editEstateDues"
                  type="number"
                  value={unitForm.estateDues}
                  onChange={(e) => setUnitForm({ ...unitForm, estateDues: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editElectricityMeter">Electricity Meter No.</label>
                <Input
                  id="editElectricityMeter"
                  value={unitForm.electricityMeter}
                  onChange={(e) => setUnitForm({ ...unitForm, electricityMeter: e.target.value })}
                  placeholder="Prepaid meter no."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Prepaid Meter</label>
                <Switch
                  checked={unitForm.prepaidMeter}
                  onCheckedChange={(v) => setUnitForm({ ...unitForm, prepaidMeter: v })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editWaterSource">Water Source</label>
                <Select
                  value={unitForm.waterSource}
                  onValueChange={(v) => setUnitForm({ ...unitForm, waterSource: v })}
                >
                  <SelectTrigger id="editWaterSource">
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
              <Switch
                checked={unitForm.parkingAvailable}
                onCheckedChange={(v) => setUnitForm({ ...unitForm, parkingAvailable: v })}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditUnitDialog(false);
                  setSelectedUnit(null);
                }}
                disabled={editingUnit}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditedUnit}
                disabled={editingUnit}
              >
                {editingUnit ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
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

      {/* Add/Edit Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Update expense details' : 'Record a new property expense'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-property">Property *</Label>
                <Select
                  value={expenseForm.propertyId}
                  onValueChange={(value) => {
                    const property = properties.find(p => p.id === value);
                    setExpenseForm({
                      ...expenseForm,
                      propertyId: value,
                      currency: property?.currency || 'NGN',
                      unitId: '' // Reset unit when property changes
                    });
                  }}
                >
                  <SelectTrigger id="expense-property">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-unit">Unit (Optional)</Label>
                <Select
                  value={expenseForm.unitId}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, unitId: value })}
                >
                  <SelectTrigger id="expense-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Property-wide)</SelectItem>
                    {getPropertyUnitsForExpense(expenseForm.propertyId).map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-category">Category *</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                >
                  <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount *</Label>
                <div className="flex gap-2">
                  <Input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <span className="flex items-center px-3 border rounded-md bg-muted text-sm">
                    {expenseForm.currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-description">Description *</Label>
              <Textarea
                id="expense-description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Enter expense description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-date">Date *</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-due-date">Due Date (Optional)</Label>
                <Input
                  id="expense-due-date"
                  type="date"
                  value={expenseForm.dueDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-status">Status *</Label>
                <Select
                  value={expenseForm.status}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, status: value })}
                >
                  <SelectTrigger id="expense-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-payment-method">Payment Method</Label>
                <Select
                  value={expenseForm.paymentMethod}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, paymentMethod: value })}
                >
                  <SelectTrigger id="expense-payment-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-notes">Notes (Optional)</Label>
              <Textarea
                id="expense-notes"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                placeholder="Add any additional notes"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveExpense} disabled={expenseSaving}>
              {expenseSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Confirmation Dialog */}
      <Dialog open={showExpenseDeleteDialog} onOpenChange={setShowExpenseDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {expenseToDelete && (
            <div className="py-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Property:</span>
                <span className="text-sm font-medium">{expenseToDelete.property?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category:</span>
                <span className="text-sm font-medium">
                  {EXPENSE_CATEGORIES.find(c => c.value === expenseToDelete.category)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-sm font-medium">
                  {formatCurrency(expenseToDelete.amount, expenseToDelete.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Description:</span>
                <span className="text-sm font-medium">{expenseToDelete.description}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowExpenseDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExpense} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Expense
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

