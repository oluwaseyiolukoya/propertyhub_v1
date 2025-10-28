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
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2
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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name.split(' ')[0]}!
        </h2>
        <p className="text-gray-600 mt-1">
          Here's an overview of your managed properties
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalUnits} total units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.occupancyRate)}%</div>
            <Progress value={metrics.occupancyRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metrics.hasMultipleCurrencies ? (
              <div>
                <div className="text-2xl font-bold">Multi-Currency</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Object.entries(metrics.revenueByCurrency).map(([currency, amount]) => (
                    <div key={currency}>{formatCurrency(Number(amount), currency)}</div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue, metrics.primaryCurrency)}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.urgentMaintenance} urgent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Properties Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Managed Properties</CardTitle>
          <CardDescription>Properties under your management</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData?.properties?.properties?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.properties.properties.map((property: any) => (
                <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{property.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {property.totalUnits} units • {property.activeLeases} active leases
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {Math.round((property.activeLeases / property.totalUnits) * 100)}% occupied
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>No properties assigned yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Items */}
        <Card>
          <CardHeader>
            <CardTitle>Requires Attention</CardTitle>
            <CardDescription>Items needing immediate action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.urgentMaintenance > 0 && (
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-red-200 bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Urgent Maintenance</p>
                    <p className="text-xs text-red-700 mt-1">
                      {metrics.urgentMaintenance} urgent maintenance requests
                    </p>
                  </div>
                </div>
              )}
              
              {metrics.expiringLeases > 0 && (
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                  <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Expiring Leases</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {metrics.expiringLeases} leases expiring soon
                    </p>
                  </div>
                </div>
              )}

              {metrics.vacantUnits > 0 && (
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
                  <Home className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Vacant Units</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {metrics.vacantUnits} units currently vacant
                    </p>
                  </div>
                </div>
              )}

              {metrics.urgentMaintenance === 0 && metrics.expiringLeases === 0 && metrics.vacantUnits === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-3" />
                  <p>All caught up! No urgent items.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Performance summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Units</span>
                <span className="text-sm font-semibold">{metrics.totalUnits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Occupied</span>
                <span className="text-sm font-semibold text-green-600">{metrics.occupiedUnits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Vacant</span>
                <span className="text-sm font-semibold text-orange-600">{metrics.vacantUnits}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-gray-600">Active Leases</span>
                <span className="text-sm font-semibold">{metrics.activeLeases}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Open Maintenance</span>
                <span className="text-sm font-semibold">{metrics.openMaintenance}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Revenue</span>
                {metrics.hasMultipleCurrencies ? (
                  <span className="text-sm font-semibold">Multi-Currency</span>
                ) : (
                  <span className="text-sm font-semibold">{formatCurrency(metrics.monthlyRevenue, metrics.primaryCurrency)}</span>
                )}
              </div>
              {metrics.totalExpensesCount > 0 && (
                <>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Total Expenses</span>
                    <span className="text-sm font-semibold">{formatCurrency(metrics.totalExpenses, metrics.primaryCurrency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-sm font-semibold text-yellow-600">{formatCurrency(metrics.pendingExpenses, metrics.primaryCurrency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Paid</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(metrics.paidExpenses, metrics.primaryCurrency)}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity with Pagination */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and actions</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingActivities ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="ml-3 text-sm text-gray-500">Loading activities...</p>
            </div>
          ) : activities.length > 0 ? (
            <>
              <div className="space-y-3">
                {activities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {activity.description || `${activity.action} ${activity.entity}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {activity.entity}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
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
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!pagination.hasMore || loadingActivities}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No recent activities</p>
              <p className="text-xs text-gray-400 mt-1">Activities will appear here as actions are performed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

