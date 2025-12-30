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
import { Calendar, Download, Mail, FileText, ChevronDown, AlertCircle } from "lucide-react";
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
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <div className="text-gray-500">Loading reports data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-gray-900 font-semibold">Failed to Load Reports</div>
          <div className="text-gray-500">{error}</div>
          <Button onClick={() => window.location.reload()} variant="outline">
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
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <FileText className="h-12 w-12 text-gray-400" />
          <div className="text-gray-900 font-semibold">No Reports Data Available</div>
          <div className="text-gray-500">
            Start adding expenses and budget items to see reports and analytics.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive project insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
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
          <Button className="gap-2 bg-orange-500 hover:bg-orange-600" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleScheduleEmail}>
            <Mail className="w-4 h-4" />
            Schedule Email
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalBudget || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalSpent || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(summary.percentageUsed || 0).toFixed(1)}% of budget
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Download className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.remaining || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(100 - (summary.percentageUsed || 0)).toFixed(1)}% available
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                summary.remaining >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Calendar className={`h-6 w-6 ${
                  summary.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalExpenses || 0}
                </p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {summary.paidExpenses || 0} Paid
                  </Badge>
                  {(summary.overdueExpenses || 0) > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {summary.overdueExpenses} Overdue
                    </Badge>
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
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
              <SelectTrigger className="w-48">
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cash Flow Forecast</CardTitle>
            <Badge variant="outline">7-Month Trend</Badge>
          </div>
        </CardHeader>
        <CardContent>
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
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No cash flow data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown and Phase Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
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
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No cost breakdown data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phase Spend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual by Phase</CardTitle>
          </CardHeader>
          <CardContent>
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
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No phase spending data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendor Performance Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vendor Performance Metrics</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">On-Time Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                <span className="text-gray-600">Quality Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600">Cost Efficiency</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No vendor performance data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleGenerateReport('executive')}>
          <CardContent className="p-6">
            <FileText className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Monthly Executive Report</h3>
            <p className="text-sm text-gray-600 mb-4">Comprehensive overview for stakeholders</p>
            <Button variant="outline" size="sm" className="w-full">Generate</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleGenerateReport('investor')}>
          <CardContent className="p-6">
            <FileText className="w-8 h-8 text-teal-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Investor Update</h3>
            <p className="text-sm text-gray-600 mb-4">Financial performance and forecasts</p>
            <Button variant="outline" size="sm" className="w-full">Generate</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleGenerateReport('cost-analysis')}>
          <CardContent className="p-6">
            <FileText className="w-8 h-8 text-amber-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Cost Analysis Report</h3>
            <p className="text-sm text-gray-600 mb-4">Detailed breakdown by category</p>
            <Button variant="outline" size="sm" className="w-full">Generate</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

