import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Building, Users, DollarSign, TrendingUp, Plus, Eye, Settings, LogOut, Menu, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { PropertiesPage } from './PropertiesPage';
import { TenantPayments } from './TenantPayments';
import { FinancialReports } from './FinancialReports';
import { PropertyManagerManagement } from './PropertyManagerManagement';
import { AccessControl } from './AccessControl';
import { PropertyOwnerSettings } from './PropertyOwnerSettings';
import { AddPropertyPage } from './AddPropertyPage';
import { Footer } from './Footer';
import PropertyOwnerDocuments from './PropertyOwnerDocuments';
import { DashboardOverview } from './DashboardOverview';
import { getOwnerDashboardOverview, getProperties } from '../lib/api';
import { getAccountInfo } from '../lib/api/auth';

interface PropertyOwnerDashboardProps {
  user: any;
  onLogout: () => void;
  managers: any[];
  propertyAssignments: any[];
  onAddManager: (managerData: any, ownerId: string) => any;
  onAssignManager: (managerId: string, propertyId: string, ownerId: string) => void;
  onRemoveManager: (managerId: string, propertyId: string, ownerId: string) => void;
  onUpdateManager: (managerId: string, updates: any) => void;
  onDeactivateManager: (managerId: string) => void;
}

export function PropertyOwnerDashboard({ 
  user, 
  onLogout,
  managers,
  propertyAssignments,
  onAddManager,
  onAssignManager,
  onRemoveManager,
  onUpdateManager,
  onDeactivateManager
}: PropertyOwnerDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [properties, setProperties] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch dashboard data, properties, and account info
  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const [dashResponse, propertiesResponse, accountResponse] = await Promise.all([
        getOwnerDashboardOverview(),
        getProperties(),
        getAccountInfo()
      ]);

      if (dashResponse.error) {
        if (!silent) toast.error(dashResponse.error.error || 'Failed to load dashboard');
      } else if (dashResponse.data) {
        setDashboardData(dashResponse.data);
      }

      if (propertiesResponse.error) {
        if (!silent) toast.error(propertiesResponse.error.error || 'Failed to load properties');
      } else if (propertiesResponse.data) {
        setProperties(propertiesResponse.data);
      }

      // Update account info (plan, limits, etc.)
      if (accountResponse.error) {
        console.error('Failed to fetch account info:', accountResponse.error);
      } else if (accountResponse.data) {
        setAccountInfo(accountResponse.data);
        
        // Show notification if plan/limits were updated (only on silent refresh)
        if (silent && accountInfo && accountResponse.data.customer) {
          const oldCustomer = accountInfo.customer;
          const newCustomer = accountResponse.data.customer;
          
          if (oldCustomer && newCustomer) {
            if (oldCustomer.plan?.name !== newCustomer.plan?.name) {
              toast.success(`Your plan has been updated to ${newCustomer.plan?.name}!`);
            }
            if (oldCustomer.propertyLimit !== newCustomer.propertyLimit) {
              toast.info(`Property limit updated to ${newCustomer.propertyLimit}`);
            }
            if (oldCustomer.userLimit !== newCustomer.userLimit) {
              toast.info(`User limit updated to ${newCustomer.userLimit}`);
            }
          }
        }
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      fetchData(true); // Silent refresh
    }, 30000); // 30 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [accountInfo]);

  // Refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchData(true); // Silent refresh
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [accountInfo]);

  // Mock properties data for backwards compatibility
  const mockProperties = [
    {
      id: 1,
      name: "Sunset Apartments",
      address: "123 Main St, Downtown",
      city: "Metro City",
      state: "CA",
      zipCode: "90210",
      propertyType: "Apartment Complex",
      yearBuilt: 2018,
      totalUnits: 24,
      units: 24,
      occupiedUnits: 22,
      occupied: 22,
      vacantUnits: 2,
      monthlyRevenue: 18400,
      avgRent: 850,
      occupancyRate: 91.7,
      manager: "Sarah Johnson",
      managerPhone: "(555) 123-4567",
      managerEmail: "sarah@propertyhub.com",
      status: "active",
      lastInspection: "2024-02-15",
      nextInspection: "2024-05-15",
      maintenanceRequests: 3,
      expiredLeases: 2,
      features: ["Pool", "Gym", "Parking", "Laundry"],
      images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400"],
      financials: {
        grossRent: 20400,
        expenses: 5200,
        netIncome: 15200,
        capRate: 6.8,
        cashFlow: 12800,
        currency: 'NGN'
      },
      insurance: {
        provider: "Property Insurance Co.",
        policyNumber: "PI-123456",
        premium: 850,
        expiration: "2024-12-31"
      },
      currency: 'NGN'
    },
    {
      id: 2,
      name: "Riverside Complex",
      address: "456 River Ave, Westside",
      city: "Metro City",
      state: "CA",
      zipCode: "90211",
      propertyType: "Mixed Use",
      yearBuilt: 2020,
      totalUnits: 36,
      units: 36,
      occupiedUnits: 34,
      occupied: 34,
      vacantUnits: 2,
      monthlyRevenue: 25200,
      avgRent: 750,
      occupancyRate: 94.4,
      manager: "Mike Chen",
      managerPhone: "(555) 987-6543",
      managerEmail: "mike@propertyhub.com",
      status: "active",
      lastInspection: "2024-03-01",
      nextInspection: "2024-06-01",
      maintenanceRequests: 5,
      expiredLeases: 1,
      features: ["Retail Space", "Elevator", "Security System", "Central AC"],
      images: ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"],
      financials: {
        grossRent: 27000,
        expenses: 6800,
        netIncome: 20200,
        capRate: 7.2,
        cashFlow: 17500,
        currency: 'NGN'
      },
      insurance: {
        provider: "Metro Insurance",
        policyNumber: "MI-789012",
        premium: 1200,
        expiration: "2024-11-30"
      },
      currency: 'NGN'
    },
    {
      id: 3,
      name: "Park View Towers",
      address: "789 Park Blvd, Northside",
      city: "Metro City",
      state: "CA",
      zipCode: "90212",
      propertyType: "High Rise",
      yearBuilt: 2019,
      totalUnits: 48,
      units: 48,
      occupiedUnits: 45,
      occupied: 45,
      vacantUnits: 3,
      monthlyRevenue: 31500,
      avgRent: 720,
      occupancyRate: 93.8,
      manager: "Lisa Rodriguez",
      managerPhone: "(555) 456-7890",
      managerEmail: "lisa@propertyhub.com",
      status: "active",
      lastInspection: "2024-01-20",
      nextInspection: "2024-04-20",
      maintenanceRequests: 2,
      expiredLeases: 3,
      features: ["Concierge", "Rooftop Deck", "Valet Parking", "Smart Home"],
      images: ["https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400"],
      financials: {
        grossRent: 34560,
        expenses: 8900,
        netIncome: 25660,
        capRate: 7.8,
        cashFlow: 22100,
        currency: 'NGN'
      },
      insurance: {
        provider: "Tower Insurance Ltd.",
        policyNumber: "TI-345678",
        premium: 1500,
        expiration: "2025-01-15"
      },
      currency: 'NGN'
    },
    {
      id: 4,
      name: "Garden Homes",
      address: "321 Garden Way, Suburbs",
      city: "Metro City",
      state: "CA",
      zipCode: "90213",
      propertyType: "Townhouse",
      yearBuilt: 2016,
      totalUnits: 18,
      units: 18,
      occupiedUnits: 16,
      occupied: 16,
      vacantUnits: 2,
      monthlyRevenue: 12400,
      avgRent: 775,
      occupancyRate: 88.9,
      manager: "David Thompson",
      managerPhone: "(555) 321-0987",
      managerEmail: "david@propertyhub.com",
      status: "maintenance",
      lastInspection: "2024-02-28",
      nextInspection: "2024-05-28",
      maintenanceRequests: 8,
      expiredLeases: 0,
      features: ["Private Garage", "Garden", "Pet Friendly", "Storage"],
      images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400"],
      financials: {
        grossRent: 13950,
        expenses: 4200,
        netIncome: 9750,
        capRate: 5.9,
        cashFlow: 8100,
        currency: 'NGN'
      },
      insurance: {
        provider: "Home Shield Insurance",
        policyNumber: "HS-901234",
        premium: 650,
        expiration: "2024-10-15"
      },
      currency: 'NGN'
    }
  ];
  
  // Use real properties if available, otherwise use mock
  const displayProperties = properties.length > 0 ? properties : mockProperties;

  // Show welcome message for first-time users
  useEffect(() => {
    if (user?.isFirstLogin) {
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 5000);
    }
  }, [user]);

  // Calculate portfolio stats
  const portfolioStats = {
    totalProperties: properties.length,
    totalUnits: properties.reduce((sum, p) => sum + p.units, 0),
    occupancyRate: Math.round(properties.reduce((sum, p) => sum + (p.occupied / p.units * 100), 0) / properties.length),
    monthlyRevenue: properties.reduce((sum, p) => sum + p.monthlyRevenue, 0),
  };

  const recentActivity = [
    {
      id: 1,
      description: "Rent payment received from Sunset Apartments Unit 4B",
      amount: "₦1,250",
      time: "2 hours ago"
    },
    {
      id: 2,
      description: "New maintenance request at Riverside Complex",
      time: "4 hours ago"
    },
    {
      id: 3,
      description: "ACH payment processed for Park View Towers Unit C401",
      amount: "₦1,800",
      time: "1 day ago"
    },
  ];

  const navigation = [
    { name: 'Portfolio Overview', key: 'dashboard' },
    { name: 'Properties', key: 'properties' },
    { name: 'Tenant Payments', key: 'payments' },
    { name: 'Financial Reports', key: 'financial' },
    { name: 'Property Managers', key: 'managers' },
    { name: 'Access Control', key: 'access' },
    { name: 'Documents', key: 'documents' },
    { name: 'Settings', key: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Building className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">PropertyHub Owner</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {user.company}
              </Badge>
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Notification */}
      {showWelcome && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Welcome to PropertyHub, {user.name}!
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Your account has been successfully set up. Get started by adding your first property or exploring the dashboard features.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWelcome(false)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg lg:shadow-none border-r mt-16 lg:mt-0`}>
          <nav className="mt-5 px-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Button
                    variant={currentView === item.key ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setCurrentView(item.key);
                      setSidebarOpen(false);
                    }}
                  >
                    {item.name}
                  </Button>
                </li>
              ))}
              
              {/* Logout Button below Settings */}
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 w-full overflow-x-hidden">
          {currentView === 'properties' ? (
            <PropertiesPage 
              user={user}
              onBack={() => setCurrentView('dashboard')}
              onNavigateToAddProperty={() => setCurrentView('add-property')}
              properties={properties}
            />
          ) : currentView === 'payments' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <TenantPayments 
                  properties={properties}
                  user={user}
                />
              </div>
            </div>
          ) : currentView === 'financial' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <FinancialReports 
                  properties={properties}
                  user={user}
                />
              </div>
            </div>
          ) : currentView === 'managers' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <PropertyManagerManagement
                  user={user}
                  managers={managers}
                  properties={properties}
                  propertyAssignments={propertyAssignments}
                  onAddManager={onAddManager}
                  onAssignManager={onAssignManager}
                  onRemoveManager={onRemoveManager}
                  onUpdateManager={onUpdateManager}
                  onDeactivateManager={onDeactivateManager}
                />
              </div>
            </div>
          ) : currentView === 'access' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <AccessControl />
              </div>
            </div>
          ) : currentView === 'documents' ? (
            <div className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <PropertyOwnerDocuments />
              </div>
            </div>
          ) : currentView === 'add-property' ? (
            <AddPropertyPage
              user={user}
              onBack={() => setCurrentView('dashboard')}
              onSave={(propertyData) => {
                setProperties(prev => [...prev, propertyData]);
                setCurrentView('properties');
              }}
            />
          ) : currentView === 'settings' ? (
            <PropertyOwnerSettings
              user={user}
              onBack={() => setCurrentView('dashboard')}
              onSave={(updates) => {
                // Handle profile updates here
                console.log('Profile updates:', updates);
              }}
              onLogout={onLogout}
            />
          ) : (
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Welcome Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}!</h2>
                <p className="text-gray-600">Here's an overview of your property portfolio</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{portfolioStats.totalProperties}</div>
                    <p className="text-xs text-muted-foreground">
                      {portfolioStats.totalUnits} total units
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{portfolioStats.occupancyRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      +2.1% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₦{(portfolioStats.monthlyRevenue || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      +12.5% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">94.2%</div>
                    <p className="text-xs text-muted-foreground">
                      2 overdue payments
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Properties List */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Property Portfolio</CardTitle>
                      <CardDescription>Your managed properties</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setCurrentView('add-property')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {properties.map((property) => (
                        <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{property.name}</h4>
                              <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                                {property.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{property.address}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{property.occupied || 0}/{property.units || 0} units occupied</span>
                              <span>₦{(property.monthlyRevenue || 0).toLocaleString()}/mo</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Manager: {property.manager || 'Unassigned'}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates from your properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            {activity.amount && (
                              <p className="text-sm font-medium text-green-600">{activity.amount}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks for property owners</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                    <Button variant="outline" className="h-20 md:h-24 flex-col text-xs sm:text-sm" onClick={() => setCurrentView('add-property')}>
                      <Plus className="h-5 w-5 md:h-6 md:w-6 mb-2" />
                      <span>Add Property</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col text-xs sm:text-sm" onClick={() => setCurrentView('managers')}>
                      <Users className="h-5 w-5 md:h-6 md:w-6 mb-2" />
                      <span>Hire Manager</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col text-xs sm:text-sm" onClick={() => setCurrentView('financial')}>
                      <DollarSign className="h-5 w-5 md:h-6 md:w-6 mb-2" />
                      <span>View Reports</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col text-xs sm:text-sm" onClick={() => setCurrentView('payments')}>
                      <DollarSign className="h-5 w-5 md:h-6 md:w-6 mb-2" />
                      <span>Payments</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col text-xs sm:text-sm" onClick={() => setCurrentView('access')}>
                      <Shield className="h-5 w-5 md:h-6 md:w-6 mb-2" />
                      <span>Access Control</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

