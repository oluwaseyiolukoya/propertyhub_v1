import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Edit,
  Share2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  ArrowRight,
  Plus,
  Info,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import KPICard from './KPICard';
import { useProjectDashboard } from '../hooks/useDeveloperDashboardData';
import { CashFlowChart } from './CashFlowChart';
import { ProjectStagesChecklist } from './ProjectStagesChecklist';
import { apiClient } from '../../../lib/api-client';
import { getCurrencySymbol } from '../../../lib/currency';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ProjectDashboardProps {
  projectId: string;
  onBack: () => void;
  onGenerateReport?: () => void;
  onEditProject?: () => void;
  onMarkAsCompleted?: () => void;
  onReactivateProject?: () => void;
}

// budgetVsActualData is now fetched from API (removed mock data)
// spendByCategoryData is now fetched from API (removed mock data)
// Cash flow data is now fetched from API (removed mock data)
// Recent activity is now fetched from API (removed mock data)

interface RecentActivity {
  id: string;
  type: 'expense' | 'funding' | 'budget';
  description: string;
  amount: number;
  currency: string;
  user: string;
  timestamp: string;
  status: string;
  metadata?: any;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projectId,
  onBack,
  onGenerateReport,
  onEditProject,
  onMarkAsCompleted,
  onReactivateProject,
}) => {
  const { data, loading, error, refetch } = useProjectDashboard(projectId);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityTotalPages, setActivityTotalPages] = useState(0);
  const activityPerPage = 5;

  // Fetch recent activity with pagination
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setActivityLoading(true);
        const skip = (activityPage - 1) * activityPerPage;
        const response = await apiClient.get(
          `/api/developer-dashboard/projects/${projectId}/recent-activity?limit=${activityPerPage}&skip=${skip}`
        );
        // apiClient.get returns { data: ... }, so access response.data
        const activities = response?.data?.activities || [];
        const total = response?.data?.total || 0;
        const totalPages = response?.data?.totalPages || 0;
        setRecentActivity(activities);
        setActivityTotal(total);
        setActivityTotalPages(totalPages);
      } catch (err: any) {
        console.error('Failed to fetch recent activity:', err);
        setRecentActivity([]);
        setActivityTotal(0);
        setActivityTotalPages(0);
      } finally {
        setActivityLoading(false);
      }
    };

    if (projectId) {
      fetchRecentActivity();
    }
  }, [projectId, activityPage]);

  if (loading) {
    return (
      <div className="space-y-5 md:space-y-6 animate-in fade-in duration-500">
        {/* Hero Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 h-32 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-xl overflow-hidden animate-in fade-in duration-500" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
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

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
        <div className="bg-red-50 rounded-full p-4 mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load project</h3>
        <p className="text-gray-600 mb-6 max-w-md text-center">{error || 'Project not found'}</p>
        <Button
          onClick={onBack}
          variant="outline"
          className="gap-2 hover:bg-[#7C3AED]/10 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Button>
      </div>
    );
  }

  const { project, alerts, cashFlowData, invoices } = data;

  console.log('🔍 [ProjectDashboard] Invoices data:', invoices?.length || 0, invoices);

  // Use real cash flow data from API, or fallback to empty array
  const monthlyCashFlow = cashFlowData || [];

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    // Use centralized currency symbol to avoid "F CFA" issue with Intl.NumberFormat
    const symbol = getCurrencySymbol(project.currency);
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${symbol}${formatted}`;
  };

  // Helper function to format category names
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

  // Helper function to format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Format spend by category data with proper category names
  const formattedSpendByCategory = data.spendByCategory?.map(item => ({
    ...item,
    category: formatCategoryName(item.category),
  })) || [];

  // Use calculated values from backend
  const totalBudget = project.totalBudget || 0;
  const actualSpend = project.actualSpend || 0;
  const grossSpend = project.grossSpend || actualSpend; // Gross spend (total expenses)
  const netSpend = project.netSpend || 0; // Net spend (expenses - funding)
  const totalFundingReceived = project.totalFundingReceived || 0; // Total funding received
  const availableBudget = project.availableBudget || 0; // Budget + Funding - Expenses
  const variance = project.variance || 0; // Gross variance
  const variancePercent = project.variancePercent || 0;
  const netVariance = project.netVariance || 0; // Net variance (after funding)
  const netVariancePercent = project.netVariancePercent || 0;
  const forecastedCompletion = project.forecastedCompletion || totalBudget;

  // Calculate forecast variance
  const forecastVariance = forecastedCompletion - totalBudget;
  const forecastVariancePercent = totalBudget > 0 ? (forecastVariance / totalBudget) * 100 : 0;

  return (
    <TooltipProvider>
      <div className="space-y-5 md:space-y-6">
        {/* Back Button */}
        <Button variant="ghost" className="gap-2 -ml-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </Button>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] p-6 md:p-8 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{project.name}</h1>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm capitalize">
                  {project.stage}
                </Badge>
              </div>
              <p className="text-white/80 font-medium">Track your project performance and financial metrics</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {onMarkAsCompleted && project.status !== 'completed' && (
                <Button
                  className="gap-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={onMarkAsCompleted}
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Completed
                </Button>
              )}
              {onReactivateProject && project.status === 'completed' && (
                <Button
                  className="gap-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={onReactivateProject}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reactivate Project
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 font-semibold"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="outline"
                className="gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 font-semibold"
                onClick={onEditProject}
              >
                <Edit className="w-4 h-4" />
                Edit Project
              </Button>
              <Button
                className="gap-2 bg-white hover:bg-gray-50 text-[#7C3AED] font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={onGenerateReport}
              >
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0ms' }}>
          <KPICard
            title="Total Budget"
            value={formatCurrency(totalBudget)}
            subtitle="From budget line items"
            icon={DollarSign}
            tooltip="Total planned budget for this project. Shows sum of budget line items if available, otherwise shows the initial project budget."
          />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '50ms' }}>
          <KPICard
            title="Gross Spend"
            value={formatCurrency(grossSpend)}
            subtitle="Total expenses paid"
            icon={TrendingUp}
            trend={{
              value: parseFloat(Math.abs(variancePercent).toFixed(1)),
              direction: variance < 0 ? 'up' : 'down',
              label: variance < 0 ? 'under budget' : 'over budget',
            }}
            tooltip="Total amount spent from paid expenses. Only expenses marked as 'Paid' are included in this calculation"
          />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
          <KPICard
            title="Funding Received"
            value={formatCurrency(totalFundingReceived)}
            subtitle="Total funding"
            icon={DollarSign}
            tooltip="Total funding received for this project. Only funding with status 'received' is included"
          />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '150ms' }}>
          <KPICard
            title="Net Spend"
            value={formatCurrency(Math.abs(netSpend))}
            subtitle={netSpend >= 0 ? 'After funding' : 'Net positive'}
            icon={netSpend >= 0 ? TrendingUp : TrendingDown}
            trend={{
              value: parseFloat(Math.abs(netVariancePercent).toFixed(1)),
              direction: netSpend >= 0 ? 'up' : 'down',
              label: netSpend >= 0 ? 'net outflow' : 'net inflow',
            }}
            tooltip="Net spend after deducting funding received. Calculated as Gross Spend - Funding Received"
          />
        </div>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
          <KPICard
            title="Available Budget"
            value={formatCurrency(Math.abs(availableBudget))}
            subtitle={availableBudget >= 0 ? 'Remaining' : 'Over budget'}
            icon={DollarSign}
            trend={{
              value: Math.abs((availableBudget / totalBudget) * 100),
              direction: availableBudget >= 0 ? 'up' : 'down',
              label: availableBudget >= 0 ? 'available' : 'exceeded',
            }}
            tooltip="Available budget including funding. Calculated as Total Budget + Funding Received - Gross Spend"
          />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '250ms' }}>
          <KPICard
            title="Net Variance"
            value={`${netVariance >= 0 ? '+' : ''}${formatCurrency(Math.abs(netVariance))}`}
            subtitle={`${netVariancePercent >= 0 ? '+' : ''}${netVariancePercent.toFixed(1)}%`}
            icon={AlertTriangle}
            trend={{
              value: Math.abs(netVariancePercent),
              direction: netVariance > 0 ? 'down' : 'up',
              label: netVariance > 0 ? 'over budget' : 'under budget',
            }}
            tooltip="Net variance after funding. Calculated as Net Spend - Total Budget. Negative values indicate under budget"
          />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
          <KPICard
            title="Forecasted Completion"
            value={formatCurrency(forecastedCompletion)}
            subtitle={
              forecastVariance > 0
                ? `${forecastVariancePercent.toFixed(1)}% over budget`
                : forecastVariance < 0
                ? `${Math.abs(forecastVariancePercent).toFixed(1)}% under budget`
                : 'on budget'
            }
            icon={Target}
            trend={{
              value: Math.abs(forecastVariancePercent),
              direction: forecastVariance > 0 ? 'down' : 'up',
              label: forecastVariance > 0 ? 'over forecast' : 'under forecast',
            }}
            tooltip="Projected total cost at project completion based on current progress and spend rate. Calculated as (Gross Spend ÷ Progress) × 100"
          />
        </div>
      </div>

      {/* Project Stages Checklist */}
      <ProjectStagesChecklist
        projectId={projectId}
        userId={project.developerId}
        onProgressUpdate={(progress) => {
          // Update the project progress in the UI
          if (data?.project) {
            data.project.progress = progress;
          }
        }}
      />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual Chart */}
        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '350ms' }}>
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white font-bold">Budget vs Actual Spend</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-white/80 cursor-help hover:text-white" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Cumulative comparison of planned budget vs actual expenses over time. Helps track spending trends and identify budget deviations early</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#7C3AED]/20 border-t-[#7C3AED] mb-4"></div>
                <p className="text-gray-500 text-sm">Loading budget data...</p>
              </div>
            ) : data.budgetVsActual && data.budgetVsActual.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.budgetVsActual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="budget"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                    name="Budget"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={{ fill: '#14b8a6' }}
                    name="Actual"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 animate-in fade-in duration-500">
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-900 mb-1">No budget data available</p>
                <p className="text-sm text-gray-600">Add budget line items to see budget vs actual comparison</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spend by Category Chart */}
        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '400ms' }}>
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white font-bold">Spend by Category</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-white/80 cursor-help hover:text-white" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Breakdown of total paid expenses by category (Labor, Materials, Equipment, etc.). Only includes expenses with 'Paid' status</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#7C3AED]/20 border-t-[#7C3AED] mb-4"></div>
                <p className="text-gray-500 text-sm">Loading spend data...</p>
              </div>
            ) : formattedSpendByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formattedSpendByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="category"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 animate-in fade-in duration-500">
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-900 mb-1">No spend data available</p>
                <p className="text-sm text-gray-600">Add expenses to see spending breakdown by category</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Enhanced Cash Flow with Date Filters */}
      <CashFlowChart
        projectId={projectId}
        periodType="monthly"
        height={350}
        currency={project.currency}
      />

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <Card className="lg:col-span-1 border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '450ms' }}>
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white font-bold">
                <AlertTriangle className="w-5 h-5 text-white" />
                Budget Alerts
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-white/80 cursor-help hover:text-white" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Critical notifications about budget overruns, pending approvals, and other important project financial events</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts && alerts.length > 0 ? (
              <>
                {alerts.slice(0, 3).map((alert) => {
                  const bgColor =
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'high'
                      ? 'bg-amber-50 border-amber-200'
                      : alert.severity === 'medium'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-green-50 border-green-200';

                  const textColor =
                    alert.severity === 'critical'
                      ? 'text-red-900'
                      : alert.severity === 'high'
                      ? 'text-amber-900'
                      : alert.severity === 'medium'
                      ? 'text-blue-900'
                      : 'text-green-900';

                  const badgeVariant =
                    alert.severity === 'critical' ? 'destructive' : 'default';
                  const badgeClass =
                    alert.severity === 'high'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : alert.severity === 'low'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : '';

                  const badgeLabel =
                    alert.severity === 'critical'
                      ? 'Critical'
                      : alert.severity === 'high'
                      ? 'Warning'
                      : alert.severity === 'medium'
                      ? 'Info'
                      : 'Good';

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-xl ${bgColor} hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-right-2`}
                      style={{ animationDelay: `${alerts.slice(0, 3).indexOf(alert) * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className={`font-medium ${textColor}`}>{alert.title}</span>
                        <Badge variant={badgeVariant} className={badgeClass}>
                          {badgeLabel}
                        </Badge>
                      </div>
                      <p className={`text-sm ${textColor.replace('900', '700')}`}>
                        {alert.message}
                      </p>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  className="w-full gap-2 hover:bg-[#7C3AED]/10 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
                >
                  View All Alerts
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="text-center py-12 animate-in fade-in duration-500">
                <div className="bg-green-50 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="font-medium text-gray-900 mb-1">No active alerts</p>
                <p className="text-sm text-gray-600">All systems are running smoothly</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '500ms' }}>
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-white font-bold">Recent Activity</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-white/80 cursor-help hover:text-white" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Latest financial transactions and activities on this project, including invoices, purchase orders, and approvals</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Button variant="link" className="gap-1 text-white hover:text-white/80 hover:underline">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl animate-pulse" style={{ backgroundSize: '200% 100%' }} />
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  // Format currency for this activity
                  const activityAmount = new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: activity.currency || project.currency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(activity.amount);

                  // Determine badge color based on type
                  const badgeColor =
                    activity.type === 'expense' ? 'bg-red-50 text-red-700 border-red-200' :
                    activity.type === 'funding' ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-blue-50 text-blue-700 border-blue-200';

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${recentActivity.indexOf(activity) * 30}ms` }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{activity.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{activity.user}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(activity.timestamp)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 mb-1">{activityAmount}</p>
                        <Badge variant="outline" className={`capitalize ${badgeColor}`}>
                          {activity.type}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 animate-in fade-in duration-500">
                <div className="bg-gray-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-900 mb-1">No recent activity</p>
                <p className="text-sm text-gray-600">Activity will appear here as actions are performed</p>
              </div>
            )}

            {/* Pagination Controls */}
            {!activityLoading && activityTotal > activityPerPage && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-600">
                  Showing {Math.min((activityPage - 1) * activityPerPage + 1, activityTotal)} to{' '}
                  {Math.min(activityPage * activityPerPage, activityTotal)} of {activityTotal} activities
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivityPage(prev => Math.max(1, prev - 1))}
                    disabled={activityPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(activityTotalPages)].map((_, idx) => {
                      const pageNum = idx + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === activityTotalPages ||
                        (pageNum >= activityPage - 1 && pageNum <= activityPage + 1)
                      ) {
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === activityPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActivityPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (
                        (pageNum === activityPage - 2 && pageNum > 1) ||
                        (pageNum === activityPage + 2 && pageNum < activityTotalPages)
                      ) {
                        return <span key={pageNum} className="text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivityPage(prev => Math.min(activityTotalPages, prev + 1))}
                    disabled={activityPage === activityTotalPages}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </TooltipProvider>
  );
};

export default ProjectDashboard;
