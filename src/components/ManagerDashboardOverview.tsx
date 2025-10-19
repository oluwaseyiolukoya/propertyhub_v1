import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { 
  Building, 
  Users, 
  DollarSign, 
  Wrench, 
  AlertTriangle, 
  TrendingUp, 
  Home,
  CheckCircle,
  Clock
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
    openMaintenance: dashboardData.maintenance?.open || 0,
    urgentMaintenance: dashboardData.maintenance?.urgent || 0,
  } : {
    totalProperties: properties.length,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    occupancyRate: 0,
    activeLeases: 0,
    expiringLeases: 0,
    monthlyRevenue: 0,
    openMaintenance: 0,
    urgentMaintenance: 0,
  };

  const recentActivities = dashboardData?.recentActivities || [];
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
            <div className="text-2xl font-bold">₦{metrics.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
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
                <span className="text-sm font-semibold">₦{metrics.monthlyRevenue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">{activity.entity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

