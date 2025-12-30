import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Info, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { getCurrencySymbol as getCurrencySymbolFromLib } from '../../../lib/currency';

interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  netCashFlow: number;
  inflowBreakdown?: {
    clientPayments: number;
    loans: number;
    equity: number;
    grants: number;
    other: number;
  };
  outflowBreakdown?: {
    labor: number;
    materials: number;
    equipment: number;
    permits: number;
    professionalFees: number;
    contingency: number;
    other: number;
  };
}

interface CashFlowChartProps {
  projectId: string;
  periodType?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  showBreakdown?: boolean;
  height?: number;
  currency?: string;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  projectId,
  periodType: initialPeriodType = 'monthly',
  showBreakdown: initialShowBreakdown = false,
  height = 300,
  currency = 'NGN',
}) => {
  const [data, setData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState(initialPeriodType);
  const [showBreakdown, setShowBreakdown] = useState(initialShowBreakdown);
  const [viewMode, setViewMode] = useState<'chart' | 'breakdown'>('chart');
  const [source, setSource] = useState<string>('realtime');

  // Date range state
  const [dateRange, setDateRange] = useState<'last6months' | 'last3months' | 'last12months' | 'custom'>('last6months');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchCashFlow();
  }, [projectId, periodType, dateRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    switch (dateRange) {
      case 'last3months':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'last6months':
        start.setMonth(start.getMonth() - 6);
        break;
      case 'last12months':
        start.setMonth(start.getMonth() - 12);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            startDate: customStartDate,
            endDate: customEndDate
          };
        }
        // Default to last 6 months if custom dates not set
        start.setMonth(start.getMonth() - 6);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const fetchCashFlow = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const { startDate, endDate } = getDateRange();
      const url = `/api/developer-dashboard/projects/${projectId}/cash-flow?periodType=${periodType}&startDate=${startDate}&endDate=${endDate}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cash flow data');
      }

      const result = await response.json();
      setData(result.data || []);
      setSource(result.source || 'realtime');
    } catch (error: any) {
      console.error('Failed to fetch cash flow:', error);
      toast.error('Failed to load cash flow data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustomDates = () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      toast.error('Start date must be before end date');
      return;
    }
    setDateRange('custom');
    setShowDatePicker(false);
    toast.success('Custom date range applied');
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'last3months':
        return 'Last 3 Months';
      case 'last6months':
        return 'Last 6 Months';
      case 'last12months':
        return 'Last 12 Months';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${customStartDate} to ${customEndDate}`;
        }
        return 'Custom Range';
      default:
        return 'Last 6 Months';
    }
  };

  // Use centralized currency symbol function
  const getCurrencySymbol = (currencyCode: string) => {
    return getCurrencySymbolFromLib(currencyCode);
  };

  const formatCurrency = (value: number) => {
    // Use centralized currency symbol to avoid "F CFA" issue with Intl.NumberFormat
    const symbol = getCurrencySymbolFromLib(currency);
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${symbol}${formatted}`;
  };

  const calculateTotals = () => {
    const totalInflow = data.reduce((sum, item) => sum + item.inflow, 0);
    const totalOutflow = data.reduce((sum, item) => sum + item.outflow, 0);
    const netCashFlow = totalInflow - totalOutflow;

    return { totalInflow, totalOutflow, netCashFlow };
  };

  const totals = calculateTotals();

  // Prepare breakdown data for bar charts
  const inflowBreakdownData = data.length > 0 && data[0].inflowBreakdown
    ? Object.entries(data[0].inflowBreakdown).map(([key, value]) => ({
        category: key.replace(/([A-Z])/g, ' $1').trim(),
        amount: value,
      }))
    : [];

  const outflowBreakdownData = data.length > 0 && data[0].outflowBreakdown
    ? Object.entries(data[0].outflowBreakdown).map(([key, value]) => ({
        category: key.replace(/([A-Z])/g, ' $1').trim(),
        amount: value,
      }))
    : [];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-400 animate-pulse" />
              <p>Loading cash flow data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle>Cash Flow Analysis</CardTitle>
              {source === 'snapshot' && (
                <Badge variant="secondary" className="text-xs">
                  <Info className="h-3 w-3 mr-1" />
                  Cached
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={viewMode === 'chart' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('chart')}
              >
                Chart
              </Button>
              <Button
                variant={viewMode === 'breakdown' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('breakdown')}
              >
                Breakdown
              </Button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Date Range:</span>

            <div className="flex items-center space-x-2 flex-1">
              <Button
                variant={dateRange === 'last3months' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('last3months')}
              >
                Last 3 Months
              </Button>
              <Button
                variant={dateRange === 'last6months' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('last6months')}
              >
                Last 6 Months
              </Button>
              <Button
                variant={dateRange === 'last12months' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('last12months')}
              >
                Last 12 Months
              </Button>

              {/* Custom Date Range Popover */}
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange === 'custom' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Custom Range
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Select Custom Date Range</h4>
                      <p className="text-xs text-gray-500">
                        Choose start and end dates for your cash flow analysis
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="end-date" className="text-xs">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDatePicker(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApplyCustomDates}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Display current date range */}
            <Badge variant="outline" className="ml-auto">
              {getDateRangeLabel()}
            </Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inflow</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.totalInflow)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Outflow</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totals.totalOutflow)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div
            className={`${
              totals.netCashFlow >= 0 ? 'bg-blue-50' : 'bg-orange-50'
            } p-4 rounded-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Cash Flow</p>
                <p
                  className={`text-2xl font-bold ${
                    totals.netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}
                >
                  {formatCurrency(totals.netCashFlow)}
                </p>
              </div>
              <DollarSign
                className={`h-8 w-8 ${
                  totals.netCashFlow >= 0 ? 'text-blue-500' : 'text-orange-500'
                }`}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No cash flow data available yet</p>
              <p className="text-sm mt-1">Data will appear as funding and expenses are recorded</p>
            </div>
          </div>
        ) : viewMode === 'chart' ? (
          /* Main Cash Flow Chart */
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `${getCurrencySymbol(currency)}${(value / 1000000).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="inflow"
                stroke="#14b8a6"
                fill="url(#colorInflow)"
                strokeWidth={2}
                name="Inflow"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stroke="#ef4444"
                fill="url(#colorOutflow)"
                strokeWidth={2}
                name="Outflow"
              />
              <Area
                type="monotone"
                dataKey="netCashFlow"
                stroke="#3b82f6"
                fill="url(#colorNet)"
                strokeWidth={2}
                name="Net Cash Flow"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          /* Breakdown View */
          <div className="grid grid-cols-2 gap-6">
            {/* Inflow Breakdown */}
            <div>
              <h4 className="font-semibold mb-4 text-green-600">Inflow Breakdown</h4>
              {inflowBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={inflowBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis tickFormatter={(value) => `${getCurrencySymbol(currency)}${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#14b8a6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No inflow breakdown available
                </p>
              )}
            </div>

            {/* Outflow Breakdown */}
            <div>
              <h4 className="font-semibold mb-4 text-red-600">Outflow Breakdown</h4>
              {outflowBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={outflowBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis tickFormatter={(value) => `${getCurrencySymbol(currency)}${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No outflow breakdown available
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;

