import React from 'react';
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
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import KPICard from './KPICard';
import { useProjectDashboard } from '../hooks/useDeveloperDashboardData';
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
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ProjectDashboardProps {
  projectId: string;
  onBack: () => void;
  onGenerateReport?: () => void;
}

// Mock data for charts (will be replaced with real data from API)
const budgetVsActualData = [
  { month: 'Jan', budget: 450000000, actual: 420000000 },
  { month: 'Feb', budget: 480000000, actual: 495000000 },
  { month: 'Mar', budget: 520000000, actual: 510000000 },
  { month: 'Apr', budget: 550000000, actual: 570000000 },
  { month: 'May', budget: 580000000, actual: 600000000 },
  { month: 'Jun', budget: 620000000, actual: 640000000 },
];

const spendByCategoryData = [
  { category: 'Structure', amount: 850000000 },
  { category: 'MEP', amount: 620000000 },
  { category: 'Finishing', amount: 480000000 },
  { category: 'Sitework', amount: 320000000 },
  { category: 'Equipment', amount: 280000000 },
];

const cashFlowData = [
  { month: 'Jan', inflow: 500000000, outflow: 420000000 },
  { month: 'Feb', inflow: 450000000, outflow: 495000000 },
  { month: 'Mar', inflow: 600000000, outflow: 510000000 },
  { month: 'Apr', inflow: 550000000, outflow: 570000000 },
  { month: 'May', inflow: 700000000, outflow: 600000000 },
  { month: 'Jun', inflow: 650000000, outflow: 640000000 },
];

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
}) => {
  const { data, loading, error } = useProjectDashboard(projectId);

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

  const { project, alerts } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: project.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const variance = project.actualSpend - project.totalBudget;
  const variancePercent =
    project.totalBudget > 0 ? ((variance / project.totalBudget) * 100).toFixed(1) : '0.0';

  // Calculate forecasted completion (example: 3.4% over budget)
  const forecastedCompletion = project.totalBudget * 1.034;

  return (
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
            <Button variant="outline" className="gap-2">
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
          value={formatCurrency(project.totalBudget)}
          icon={DollarSign}
        />
        <KPICard
          title="Actual Spend"
          value={formatCurrency(project.actualSpend)}
          subtitle="vs last month"
          icon={TrendingUp}
          trend={{
            value: 8.5,
            direction: 'up',
            label: 'vs last month',
          }}
        />
        <KPICard
          title="Variance"
          value={`${variance >= 0 ? '+' : ''}${formatCurrency(Math.abs(variance))}`}
          icon={AlertTriangle}
          trend={{
            value: parseFloat(variancePercent),
            direction: variance > 0 ? 'down' : 'up',
          }}
        />
        <KPICard
          title="Forecasted Completion"
          value={formatCurrency(forecastedCompletion)}
          subtitle="over budget"
          icon={Target}
          trend={{
            value: 3.4,
            direction: 'down',
            label: 'over budget',
          }}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={budgetVsActualData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
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
          </CardContent>
        </Card>

        {/* Spend by Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spendByCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
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
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Cash Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="inflow"
                stroke="#14b8a6"
                fill="url(#colorInflow)"
                strokeWidth={2}
                name="Inflow"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stroke="#ef4444"
                fill="url(#colorOutflow)"
                strokeWidth={2}
                name="Outflow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Budget Alerts
            </CardTitle>
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
              <CardTitle>Recent Activity</CardTitle>
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
  );
};

export default ProjectDashboard;
