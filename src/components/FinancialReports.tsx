import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Building, 
  Calendar,
  Download,
  Filter,
  Eye,
  BarChart3,
  PieChart,
  LineChart,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';

interface FinancialReportsProps {
  properties: any[];
  user: any;
}

export const FinancialReports = ({ properties, user }: FinancialReportsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [reportView, setReportView] = useState('overview');

  // Mock financial data
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 85000, expenses: 25000, netIncome: 60000 },
    { month: 'Feb', revenue: 87000, expenses: 28000, netIncome: 59000 },
    { month: 'Mar', revenue: 89000, expenses: 26000, netIncome: 63000 },
    { month: 'Apr', revenue: 91000, expenses: 30000, netIncome: 61000 },
    { month: 'May', revenue: 88000, expenses: 24000, netIncome: 64000 },
    { month: 'Jun', revenue: 92000, expenses: 27000, netIncome: 65000 },
    { month: 'Jul', revenue: 94000, expenses: 29000, netIncome: 65000 },
    { month: 'Aug', revenue: 93000, expenses: 25000, netIncome: 68000 },
    { month: 'Sep', revenue: 95000, expenses: 31000, netIncome: 64000 },
    { month: 'Oct', revenue: 96000, expenses: 28000, netIncome: 68000 },
    { month: 'Nov', revenue: 98000, expenses: 26000, netIncome: 72000 },
    { month: 'Dec', revenue: 100000, expenses: 30000, netIncome: 70000 }
  ];

  const expenseBreakdown = [
    { name: 'Maintenance', value: 35, amount: 105000, color: '#8884d8' },
    { name: 'Utilities', value: 20, amount: 60000, color: '#82ca9d' },
    { name: 'Insurance', value: 15, amount: 45000, color: '#ffc658' },
    { name: 'Property Tax', value: 20, amount: 60000, color: '#ff7300' },
    { name: 'Management Fees', value: 10, amount: 30000, color: '#00ff7f' }
  ];

  const propertyPerformance = properties.map(property => ({
    ...property,
    revenue: property.monthlyRevenue,
    expenses: property.monthlyRevenue * 0.3,
    netIncome: property.monthlyRevenue * 0.7,
    roi: ((property.monthlyRevenue * 12 * 0.7) / (property.monthlyRevenue * 12 * 15)) * 100,
    capRate: property.financials?.capRate || 6.5,
    cashFlow: property.financials?.cashFlow || property.monthlyRevenue * 0.6
  }));

  const currentYear = new Date().getFullYear();
  const totalRevenue = monthlyRevenueData.reduce((sum, month) => sum + month.revenue, 0);
  const totalExpenses = monthlyRevenueData.reduce((sum, month) => sum + month.expenses, 0);
  const totalNetIncome = totalRevenue - totalExpenses;
  const averageOccupancy = properties.reduce((sum, p) => sum + p.occupancyRate, 0) / properties.length;
  const portfolioCapRate = propertyPerformance.reduce((sum, p) => sum + p.capRate, 0) / propertyPerformance.length;

  const yearOverYearGrowth = 12.5; // Mock data
  const revenueGrowth = 8.3;
  const expenseGrowth = 4.1;

  const filteredProperties = selectedProperty === 'all' 
    ? propertyPerformance 
    : propertyPerformance.filter(p => p.id.toString() === selectedProperty);

  const exportReport = (type: string) => {
    // Mock export functionality
    console.log(`Exporting ${type} report...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Financial Reports</h2>
          <p className="text-gray-600 mt-1">Comprehensive financial analytics for your property portfolio</p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-48">
              <Building className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map(property => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => exportReport('comprehensive')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{revenueGrowth}% vs last year
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Operating Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalNetIncome.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{yearOverYearGrowth}% vs last year
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Cap Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioCapRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              Above market average
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Margin</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((totalNetIncome / totalRevenue) * 100).toFixed(1)}%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Healthy margin
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportView} onValueChange={setReportView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses Trend</CardTitle>
                <CardDescription>Monthly financial performance over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
                    <Line type="monotone" dataKey="netIncome" stroke="#ff7300" strokeWidth={3} name="Net Income" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Distribution of operating expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Occupancy</p>
                    <p className="text-2xl font-bold">{averageOccupancy.toFixed(1)}%</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Properties</p>
                    <p className="text-2xl font-bold">{properties.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Units</p>
                    <p className="text-2xl font-bold">{properties.reduce((sum, p) => sum + p.units, 0)}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Detailed revenue trends and projections</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Property</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProperties.map((property) => (
                    <div key={property.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{property.name}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(property.revenue / Math.max(...filteredProperties.map(p => p.revenue))) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-medium">${property.revenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{property.units} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Annual Revenue</span>
                    <span className="font-bold">${(totalRevenue).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Monthly</span>
                    <span className="font-bold">${(totalRevenue / 12).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Revenue per Unit</span>
                    <span className="font-bold">${Math.round(totalRevenue / properties.reduce((sum, p) => sum + p.units, 0))}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">YoY Growth</span>
                    <span className="font-bold text-green-600">+{revenueGrowth}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expense Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Expenses']} />
                    <Line type="monotone" dataKey="expenses" stroke="#ff7300" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenseBreakdown.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: expense.color }}
                        />
                        <span className="font-medium">{expense.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${expense.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{expense.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expense Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">${totalExpenses.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Annual Expenses</p>
                  <div className="flex items-center justify-center text-red-600 mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span className="text-xs">+{expenseGrowth}% vs last year</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">${Math.round(totalExpenses / properties.reduce((sum, p) => sum + p.units, 0))}</p>
                  <p className="text-sm text-gray-600">Expense per Unit</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{((totalExpenses / totalRevenue) * 100).toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Expense Ratio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Financial Performance</CardTitle>
              <CardDescription>Individual property analysis and comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Monthly Revenue</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Cap Rate</TableHead>
                      <TableHead>Cash Flow</TableHead>
                      <TableHead>ROI</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{property.name}</p>
                            <p className="text-sm text-gray-500">{property.units} units</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">${property.revenue.toLocaleString()}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${property.occupancyRate}%` }}
                              />
                            </div>
                            <span className="text-sm">{property.occupancyRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={property.capRate > 7 ? 'default' : 'secondary'}>
                            {property.capRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">${property.cashFlow.toLocaleString()}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {property.roi > 8 ? (
                              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                            )}
                            <span className={property.roi > 8 ? 'text-green-600' : 'text-red-600'}>
                              {property.roi.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                            {property.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">Strong Performance</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your portfolio is generating 12.5% YoY growth with healthy margins above 70%.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">Occupancy Optimization</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Average occupancy of {averageOccupancy.toFixed(1)}% is above market. Consider strategic rent increases.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-900">Expense Management</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Maintenance costs are trending up. Consider preventive maintenance programs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Increase rent for underperforming units</p>
                      <p className="text-sm text-gray-600">Units below market rate could generate additional $15K annually</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Implement energy efficiency upgrades</p>
                      <p className="text-sm text-gray-600">Could reduce utility expenses by 15-20%</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Consider property acquisition</p>
                      <p className="text-sm text-gray-600">Strong cash flow supports expansion opportunities</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Review insurance policies</p>
                      <p className="text-sm text-gray-600">Annual review could reduce premiums by 5-10%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Projections</CardTitle>
              <CardDescription>12-month outlook based on current trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">${(totalRevenue * 1.08).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Projected Annual Revenue</p>
                  <p className="text-xs text-green-600">+8% growth</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">${(totalNetIncome * 1.12).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Projected Net Income</p>
                  <p className="text-xs text-blue-600">+12% growth</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-600">{(portfolioCapRate + 0.3).toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Target Cap Rate</p>
                  <p className="text-xs text-purple-600">Optimization goal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};


