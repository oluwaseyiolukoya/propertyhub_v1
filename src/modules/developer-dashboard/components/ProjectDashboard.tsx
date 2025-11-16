import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Edit,
  Share2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Target,
  ArrowRight,
  Plus,
  Info,
} from 'lucide-react';
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
}

// budgetVsActualData is now fetched from API (removed mock data)
// spendByCategoryData is now fetched from API (removed mock data)

// Cash flow data is now fetched from API (removed mock data)

const recentActivity = [
  {
    id: 1,
    type: 'invoice',
    description: 'Invoice INV-1238 approved',
    amount: '₦41,200,000',
    user: 'John Davis',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'po',
    description: 'Purchase Order PO-2025-006 created',
    amount: '₦125,000,000',
    user: 'Sarah Anderson',
    time: '5 hours ago',
  },
  {
    id: 3,
    type: 'approval',
    description: 'Budget revision approved',
    amount: '₦50,000,000',
    user: 'Michael Chen',
    time: '1 day ago',
  },
  {
    id: 4,
    type: 'invoice',
    description: 'Invoice INV-1237 matched to PO',
    amount: '₦28,400,000',
    user: 'System',
    time: '1 day ago',
  },
];

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projectId,
  onBack,
  onGenerateReport,
  onEditProject,
}) => {
  const { data, loading, error, refetch } = useProjectDashboard(projectId);

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

  // Format spend by category data with proper category names
  const formattedSpendByCategory = data.spendByCategory?.map(item => ({
    ...item,
    category: formatCategoryName(item.category),
  })) || [];

  // Use calculated values from backend
  const totalBudget = project.totalBudget || 0;
  const actualSpend = project.actualSpend || 0;
  const variance = project.variance || 0;
  const variancePercent = project.variancePercent || 0;
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
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-medium text-gray-900">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          </div>

          <div className="flex gap-2">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Budget"
          value={formatCurrency(totalBudget)}
          subtitle="From budget line items"
          icon={DollarSign}
          tooltip="Total planned budget across all budget line items for this project"
        />
        <KPICard
          title="Actual Spend"
          value={formatCurrency(actualSpend)}
          subtitle="From paid expenses"
          icon={TrendingUp}
          trend={{
            value: Math.abs(variancePercent),
            direction: variance < 0 ? 'up' : 'down',
            label: variance < 0 ? 'under budget' : 'over budget',
          }}
          tooltip="Total amount spent from paid expenses. Only expenses marked as 'Paid' are included in this calculation"
        />
        <KPICard
          title="Variance"
          value={`${variance >= 0 ? '+' : ''}${formatCurrency(Math.abs(variance))}`}
          subtitle={`${variancePercent >= 0 ? '+' : ''}${variancePercent.toFixed(1)}%`}
          icon={AlertTriangle}
          trend={{
            value: Math.abs(variancePercent),
            direction: variance > 0 ? 'down' : 'up',
            label: variance > 0 ? 'over budget' : 'under budget',
          }}
          tooltip="Difference between actual spend and total budget. Negative values indicate under budget, positive values indicate over budget"
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
          tooltip="Projected total cost at project completion based on current progress and spend rate. Calculated as (Actual Spend ÷ Progress) × 100"
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
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">{activity.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 mb-1">{activity.amount}</p>
                    <Badge variant="outline" className="capitalize">
                      {activity.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </TooltipProvider>
  );
};

export default ProjectDashboard;
