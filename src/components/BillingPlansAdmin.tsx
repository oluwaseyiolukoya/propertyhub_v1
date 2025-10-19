import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { 
  getBillingPlans, 
  createBillingPlan, 
  updateBillingPlan, 
  deleteBillingPlan,
  type BillingPlan 
} from '../lib/api';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Plus, 
  Edit, 
  MoreHorizontal,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Search,
  Eye
} from 'lucide-react';

export function BillingPlansAdmin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Currency configuration
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.85 },
    { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.73 },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.25 },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.35 },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 110 },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.92 },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', rate: 8.5 },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1650 }
  ];

  // Get current currency details
  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  // Convert amount to selected currency
  const convertCurrency = (amount: number) => {
    const converted = amount * currentCurrency.rate;
    return currentCurrency.code === 'JPY' ? Math.round(converted) : Math.round(converted * 100) / 100;
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    const converted = convertCurrency(amount);
    if (currentCurrency.code === 'JPY') {
      return `${currentCurrency.symbol}${converted.toLocaleString()}`;
    }
    return `${currentCurrency.symbol}${converted.toLocaleString()}`;
  };

  // Fetch plans on component mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getBillingPlans();
      
      if (response.error) {
        toast.error(response.error.error || 'Failed to load billing plans');
      } else if (response.data) {
        setPlans(response.data);
      }
    } catch (error) {
      toast.error('Failed to load billing plans');
    } finally {
      setLoading(false);
    }
  };

  // Transform API plans to match component format
  const subscriptionPlans = plans.map((plan: any) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description || '',
    monthlyPrice: plan.priceMonthly || plan.monthlyPrice,
    yearlyPrice: plan.priceYearly || plan.annualPrice || (plan.priceMonthly * 10),
    maxProperties: plan.propertyLimit,
    maxUnits: plan.userLimit,
    features: Array.isArray(plan.features) ? plan.features : 
              (typeof plan.features === 'string' ? JSON.parse(plan.features) : []),
    activeSubscriptions: plan._count?.customers || 0,
    revenue: (plan.priceMonthly || plan.monthlyPrice) * (plan._count?.customers || 0),
    status: plan.isActive ? 'active' : 'deprecated',
    created: new Date(plan.createdAt).toISOString().split('T')[0]
  }));

  // Calculate billing overview from plans
  const billingOverview = {
    totalRevenue: subscriptionPlans.reduce((sum, plan) => sum + (plan.revenue * 12), 0),
    monthlyRevenue: subscriptionPlans.reduce((sum, plan) => sum + plan.revenue, 0),
    activeSubscriptions: subscriptionPlans.reduce((sum, plan) => sum + plan.activeSubscriptions, 0),
    churnRate: 3.2,
    avgRevenuePer: subscriptionPlans.length > 0 
      ? Math.round(subscriptionPlans.reduce((sum, plan) => sum + plan.revenue, 0) / subscriptionPlans.reduce((sum, plan) => sum + plan.activeSubscriptions, 0))
      : 0,
    overdueBills: 12,
    totalTransactions: 1847,
    refundRequests: 5
  };

  const recentTransactions = [
    {
      id: 1,
      customer: "Metro Properties LLC",
      plan: "Enterprise",
      amount: 2500,
      status: "completed",
      date: "2025-10-16",
      type: "subscription",
      invoice: "INV-001847"
    },
    {
      id: 2,
      customer: "Coastal Rentals",
      plan: "Professional",
      amount: 750,
      status: "completed",
      date: "2025-10-16",
      type: "subscription",
      invoice: "INV-001846"
    },
    {
      id: 3,
      customer: "Urban Living Co.",
      plan: "Professional",
      amount: 750,
      status: "failed",
      date: "2025-10-15",
      type: "subscription",
      invoice: "INV-001845"
    },
    {
      id: 4,
      customer: "Smith Properties",
      plan: "Professional",
      amount: 750,
      status: "refunded",
      date: "2025-10-14",
      type: "subscription",
      invoice: "INV-001844"
    },
    {
      id: 5,
      customer: "Riverside Management",
      plan: "Basic",
      amount: 299,
      status: "pending",
      date: "2025-10-16",
      type: "subscription",
      invoice: "INV-001848"
    }
  ];

  const billingIssues = [
    {
      id: 1,
      customer: "Urban Living Co.",
      issue: "Payment Failed",
      description: "Credit card expired, automatic retry scheduled",
      severity: "medium",
      created: "2025-10-15",
      status: "in-progress"
    },
    {
      id: 2,
      customer: "Downtown Properties",
      issue: "Refund Request", 
      description: "Requesting refund for unused subscription period",
      severity: "low",
      created: "2025-10-14",
      status: "pending"
    },
    {
      id: 3,
      customer: "Metro Properties LLC",
      issue: "Plan Upgrade",
      description: "Customer wants to upgrade mid-billing cycle",
      severity: "low",
      created: "2025-10-13",
      status: "resolved"
    }
  ];

  const revenueData = [
    { month: "Apr", revenue: 35000, subscriptions: 120 },
    { month: "May", revenue: 38000, subscriptions: 125 },
    { month: "Jun", revenue: 41000, subscriptions: 132 },
    { month: "Jul", revenue: 43500, subscriptions: 138 },
    { month: "Aug", revenue: 44800, subscriptions: 142 },
    { month: "Sep", revenue: 45800, subscriptions: 148 }
  ];

  const handleCreatePlan = () => {
    setIsCreatePlanOpen(true);
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsCreatePlanOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'refunded':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const PlanForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="planName">Plan Name</Label>
        <Input 
          id="planName" 
          placeholder="e.g., Professional" 
          defaultValue={selectedPlan?.name}
        />
      </div>
      
      <div>
        <Label htmlFor="planDescription">Description</Label>
        <Textarea 
          id="planDescription" 
          placeholder="Brief description of the plan"
          defaultValue={selectedPlan?.description}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="monthlyPrice">Monthly Price ({currentCurrency.symbol})</Label>
          <Input 
            id="monthlyPrice" 
            type="number" 
            placeholder="299"
            defaultValue={selectedPlan?.monthlyPrice ? convertCurrency(selectedPlan.monthlyPrice) : ''}
          />
        </div>
        <div>
          <Label htmlFor="yearlyPrice">Yearly Price ({currentCurrency.symbol})</Label>
          <Input 
            id="yearlyPrice" 
            type="number" 
            placeholder="2990"
            defaultValue={selectedPlan?.yearlyPrice ? convertCurrency(selectedPlan.yearlyPrice) : ''}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxProperties">Max Properties</Label>
          <Input 
            id="maxProperties" 
            type="number" 
            placeholder="25"
            defaultValue={selectedPlan?.maxProperties}
          />
        </div>
        <div>
          <Label htmlFor="maxUnits">Max Units</Label>
          <Input 
            id="maxUnits" 
            type="number" 
            placeholder="500"
            defaultValue={selectedPlan?.maxUnits}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea 
          id="features" 
          placeholder="Property Management&#10;Tenant Management&#10;Payment Processing"
          defaultValue={selectedPlan?.features?.join('\n')}
          rows={5}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch id="active" defaultChecked={selectedPlan?.status === 'active'} />
        <Label htmlFor="active">Plan is active and available for new customers</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing & Plans</h2>
          <p className="text-gray-600">Manage subscription plans and billing</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="currency-select" className="text-sm font-medium">Currency:</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-40" id="currency-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center space-x-2">
                      <span>{currency.symbol}</span>
                      <span>{currency.code}</span>
                      <span className="text-gray-500">- {currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreatePlan}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Billing Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(billingOverview.monthlyRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  +8.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{billingOverview.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  +12 new this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{billingOverview.churnRate}%</div>
                <p className="text-xs text-muted-foreground">
                  -0.5% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Revenue/Customer</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(billingOverview.avgRevenuePer)}</div>
                <p className="text-xs text-muted-foreground">
                  +15.3% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity and Plan Performance */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Plan Performance</CardTitle>
                <CardDescription>Revenue by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptionPlans.filter(p => p.status === 'active').map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-sm text-gray-600">{plan.activeSubscriptions} subscriptions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(plan.revenue)}/mo</p>
                        <p className="text-sm text-gray-600">{formatCurrency(plan.monthlyPrice)}/user</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest billing activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(transaction.status)}
                        <div>
                          <p className="text-sm font-medium">{transaction.customer}</p>
                          <p className="text-xs text-gray-600">{transaction.plan} - {transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(transaction.amount)}</p>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'failed' ? 'destructive' :
                          transaction.status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing Issues */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Billing Issues</CardTitle>
                <CardDescription>Recent billing problems requiring attention</CardDescription>
              </div>
              <Badge variant="destructive">{billingIssues.filter(i => i.status !== 'resolved').length} Open</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {billingIssues.map((issue) => (
                  <div key={issue.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{issue.customer}</h4>
                        <Badge variant={
                          issue.severity === 'high' ? 'destructive' :
                          issue.severity === 'medium' ? 'secondary' : 'outline'
                        }>
                          {issue.severity}
                        </Badge>
                        <Badge variant={issue.status === 'resolved' ? 'default' : 'secondary'}>
                          {issue.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{issue.issue}</p>
                      <p className="text-sm text-gray-600">{issue.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{issue.created}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid gap-6">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className={plan.status === 'deprecated' ? 'opacity-60' : ''}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <CardTitle>{plan.name}</CardTitle>
                      <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                        {plan.status}
                      </Badge>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Pricing</h4>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">{formatCurrency(plan.monthlyPrice)}</p>
                        <p className="text-sm text-gray-600">per month</p>
                        <p className="text-sm text-gray-600">{formatCurrency(plan.yearlyPrice)}/year (save 17%)</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Limits</h4>
                      <div className="space-y-1">
                        <p className="text-sm">Up to {plan.maxProperties} properties</p>
                        <p className="text-sm">Up to {plan.maxUnits} units</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Performance</h4>
                      <div className="space-y-1">
                        <p className="text-sm">{plan.activeSubscriptions} active subscriptions</p>
                        <p className="text-sm">{formatCurrency(plan.revenue)}/month revenue</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <ul className="text-sm space-y-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-gray-500">+{plan.features.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="font-medium">{transaction.customer}</div>
                    </TableCell>
                    <TableCell>{transaction.plan}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'failed' ? 'destructive' :
                          transaction.status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {transaction.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell className="font-mono text-sm">{transaction.invoice}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <div className="grid gap-4">
            {billingIssues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className={`h-5 w-5 ${
                      issue.severity === 'high' ? 'text-red-600' :
                      issue.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <CardTitle className="text-lg">{issue.customer}</CardTitle>
                      <CardDescription>{issue.issue}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      issue.severity === 'high' ? 'destructive' :
                      issue.severity === 'medium' ? 'secondary' : 'outline'
                    }>
                      {issue.severity} priority
                    </Badge>
                    <Badge variant={issue.status === 'resolved' ? 'default' : 'secondary'}>
                      {issue.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Resolve
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">{issue.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created: {issue.created}</span>
                    <span>ID: #{issue.id.toString().padStart(6, '0')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
                <CardDescription>Monthly revenue and subscription trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{data.month} 2024</p>
                        <p className="text-sm text-gray-600">{data.subscriptions} subscriptions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(data.revenue)}</p>
                        <p className="text-sm text-gray-600">
                          {index > 0 ? (
                            <span className={
                              data.revenue > revenueData[index - 1].revenue 
                                ? 'text-green-600' : 'text-red-600'
                            }>
                              {((data.revenue - revenueData[index - 1].revenue) / revenueData[index - 1].revenue * 100).toFixed(1)}%
                            </span>
                          ) : (
                            '--'
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Analytics</CardTitle>
                <CardDescription>Performance metrics by plan type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptionPlans.filter(p => p.status === 'active').map((plan) => (
                    <div key={plan.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-sm text-gray-600">
                          {Math.round((plan.activeSubscriptions / billingOverview.activeSubscriptions) * 100)}% of total
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{
                            width: `${(plan.activeSubscriptions / billingOverview.activeSubscriptions) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{plan.activeSubscriptions} customers</span>
                        <span>{formatCurrency(plan.revenue)}/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Critical business metrics overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-600">Customer Lifetime Value</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(8750)}</p>
                  <p className="text-sm text-gray-500">Average per customer</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-600">Monthly Recurring Revenue</h3>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(billingOverview.monthlyRevenue)}</p>
                  <p className="text-sm text-gray-500">+8.2% month over month</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-600">Customer Acquisition Cost</h3>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(285)}</p>
                  <p className="text-sm text-gray-500">Per new customer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan 
                ? 'Update the subscription plan details below.' 
                : 'Set up a new subscription plan for your customers.'
              }
            </DialogDescription>
          </DialogHeader>
          <PlanForm />
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => {
              setIsCreatePlanOpen(false);
              setSelectedPlan(null);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              setIsCreatePlanOpen(false);
              setSelectedPlan(null);
            }}>
              {selectedPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
