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
  CheckCircle2,
  FileText,
  Settings,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  TrendingUp
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
        <Card className="max-w-md border-0 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] h-2"></div>
          <CardHeader className="text-center pt-8 pb-6">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-xl shadow-purple-500/25">
              <Home className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">No Active Lease</CardTitle>
            <CardDescription className="text-gray-600 font-medium mt-3 text-base">
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
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'scheduled': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

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
                Welcome back, {tenantData.name.split(' ')[0]}!
              </h1>
              <p className="text-white/80 font-medium mt-1 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {tenantData.unit}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
              <p className="text-white/70 text-xs font-medium">Lease Status</p>
              <p className="text-white font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-300" />
                Active
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rent Payment Alert */}
      {tenantData.daysUntilDue <= 15 && (
        <Card className="border-0 shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div className={`p-4 md:p-5 ${tenantData.daysUntilDue <= 3 ? 'bg-gradient-to-r from-red-500 to-pink-500' : tenantData.daysUntilDue <= 7 ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-[#7C3AED] to-[#5B21B6]'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white/90 text-sm font-medium">Rent Payment Due</p>
                  <p className="text-white text-lg font-bold">
                    ₦{tenantData.monthlyRent.toLocaleString()} • {tenantData.daysUntilDue} days remaining
                  </p>
                  <p className="text-white/80 text-xs font-medium mt-0.5">Due on {tenantData.nextPaymentDue}</p>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full sm:w-auto shrink-0 bg-white hover:bg-gray-50 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => onNavigate('payments')}
              >
                Pay Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">{tenantData.isAnnualRent ? 'Annual Rent' : 'Monthly Rent'}</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 p-2 md:p-2.5 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">₦{tenantData.monthlyRent.toLocaleString()}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Next due: {tenantData.nextPaymentDue}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">Balance</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2 md:p-2.5 shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">₦{tenantData.balance.toLocaleString()}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {tenantData.balance === 0 ? '✨ All paid up!' : 'Outstanding'}
            </p>
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
            <div className="text-xl md:text-3xl font-bold text-gray-900">{maintenanceRequests.filter(r => r.status !== 'completed').length}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Active requests
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">Lease</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2 md:p-2.5 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
              <Home className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-green-600">Active</div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {tenantData.isIndefiniteLease ? 'Indefinite' : `Until ${tenantData.leaseEnd}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Unit Information */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 backdrop-blur-sm p-2.5 shadow-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white font-bold text-lg">Your Unit</CardTitle>
                <CardDescription className="text-white/80 font-medium">Rental unit information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start space-x-3 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
              <div className="rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 p-2 shadow-md">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">{tenantData.unit}</p>
                <p className="text-sm text-gray-600 font-medium">{tenantData.address}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-semibold mb-1">Lease Start</p>
                <p className="text-sm font-bold text-gray-900">{tenantData.leaseStart}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-semibold mb-1">Lease End</p>
                <p className="text-sm font-bold text-gray-900">{tenantData.leaseEnd}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs text-purple-600 font-semibold mb-1">{tenantData.isAnnualRent ? 'Annual Rent' : 'Monthly Rent'}</p>
                <p className="text-sm font-bold text-gray-900">₦{tenantData.monthlyRent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-semibold mb-1">Move-in Date</p>
                <p className="text-sm font-bold text-gray-900">{tenantData.moveInDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2.5 shadow-lg shadow-green-500/25">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Recent Payments</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Your payment history</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('payments')}
                className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 font-semibold shadow-sm"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="rounded-full bg-gradient-to-br from-gray-100 to-slate-100 p-4 mb-3">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No payments yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-4 px-5 hover:bg-green-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-100 p-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">₦{payment.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 font-medium">{payment.date} • {payment.method}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(payment.status) + ' font-semibold border'}>
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Maintenance Requests */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 shadow-lg shadow-orange-500/25">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Maintenance</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Track service requests</CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onNavigate('maintenance')}
                className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25 font-semibold transition-all duration-200"
              >
                New Request
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {maintenanceRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="rounded-full bg-gradient-to-br from-green-100 to-emerald-100 p-4 mb-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-gray-900 font-bold mb-1">All Good!</p>
                <p className="text-gray-500 font-medium text-sm text-center">No active maintenance requests</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {maintenanceRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between py-4 px-5 hover:bg-orange-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-orange-100 p-2">
                        <Wrench className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{request.title}</p>
                        <p className="text-xs text-gray-500 font-medium">{request.category} • {request.date}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(request.status) + ' font-semibold border'}>
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 p-2.5 shadow-lg shadow-blue-500/25">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900 font-bold text-lg">Announcements</CardTitle>
                <CardDescription className="text-gray-600 font-medium">Updates from management</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="rounded-full bg-gradient-to-br from-gray-100 to-slate-100 p-4 mb-3">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No announcements</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="py-4 px-5 hover:bg-blue-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 mt-0.5">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-bold text-gray-900">{announcement.title}</p>
                          <span className="text-xs text-gray-500 font-medium shrink-0 ml-2">{announcement.date}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{announcement.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 backdrop-blur-sm p-2.5 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white font-bold text-lg">Quick Actions</CardTitle>
              <CardDescription className="text-white/80 font-medium">Common tasks and features</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <button
              className="group relative h-24 md:h-28 flex flex-col items-center justify-center space-y-2 text-xs sm:text-sm bg-white border-2 border-purple-200 hover:border-purple-400 rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              onClick={() => onNavigate('payments')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-300"></div>
              <div className="relative rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 p-2.5 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="relative text-gray-700 group-hover:text-purple-700 transition-colors">Pay Rent</span>
            </button>
            <button
              className="group relative h-24 md:h-28 flex flex-col items-center justify-center space-y-2 text-xs sm:text-sm bg-white border-2 border-orange-200 hover:border-orange-400 rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              onClick={() => onNavigate('maintenance')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/10 group-hover:to-amber-500/10 transition-all duration-300"></div>
              <div className="relative rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300">
                <Wrench className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="relative text-gray-700 group-hover:text-orange-700 transition-colors text-center">Submit Request</span>
            </button>
            <button
              className="group relative h-24 md:h-28 flex flex-col items-center justify-center space-y-2 text-xs sm:text-sm bg-white border-2 border-blue-200 hover:border-blue-400 rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              onClick={() => onNavigate('documents')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-300"></div>
              <div className="relative rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="relative text-gray-700 group-hover:text-blue-700 transition-colors text-center">View Lease</span>
            </button>
            <button
              className="group relative h-24 md:h-28 flex flex-col items-center justify-center space-y-2 text-xs sm:text-sm bg-white border-2 border-gray-200 hover:border-gray-400 rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              onClick={() => onNavigate('settings')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/0 to-slate-500/0 group-hover:from-gray-500/10 group-hover:to-slate-500/10 transition-all duration-300"></div>
              <div className="relative rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 p-2.5 shadow-lg shadow-gray-500/25 group-hover:scale-110 transition-transform duration-300">
                <Settings className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="relative text-gray-700 group-hover:text-gray-800 transition-colors">Settings</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantOverview;

