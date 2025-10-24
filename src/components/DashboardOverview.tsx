import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { DollarSign, Users, Home, AlertTriangle, CheckCircle, Clock, Building, TrendingUp } from 'lucide-react';

interface DashboardOverviewProps {
  dashboardData: any;
  properties: any[];
  user: any;
  onViewChange?: (view: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  dashboardData, 
  properties, 
  user,
  onViewChange 
}) => {
  // Use API data if available, otherwise use calculated values from properties
  const metrics = dashboardData ? {
    totalRevenue: dashboardData.revenue?.currentMonth || 0,
    totalProperties: dashboardData.portfolio?.totalProperties || properties.length,
    totalUnits: dashboardData.portfolio?.totalUnits || properties.reduce((sum: number, p: any) => sum + (p.totalUnits || 0), 0),
    occupancyRate: dashboardData.portfolio?.occupancyRate || 0,
    occupiedUnits: dashboardData.portfolio?.occupiedUnits || 0,
    maintenanceTickets: dashboardData.operations?.pendingMaintenance || 0,
    expiringLeases: dashboardData.operations?.expiringLeases || 0,
    activeManagers: dashboardData.operations?.activeManagers || 0
  } : {
    totalRevenue: properties.reduce((sum: number, p: any) => sum + (p.totalMonthlyIncome || 0), 0),
    totalProperties: properties.length,
    totalUnits: properties.reduce((sum: number, p: any) => sum + (p.totalUnits || 0), 0),
    occupancyRate: properties.length > 0 
      ? properties.reduce((sum: number, p: any) => sum + (p.occupancyRate || 0), 0) / properties.length 
      : 0,
    occupiedUnits: properties.reduce((sum: number, p: any) => sum + (p.occupiedUnits || 0), 0),
    maintenanceTickets: 0,
    expiringLeases: 0,
    activeManagers: 0
  };

  const recentActivity: any[] = [];
  const upcomingPayments: any[] = [];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}!</h2>
        <p className="text-gray-600">Here's an overview of your property portfolio</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
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
            <CardTitle className="text-sm font-medium">Occupied Units</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.occupiedUnits}</div>
            <p className="text-xs text-muted-foreground">
              of {metrics.totalUnits} units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.occupancyRate)}%</div>
            <Progress value={metrics.occupancyRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Properties</CardTitle>
              <CardDescription>Manage and monitor your property portfolio</CardDescription>
            </div>
            {onViewChange && (
              <Button onClick={() => onViewChange('properties')} size="sm">
                View All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {properties.slice(0, 5).map((property) => (
              <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{property.name}</h3>
                  <p className="text-sm text-muted-foreground">{property.address || property.city}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {property.occupiedUnits || 0}/{property.totalUnits || 0} Units
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ₦{(property.totalMonthlyIncome || 0).toLocaleString()}/mo
                    </div>
                  </div>
                  <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                    {property.status}
                  </Badge>
                </div>
              </div>
            ))}
            {properties.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p>No properties yet. Add your first property to get started.</p>
                {onViewChange && (
                  <Button onClick={() => onViewChange('add-property')} className="mt-4">
                    Add Property
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>Important items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.expiringLeases > 0 && (
                <div className="flex items-start space-x-3">
                  <div className="p-1 rounded-full bg-yellow-100">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {metrics.expiringLeases} lease(s) expiring soon
                    </p>
                    <p className="text-xs text-gray-500">Requires attention</p>
                  </div>
                </div>
              )}
              {metrics.maintenanceTickets > 0 && (
                <div className="flex items-start space-x-3">
                  <div className="p-1 rounded-full bg-red-100">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {metrics.maintenanceTickets} pending maintenance request(s)
                    </p>
                    <p className="text-xs text-gray-500">Requires action</p>
                  </div>
                </div>
              )}
              {metrics.expiringLeases === 0 && metrics.maintenanceTickets === 0 && (
                <div className="flex items-start space-x-3">
                  <div className="p-1 rounded-full bg-green-100">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">All clear!</p>
                    <p className="text-xs text-gray-500">No urgent items</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>Rent payments due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payment.tenant}</p>
                    <p className="text-xs text-gray-500">{payment.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₦{payment.amount}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">{payment.dueDate}</p>
                      <Badge 
                        variant={payment.status === 'due-soon' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {payment.status === 'due-soon' ? 'Due Soon' : 'Upcoming'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Add New Tenant</p>
                  <p className="text-sm text-gray-500">Register a new tenant to your property</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Record Payment</p>
                  <p className="text-sm text-gray-500">Manually record a rent payment</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Send Reminder</p>
                  <p className="text-sm text-gray-500">Send payment reminder to tenants</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

