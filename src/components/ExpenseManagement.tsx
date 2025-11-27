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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage all property expenses</p>
        </div>
        <Button onClick={handleAddExpense}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Statistics Cards */}
      {expenseStats && (
        <TooltipProvider>
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center gap-1">
                        Total Expenses
                        <AlertCircle className="h-3 w-3 text-muted-foreground" />
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
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(expenseStats.totalAmount || 0, smartBaseCurrency)}</div>
              <p className="text-xs text-muted-foreground mt-1">{expenseStats.totalCount || 0} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center gap-1">
                        Paid
                        <AlertCircle className="h-3 w-3 text-muted-foreground" />
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
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  expenseStats.byStatus?.find((s: any) => s.status === 'paid')?._sum?.amount || 0,
                  smartBaseCurrency
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {expenseStats.byStatus?.find((s: any) => s.status === 'paid')?._count || 0} expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center gap-1">
                        Pending
                        <AlertCircle className="h-3 w-3 text-muted-foreground" />
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
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(
                  expenseStats.byStatus?.find((s: any) => s.status === 'pending')?._sum?.amount || 0,
                  smartBaseCurrency
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {expenseStats.byStatus?.find((s: any) => s.status === 'pending')?._count || 0} expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center gap-1">
                        Top Category
                        <AlertCircle className="h-3 w-3 text-muted-foreground" />
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
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {expenseStats.byCategory && expenseStats.byCategory.length > 0
                  ? EXPENSE_CATEGORIES.find(c => c.value === expenseStats.byCategory[0].category)?.label || expenseStats.byCategory[0].category
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Expenses by Property</CardTitle>
                  <CardDescription>Total expenses for each property</CardDescription>
                </div>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
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
                      className="max-w-sm"
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
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{propExpense.propertyName}</p>
                            <p className="text-sm text-muted-foreground">
                              {propExpense.count} {propExpense.count === 1 ? 'expense' : 'expenses'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterProperty} onValueChange={setFilterProperty}>
              <SelectTrigger>
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
              <SelectTrigger>
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
              <SelectTrigger>
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
                <SelectTrigger>
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
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>
            {filteredExpenses.length} of {expenses.length} expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  {isManager && <TableHead>Approval</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
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
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </TableCell>
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
                      <TableCell className="max-w-[250px]">
                        <p className="truncate">{expense.description}</p>
                        {expense.notes && (
                          <p className="text-xs text-muted-foreground truncate">{expense.notes}</p>
                        )}
                      </TableCell>
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
                      {isManager && (
                        <TableCell>
                          {expense.requiresApproval ? (
                            <Badge variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pending Approval
                            </Badge>
                          ) : (
                            <Badge variant="outline">
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
                      unitId: 'none'
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
              {/* Date - black & white themed calendar */}
              <div className="space-y-2">
                <Label htmlFor="expense-date">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expenseForm.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expenseForm.date
                        ? format(new Date(expenseForm.date), "PPP")
                        : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Due Date - black & white themed calendar */}
              <div className="space-y-2">
                <Label htmlFor="expense-due-date">Due Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expenseForm.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expenseForm.dueDate
                        ? format(new Date(expenseForm.dueDate), "PPP")
                        : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                    />
                  </PopoverContent>
                </Popover>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showExpenseDeleteDialog} onOpenChange={setShowExpenseDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {expenseToDelete && (
              <div className="p-4 border rounded-lg space-y-2">
                <p><strong>Description:</strong> {expenseToDelete.description}</p>
                <p><strong>Amount:</strong> {formatCurrency(expenseToDelete.amount, expenseToDelete.currency)}</p>
                <p><strong>Category:</strong> {EXPENSE_CATEGORIES.find(c => c.value === expenseToDelete.category)?.label}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowExpenseDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExpense}>
              Delete Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

