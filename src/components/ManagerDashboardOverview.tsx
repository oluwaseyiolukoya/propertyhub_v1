import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { formatCurrency } from '../lib/currency';
import { getManagerActivities } from '../lib/api/dashboard';
import { toast } from 'sonner';
import {
  Building,
  Users,
  DollarSign,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Home,
  CheckCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  MapPin,
  FileText,
  BarChart3,
  Activity
} from 'lucide-react';

interface ManagerDashboardOverviewProps {
  dashboardData: any;
  properties: any[];
  user: any;
}

export const ManagerDashboardOverview: React.FC<ManagerDashboardOverviewProps> = ({
  dashboardData,
  properties,
  user
}) => {
  // State for paginated activities
  const [activities, setActivities] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Extract metrics from API data
  const metrics = dashboardData ? {
    totalProperties: dashboardData.properties?.total || 0,
    totalUnits: dashboardData.units?.total || 0,
    occupiedUnits: dashboardData.units?.occupied || 0,
    vacantUnits: dashboardData.units?.vacant || 0,
    occupancyRate: dashboardData.units?.occupancyRate || 0,
    activeLeases: dashboardData.leases?.active || 0,
    expiringLeases: dashboardData.leases?.expiringSoon || 0,
    monthlyRevenue: dashboardData.revenue?.currentMonth || 0,
    revenueByCurrency: dashboardData.revenue?.byCurrency || {},
    primaryCurrency: dashboardData.revenue?.primaryCurrency || user?.baseCurrency || 'USD',
    hasMultipleCurrencies: dashboardData.revenue?.hasMultipleCurrencies || false,
    openMaintenance: dashboardData.maintenance?.open || 0,
    urgentMaintenance: dashboardData.maintenance?.urgent || 0,
    totalExpenses: dashboardData.expenses?.total || 0,
    totalExpensesCount: dashboardData.expenses?.totalCount || 0,
    pendingExpenses: dashboardData.expenses?.pending || 0,
    pendingExpensesCount: dashboardData.expenses?.pendingCount || 0,
    paidExpenses: dashboardData.expenses?.paid || 0,
    paidExpensesCount: dashboardData.expenses?.paidCount || 0
  } : {
    totalProperties: properties.length,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    occupancyRate: 0,
    activeLeases: 0,
    expiringLeases: 0,
    monthlyRevenue: 0,
    revenueByCurrency: {},
    primaryCurrency: user?.baseCurrency || 'USD',
    hasMultipleCurrencies: false,
    openMaintenance: 0,
    urgentMaintenance: 0,
    totalExpenses: 0,
    totalExpensesCount: 0,
    pendingExpenses: 0,
    pendingExpensesCount: 0,
    paidExpenses: 0,
    paidExpensesCount: 0
  };

  // Fetch activities when component mounts or page changes
  useEffect(() => {
    fetchActivities(currentPage);
  }, [currentPage]);

  const fetchActivities = async (page: number) => {
    try {
      setLoadingActivities(true);
      const response = await getManagerActivities(page, 5);

      if (response.error) {
        console.error('Failed to load activities:', response.error);
        toast.error('Failed to load recent activities');
      } else if (response.data) {
        setActivities(response.data.activities || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 5,
          total: 0,
          totalPages: 0,
          hasMore: false
        });
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast.error('Failed to load recent activities');
    } finally {
      setLoadingActivities(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Debug: Log revenue data
  React.useEffect(() => {
    if (dashboardData) {
      console.log('💰 Revenue Data:', {
        currentMonth: dashboardData.revenue?.currentMonth,
        byCurrency: dashboardData.revenue?.byCurrency,
        primaryCurrency: dashboardData.revenue?.primaryCurrency,
        hasMultipleCurrencies: dashboardData.revenue?.hasMultipleCurrencies,
        userBaseCurrency: user?.baseCurrency,
        finalPrimaryCurrency: metrics.primaryCurrency,
        finalMonthlyRevenue: metrics.monthlyRevenue
      });
    }
  }, [dashboardData, user?.baseCurrency]);

  const upcomingTasks = dashboardData?.upcomingTasks || {};

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Hero Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] p-6 md:p-8 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg hidden md:flex">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Welcome back, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-white/80 font-medium mt-1 flex items-center gap-2">
                <Building className="h-4 w-4" />
                {metrics.totalProperties} {metrics.totalProperties === 1 ? 'Property' : 'Properties'} Managed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
              <p className="text-white/70 text-xs font-medium">Occupancy Rate</p>
              <p className="text-white font-bold text-xl flex items-center gap-1">
                {Math.round(metrics.occupancyRate)}%
                <TrendingUp className="h-4 w-4 text-green-300" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics - Animated Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">Properties</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 p-2 md:p-2.5 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
              <Building className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">{metrics.totalProperties}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {metrics.totalUnits} total units
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">Occupancy</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2 md:p-2.5 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
              <Home className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">{Math.round(metrics.occupancyRate)}%</div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${metrics.occupancyRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">Revenue</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2 md:p-2.5 shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {metrics.hasMultipleCurrencies ? (
              <div>
                <div className="text-lg md:text-xl font-bold text-gray-900">Multi-Currency</div>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {Object.entries(metrics.revenueByCurrency).map(([currency, amount]) => (
                    <div key={currency} className="font-medium">{formatCurrency(Number(amount), currency)}</div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="text-xl md:text-3xl font-bold text-gray-900">{formatCurrency(metrics.monthlyRevenue, metrics.primaryCurrency)}</div>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  This month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 group-hover:from-orange-500/10 group-hover:to-amber-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">Maintenance</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-2 md:p-2.5 shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300">
              <Wrench className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">{metrics.openMaintenance}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {metrics.urgentMaintenance > 0 ? (
                <span className="text-red-600 font-semibold">{metrics.urgentMaintenance} urgent</span>
              ) : (
                'Open requests'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Properties Overview */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-2.5 shadow-lg shadow-purple-500/25">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-900 font-bold text-lg">Managed Properties</CardTitle>
              <CardDescription className="text-gray-600 font-medium">Properties under your management</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {dashboardData?.properties?.properties?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {dashboardData.properties.properties.map((property: any) => {
                const occupancyRate = property.totalUnits > 0
                  ? Math.round((property.activeLeases / property.totalUnits) * 100)
                  : 0;
                return (
                  <div key={property.id} className="flex items-center justify-between p-5 hover:bg-purple-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                        <Building className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{property.name}</h3>
                        <p className="text-sm text-gray-500 font-medium">
                          {property.totalUnits} units • {property.activeLeases} active leases
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${occupancyRate >= 80 ? 'text-green-600' : occupancyRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {occupancyRate}%
                      </div>
                      <p className="text-xs text-gray-500 font-medium">occupied</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 p-6 mb-4">
                <Building className="h-12 w-12 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Properties Assigned</h3>
              <p className="text-gray-500 text-center max-w-sm">Properties assigned to you will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Urgent Items */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-b border-red-100">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-red-500 to-orange-500 p-2.5 shadow-lg shadow-red-500/25">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900 font-bold text-lg">Requires Attention</CardTitle>
                <CardDescription className="text-gray-600 font-medium">Items needing immediate action</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {metrics.urgentMaintenance > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
                  <div className="rounded-lg bg-red-100 p-2.5">
                    <Wrench className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-red-900">Urgent Maintenance</p>
                    <p className="text-sm text-red-700 font-medium">
                      {metrics.urgentMaintenance} urgent {metrics.urgentMaintenance === 1 ? 'request' : 'requests'}
                    </p>
                  </div>
                  <Badge className="bg-red-500 text-white border-0 font-semibold">{metrics.urgentMaintenance}</Badge>
                </div>
              )}

              {metrics.expiringLeases > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200">
                  <div className="rounded-lg bg-yellow-100 p-2.5">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-yellow-900">Expiring Leases</p>
                    <p className="text-sm text-yellow-700 font-medium">
                      {metrics.expiringLeases} {metrics.expiringLeases === 1 ? 'lease' : 'leases'} expiring soon
                    </p>
                  </div>
                  <Badge className="bg-yellow-500 text-white border-0 font-semibold">{metrics.expiringLeases}</Badge>
                </div>
              )}

              {metrics.vacantUnits > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <div className="rounded-lg bg-blue-100 p-2.5">
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-900">Vacant Units</p>
                    <p className="text-sm text-blue-700 font-medium">
                      {metrics.vacantUnits} {metrics.vacantUnits === 1 ? 'unit' : 'units'} currently vacant
                    </p>
                  </div>
                  <Badge className="bg-blue-500 text-white border-0 font-semibold">{metrics.vacantUnits}</Badge>
                </div>
              )}

              {metrics.urgentMaintenance === 0 && metrics.expiringLeases === 0 && metrics.vacantUnits === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-gradient-to-br from-green-100 to-emerald-100 p-4 mb-3">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">All Caught Up!</h3>
                  <p className="text-gray-500 text-sm">No urgent items need your attention.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 p-2.5 shadow-lg shadow-blue-500/25">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900 font-bold text-lg">Quick Stats</CardTitle>
                <CardDescription className="text-gray-600 font-medium">Performance summary</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {/* Units Section */}
              <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Units Overview</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{metrics.totalUnits}</div>
                    <p className="text-xs text-gray-500 font-medium">Total</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{metrics.occupiedUnits}</div>
                    <p className="text-xs text-gray-500 font-medium">Occupied</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{metrics.vacantUnits}</div>
                    <p className="text-xs text-gray-500 font-medium">Vacant</p>
                  </div>
                </div>
              </div>

              {/* Leases & Maintenance */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <p className="text-xs text-purple-600 font-semibold">Active Leases</p>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.activeLeases}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="h-4 w-4 text-orange-600" />
                    <p className="text-xs text-orange-600 font-semibold">Open Tickets</p>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.openMaintenance}</div>
                </div>
              </div>

              {/* Revenue */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-600 font-semibold">Monthly Revenue</p>
                </div>
                {metrics.hasMultipleCurrencies ? (
                  <div className="text-lg font-bold text-gray-900">Multi-Currency</div>
                ) : (
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.monthlyRevenue, metrics.primaryCurrency)}</div>
                )}
              </div>

              {/* Expenses */}
              {metrics.totalExpensesCount > 0 && (
                <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <p className="text-xs text-red-600 font-semibold">Expenses</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(metrics.totalExpenses, metrics.primaryCurrency)}</div>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-600">{formatCurrency(metrics.pendingExpenses, metrics.primaryCurrency)}</div>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{formatCurrency(metrics.paidExpenses, metrics.primaryCurrency)}</div>
                      <p className="text-xs text-gray-500">Paid</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity with Pagination */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2.5 shadow-lg shadow-green-500/25">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-900 font-bold text-lg">Recent Activity</CardTitle>
              <CardDescription className="text-gray-600 font-medium">Latest updates and actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingActivities ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-500 font-medium">Loading activities...</p>
              </div>
            </div>
          ) : activities.length > 0 ? (
            <>
              <div className="divide-y divide-gray-100">
                {activities.map((activity: any) => (
                  <div key={activity.id} className="flex items-center gap-4 p-5 hover:bg-green-50/50 transition-colors">
                    <div className="rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 p-2.5">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {activity.description || `${activity.action} ${activity.entity}`}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold capitalize">
                      {activity.entity}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="text-sm text-gray-600 font-medium">
                    Page {pagination.page} of {pagination.totalPages}
                    <span className="text-gray-400 ml-1">
                      ({pagination.total} total)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || loadingActivities}
                      className="font-semibold"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!pagination.hasMore || loadingActivities}
                      className="font-semibold"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-gradient-to-br from-gray-100 to-slate-100 p-6 mb-4">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Recent Activities</h3>
              <p className="text-gray-500 text-center max-w-sm">Activities will appear here as actions are performed on your managed properties.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

