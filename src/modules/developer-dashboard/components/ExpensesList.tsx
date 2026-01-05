import React, { useState, useEffect } from "react";
import { Edit, Trash2, Eye, Filter, Search, Download, MoreVertical, Loader2, Receipt, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "labor", label: "Labor & Payroll", icon: "👷" },
  { value: "materials", label: "Materials & Supplies", icon: "🏗️" },
  { value: "equipment", label: "Equipment & Machinery", icon: "🔧" },
  { value: "permits", label: "Permits & Licenses", icon: "📋" },
  { value: "professional-fees", label: "Professional Fees", icon: "👨‍💼" },
  { value: "contingency", label: "Contingency", icon: "⚠️" },
  { value: "other", label: "Other Expenses", icon: "📦" },
];

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paidDate: string | null;
  paymentStatus: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface ExpensesListProps {
  projectId: string;
  projectCurrency?: string;
  onEdit: (expense: Expense) => void;
  onRefresh?: () => void;
}

export function ExpensesList({
  projectId,
  projectCurrency = "NGN",
  onEdit,
  onRefresh,
}: ExpensesListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [projectId]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(
        `/api/developer-dashboard/projects/${projectId}/expenses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }

      const data = await response.json();
      setExpenses(data);
    } catch (error: any) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;

    setDeleting(true);
    try {
      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(
        `/api/developer-dashboard/projects/${projectId}/expenses/${expenseToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      toast.success("Expense deleted successfully");
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
      fetchExpenses(); // Refresh the list
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    } finally {
      setDeleting(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      NGN: "₦",
      XOF: "CFA",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    return symbols[currency] || currency;
  };

  const getCategoryLabel = (category: string) => {
    const cat = EXPENSE_CATEGORIES.find((c) => c.value === category);
    return cat ? `${cat.icon} ${cat.label}` : category;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      paid: { variant: "default", label: "Paid" },
      pending: { variant: "secondary", label: "Pending" },
      partial: { variant: "outline", label: "Partial" },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant as any} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || expense.paymentStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalAmount = filteredExpenses.reduce(
    (sum, exp) => sum + exp.totalAmount,
    0
  );
  const paidAmount = filteredExpenses
    .filter((exp) => exp.paymentStatus === "paid")
    .reduce((sum, exp) => sum + exp.totalAmount, 0);
  const pendingAmount = filteredExpenses
    .filter((exp) => exp.paymentStatus === "pending")
    .reduce((sum, exp) => sum + exp.totalAmount, 0);

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
          <CardTitle className="text-white text-lg font-semibold">Project Expenses</CardTitle>
        </div>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Summary cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg animate-shimmer" />
              ))}
            </div>
            {/* Table skeleton */}
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-shimmer" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl">
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg font-semibold">Project Expenses</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExpenses}
            className="gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      <CardContent className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {/* Total Expenses */}
          <div className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 rounded-xl" style={{ animationDelay: '0ms' }}>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <p className="text-white/90 text-sm font-medium">Total Expenses</p>
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-white">
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {getCurrencySymbol(projectCurrency)}
                {totalAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {filteredExpenses.length} expense(s)
              </p>
            </div>
          </div>

          {/* Paid */}
          <div className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 rounded-xl" style={{ animationDelay: '50ms' }}>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <div className="flex items-center justify-between">
                <p className="text-white/90 text-sm font-medium">Paid</p>
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-white">
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {getCurrencySymbol(projectCurrency)}
                {paidAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {filteredExpenses.filter((e) => e.paymentStatus === "paid").length} expense(s)
              </p>
            </div>
          </div>

          {/* Pending */}
          <div className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 rounded-xl" style={{ animationDelay: '100ms' }}>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4">
              <div className="flex items-center justify-between">
                <p className="text-white/90 text-sm font-medium">Pending</p>
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-white">
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {getCurrencySymbol(projectCurrency)}
                {pendingAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {filteredExpenses.filter((e) => e.paymentStatus === "pending").length} expense(s)
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-xl">
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-4 rounded-t-lg">
            <CardTitle className="text-white text-sm font-semibold">Filters</CardTitle>
          </div>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-11">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon ? `${cat.icon} ` : ""}
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px] h-11">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card className="border-0 shadow-xl">
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <CardTitle className="text-white text-lg font-semibold">Expense Records</CardTitle>
          </div>
          <CardContent className="p-0">
            {filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-gray-50">
                <Receipt className="h-16 w-16 text-gray-400 mb-4" />
                <p className="font-medium text-lg mb-2">No expenses found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first expense to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="text-right font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense, index) => (
                      <TableRow
                        key={expense.id}
                        className="hover:bg-gray-50 transition-colors animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                    <TableCell className="font-medium">
                      {expense.paidDate
                        ? new Date(expense.paidDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate">
                          {expense.description}
                        </p>
                        {expense.notes && (
                          <p className="text-xs text-gray-500 truncate">
                            {expense.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getCategoryLabel(expense.category)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-gray-900">
                          {getCurrencySymbol(expense.currency)}
                          {expense.totalAmount.toLocaleString()}
                        </span>
                        {expense.taxAmount > 0 && (
                          <span className="text-xs text-gray-500">
                            Tax: {getCurrencySymbol(expense.currency)}
                            {expense.taxAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onEdit(expense)}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(expense)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
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
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense?
              {expenseToDelete && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {expenseToDelete.description}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Amount: {getCurrencySymbol(expenseToDelete.currency)}
                    {expenseToDelete.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Category: {getCategoryLabel(expenseToDelete.category)}
                  </p>
                </div>
              )}
              <p className="mt-4 text-red-600 font-medium">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

