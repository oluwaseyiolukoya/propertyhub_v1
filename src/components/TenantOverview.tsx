import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  CreditCard,
  Home,
  Wrench,
  Bell,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface TenantOverviewProps {
  onNavigate: (section: string) => void;
  dashboardData: any;
}

const TenantOverview: React.FC<TenantOverviewProps> = ({ onNavigate, dashboardData }) => {
  // Handle null or loading state
  if (!dashboardData || !dashboardData.hasActiveLease) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Active Lease</CardTitle>
            <CardDescription>
              You don't have an active lease at the moment. Please contact your property manager for assistance.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { lease, property, unit, rent, maintenance, payments, notifications } = dashboardData;

  // Determine rent frequency - check lease, unit, or unit features
  const rentFrequency = lease?.rentFrequency || unit?.rentFrequency ||
    (unit?.features?.nigeria?.rentFrequency) ||
    (unit?.features?.rentFrequency) || 'monthly';
  const isAnnualRent = rentFrequency === 'annual';

  // Check if lease is indefinite (no end date or specialClauses.isIndefinite)
  const isIndefiniteLease = !lease.endDate || lease.specialClauses?.isIndefinite === true;

  // Format tenant data from API response
  const tenantData = {
    name: dashboardData.user?.name || "Tenant",
    unit: `${property.name} - Unit ${unit.unitNumber}`,
    address: `${property.address}, ${property.city}, ${property.state}`,
    leaseStart: new Date(lease.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    leaseEnd: isIndefiniteLease ? 'Indefinite' : new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    monthlyRent: lease.monthlyRent,
    rentFrequency: rentFrequency,
    isAnnualRent: isAnnualRent,
    isIndefiniteLease: isIndefiniteLease,
    nextPaymentDue: new Date(rent.nextPaymentDue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    daysUntilDue: rent.daysUntilDue,
    balance: 0,
    moveInDate: new Date(lease.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  };

  const recentPayments = payments.recent.map((payment: any) => ({
    id: payment.id,
    date: new Date(payment.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    amount: payment.amount,
    status: 'paid',
    method: payment.paymentMethod
  }));

  const maintenanceRequests = maintenance.recent.map((req: any) => ({
    id: req.id,
    title: req.title,
    status: req.status,
    date: new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    category: req.category
  }));

  const announcements = notifications.announcements.map((notif: any) => ({
    id: notif.id,
    title: notif.title,
    date: new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    message: notif.message
  }));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {tenantData.name.split(' ')[0]}!</h1>
        <p className="text-sm md:text-base text-muted-foreground">Here's what's happening with your rental</p>
      </div>

      {/* Rent Payment Alert */}
      {tenantData.daysUntilDue <= 15 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
          <AlertDescription className="text-blue-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm sm:text-base">Your {tenantData.isAnnualRent ? 'annual' : ''} rent payment of ₦{tenantData.monthlyRent.toLocaleString()} is due on {tenantData.nextPaymentDue} ({tenantData.daysUntilDue} days remaining)</span>
              <Button
                size="sm"
                className="w-full sm:w-auto shrink-0"
                onClick={() => onNavigate('payments')}
              >
                Pay Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tenantData.isAnnualRent ? 'Annual Rent' : 'Monthly Rent'}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{tenantData.monthlyRent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Next due: {tenantData.nextPaymentDue}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{tenantData.balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {tenantData.balance === 0 ? 'All paid up!' : 'Outstanding balance'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceRequests.filter(r => r.status !== 'completed').length}</div>
            <p className="text-xs text-muted-foreground">
              Active requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lease Status</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              {tenantData.isIndefiniteLease ? 'Indefinite Lease' : `Until ${tenantData.leaseEnd}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit Information */}
        <Card>
          <CardHeader>
            <CardTitle>Your Unit</CardTitle>
            <CardDescription>Rental unit information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{tenantData.unit}</p>
                <p className="text-sm text-muted-foreground">{tenantData.address}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Lease Start</p>
                <p className="text-sm font-medium">{tenantData.leaseStart}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lease End</p>
                <p className="text-sm font-medium">{tenantData.leaseEnd}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tenantData.isAnnualRent ? 'Annual Rent' : 'Monthly Rent'}</p>
                <p className="text-sm font-medium">₦{tenantData.monthlyRent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Move-in Date</p>
                <p className="text-sm font-medium">{tenantData.moveInDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Your payment history</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigate('payments')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">₦{payment.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{payment.date} • {payment.method}</p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Maintenance Requests</CardTitle>
                <CardDescription>Track your service requests</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigate('maintenance')}>
                New Request
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maintenanceRequests.map((request) => (
                <div key={request.id} className="flex items-start justify-between py-2 border-b last:border-0">
                  <div className="flex items-start space-x-3">
                    <Wrench className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">{request.title}</p>
                      <p className="text-xs text-muted-foreground">{request.category} • {request.date}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Updates from property management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="space-y-1 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{announcement.title}</p>
                        <p className="text-xs text-muted-foreground mb-1">{announcement.date}</p>
                        <p className="text-sm text-muted-foreground">{announcement.message}</p>
                      </div>
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
          <CardDescription>Common tasks and features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Button variant="outline" className="h-20 md:h-24 flex flex-col items-center justify-center space-y-2 text-xs sm:text-sm" onClick={() => onNavigate('payments')}>
              <CreditCard className="h-5 w-5 md:h-6 md:w-6" />
              <span>Pay Rent</span>
            </Button>
            <Button variant="outline" className="h-20 md:h-24 flex flex-col items-center justify-center space-y-2 text-xs sm:text-sm" onClick={() => onNavigate('maintenance')}>
              <Wrench className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-center">Submit Request</span>
            </Button>
            <Button variant="outline" className="h-20 md:h-24 flex flex-col items-center justify-center space-y-2 text-xs sm:text-sm" onClick={() => onNavigate('documents')}>
              <Home className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-center">View Lease</span>
            </Button>
            <Button variant="outline" className="h-20 md:h-24 flex flex-col items-center justify-center space-y-2 text-xs sm:text-sm" onClick={() => onNavigate('settings')}>
              <Bell className="h-5 w-5 md:h-6 md:w-6" />
              <span>Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantOverview;

