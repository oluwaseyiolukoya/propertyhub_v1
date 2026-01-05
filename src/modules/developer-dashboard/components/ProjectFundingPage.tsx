import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Edit,
  MoreVertical,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { AddFundingModal } from "./AddFundingModal";
import { EditFundingModal } from "./EditFundingModal";
import { getProjectById } from "../services/developerDashboard.api";
import { getCurrencySymbol as getCurrencySymbolFromLib } from "../../../lib/currency";

interface FundingRecord {
  id: string;
  amount: number;
  currency: string;
  fundingType: string;
  fundingSource: string | null;
  expectedDate: string | null;
  receivedDate: string | null;
  status: string;
  referenceNumber: string | null;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ProjectFundingPageProps {
  projectId: string;
  projectName: string;
  projectCurrency?: string;
  onBack: () => void;
}

const FUNDING_TYPE_COLORS: Record<string, string> = {
  client_payment: "#10b981",
  bank_loan: "#3b82f6",
  equity_investment: "#8b5cf6",
  grant: "#f59e0b",
  internal_budget: "#6366f1",
  advance_payment: "#14b8a6",
};

const FUNDING_TYPE_LABELS: Record<string, string> = {
  client_payment: "Client Payment",
  bank_loan: "Bank Loan",
  equity_investment: "Equity Investment",
  grant: "Grant",
  internal_budget: "Internal Budget",
  advance_payment: "Advance Payment",
};

export const ProjectFundingPage: React.FC<ProjectFundingPageProps> = ({
  projectId,
  projectName,
  projectCurrency: propProjectCurrency = "NGN",
  onBack,
}) => {
  const [fundingRecords, setFundingRecords] = useState<FundingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFunding, setSelectedFunding] = useState<FundingRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [projectCurrency, setProjectCurrency] = useState<string>(propProjectCurrency);

  // Fetch project currency
  useEffect(() => {
    const fetchProjectCurrency = async () => {
      try {
        const response = await getProjectById(projectId);
        if (response.success && response.data) {
          setProjectCurrency(response.data.currency || propProjectCurrency);
        }
      } catch (error) {
        console.error('Failed to fetch project currency:', error);
        // Keep prop currency if fetch fails
      }
    };

    if (projectId) {
      fetchProjectCurrency();
    }
  }, [projectId, propProjectCurrency]);

  useEffect(() => {
    fetchFunding();
  }, [projectId]);

  const fetchFunding = async () => {
    setLoading(true);
    try {
      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(
        `/api/developer-dashboard/projects/${projectId}/funding`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch funding records");
      }

      const data = await response.json();
      setFundingRecords(data);
    } catch (error: any) {
      console.error("Error fetching funding:", error);
      toast.error("Failed to load funding records");
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount: number) => {
    // Use centralized currency symbol to avoid "F CFA" issue with Intl.NumberFormat
    const symbol = getCurrencySymbolFromLib(projectCurrency);
    const formatted = amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${symbol}${formatted}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter records
  const filteredRecords = fundingRecords.filter((record) => {
    if (statusFilter !== "all" && record.status !== statusFilter) return false;
    if (typeFilter !== "all" && record.fundingType !== typeFilter) return false;
    return true;
  });

  // Calculate totals
  const totalReceived = fundingRecords
    .filter((r) => r.status === "received")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPending = fundingRecords
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPartial = fundingRecords
    .filter((r) => r.status === "partial")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalCancelled = fundingRecords
    .filter((r) => r.status === "cancelled")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalFunding = totalReceived + totalPending + totalPartial;

  // Funding by type
  const fundingByType = Object.keys(FUNDING_TYPE_LABELS).map((type) => {
    const amount = fundingRecords
      .filter((r) => r.fundingType === type && r.status === "received")
      .reduce((sum, r) => sum + r.amount, 0);
    return {
      name: FUNDING_TYPE_LABELS[type],
      value: amount,
      color: FUNDING_TYPE_COLORS[type],
    };
  }).filter((item) => item.value > 0);

  // Funding over time (monthly)
  const fundingOverTime = fundingRecords
    .filter((r) => r.receivedDate && r.status === "received")
    .reduce((acc: any[], record) => {
      const date = new Date(record.receivedDate!);
      const monthYear = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });

      const existing = acc.find((item) => item.month === monthYear);
      if (existing) {
        existing.amount += record.amount;
      } else {
        acc.push({ month: monthYear, amount: record.amount });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Status distribution
  const statusDistribution = [
    { name: "Received", value: totalReceived, color: "#10b981" },
    { name: "Pending", value: totalPending, color: "#f59e0b" },
    { name: "Partial", value: totalPartial, color: "#3b82f6" },
  ].filter((item) => item.value > 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "received":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "partial":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      received: { className: "bg-green-100 text-green-800", label: "Received" },
      pending: { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      partial: { className: "bg-blue-100 text-blue-800", label: "Partial" },
      cancelled: { className: "bg-red-100 text-red-800", label: "Cancelled" },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleEditFunding = (funding: FundingRecord) => {
    setSelectedFunding(funding);
    setIsEditModalOpen(true);
  };

  const handleStatusChange = async (fundingId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(
        `/api/developer-dashboard/projects/${projectId}/funding/${fundingId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(`Status updated to ${newStatus}`);
      fetchFunding();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 md:space-y-6 animate-in fade-in duration-500">
        {/* Hero Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 h-32 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Chart Skeleton */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-200 to-gray-300 h-16 animate-pulse" />
          <CardContent className="p-6">
            <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Back Button */}
      <Button variant="ghost" className="gap-2 -ml-2" onClick={onBack}>
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Button>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] p-6 md:p-8 shadow-xl animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-white" />
              Project Funding
            </h1>
            <p className="text-white/80 font-medium">{projectName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 font-semibold"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              className="gap-2 bg-white hover:bg-gray-50 text-[#7C3AED] font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Funding
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '0ms' }}>
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Total Received</CardTitle>
              <CheckCircle className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalReceived)}
              </p>
              <p className="text-xs text-gray-600">
                {fundingRecords.filter((r) => r.status === "received").length} transactions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '50ms' }}>
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Pending</CardTitle>
              <Clock className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-xs text-gray-600">
                {fundingRecords.filter((r) => r.status === "pending").length} expected
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '100ms' }}>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Total Funding</CardTitle>
              <DollarSign className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalFunding)}
              </p>
              <p className="text-xs text-gray-600">
                Received + Pending
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '150ms' }}>
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Funding Sources</CardTitle>
              <TrendingUp className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {fundingByType.length}
              </p>
              <p className="text-xs text-gray-600">
                Active funding types
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funding Over Time */}
        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
            <CardTitle className="text-white font-bold">Funding Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {fundingOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={fundingOverTime}
                  margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis
                    stroke="#6b7280"
                    tickFormatter={(value) => formatCurrency(value)}
                    width={80}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    fill="url(#colorAmount)"
                    strokeWidth={2}
                    name="Funding"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 animate-in fade-in duration-500">
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-900 mb-1">No funding data yet</p>
                <p className="text-sm text-gray-600">Add funding records to see trends over time</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funding by Type */}
        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '250ms' }}>
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
            <CardTitle className="text-white font-bold">Funding by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {fundingByType.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={fundingByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {fundingByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 animate-in fade-in duration-500">
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-900 mb-1">No funding breakdown yet</p>
                <p className="text-sm text-gray-600">Add funding to see distribution by type</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution - Card Grid */}
      {statusDistribution.length > 0 && (
        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms' }}>
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
            <CardTitle className="text-white font-bold">Funding Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statusDistribution.map((status, index) => {
                const percentage = totalFunding > 0 ? (status.value / totalFunding) * 100 : 0;
                const Icon =
                  status.name === "Received" ? CheckCircle :
                  status.name === "Pending" ? Clock :
                  status.name === "Partial" ? AlertCircle :
                  XCircle;

                return (
                  <div
                    key={index}
                    className="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Background gradient */}
                    <div
                      className="absolute inset-0 opacity-5"
                      style={{ backgroundColor: status.color }}
                    />

                    {/* Content */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <Icon
                          className="h-5 w-5"
                          style={{ color: status.color }}
                        />
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: `${status.color}20`,
                            color: status.color
                          }}
                        >
                          {percentage.toFixed(0)}%
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">
                          {status.name}
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(status.value)}
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: status.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funding Records Table - Full Width */}
      <div className="w-full">
        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '350ms' }}>
        <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold">Funding Records</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
                  <SelectValue className="text-white" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
                  <SelectValue className="text-white" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(FUNDING_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 transition-colors duration-200 animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {/* Type */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {FUNDING_TYPE_LABELS[record.fundingType] || record.fundingType}
                            </div>
                            {record.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {record.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.fundingSource || "-"}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(record.amount)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.receivedDate
                            ? formatDate(record.receivedDate)
                            : record.expectedDate
                            ? formatDate(record.expectedDate)
                            : formatDate(record.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {record.receivedDate
                            ? "Received"
                            : record.expectedDate
                            ? "Expected"
                            : "Created"}
                        </div>
                      </td>

                      {/* Reference */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.referenceNumber || "-"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] transition-colors duration-200"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEditFunding(record)}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                              Change Status
                            </DropdownMenuLabel>
                            {record.status !== "received" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(record.id, "received")}
                                className="gap-2"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Mark as Received
                              </DropdownMenuItem>
                            )}
                            {record.status !== "pending" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(record.id, "pending")}
                                className="gap-2"
                              >
                                <Clock className="h-4 w-4 text-yellow-600" />
                                Mark as Pending
                              </DropdownMenuItem>
                            )}
                            {record.status !== "partial" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(record.id, "partial")}
                                className="gap-2"
                              >
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                Mark as Partial
                              </DropdownMenuItem>
                            )}
                            {record.status !== "cancelled" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(record.id, "cancelled")}
                                className="gap-2 text-red-600"
                              >
                                <XCircle className="h-4 w-4" />
                                Mark as Cancelled
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 animate-in fade-in duration-500">
              <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <DollarSign className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No funding records found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters to see more results"
                  : "Click 'Add Funding' to create your first funding record"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Add Funding Modal */}
      <AddFundingModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projectId={projectId}
        projectCurrency={projectCurrency}
        onSuccess={fetchFunding}
      />

      {/* Edit Funding Modal */}
      {selectedFunding && (
        <EditFundingModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedFunding(null);
          }}
          projectId={projectId}
          projectCurrency={projectCurrency}
          funding={selectedFunding}
          onSuccess={fetchFunding}
        />
      )}
    </div>
  );
};

export default ProjectFundingPage;


