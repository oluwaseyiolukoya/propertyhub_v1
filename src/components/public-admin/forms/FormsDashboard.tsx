import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { publicAdminApi } from "../../../lib/api/publicAdminApi";
import { generateRoute } from "../routes";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import {
  Calendar,
  Mail,
  MessageSquare,
  ShoppingCart,
  HeadphonesIcon,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface FormsDashboardProps {
  onNavigateToForm?: (formType: string) => void;
}

interface FormStats {
  overall: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    closed: number;
  };
  byFormType: Array<{
    formType: string;
    total: number;
    byStatus: {
      new: number;
      contacted: number;
      qualified: number;
      closed: number;
    };
    byPriority: Record<string, number>;
    recent: Array<{
      id: string;
      name: string;
      email: string;
      formType: string;
      status: string;
      createdAt: string;
    }>;
  }>;
  trends: Array<{
    date: string;
    count: number;
  }>;
}

const formTypeConfig: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  contact: {
    label: "Contact Us",
    icon: Mail,
    color: "bg-blue-500",
  },
  demo: {
    label: "Schedule Demo",
    icon: Calendar,
    color: "bg-purple-500",
  },
  sales: {
    label: "Sales Inquiry",
    icon: ShoppingCart,
    color: "bg-green-500",
  },
  support: {
    label: "Support",
    icon: HeadphonesIcon,
    color: "bg-orange-500",
  },
};

export function FormsDashboard({ onNavigateToForm }: FormsDashboardProps = {}) {
  const navigate = useNavigate();

  // Use React Router navigation if available, fallback to callback for backward compatibility
  const handleNavigateToForm = (formType: string) => {
    const route = generateRoute("forms", formType);
    navigate(route);
    // Also call callback if provided for backward compatibility
    onNavigateToForm?.(formType);
  };
  const [stats, setStats] = useState<FormStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>(
    {}
  );

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await publicAdminApi.forms.getStats({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      });

      if (response.success) {
        setStats(response.data);
      } else {
        toast.error("Failed to load form statistics");
      }
    } catch (error: any) {
      console.error("Error loading stats:", error);
      toast.error(error.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { className: string; icon: React.ComponentType<{ className?: string }> }
    > = {
      new: { className: "bg-blue-500", icon: Clock },
      contacted: { className: "bg-yellow-500", icon: AlertCircle },
      qualified: { className: "bg-green-500", icon: CheckCircle },
      closed: { className: "bg-gray-500", icon: XCircle },
    };
    const config = variants[status] || variants.new;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">No statistics available</p>
        <Button onClick={loadStats} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forms Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Overview of all form submissions and analytics
          </p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.overall.total}
            </div>
            <p className="text-xs text-gray-500 mt-1">All forms</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">
              New
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {stats.overall.new}
            </div>
            <p className="text-xs text-blue-600 mt-1">Require attention</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Contacted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">
              {stats.overall.contacted}
            </div>
            <p className="text-xs text-yellow-600 mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">
              Qualified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {stats.overall.qualified}
            </div>
            <p className="text-xs text-green-600 mt-1">Potential leads</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.overall.closed}
            </div>
            <p className="text-xs text-gray-600 mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Form Type Cards */}
      {stats.byFormType.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Submissions by Form Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.byFormType.map((formType) => {
              const config = formTypeConfig[formType.formType] || {
                label: formType.formType,
                icon: MessageSquare,
                color: "bg-gray-500",
              };
              const Icon = config.icon;
              const handleClick = () => {
                if (formType.formType === "demo") {
                  handleNavigateToForm("schedule-demo");
                } else if (formType.formType === "contact") {
                  handleNavigateToForm("contact-us");
                }
              };
              const isClickable =
                formType.formType === "demo" || formType.formType === "contact";
              return (
                <Card
                  key={formType.formType}
                  className={`hover:shadow-lg transition-shadow ${
                    isClickable ? "cursor-pointer" : ""
                  }`}
                  onClick={isClickable ? handleClick : undefined}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${config.color} text-white`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {config.label}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {formType.total} total
                          </CardDescription>
                        </div>
                      </div>
                      {isClickable && (
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">New</span>
                        <span className="font-semibold text-blue-600">
                          {formType.byStatus.new}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Contacted</span>
                        <span className="font-semibold text-yellow-600">
                          {formType.byStatus.contacted}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Qualified</span>
                        <span className="font-semibold text-green-600">
                          {formType.byStatus.qualified}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Closed</span>
                        <span className="font-semibold text-gray-600">
                          {formType.byStatus.closed}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Row */}
      {stats.trends.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submission Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Trends</CardTitle>
              <CardDescription>
                Daily submissions over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDate(value)}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => formatDate(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    name="Submissions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Breakdown by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: "New", value: stats.overall.new },
                    { name: "Contacted", value: stats.overall.contacted },
                    { name: "Qualified", value: stats.overall.qualified },
                    { name: "Closed", value: stats.overall.closed },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Submissions */}
      {stats.byFormType.some((ft) => ft.recent.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>
              Latest submissions across all form types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byFormType.flatMap((formType) =>
                formType.recent.map((submission) => {
                  const config = formTypeConfig[formType.formType] || {
                    label: formType.formType,
                    icon: MessageSquare,
                    color: "bg-gray-500",
                  };
                  const Icon = config.icon;
                  return (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${config.color} text-white`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {submission.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.email} • {config.label}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(submission.status)}
                        <span className="text-xs text-gray-500">
                          {formatDate(submission.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {stats.byFormType.every((ft) => ft.recent.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No recent submissions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
