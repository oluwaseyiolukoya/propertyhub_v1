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
  projectCurrency = "NGN",
  onBack,
}) => {
  const [fundingRecords, setFundingRecords] = useState<FundingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

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
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    return symbols[currency] || currency;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: projectCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2 -ml-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              Project Funding
            </h1>
            <p className="text-gray-600 mt-1">{projectName}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700"
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Received</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalReceived)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {fundingRecords.filter((r) => r.status === "received").length} transactions
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(totalPending)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {fundingRecords.filter((r) => r.status === "pending").length} expected
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Funding</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalFunding)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Received + Pending
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Funding Sources</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fundingByType.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Active funding types
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funding Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Funding Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {fundingOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={fundingOverTime}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => formatCurrency(value)} />
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
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No funding data yet</p>
                  <p className="text-sm mt-1">Add funding records to see trends</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funding by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Funding by Type</CardTitle>
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
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No funding breakdown yet</p>
                  <p className="text-sm mt-1">Add funding to see distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution Chart */}
      {statusDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Funding Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(value) => formatCurrency(value)} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Funding Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Funding Records</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
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
                <SelectTrigger className="w-40">
                  <SelectValue />
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
        <CardContent>
          {filteredRecords.length > 0 ? (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(record.status)}
                        <h3 className="font-semibold text-gray-900">
                          {FUNDING_TYPE_LABELS[record.fundingType] || record.fundingType}
                        </h3>
                        {getStatusBadge(record.status)}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {record.description || "No description"}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {record.fundingSource && (
                          <div>
                            <p className="text-gray-500">Source</p>
                            <p className="font-medium">{record.fundingSource}</p>
                          </div>
                        )}
                        {record.receivedDate && (
                          <div>
                            <p className="text-gray-500">Received Date</p>
                            <p className="font-medium">{formatDate(record.receivedDate)}</p>
                          </div>
                        )}
                        {record.expectedDate && !record.receivedDate && (
                          <div>
                            <p className="text-gray-500">Expected Date</p>
                            <p className="font-medium">{formatDate(record.expectedDate)}</p>
                          </div>
                        )}
                        {record.referenceNumber && (
                          <div>
                            <p className="text-gray-500">Reference</p>
                            <p className="font-medium">{record.referenceNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(record.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(record.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No funding records found</p>
              <p className="text-sm mt-1">
                {statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Click 'Add Funding' to create your first record"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Funding Modal */}
      <AddFundingModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projectId={projectId}
        projectCurrency={projectCurrency}
        onSuccess={fetchFunding}
      />
    </div>
  );
};

export default ProjectFundingPage;


