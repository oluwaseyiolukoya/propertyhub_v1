import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Calendar, Download, Mail, FileText, ChevronDown } from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ReportsPageProps {
  projectId: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("last-6-months");
  const [selectedPhase, setSelectedPhase] = useState("all-phases");

  // Mock data - replace with API calls
  const cashFlowData = [
    { month: "Jan", inflow: 500000, outflow: 420000 },
    { month: "Feb", inflow: 450000, outflow: 495000 },
    { month: "Mar", inflow: 600000, outflow: 510000 },
    { month: "Apr", inflow: 550000, outflow: 570000 },
    { month: "May", inflow: 700000, outflow: 600000 },
    { month: "Jun", inflow: 650000, outflow: 640000 },
    { month: "Jul", inflow: 600000, outflow: 580000 },
  ];

  const costBreakdownData = [
    { name: "Labor", value: 1200000, color: "#3b82f6" },
    { name: "Materials", value: 950000, color: "#14b8a6" },
    { name: "Equipment", value: 450000, color: "#f59e0b" },
    { name: "Subcontractors", value: 680000, color: "#8b5cf6" },
    { name: "Other", value: 270000, color: "#6b7280" },
  ];

  const vendorPerformanceData = [
    { vendor: "ABC Construction", onTime: 95, quality: 92, cost: 88 },
    { vendor: "XYZ Electrical", onTime: 88, quality: 90, cost: 85 },
    { vendor: "BuildRight Materials", onTime: 92, quality: 85, cost: 90 },
    { vendor: "ProPlumbing Inc", onTime: 85, quality: 88, cost: 92 },
    { vendor: "Elite Finishing", onTime: 90, quality: 95, cost: 87 },
  ];

  const phaseSpendData = [
    { phase: "Planning", budget: 450000, actual: 420000 },
    { phase: "Foundation", budget: 800000, actual: 850000 },
    { phase: "Structure", budget: 1200000, actual: 1180000 },
    { phase: "MEP", budget: 650000, actual: 720000 },
    { phase: "Finishing", budget: 500000, actual: 380000 },
  ];

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [projectId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleGenerateReport = (reportType: string) => {
    console.log(`Generating ${reportType} report for project ${projectId}`);
    // Implement report generation logic
  };

  const handleDownloadPDF = () => {
    console.log(`Downloading PDF report for project ${projectId}`);
    // Implement PDF download logic
  };

  const handleScheduleEmail = () => {
    console.log(`Scheduling email report for project ${projectId}`);
    // Implement email scheduling logic
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive project insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                Generate Report
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleGenerateReport('investor')}>
                Investor Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateReport('management')}>
                Management Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateReport('executive')}>
                Executive Summary
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateReport('cost-analysis')}>
                Cost Analysis Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-2 bg-orange-500 hover:bg-orange-600" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleScheduleEmail}>
            <Mail className="w-4 h-4" />
            Schedule Email
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="year-to-date">Year to Date</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-phases">All Phases</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Forecast */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cash Flow Forecast</CardTitle>
            <Badge variant="outline">7-Month Trend</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="inflow"
                stackId="1"
                stroke="#14b8a6"
                fill="#14b8a6"
                fillOpacity={0.6}
                name="Inflow"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="Outflow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost Breakdown and Phase Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {costBreakdownData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Phase Spend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual by Phase</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={phaseSpendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="phase" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="budget" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Budget" />
                <Bar dataKey="actual" fill="#14b8a6" radius={[8, 8, 0, 0]} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Performance Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vendor Performance Metrics</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">On-Time Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                <span className="text-gray-600">Quality Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600">Cost Efficiency</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendorPerformanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
              <YAxis dataKey="vendor" type="category" width={150} stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => `${value}%`}
              />
              <Legend />
              <Bar dataKey="onTime" fill="#3b82f6" radius={[0, 4, 4, 0]} name="On-Time" />
              <Bar dataKey="quality" fill="#14b8a6" radius={[0, 4, 4, 0]} name="Quality" />
              <Bar dataKey="cost" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleGenerateReport('executive')}>
          <CardContent className="p-6">
            <FileText className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Monthly Executive Report</h3>
            <p className="text-sm text-gray-600 mb-4">Comprehensive overview for stakeholders</p>
            <Button variant="outline" size="sm" className="w-full">Generate</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleGenerateReport('investor')}>
          <CardContent className="p-6">
            <FileText className="w-8 h-8 text-teal-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Investor Update</h3>
            <p className="text-sm text-gray-600 mb-4">Financial performance and forecasts</p>
            <Button variant="outline" size="sm" className="w-full">Generate</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleGenerateReport('cost-analysis')}>
          <CardContent className="p-6">
            <FileText className="w-8 h-8 text-amber-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Cost Analysis Report</h3>
            <p className="text-sm text-gray-600 mb-4">Detailed breakdown by category</p>
            <Button variant="outline" size="sm" className="w-full">Generate</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

