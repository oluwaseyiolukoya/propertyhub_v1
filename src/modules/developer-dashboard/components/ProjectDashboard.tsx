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
import { apiClient } from '../../../lib/api-client';
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

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load project</h3>
        <p className="text-gray-600 mb-6">{error || 'Project not found'}</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portfolio
        </Button>
      </div>
    );
  }

  const { project, alerts, cashFlowData } = data;

  // Use real cash flow data from API, or fallback to empty array
  const monthlyCashFlow = cashFlowData || [];

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: project.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
        <Button variant="ghost" className="gap-2 -ml-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <Badge variant="outline" className="capitalize">
                {project.stage}
              </Badge>
            </div>
            <p className="text-gray-600">Track your project performance and financial metrics</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Overall Progress</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-2">Automatic Progress Calculation</p>
                      <p className="text-xs">Progress is automatically calculated based on:</p>
                      <ul className="text-xs list-disc list-inside mt-1 space-y-1">
                        <li>Milestones completion (40%)</li>
                        <li>Budget progress (30%)</li>
                        <li>Time elapsed (20%)</li>
                        <li>Project stage (10%)</li>
                      </ul>
                      <p className="text-xs mt-2 text-gray-500">Updates automatically when milestones, budget, or expenses change</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="font-medium text-gray-900">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          </div>

          <div className="flex gap-2">
            {onMarkAsCompleted && project.status !== 'completed' && (
              <Button
                variant="default"
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={onMarkAsCompleted}
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Completed
              </Button>
            )}
            {onReactivateProject && project.status === 'completed' && (
              <Button
                variant="default"
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={onReactivateProject}
              >
                <RotateCcw className="w-4 h-4" />
                Reactivate Project
              </Button>
            )}
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button variant="outline" className="gap-2" onClick={onEditProject}>
              <Edit className="w-4 h-4" />
              Edit Project
            </Button>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={onGenerateReport}>
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Budget"
          value={formatCurrency(totalBudget)}
          subtitle="From budget line items"
          icon={DollarSign}
          tooltip="Total planned budget across all budget line items for this project"
        />
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
        <KPICard
          title="Funding Received"
          value={formatCurrency(totalFundingReceived)}
          subtitle="Total funding"
          icon={DollarSign}
          tooltip="Total funding received for this project. Only funding with status 'received' is included"
        />
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

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Budget vs Actual Spend</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Cumulative comparison of planned budget vs actual expenses over time. Helps track spending trends and identify budget deviations early</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-gray-500">Loading budget data...</div>
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
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <p className="mb-2">No budget data available</p>
                <p className="text-sm">Add budget line items to see budget vs actual</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spend by Category Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Spend by Category</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Breakdown of total paid expenses by category (Labor, Materials, Equipment, etc.). Only includes expenses with 'Paid' status</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-gray-500">Loading spend data...</div>
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
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <p className="mb-2">No spend data available</p>
                <p className="text-sm">Add expenses to see spend by category</p>
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
      />

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Budget Alerts
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
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
                      : 'bg-blue-50 border-blue-200';

                  const textColor =
                    alert.severity === 'critical'
                      ? 'text-red-900'
                      : alert.severity === 'high'
                      ? 'text-amber-900'
                      : 'text-blue-900';

                  const badgeVariant =
                    alert.severity === 'critical' ? 'destructive' : 'default';
                  const badgeClass =
                    alert.severity === 'high' ? 'bg-amber-500 hover:bg-amber-600' : '';

                  return (
                    <div key={alert.id} className={`p-3 border rounded-lg ${bgColor}`}>
                      <div className="flex items-start justify-between mb-1">
                        <span className={`font-medium ${textColor}`}>{alert.title}</span>
                        <Badge variant={badgeVariant} className={badgeClass}>
                          {alert.severity === 'critical'
                            ? 'Critical'
                            : alert.severity === 'high'
                            ? 'Warning'
                            : 'Info'}
                        </Badge>
                      </div>
                      <p className={`text-sm ${textColor.replace('900', '700')}`}>
                        {alert.message}
                      </p>
                    </div>
                  );
                })}
                <Button variant="outline" className="w-full gap-2">
                  View All Alerts
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No active alerts</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Recent Activity</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Latest financial transactions and activities on this project, including invoices, purchase orders, and approvals</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Button variant="link" className="gap-1">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 animate-pulse rounded" />
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
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
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
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No recent activity</p>
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
