import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { toast } from "sonner";
import { getAnalyticsOverview } from '../lib/api';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Building2,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Zap,
  Target,
  UserCheck,
  UserX,
  Smartphone,
  Globe,
  MapPin,
  CreditCard,
  FileText,
  BarChart
} from 'lucide-react';

export function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await getAnalyticsOverview({ period: dateRange });
      
      if (response.error) {
        toast.error(response.error.error || 'Failed to load analytics');
      } else if (response.data) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Platform metrics from API or mock data
  const platformMetrics = analyticsData?.overview || {
    totalCustomers: 156,
    activeCustomers: 148,
    totalRevenue: 245000,
    monthlyRevenue: 45800,
    totalProperties: 1245,
    totalUnits: 18650,
    activeUsers: 2847,
    systemUptime: 99.9,
    supportTickets: 42,
    avgResponseTime: 2.4
  };

  const customerGrowthData = [
    { month: 'Apr', newCustomers: 12, churnedCustomers: 3, netGrowth: 9, totalCustomers: 120 },
    { month: 'May', newCustomers: 15, churnedCustomers: 2, netGrowth: 13, totalCustomers: 133 },
    { month: 'Jun', newCustomers: 18, churnedCustomers: 4, netGrowth: 14, totalCustomers: 147 },
    { month: 'Jul', newCustomers: 14, churnedCustomers: 3, netGrowth: 11, totalCustomers: 158 },
    { month: 'Aug', newCustomers: 16, churnedCustomers: 5, netGrowth: 11, totalCustomers: 169 },
    { month: 'Sep', newCustomers: 13, churnedCustomers: 2, netGrowth: 11, totalCustomers: 180 }
  ];

  const revenueAnalytics = {
    mrr: 45800,
    arr: 549600,
    churnRate: 3.2,
    avgRevenuePerCustomer: 310,
    lifetimeValue: 8750,
    monthlyGrowthRate: 8.2,
    planDistribution: [
      { plan: 'Enterprise', customers: 25, revenue: 62500, percentage: 17 },
      { plan: 'Professional', customers: 78, revenue: 58500, percentage: 53 },
      { plan: 'Basic', customers: 45, revenue: 13455, percentage: 30 }
    ]
  };

  const usageMetrics = {
    dailyActiveUsers: 1847,
    monthlyActiveUsers: 2847,
    avgSessionDuration: '24m 32s',
    bounceRate: 12.4,
    featureAdoption: [
      { feature: 'Tenant Management', adoption: 95, users: 2704 },
      { feature: 'Payment Processing', adoption: 87, users: 2477 },
      { feature: 'Maintenance Tickets', adoption: 78, users: 2221 },
      { feature: 'Access Control', adoption: 65, users: 1851 },
      { feature: 'Reporting', adoption: 54, users: 1537 }
    ],
    mobileVsWeb: {
      mobile: 68,
      web: 32
    }
  };

  const performanceMetrics = {
    systemUptime: 99.9,
    avgLoadTime: 1.2,
    errorRate: 0.05,
    supportTickets: {
      open: 42,
      inProgress: 18,
      resolved: 156,
      avgResolutionTime: 4.6
    },
    userSatisfaction: 4.6,
    npsScore: 72
  };

  const topCustomersByRevenue = [
    { company: 'Metro Properties LLC', revenue: 2500, growth: 12.5, properties: 45, plan: 'Enterprise' },
    { company: 'Urban Living Properties', revenue: 1875, growth: 8.3, properties: 32, plan: 'Professional' },
    { company: 'Coastal Rentals', revenue: 1650, growth: -2.1, properties: 28, plan: 'Professional' },
    { company: 'Downtown Developments', revenue: 1425, growth: 15.2, properties: 22, plan: 'Professional' },
    { company: 'Riverside Management', revenue: 1200, growth: 5.8, properties: 18, plan: 'Professional' }
  ];

  const geographicData = [
    { region: 'North America', customers: 98, revenue: 156800, growth: 12.3 },
    { region: 'Europe', customers: 32, revenue: 48600, growth: 18.7 },
    { region: 'Asia Pacific', customers: 18, revenue: 27300, growth: 25.4 },
    { region: 'Latin America', customers: 8, revenue: 12300, growth: 8.9 }
  ];

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    } else if (growth < 0) {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    }
    return <div className="h-4 w-4" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive platform insights and metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="date-range" className="text-sm font-medium">Period:</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32" id="date-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformMetrics.totalCustomers}</div>
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+12% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${platformMetrics.monthlyRevenue.toLocaleString()}</div>
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+8.2% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformMetrics.totalProperties.toLocaleString()}</div>
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+15% growth</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformMetrics.activeUsers.toLocaleString()}</div>
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+5.3% active rate</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Health */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
                <CardDescription>System performance and reliability metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>System Uptime</span>
                  </div>
                  <span className="font-medium">{platformMetrics.systemUptime}%</span>
                </div>
                <Progress value={platformMetrics.systemUptime} className="h-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>Avg Response Time</span>
                  </div>
                  <span className="font-medium">{platformMetrics.avgResponseTime}s</span>
                </div>
                <Progress value={85} className="h-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>Open Support Tickets</span>
                  </div>
                  <span className="font-medium">{platformMetrics.supportTickets}</span>
                </div>
                <Progress value={25} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Customer distribution by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {geographicData.map((region, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-medium">{region.region}</p>
                          <p className="text-sm text-gray-600">{region.customers} customers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${region.revenue.toLocaleString()}</p>
                        <div className={`flex items-center space-x-1 text-xs ${getGrowthColor(region.growth)}`}>
                          {getGrowthIcon(region.growth)}
                          <span>{region.growth > 0 ? '+' : ''}{region.growth}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Growth Trend</CardTitle>
              <CardDescription>New customer acquisition and churn analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerGrowthData.slice(-3).map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">{data.month} 2024</p>
                        <p className="text-sm text-gray-600">{data.totalCustomers} total customers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm text-green-600">+{data.newCustomers}</p>
                          <p className="text-xs text-gray-500">New</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-red-600">-{data.churnedCustomers}</p>
                          <p className="text-xs text-gray-500">Churned</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-blue-600">+{data.netGrowth}</p>
                          <p className="text-xs text-gray-500">Net Growth</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {/* Customer Analytics */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Acquisition</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">13</div>
                <p className="text-xs text-muted-foreground">New customers this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-muted-foreground">-0.5% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Revenue/Customer</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueAnalytics.avgRevenuePerCustomer}</div>
                <p className="text-xs text-muted-foreground">+15.3% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Customer Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Growth Analysis</CardTitle>
              <CardDescription>Monthly customer acquisition and retention trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerGrowthData.map((data, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 p-3 border rounded-lg">
                    <div className="text-center">
                      <p className="font-medium">{data.month}</p>
                      <p className="text-sm text-gray-600">2024</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">+{data.newCustomers}</p>
                      <p className="text-xs text-gray-500">New Customers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">-{data.churnedCustomers}</p>
                      <p className="text-xs text-gray-500">Churned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">+{data.netGrowth}</p>
                      <p className="text-xs text-gray-500">Net Growth</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{data.totalCustomers}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Revenue</CardTitle>
              <CardDescription>Highest value customers and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monthly Revenue</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomersByRevenue.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{customer.company}</TableCell>
                      <TableCell>
                        <Badge variant={
                          customer.plan === 'Enterprise' ? 'default' :
                          customer.plan === 'Professional' ? 'secondary' : 'outline'
                        }>
                          {customer.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>${customer.revenue.toLocaleString()}</TableCell>
                      <TableCell>{customer.properties}</TableCell>
                      <TableCell>
                        <div className={`flex items-center space-x-1 ${getGrowthColor(customer.growth)}`}>
                          {getGrowthIcon(customer.growth)}
                          <span>{customer.growth > 0 ? '+' : ''}{customer.growth}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Metrics */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueAnalytics.mrr.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ARR</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueAnalytics.arr.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Annual Recurring Revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueAnalytics.lifetimeValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Average Lifetime Value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenueAnalytics.monthlyGrowthRate}%</div>
                <p className="text-xs text-muted-foreground">Monthly growth rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Plan Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Plan</CardTitle>
              <CardDescription>Performance breakdown by subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueAnalytics.planDistribution.map((plan, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          plan.plan === 'Enterprise' ? 'default' :
                          plan.plan === 'Professional' ? 'secondary' : 'outline'
                        }>
                          {plan.plan}
                        </Badge>
                        <span className="font-medium">{plan.customers} customers</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${plan.revenue.toLocaleString()}/mo</p>
                        <p className="text-sm text-gray-600">{plan.percentage}% of total</p>
                      </div>
                    </div>
                    <Progress value={plan.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trends */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Growth</CardTitle>
                <CardDescription>Revenue progression over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerGrowthData.slice(-4).map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{data.month} 2024</p>
                        <p className="text-sm text-gray-600">{data.totalCustomers} customers</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(data.totalCustomers * 310).toLocaleString()}</p>
                        <div className="flex items-center space-x-1 text-xs text-green-600">
                          <ArrowUpRight className="h-3 w-3" />
                          <span>+{((data.netGrowth / (data.totalCustomers - data.netGrowth)) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>Key financial performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span>Average Revenue Per User</span>
                  </div>
                  <span className="font-medium">${revenueAnalytics.avgRevenuePerCustomer}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Customer Lifetime Value</span>
                  </div>
                  <span className="font-medium">${revenueAnalytics.lifetimeValue.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Monthly Churn Rate</span>
                  </div>
                  <span className="font-medium">{revenueAnalytics.churnRate}%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    <span>Monthly Growth Rate</span>
                  </div>
                  <span className="font-medium">{revenueAnalytics.monthlyGrowthRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {/* Usage Metrics */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageMetrics.dailyActiveUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">65% of total users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageMetrics.avgSessionDuration}</div>
                <p className="text-xs text-muted-foreground">Average session time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mobile Usage</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageMetrics.mobileVsWeb.mobile}%</div>
                <p className="text-xs text-muted-foreground">vs {usageMetrics.mobileVsWeb.web}% web</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageMetrics.bounceRate}%</div>
                <p className="text-xs text-muted-foreground">Single-page sessions</p>
              </CardContent>
            </Card>
          </div>

          {/* Feature Adoption */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Adoption Rates</CardTitle>
              <CardDescription>Usage statistics for key platform features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageMetrics.featureAdoption.map((feature, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{feature.feature}</span>
                      <div className="text-right">
                        <span className="font-medium">{feature.adoption}%</span>
                        <p className="text-sm text-gray-600">{feature.users.toLocaleString()} users</p>
                      </div>
                    </div>
                    <Progress value={feature.adoption} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Usage */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
                <CardDescription>Usage breakdown by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span>Mobile App</span>
                      </div>
                      <span className="font-medium">{usageMetrics.mobileVsWeb.mobile}%</span>
                    </div>
                    <Progress value={usageMetrics.mobileVsWeb.mobile} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        <span>Web Application</span>
                      </div>
                      <span className="font-medium">{usageMetrics.mobileVsWeb.web}%</span>
                    </div>
                    <Progress value={usageMetrics.mobileVsWeb.web} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Engagement metrics and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Monthly Active Users</span>
                  </div>
                  <span className="font-medium">{usageMetrics.monthlyActiveUsers.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span>Daily Active Users</span>
                  </div>
                  <span className="font-medium">{usageMetrics.dailyActiveUsers.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span>Avg Session Duration</span>
                  </div>
                  <span className="font-medium">{usageMetrics.avgSessionDuration}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Bounce Rate</span>
                  </div>
                  <span className="font-medium">{usageMetrics.bounceRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.systemUptime}%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.avgLoadTime}s</div>
                <p className="text-xs text-muted-foreground">Page load average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.errorRate}%</div>
                <p className="text-xs text-muted-foreground">System error rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics.userSatisfaction}/5</div>
                <p className="text-xs text-muted-foreground">Average rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Support Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Support Performance</CardTitle>
              <CardDescription>Customer support metrics and ticket analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>Open Tickets</span>
                    </div>
                    <span className="font-medium">{performanceMetrics.supportTickets.open}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>In Progress</span>
                    </div>
                    <span className="font-medium">{performanceMetrics.supportTickets.inProgress}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Resolved</span>
                    </div>
                    <span className="font-medium">{performanceMetrics.supportTickets.resolved}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="font-medium text-gray-600">Avg Resolution Time</h3>
                    <p className="text-2xl font-bold text-blue-600">{performanceMetrics.supportTickets.avgResolutionTime}h</p>
                    <p className="text-sm text-gray-500">-15% from last month</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="font-medium text-gray-600">Customer Satisfaction</h3>
                    <p className="text-2xl font-bold text-green-600">{performanceMetrics.userSatisfaction}/5</p>
                    <p className="text-sm text-gray-500">+0.3 from last month</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="font-medium text-gray-600">NPS Score</h3>
                    <p className="text-2xl font-bold text-purple-600">{performanceMetrics.npsScore}</p>
                    <p className="text-sm text-gray-500">+8 points improvement</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Technical performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>System Uptime</span>
                    <span className="font-medium">{performanceMetrics.systemUptime}%</span>
                  </div>
                  <Progress value={performanceMetrics.systemUptime} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Page Load Performance</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>API Response Time</span>
                    <span className="font-medium">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Error Rate (Inverted)</span>
                    <span className="font-medium">99.95%</span>
                  </div>
                  <Progress value={99.95} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>Service quality and reliability indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span>Service Level Agreement</span>
                  </div>
                  <span className="font-medium">99.2%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span>API Availability</span>
                  </div>
                  <span className="font-medium">99.8%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <span>Response Time SLA</span>
                  </div>
                  <span className="font-medium">98.5%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <span>Data Integrity</span>
                  </div>
                  <span className="font-medium">100%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Reports and Exports */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Reports</CardTitle>
                <CardDescription>Pre-configured analytical reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BarChart className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">Monthly Revenue Report</p>
                      <p className="text-sm text-gray-600">Revenue breakdown and trends</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Customer Analytics</p>
                      <p className="text-sm text-gray-600">Acquisition and retention metrics</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="font-medium">Usage Analytics</p>
                      <p className="text-sm text-gray-600">Feature adoption and engagement</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="font-medium">Performance Report</p>
                      <p className="text-sm text-gray-600">System health and support metrics</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Reports</CardTitle>
                <CardDescription>Create custom analytical reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input id="report-name" placeholder="e.g., Q3 Performance Analysis" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metrics">Select Metrics</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose metrics to include" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue Metrics</SelectItem>
                      <SelectItem value="customers">Customer Analytics</SelectItem>
                      <SelectItem value="usage">Usage Statistics</SelectItem>
                      <SelectItem value="performance">Performance Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-range-report">Date Range</Label>
                  <Select>
                    <SelectTrigger id="date-range-report">
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Custom Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Data Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights & Recommendations</CardTitle>
              <CardDescription>AI-powered business insights and actionable recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Revenue Growth Opportunity</h4>
                      <p className="text-sm text-green-800 mt-1">
                        Professional plan customers show 23% higher engagement. Consider targeted upselling campaigns to Basic plan users.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Customer Retention Focus</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Customers using 3+ features have 40% lower churn rate. Implement feature adoption campaigns for new users.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Smartphone className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Mobile Optimization</h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        68% of users access via mobile. Prioritize mobile feature development to improve user experience.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900">Support Efficiency</h4>
                      <p className="text-sm text-purple-800 mt-1">
                        Response time improved 15% this month. Consider expanding support team to maintain quality during growth.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Export analytical data in various formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-16 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Export to PDF</span>
                </Button>
                
                <Button variant="outline" className="h-16 flex-col">
                  <BarChart className="h-6 w-6 mb-2" />
                  <span>Export to Excel</span>
                </Button>
                
                <Button variant="outline" className="h-16 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  <span>Export to CSV</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
