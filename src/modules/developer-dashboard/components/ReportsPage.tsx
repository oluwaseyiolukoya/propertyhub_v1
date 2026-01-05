import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
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
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Calendar, Download, Mail, FileText, ChevronDown, AlertCircle, BarChart3, Loader2, TrendingUp, DollarSign, TrendingDown } from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import {
  getProjectReports,
  ReportsData,
  CashFlowData,
  CostBreakdownData,
  VendorPerformanceData,
  PhaseSpendData,
  ReportSummary
} from "../../../lib/api/developer-reports";
import { getCurrencySymbol } from "../../../lib/currency";
import { getProjectById } from "../services/developerDashboard.api";

interface ReportsPageProps {
  projectId: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("last-6-months");
  const [selectedPhase, setSelectedPhase] = useState("all-phases");

  // Real data from API
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [costBreakdownData, setCostBreakdownData] = useState<CostBreakdownData[]>([]);
  const [vendorPerformanceData, setVendorPerformanceData] = useState<VendorPerformanceData[]>([]);
  const [phaseSpendData, setPhaseSpendData] = useState<PhaseSpendData[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [currency, setCurrency] = useState<string>('NGN'); // Default to NGN

  // Fetch project currency
  useEffect(() => {
    const fetchProjectCurrency = async () => {
      try {
        const response = await getProjectById(projectId);
        if (response.success && response.data) {
          setCurrency(response.data.currency || 'NGN');
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

  // Fetch real data from API
  useEffect(() => {
    const fetchReportsData = async () => {
      if (!projectId) return;

      setLoading(true);
      setError(null);

      try {
        console.log(`📊 Fetching reports data for project: ${projectId}`);
        const data = await getProjectReports(projectId, selectedPeriod);

        console.log('✅ Reports data received:', data);

        setReportsData(data);
        setSummary(data.summary);
        setCashFlowData(data.cashFlow || []);
        setCostBreakdownData(data.costBreakdown || []);
        setVendorPerformanceData(data.vendorPerformance || []);
        setPhaseSpendData(data.phaseSpend || []);
        // Update currency from API response if available, otherwise keep existing
        if (data.currency) {
          setCurrency(data.currency);
        }
      } catch (err: any) {
        console.error('❌ Error fetching reports data:', err);
        setError(err.message || 'Failed to load reports data');
        toast.error('Failed to load reports data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [projectId, selectedPeriod]);

  const formatCurrency = (value: number) => {
    // Use centralized currency symbol to avoid "F CFA" issue with Intl.NumberFormat
    const symbol = getCurrencySymbol(currency);
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${symbol}${formatted}`;
  };

  const handleGenerateReport = (reportType: string) => {
    console.log(`Generating ${reportType} report for project ${projectId}`);
    // Implement report generation logic
  };

  const handleDownloadPDF = () => {
    console.log(`Downloading PDF report for project ${projectId}`);
    // Implement PDF download logic
  };

  const handleScheduleEmail = () => {
    console.log(`Scheduling email report for project ${projectId}`);
    // Implement email scheduling logic
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] rounded-xl p-8 text-white">
          <div className="h-8 w-64 bg-white/20 rounded-lg mb-2 animate-shimmer"></div>
          <div className="h-4 w-96 bg-white/20 rounded-lg animate-shimmer"></div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border-0 shadow-xl p-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="h-4 w-24 bg-gray-200 rounded mb-4 animate-shimmer"></div>
              <div className="h-8 w-32 bg-gray-200 rounded mb-2 animate-shimmer"></div>
              <div className="h-3 w-20 bg-gray-200 rounded animate-shimmer"></div>
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white rounded-xl border-0 shadow-xl p-6">
          <div className="h-6 w-48 bg-gray-200 rounded mb-6 animate-shimmer"></div>
          <div className="h-64 bg-gray-100 rounded animate-shimmer"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6 bg-white rounded-xl border-0 shadow-xl">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <div className="text-gray-900 font-semibold text-lg">Failed to Load Reports</div>
          <div className="text-gray-500 text-sm">{error}</div>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6 bg-white rounded-xl border-0 shadow-xl">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
            <FileText className="h-8 w-8 text-[#7C3AED]" />
          </div>
          <div className="text-gray-900 font-semibold text-lg">No Reports Data Available</div>
          <div className="text-gray-500 text-sm">
            Start adding expenses and budget items to see reports and analytics.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6 p-6">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] rounded-xl p-8 text-white overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-white" />
              <span>Reports & Analytics</span>
            </h1>
            <p className="text-purple-100">Comprehensive project insights and performance metrics</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
                  <FileText className="w-4 h-4" />
                  Generate Report
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleGenerateReport('investor')}>
                  Investor Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGenerateReport('management')}>
                  Management Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGenerateReport('executive')}>
                  Executive Summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGenerateReport('cost-analysis')}>
                  Cost Analysis Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="gap-2 bg-white text-[#7C3AED] hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button variant="outline" className="gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20" onClick={handleScheduleEmail}>
              <Mail className="w-4 h-4" />
              Schedule Email
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {/* Total Budget */}
        <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0ms' }}>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <div className="flex items-center justify-between">
              <p className="text-white/90 text-sm font-medium">Total Budget</p>
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(summary.totalBudget || 0)}
            </p>
            <p className="text-sm text-gray-500">Project budget allocation</p>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '50ms' }}>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
            <div className="flex items-center justify-between">
              <p className="text-white/90 text-sm font-medium">Total Spent</p>
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(summary.totalSpent || 0)}
            </p>
            <p className="text-sm text-gray-500">
              {(summary.percentageUsed || 0).toFixed(1)}% of budget used
            </p>
          </CardContent>
        </Card>

        {/* Remaining */}
        <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
          <div className={`p-4 ${summary.remaining >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
            <div className="flex items-center justify-between">
              <p className="text-white/90 text-sm font-medium">Remaining</p>
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {summary.remaining >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-white" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-white" />
                )}
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <p className={`text-3xl font-bold mb-1 ${summary.remaining >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatCurrency(summary.remaining || 0)}
            </p>
            <p className="text-sm text-gray-500">
              {(100 - (summary.percentageUsed || 0)).toFixed(1)}% available
            </p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '150ms' }}>
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] p-4">
            <div className="flex items-center justify-between">
              <p className="text-white/90 text-sm font-medium">Expenses</p>
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {summary.totalExpenses || 0}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                {summary.paidExpenses || 0} Paid
              </Badge>
              {(summary.overdueExpenses || 0) > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {summary.overdueExpenses} Overdue
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-xl">
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-4 rounded-t-lg">
          <CardTitle className="text-white text-lg font-semibold">Filters</CardTitle>
        </div>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48 h-11">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="year-to-date">Year to Date</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-48 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-phases">All Phases</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Forecast */}
      <Card className="border-0 shadow-xl">
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg font-semibold">Cash Flow Forecast</CardTitle>
            <Badge variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white">7-Month Trend</Badge>
          </div>
        </div>
        <CardContent className="p-6">
          {cashFlowData && cashFlowData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashFlowData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis
                stroke="#6b7280"
                width={80}
                tickFormatter={(value: number) => {
                  // Format large numbers with K, M, B suffixes for better readability
                  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="inflow"
                stackId="1"
                stroke="#14b8a6"
                fill="#14b8a6"
                fillOpacity={0.6}
                name="Inflow"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="Outflow"
              />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 bg-gray-50 rounded-lg">
              <BarChart3 className="h-12 w-12 text-gray-400 mb-3" />
              <p className="font-medium">No cash flow data available</p>
              <p className="text-sm text-gray-400 mt-1">Add expenses and funding to see cash flow trends</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown and Phase Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Cost Breakdown by Category */}
        <Card className="border-0 shadow-xl">
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <CardTitle className="text-white text-lg font-semibold">Cost Breakdown by Category</CardTitle>
          </div>
          <CardContent className="p-6">
            {costBreakdownData && costBreakdownData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {costBreakdownData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-700 font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 bg-gray-50 rounded-lg">
                <BarChart3 className="h-12 w-12 text-gray-400 mb-3" />
                <p className="font-medium">No cost breakdown data available</p>
                <p className="text-sm text-gray-400 mt-1">Add expenses to see category breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phase Spend Analysis */}
        <Card className="border-0 shadow-xl">
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <CardTitle className="text-white text-lg font-semibold">Budget vs Actual by Phase</CardTitle>
          </div>
          <CardContent className="p-6">
            {phaseSpendData && phaseSpendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={phaseSpendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="phase" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                  <Bar dataKey="budget" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Budget" />
                  <Bar dataKey="actual" fill="#14b8a6" radius={[8, 8, 0, 0]} name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 bg-gray-50 rounded-lg">
                <BarChart3 className="h-12 w-12 text-gray-400 mb-3" />
                <p className="font-medium">No phase spending data available</p>
                <p className="text-sm text-gray-400 mt-1">Add budget and expenses to see phase analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendor Performance Metrics */}
      <Card className="border-0 shadow-xl">
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-white text-lg font-semibold">Vendor Performance Metrics</CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-white">On-Time Delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                <span className="text-white">Quality Score</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-white">Cost Efficiency</span>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          {vendorPerformanceData && vendorPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorPerformanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
              <YAxis dataKey="vendor" type="category" width={150} stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => `${value}%`}
              />
              <Legend />
                <Bar dataKey="onTime" fill="#3b82f6" radius={[0, 4, 4, 0]} name="On-Time" />
                <Bar dataKey="quality" fill="#14b8a6" radius={[0, 4, 4, 0]} name="Quality" />
                <Bar dataKey="cost" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Cost" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 bg-gray-50 rounded-lg">
              <BarChart3 className="h-12 w-12 text-gray-400 mb-3" />
              <p className="font-medium">No vendor performance data available</p>
              <p className="text-sm text-gray-400 mt-1">Add vendors and purchases to see performance metrics</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0ms' }} onClick={() => handleGenerateReport('executive')}>
          <CardContent className="p-6">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Monthly Executive Report</h3>
            <p className="text-sm text-gray-600 mb-4">Comprehensive overview for stakeholders</p>
            <Button variant="outline" size="sm" className="w-full border-gray-300 hover:bg-gray-50">Generate</Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '50ms' }} onClick={() => handleGenerateReport('investor')}>
          <CardContent className="p-6">
            <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Investor Update</h3>
            <p className="text-sm text-gray-600 mb-4">Financial performance and forecasts</p>
            <Button variant="outline" size="sm" className="w-full border-gray-300 hover:bg-gray-50">Generate</Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }} onClick={() => handleGenerateReport('cost-analysis')}>
          <CardContent className="p-6">
            <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Cost Analysis Report</h3>
            <p className="text-sm text-gray-600 mb-4">Detailed breakdown by category</p>
            <Button variant="outline" size="sm" className="w-full border-gray-300 hover:bg-gray-50">Generate</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

