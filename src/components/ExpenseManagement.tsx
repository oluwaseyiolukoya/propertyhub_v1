import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "./ui/pagination";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { toast } from "sonner";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  approveExpense,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  PAYMENT_METHODS,
  type Expense
} from '../lib/api/expenses';
import { formatCurrency, getSmartBaseCurrency } from '../lib/currency';
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
  FileText,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  ArrowUpDown,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { format } from 'date-fns';
import { cn } from '../lib/utils';


interface ExpenseManagementProps {
  user: any;
  properties: any[];
  units: any[];
  onBack: () => void;
}

export function ExpenseManagement({ user, properties, units, onBack }: ExpenseManagementProps) {
  // Calculate smart base currency
  const smartBaseCurrency = getSmartBaseCurrency(properties);

  // State management
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseStats, setExpenseStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [showExpenseDeleteDialog, setShowExpenseDeleteDialog] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Property pagination and search
  const [propertySearchTerm, setPropertySearchTerm] = useState('');
  const [propertyPage, setPropertyPage] = useState(1);
  const propertiesPerPage = 5;

  // Form state
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
    notes: '',
    visibleToManager: false
  });

  // Load data on mount
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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
      notes: '',
      visibleToManager: false
    });
    setShowExpenseDialog(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      propertyId: expense.propertyId,
      unitId: expense.unitId || 'none',
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      currency: expense.currency,
      date: new Date(expense.date).toISOString().split('T')[0],
      dueDate: expense.dueDate ? new Date(expense.dueDate).toISOString().split('T')[0] : '',
      status: expense.status,
      paymentMethod: expense.paymentMethod || '',
      notes: expense.notes || '',
      visibleToManager: expense.visibleToManager
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
        notes: expenseForm.notes || undefined,
        visibleToManager: expenseForm.visibleToManager
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
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save expense');
    } finally {
      setExpenseSaving(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      const res = await deleteExpense(expenseToDelete.id);
      if (res.error) throw new Error(res.error);

      toast.success('Expense deleted successfully');
      setShowExpenseDeleteDialog(false);
      setExpenseToDelete(null);
      await loadExpenses();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete expense');
    }
  };

  const handleApproveExpense = async (expense: Expense) => {
    try {
      const res = await approveExpense(expense.id);
      if (res.error) throw new Error(res.error);

      toast.success('Expense approved successfully');
      await loadExpenses();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve expense');
    }
  };

  const handleToggleVisibility = async (expense: Expense) => {
    try {
      const res = await updateExpense(expense.id, {
        visibleToManager: !expense.visibleToManager
      });

      if (res.error) throw new Error(res.error);

      toast.success(
        !expense.visibleToManager
          ? 'Expense now visible to managers'
          : 'Expense hidden from managers'
      );
      await loadExpenses();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update visibility');
    }
  };

  const getPropertyUnitsForExpense = (propertyId: string) => {
    return units.filter(unit => unit.propertyId === propertyId);
  };

  // Filter and sort expenses
  const filteredExpenses = expenses
    .filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProperty = filterProperty === 'all' || expense.propertyId === filterProperty;
      const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;

      return matchesSearch && matchesProperty && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime());
      } else {
        return multiplier * (a.amount - b.amount);
      }
    });

  const isOwner = user?.role?.toLowerCase().includes('owner');
  const isManager = user?.role?.toLowerCase().includes('manager');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Expense Management</h1>
              <p className="text-purple-100 mt-1 text-lg">Track and manage all property expenses</p>
            </div>
          </div>
          <Button
            onClick={handleAddExpense}
            className="bg-white hover:bg-purple-50 text-[#7C3AED] font-semibold shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {expenseStats && (
        <TooltipProvider>
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-4">
              <CardHeader className="pb-2 p-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help inline-flex items-center gap-1">
                          Total Expenses
                          <AlertCircle className="h-3 w-3 text-white/80" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          The sum of all expenses across all your properties, converted to your base currency.
                          Includes all statuses: paid, pending, and overdue.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 bg-white">
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(expenseStats.totalAmount || 0, smartBaseCurrency)}</div>
              <p className="text-sm text-gray-600 mt-2 font-medium">{expenseStats.totalCount || 0} transactions</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4">
              <CardHeader className="pb-2 p-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help inline-flex items-center gap-1">
                          Paid
                          <AlertCircle className="h-3 w-3 text-white/80" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Total amount of expenses that have been marked as "Paid" and completed.
                          These are expenses that no longer require action.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 bg-white">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(
                  expenseStats.byStatus?.find((s: any) => s.status === 'paid')?._sum?.amount || 0,
                  smartBaseCurrency
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                {expenseStats.byStatus?.find((s: any) => s.status === 'paid')?._count || 0} expenses
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4">
              <CardHeader className="pb-2 p-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help inline-flex items-center gap-1">
                          Pending
                          <AlertCircle className="h-3 w-3 text-white/80" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Total amount of expenses awaiting payment. These expenses have been recorded
                          but payment has not been completed yet.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 bg-white">
              <div className="text-3xl font-bold text-amber-600">
                {formatCurrency(
                  expenseStats.byStatus?.find((s: any) => s.status === 'pending')?._sum?.amount || 0,
                  smartBaseCurrency
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                {expenseStats.byStatus?.find((s: any) => s.status === 'pending')?._count || 0} expenses
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-4">
              <CardHeader className="pb-2 p-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help inline-flex items-center gap-1">
                          Top Category
                          <AlertCircle className="h-3 w-3 text-white/80" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          The expense category with the highest total spending across all your properties.
                          This helps identify where most of your money is being spent.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 bg-white">
              <div className="text-xl font-bold text-gray-900 truncate">
                {expenseStats.byCategory && expenseStats.byCategory.length > 0
                  ? EXPENSE_CATEGORIES.find(c => c.value === expenseStats.byCategory[0].category)?.label || expenseStats.byCategory[0].category
                  : 'N/A'}
              </div>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                {expenseStats.byCategory && expenseStats.byCategory.length > 0
                  ? formatCurrency(expenseStats.byCategory[0]._sum?.amount || 0, smartBaseCurrency)
                  : '-'}
              </p>
            </CardContent>
          </Card>
        </div>
        </TooltipProvider>
      )}

      {/* Expenses by Property (Owner only) */}
      {isOwner && expenseStats?.byProperty && expenseStats.byProperty.length > 0 && (() => {
        // Filter properties by search term
        const filteredProperties = expenseStats.byProperty.filter(propExpense =>
          propExpense.propertyName.toLowerCase().includes(propertySearchTerm.toLowerCase())
        );

        // Calculate pagination
        const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
        const startIndex = (propertyPage - 1) * propertiesPerPage;
        const endIndex = startIndex + propertiesPerPage;
        const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

        return (
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900">Expenses by Property</CardTitle>
                    <CardDescription className="text-gray-600">Total expenses for each property</CardDescription>
                  </div>
                </div>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <Input
                      placeholder="Search properties..."
                      value={propertySearchTerm}
                      onChange={(e) => {
                        setPropertySearchTerm(e.target.value);
                        setPropertyPage(1); // Reset to first page on search
                      }}
                      className="max-w-sm border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paginatedProperties.length > 0 ? (
                  <>
                    {paginatedProperties.map((propExpense) => (
                      <div
                        key={propExpense.propertyId}
                        className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl hover:border-[#7C3AED] hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-[#7C3AED] flex items-center justify-center shadow-md">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{propExpense.propertyName}</p>
                            <p className="text-sm text-gray-600 font-medium">
                              {propExpense.count} {propExpense.count === 1 ? 'expense' : 'expenses'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#7C3AED]">
                            {formatCurrency(propExpense.totalAmount, propExpense.currency)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-6">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setPropertyPage(prev => Math.max(1, prev - 1))}
                                className={propertyPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setPropertyPage(page)}
                                  isActive={propertyPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}

                            <PaginationItem>
                              <PaginationNext
                                onClick={() => setPropertyPage(prev => Math.min(totalPages, prev + 1))}
                                className={propertyPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No properties found matching "{propertySearchTerm}"
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Filters */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Filter className="h-5 w-5 text-gray-700" />
            </div>
            <CardTitle className="text-lg text-gray-900">Filters & Search</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#7C3AED]" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
            </div>

            <Select value={filterProperty} onValueChange={setFilterProperty}>
              <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map(prop => (
                  <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {EXPENSE_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="amount">Sort by Amount</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="border-gray-300 hover:border-[#7C3AED] hover:bg-purple-50"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4 text-[#7C3AED]" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">All Expenses</CardTitle>
              <CardDescription className="text-gray-600">
                {filteredExpenses.length} of {expenses.length} expenses
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#111827] hover:bg-[#111827]">
                  <TableHead className="text-white font-semibold">Date</TableHead>
                  <TableHead className="text-white font-semibold">Property</TableHead>
                  <TableHead className="text-white font-semibold">Category</TableHead>
                  <TableHead className="text-white font-semibold">Description</TableHead>
                  <TableHead className="text-white font-semibold">Amount</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  {isManager && <TableHead className="text-white font-semibold">Approval</TableHead>}
                  <TableHead className="text-right text-white font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isManager ? 8 : 7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isManager ? 8 : 7} className="text-center text-muted-foreground py-8">
                      {searchTerm || filterProperty !== 'all' || filterCategory !== 'all' || filterStatus !== 'all'
                        ? 'No expenses match your filters'
                        : 'No expenses recorded yet. Click "Add Expense" to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense, index) => (
                    <TableRow
                      key={expense.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-[#7C3AED]/5 transition-colors`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-[#7C3AED]" />
                          <span className="font-medium text-gray-900">{new Date(expense.date).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">{expense.property?.name || 'Unknown'}</p>
                          {expense.unit && (
                            <p className="text-xs text-gray-600 font-medium">Unit {expense.unit.unitNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-[#7C3AED] hover:bg-purple-200 font-semibold border-0">
                          {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="truncate font-medium text-gray-900">{expense.description}</p>
                        {expense.notes && (
                          <p className="text-xs text-gray-600 truncate mt-0.5">{expense.notes}</p>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-gray-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`font-semibold ${
                            expense.status === 'paid'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                            expense.status === 'pending'
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                            expense.status === 'overdue'
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                            'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } border-0 capitalize`}
                        >
                          {expense.status}
                        </Badge>
                      </TableCell>
                      {isManager && (
                        <TableCell>
                          {expense.requiresApproval ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 font-semibold border-0">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pending Approval
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 font-semibold border-0">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                        </TableCell>
                      )}
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
                            {isOwner && expense.requiresApproval && (
                              <DropdownMenuItem onClick={() => handleApproveExpense(expense)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {isOwner && expense.recordedByRole?.toLowerCase().includes('owner') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleVisibility(expense)}>
                                  {expense.visibleToManager ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Hide from Managers
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Show to Managers
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            {isOwner && (
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
                            )}
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

      {/* Add/Edit Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -mx-6 -mt-6 px-6 py-4 rounded-t-xl">
            <DialogTitle className="text-white text-xl">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            <DialogDescription className="text-purple-100">
              {editingExpense ? 'Update expense details' : 'Record a new property expense'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-property" className="text-sm font-semibold text-gray-700">Property *</Label>
                <Select
                  value={expenseForm.propertyId}
                  onValueChange={(value) => {
                    const property = properties.find(p => p.id === value);
                    setExpenseForm({
                      ...expenseForm,
                      propertyId: value,
                      currency: property?.currency || 'NGN',
                      unitId: 'none'
                    });
                  }}
                >
                  <SelectTrigger id="expense-property" className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                <Label htmlFor="expense-unit" className="text-sm font-semibold text-gray-700">Unit (Optional)</Label>
                <Select
                  value={expenseForm.unitId}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, unitId: value })}
                >
                  <SelectTrigger id="expense-unit" className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                <Label htmlFor="expense-category" className="text-sm font-semibold text-gray-700">Category *</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                >
                  <SelectTrigger id="expense-category" className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                <Label htmlFor="expense-amount" className="text-sm font-semibold text-gray-700">Amount *</Label>
                <div className="flex gap-2">
                  <Input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="flex-1 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <span className="flex items-center px-3 border border-gray-300 rounded-md bg-gray-50 text-sm font-semibold text-gray-700">
                    {expenseForm.currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-description" className="text-sm font-semibold text-gray-700">Description *</Label>
              <Textarea
                id="expense-description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Enter expense description"
                rows={3}
                className="resize-none border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date - purple themed calendar */}
              <div className="space-y-2">
                <Label htmlFor="expense-date" className="text-sm font-semibold text-gray-700">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]",
                        !expenseForm.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#7C3AED]" />
                      {expenseForm.date
                        ? format(new Date(expenseForm.date), "PPP")
                        : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-xl" align="start">
                    <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white p-3 rounded-t-xl">
                      <p className="font-semibold">Select Date</p>
                    </div>
                    <CalendarComponent
                      mode="single"
                      selected={expenseForm.date ? new Date(expenseForm.date) : undefined}
                      onSelect={(date) =>
                        setExpenseForm({
                          ...expenseForm,
                          date: date ? format(date, "yyyy-MM-dd") : "",
                        })
                      }
                      initialFocus
                      classNames={{
                        months: "flex flex-col space-y-4 p-3",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-semibold text-gray-900",
                        nav: "space-x-1 flex items-center",
                        nav_button: cn(
                          "h-7 w-7 bg-transparent p-0 border border-gray-300 hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED] rounded-md"
                        ),
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#7C3AED] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: cn(
                          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] rounded-md"
                        ),
                        day_selected:
                          "bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:text-white focus:bg-[#6D28D9] focus:text-white font-bold shadow-md",
                        day_today: "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                        day_outside: "text-gray-400 opacity-50",
                        day_disabled: "text-gray-400 opacity-50",
                        day_hidden: "invisible",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Due Date - purple themed calendar */}
              <div className="space-y-2">
                <Label htmlFor="expense-due-date" className="text-sm font-semibold text-gray-700">Due Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]",
                        !expenseForm.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#7C3AED]" />
                      {expenseForm.dueDate
                        ? format(new Date(expenseForm.dueDate), "PPP")
                        : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-xl" align="start">
                    <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white p-3 rounded-t-xl">
                      <p className="font-semibold">Select Due Date</p>
                    </div>
                    <CalendarComponent
                      mode="single"
                      selected={expenseForm.dueDate ? new Date(expenseForm.dueDate) : undefined}
                      onSelect={(date) =>
                        setExpenseForm({
                          ...expenseForm,
                          dueDate: date ? format(date, "yyyy-MM-dd") : "",
                        })
                      }
                      initialFocus
                      classNames={{
                        months: "flex flex-col space-y-4 p-3",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-semibold text-gray-900",
                        nav: "space-x-1 flex items-center",
                        nav_button: cn(
                          "h-7 w-7 bg-transparent p-0 border border-gray-300 hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED] rounded-md"
                        ),
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#7C3AED] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: cn(
                          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] rounded-md"
                        ),
                        day_selected:
                          "bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:text-white focus:bg-[#6D28D9] focus:text-white font-bold shadow-md",
                        day_today: "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                        day_outside: "text-gray-400 opacity-50",
                        day_disabled: "text-gray-400 opacity-50",
                        day_hidden: "invisible",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-status" className="text-sm font-semibold text-gray-700">Status *</Label>
                <Select
                  value={expenseForm.status}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, status: value })}
                >
                  <SelectTrigger id="expense-status" className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
                <Label htmlFor="expense-payment-method" className="text-sm font-semibold text-gray-700">Payment Method</Label>
                <Select
                  value={expenseForm.paymentMethod}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, paymentMethod: value })}
                >
                  <SelectTrigger id="expense-payment-method" className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
              <Label htmlFor="expense-notes" className="text-sm font-semibold text-gray-700">Notes (Optional)</Label>
              <Textarea
                id="expense-notes"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                placeholder="Add any additional notes"
                rows={2}
                className="resize-none border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setShowExpenseDialog(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveExpense}
              disabled={expenseSaving}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-md"
            >
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showExpenseDeleteDialog} onOpenChange={setShowExpenseDeleteDialog}>
        <DialogContent className="border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-red-600 to-red-700 -mx-6 -mt-6 px-6 py-4 rounded-t-xl">
            <DialogTitle className="text-white text-xl">Delete Expense</DialogTitle>
            <DialogDescription className="text-red-100">
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {expenseToDelete && (
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-xl space-y-2">
                <p className="text-gray-900"><strong className="font-semibold">Description:</strong> {expenseToDelete.description}</p>
                <p className="text-gray-900"><strong className="font-semibold">Amount:</strong> {formatCurrency(expenseToDelete.amount, expenseToDelete.currency)}</p>
                <p className="text-gray-900"><strong className="font-semibold">Category:</strong> {EXPENSE_CATEGORIES.find(c => c.value === expenseToDelete.category)?.label}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setShowExpenseDeleteDialog(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteExpense}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-md"
            >
              Delete Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

