import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Search,
  Trash2,
  Edit,
  MoreVertical,
  Loader2,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { useBudgetLineItems } from '../hooks/useDeveloperDashboardData';
import { getCurrencySymbol as getCurrencySymbolFromLib } from '../../../lib/currency';
import {
  createBudgetLineItem,
  updateBudgetLineItem,
  deleteBudgetLineItem,
  getProjectById,
} from '../services/developerDashboard.api';
import type { BudgetLineItem } from '../types';

interface BudgetManagementPageProps {
  projectId: string;
}

// Budget categories
const BUDGET_CATEGORIES = [
  'labor',
  'materials',
  'equipment',
  'permits',
  'professional-fees',
  'contingency',
  'utilities',
  'insurance',
  'other',
];

// Budget status types
type BudgetStatus = 'on-track' | 'warning' | 'over-budget' | 'under-budget' | 'not-started';

export const BudgetManagementPage: React.FC<BudgetManagementPageProps> = ({ projectId }) => {
  const { data: budgetItems, loading, error, refetch } = useBudgetLineItems(projectId);
  const [projectCurrency, setProjectCurrency] = useState<string>('NGN');

  const [selectedBudget, setSelectedBudget] = useState<BudgetLineItem | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetLineItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newBudgetLine, setNewBudgetLine] = useState({
    category: '',
    subcategory: '',
    description: '',
    plannedAmount: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  const [editBudgetLine, setEditBudgetLine] = useState({
    category: '',
    subcategory: '',
    description: '',
    plannedAmount: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  // Fetch project currency
  useEffect(() => {
    const fetchProjectCurrency = async () => {
      try {
        const response = await getProjectById(projectId);
        if (response.success && response.data) {
          setProjectCurrency(response.data.currency || 'NGN');
        }
      } catch (error) {
        console.error('Failed to fetch project currency:', error);
        // Keep default 'NGN' if fetch fails
      }
    };

    if (projectId) {
      fetchProjectCurrency();
    }
  }, [projectId]);

  const formatCurrency = (value: number) => {
    // Use centralized currency symbol to avoid "F CFA" issue with Intl.NumberFormat
    const symbol = getCurrencySymbolFromLib(projectCurrency);
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${symbol}${formatted}`;
  };

  const formatCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      'labor': 'Labor',
      'materials': 'Materials',
      'equipment': 'Equipment',
      'permits': 'Permits',
      'professional-fees': 'Professional Fees',
      'contingency': 'Contingency',
      'utilities': 'Utilities',
      'insurance': 'Insurance',
      'other': 'Other',
    };
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getStatusBadge = (item: BudgetLineItem) => {
    const variance = item.variance || 0;
    const variancePercent = item.variancePercent || 0;

    if (item.actualAmount === 0) {
      return <Badge variant="outline">Not Started</Badge>;
    } else if (variancePercent <= -10) {
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Under Budget</Badge>;
    } else if (variancePercent < 0) {
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">On Track</Badge>;
    } else if (variancePercent <= 10) {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Warning</Badge>;
    } else {
      return <Badge variant="destructive">Over Budget</Badge>;
    }
  };

  const filteredData = budgetItems.filter((item) => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch =
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.subcategory && item.subcategory.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const totalPlanned = budgetItems.reduce((sum, item) => sum + item.plannedAmount, 0);
  const totalActual = budgetItems.reduce((sum, item) => sum + item.actualAmount, 0);
  const totalVariance = totalActual - totalPlanned;
  const totalVariancePercent = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0;

  const handleAddBudget = async () => {
    if (!newBudgetLine.category || !newBudgetLine.description || !newBudgetLine.plannedAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createBudgetLineItem(projectId, {
        category: newBudgetLine.category,
        subcategory: newBudgetLine.subcategory || undefined,
        description: newBudgetLine.description,
        plannedAmount: parseFloat(newBudgetLine.plannedAmount),
        startDate: newBudgetLine.startDate || undefined,
        endDate: newBudgetLine.endDate || undefined,
        notes: newBudgetLine.notes || undefined,
      });

      if (response.success) {
        toast.success('Budget line item created successfully');
        setIsAddDialogOpen(false);
        setNewBudgetLine({
          category: '',
          subcategory: '',
          description: '',
          plannedAmount: '',
          startDate: '',
          endDate: '',
          notes: '',
        });
        refetch();

        // Update project progress automatically
        try {
          const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
          if (token) {
            await fetch(`/api/developer-dashboard/projects/${projectId}/progress/update`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            console.log("[BudgetManagement] Project progress updated automatically");
          }
        } catch (progressError) {
          console.warn("[BudgetManagement] Failed to update progress:", progressError);
          // Don't fail the whole operation if progress update fails
        }
      } else {
        toast.error(response.error || 'Failed to create budget line item');
      }
    } catch (error) {
      console.error('Error creating budget line item:', error);
      toast.error('Failed to create budget line item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBudget = async () => {
    if (!selectedBudget) return;

    if (!editBudgetLine.category || !editBudgetLine.description || !editBudgetLine.plannedAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await updateBudgetLineItem(projectId, selectedBudget.id, {
        category: editBudgetLine.category,
        subcategory: editBudgetLine.subcategory || undefined,
        description: editBudgetLine.description,
        plannedAmount: parseFloat(editBudgetLine.plannedAmount),
        startDate: editBudgetLine.startDate || undefined,
        endDate: editBudgetLine.endDate || undefined,
        notes: editBudgetLine.notes || undefined,
      });

      if (response.success) {
        toast.success('Budget line item updated successfully');
        setIsEditDialogOpen(false);
        setSelectedBudget(null);
        refetch();

        // Update project progress automatically
        try {
          const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
          if (token) {
            await fetch(`/api/developer-dashboard/projects/${projectId}/progress/update`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            console.log("[BudgetManagement] Project progress updated automatically after edit");
          }
        } catch (progressError) {
          console.warn("[BudgetManagement] Failed to update progress:", progressError);
          // Don't fail the whole operation if progress update fails
        }
      } else {
        toast.error(response.error || 'Failed to update budget line item');
      }
    } catch (error) {
      console.error('Error updating budget line item:', error);
      toast.error('Failed to update budget line item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (item: BudgetLineItem) => {
    setBudgetToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return;

    setDeleting(true);
    try {
      const response = await deleteBudgetLineItem(projectId, budgetToDelete.id);

      if (response.success) {
        toast.success('Budget line item deleted successfully');
        setIsDeleteDialogOpen(false);
        setBudgetToDelete(null);
        refetch();
      } else {
        toast.error(response.error || 'Failed to delete budget line item');
      }
    } catch (error) {
      console.error('Error deleting budget line item:', error);
      toast.error('Failed to delete budget line item');
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = (item: BudgetLineItem) => {
    setSelectedBudget(item);
    setEditBudgetLine({
      category: item.category,
      subcategory: item.subcategory || '',
      description: item.description,
      plannedAmount: item.plannedAmount.toString(),
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      notes: item.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-5 md:space-y-6 animate-in fade-in duration-500">
        {/* Hero Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 h-32 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-xl overflow-hidden animate-in fade-in duration-500" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-200 to-gray-300 h-16 animate-pulse" />
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
        <div className="bg-red-50 rounded-full p-4 mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load budget data</h3>
        <p className="text-gray-600 mb-6 max-w-md text-center">{error}</p>
        <Button
          onClick={() => refetch()}
          className="gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
        >
          <Loader2 className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] p-6 md:p-8 shadow-xl animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Budget Management</h1>
            <p className="text-white/80 font-medium">Track and manage project budget allocations</p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="gap-2 bg-white hover:bg-gray-50 text-[#7C3AED] font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Add Budget Line
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '0ms' }}>
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Total Budget</CardTitle>
              <DollarSign className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalPlanned)}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '50ms' }}>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Actual Spend</CardTitle>
              <TrendingUp className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalActual)}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '100ms' }}>
          <CardHeader className={`pb-3 ${totalVariance > 0 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'} text-white`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Variance</CardTitle>
              {totalVariance > 0 ? (
                <TrendingUp className="h-5 w-5 text-white/80" />
              ) : (
                <TrendingDown className="h-5 w-5 text-white/80" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className={`text-3xl font-bold ${totalVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalVariance > 0 ? '+' : ''}{formatCurrency(totalVariance)}
            </div>
            <p className={`text-sm mt-1 ${totalVariancePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalVariancePercent > 0 ? '+' : ''}{totalVariancePercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '150ms' }}>
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Budget Items</CardTitle>
              <FileText className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">{budgetItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search budget items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {BUDGET_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategoryName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Table */}
      <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '250ms' }}>
        <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
          <CardTitle className="text-white font-bold">Budget Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-16 animate-in fade-in duration-500">
              <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No budget items found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterCategory !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'Get started by adding your first budget line item to track project expenses'}
              </p>
              {!searchTerm && filterCategory === 'all' && (
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  Add Budget Line
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Planned</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors duration-200 animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatCategoryName(item.category)}</div>
                          {item.subcategory && (
                            <div className="text-sm text-gray-500">{item.subcategory}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium">{item.description}</div>
                          {item.notes && (
                            <div className="text-sm text-gray-500 truncate">{item.notes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.plannedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.actualAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={item.variance > 0 ? 'text-red-600' : 'text-green-600'}>
                          {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                          <div className="text-xs">
                            ({item.variancePercent > 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] transition-colors duration-200"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(item)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(item)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Budget Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <DialogTitle className="text-white text-2xl font-bold">Add Budget Line Item</DialogTitle>
            <DialogDescription className="text-purple-100 mt-2">
              Create a new budget line item for this project
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 p-6 pl-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Category *</Label>
                <Select
                  value={newBudgetLine.category}
                  onValueChange={(value) => setNewBudgetLine({ ...newBudgetLine, category: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatCategoryName(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-sm font-semibold text-gray-700">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={newBudgetLine.subcategory}
                  onChange={(e) => setNewBudgetLine({ ...newBudgetLine, subcategory: e.target.value })}
                  placeholder="e.g., Skilled labor"
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description *</Label>
              <Input
                id="description"
                value={newBudgetLine.description}
                onChange={(e) => setNewBudgetLine({ ...newBudgetLine, description: e.target.value })}
                placeholder="e.g., Construction labor costs"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plannedAmount" className="text-sm font-semibold text-gray-700">Planned Amount *</Label>
              <Input
                id="plannedAmount"
                type="number"
                value={newBudgetLine.plannedAmount}
                onChange={(e) => setNewBudgetLine({ ...newBudgetLine, plannedAmount: e.target.value })}
                placeholder="0"
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newBudgetLine.startDate}
                  onChange={(e) => setNewBudgetLine({ ...newBudgetLine, startDate: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newBudgetLine.endDate}
                  onChange={(e) => setNewBudgetLine({ ...newBudgetLine, endDate: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">Notes</Label>
              <Textarea
                id="notes"
                value={newBudgetLine.notes}
                onChange={(e) => setNewBudgetLine({ ...newBudgetLine, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={submitting}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBudget}
              disabled={submitting}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Budget Line
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <DialogTitle className="text-white text-2xl font-bold">Edit Budget Line Item</DialogTitle>
            <DialogDescription className="text-purple-100 mt-2">
              Update the budget line item details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 p-6 pl-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-sm font-semibold text-gray-700">Category *</Label>
                <Select
                  value={editBudgetLine.category}
                  onValueChange={(value) => setEditBudgetLine({ ...editBudgetLine, category: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatCategoryName(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subcategory" className="text-sm font-semibold text-gray-700">Subcategory</Label>
                <Input
                  id="edit-subcategory"
                  value={editBudgetLine.subcategory}
                  onChange={(e) => setEditBudgetLine({ ...editBudgetLine, subcategory: e.target.value })}
                  placeholder="e.g., Skilled labor"
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-700">Description *</Label>
              <Input
                id="edit-description"
                value={editBudgetLine.description}
                onChange={(e) => setEditBudgetLine({ ...editBudgetLine, description: e.target.value })}
                placeholder="e.g., Construction labor costs"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plannedAmount" className="text-sm font-semibold text-gray-700">Planned Amount *</Label>
              <Input
                id="edit-plannedAmount"
                type="number"
                value={editBudgetLine.plannedAmount}
                onChange={(e) => setEditBudgetLine({ ...editBudgetLine, plannedAmount: e.target.value })}
                placeholder="0"
                className="h-11"
              />
            </div>
            {selectedBudget && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Actual Amount (Auto-calculated from Expenses)</Label>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Current Actual Spend:</span>
                    <span className="text-xl font-bold text-[#7C3AED]">
                      {formatCurrency(selectedBudget.actualAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    This amount is automatically calculated from paid expenses in the "{formatCategoryName(selectedBudget.category)}" category.
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate" className="text-sm font-semibold text-gray-700">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={editBudgetLine.startDate}
                  onChange={(e) => setEditBudgetLine({ ...editBudgetLine, startDate: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate" className="text-sm font-semibold text-gray-700">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={editBudgetLine.endDate}
                  onChange={(e) => setEditBudgetLine({ ...editBudgetLine, endDate: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="text-sm font-semibold text-gray-700">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editBudgetLine.notes}
                onChange={(e) => setEditBudgetLine({ ...editBudgetLine, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditBudget}
              disabled={submitting}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Budget Line
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget Line Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget line item? This action cannot be undone.
              {budgetToDelete && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{formatCategoryName(budgetToDelete.category)}</p>
                  <p className="text-sm text-gray-600">{budgetToDelete.description}</p>
                  <p className="text-sm font-medium mt-2">
                    Planned: {formatCurrency(budgetToDelete.plannedAmount)}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
