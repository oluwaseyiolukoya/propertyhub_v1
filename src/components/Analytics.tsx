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
import { getAnalyticsOverview, getAnalyticsDashboard, getSystemHealth, getActivityLogs, getCustomerAnalytics } from '../lib/api/analytics';
import { getCustomers } from '../lib/api/customers';
import { getInvoices } from '../lib/api/invoices';
import { computeCustomerChurn, computeMRRChurn, lastNDaysWindow } from '../lib/metrics';
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
import { useCurrency } from '../lib/CurrencyContext';

export function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerAnalytics, setCustomerAnalytics] = useState<any>(null);
  const { formatCurrency } = useCurrency();

  // Pagination for Customer Growth Analysis
  const [growthPage, setGrowthPage] = useState<number>(1);
  const growthPageSize = 5;
  // Independent range for Customer Growth Analysis
  const [growthRange, setGrowthRange] = useState<string>('30d');

  // Custom Report builder state
  const [reportName, setReportName] = useState<string>('');
  const [reportMetric, setReportMetric] = useState<string>('revenue');
  const [reportRange, setReportRange] = useState<string>('30d');
  const [isExportingReport, setIsExportingReport] = useState<boolean>(false);

  // Fetch analytics data
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, growthRange]);

  // Reset growth pagination when range or data changes
  useEffect(() => {
    setGrowthPage(1);
  }, [dateRange, growthRange, analyticsData, customerAnalytics]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, dashboardRes, healthRes, logsRes, customersRes, customerAnalyticsRes] = await Promise.all([
        getAnalyticsOverview({ period: dateRange }),
        getAnalyticsDashboard(),
        getSystemHealth(),
        getActivityLogs({ limit: 50 }),
        getCustomers(),
        getCustomerAnalytics({ period: growthRange }),
      ]);

      console.log('📊 Analytics API Responses:', {
        overview: overviewRes,
        dashboard: dashboardRes,
        health: healthRes,
        logs: logsRes?.data?.length || 0,
        customers: customersRes?.data?.length || 0,
        customerAnalytics: customerAnalyticsRes?.data
      });

      if (overviewRes.error) toast.error(overviewRes.error.error || 'Failed to load analytics overview');
      if (dashboardRes.error) toast.error(dashboardRes.error.error || 'Failed to load analytics dashboard');
      if (healthRes.error) toast.error(healthRes.error.error || 'Failed to load system health');
      if (logsRes.error) toast.error(logsRes.error.error || 'Failed to load activity logs');
      if (customersRes.error) toast.error(customersRes.error.error || 'Failed to load customers');
      if (customerAnalyticsRes.error) toast.error(customerAnalyticsRes.error.error || 'Failed to load customer analytics');

      if (overviewRes.data) {
        console.log('✅ Setting analytics data:', overviewRes.data);
        setAnalyticsData(overviewRes.data);
      }
      if (dashboardRes.data) {
        console.log('✅ Setting dashboard data:', dashboardRes.data);
        setDashboardData(dashboardRes.data);
      }
      if (healthRes.data) {
        console.log('✅ Setting system health data:', healthRes.data);
        setSystemHealth(healthRes.data);
      }
      if (logsRes.data) setActivityLogs(logsRes.data);
      if (customersRes.data) setCustomers(customersRes.data);
      if (customerAnalyticsRes.data) {
        console.log('✅ Setting customer analytics data:', customerAnalyticsRes.data);
        setCustomerAnalytics(customerAnalyticsRes.data);
      }
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh handler
  const handleRefresh = async () => {
    await fetchAnalytics();
  };

  // Derived metrics from DB-backed responses (with robust fallbacks)
  const overview = analyticsData?.overview || null;
  const dailyStats: Array<{ date: string; customers: number; revenue: number }>
    = (analyticsData?.dailyStats as any[]) || [];

  const toNumber = (v: any): number => {
    if (typeof v === 'number') return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Base values from APIs
  let apiTotalCustomers = toNumber(overview?.totalCustomers ?? dashboardData?.overview?.totalCustomers);
  let apiActiveCustomers = toNumber(overview?.activeCustomers ?? dashboardData?.overview?.activeCustomers);
  let apiTotalProperties = toNumber(overview?.totalProperties ?? dashboardData?.overview?.totalProperties);
  let apiTotalUsers = toNumber(overview?.totalUsers ?? dashboardData?.overview?.totalUsers);
  let apiMRR = toNumber((dashboardData?.overview?.mrr ?? overview?.mrr));
  const totalRevenuePeriod = toNumber(overview?.revenue);
  const revenueGrowthPct = toNumber(overview?.revenueGrowth);

  // Fallbacks from customers list when API returns zeros (fresh DBs/mocks)
  const customersCountFallback = Array.isArray(customers) ? customers.length : 0;
  const activeCustomersFallback = Array.isArray(customers)
    ? customers.filter((c: any) => ['active', 'trial'].includes((c.status || '').toLowerCase())).length
    : 0;
  const totalPropertiesFallback = Array.isArray(customers)
    ? customers.reduce((sum: number, c: any) => sum + (toNumber(c.propertiesCount ?? c._count?.properties)), 0)
    : 0;
  const totalUsersFallback = Array.isArray(customers)
    ? customers.reduce((sum: number, c: any) => sum + (toNumber(c._count?.users) || (Array.isArray(c.users) ? c.users.length : 0)), 0)
    : 0;
  const mrrFallback = Array.isArray(customers)
    ? customers.reduce((sum: number, c: any) => sum + toNumber(c.mrr ?? c.plan?.monthlyPrice), 0)
    : 0;

  const totalCustomers = apiTotalCustomers || customersCountFallback;
  const activeCustomers = apiActiveCustomers || activeCustomersFallback;
  const totalProperties = apiTotalProperties || totalPropertiesFallback;
  const totalUsers = apiTotalUsers || totalUsersFallback;
  const mrr = apiMRR || mrrFallback;

  console.log('📈 Computed Analytics Metrics:', {
    totalCustomers,
    activeCustomers,
    totalProperties,
    totalUsers,
    mrr,
    totalRevenuePeriod,
    revenueGrowthPct,
    overview
  });

  const acquisitionCount = dailyStats.reduce((s, d: any) => s + (Number(d.customers) || 0), 0);
  const arpu = activeCustomers > 0 ? Math.round((mrr / activeCustomers) * 100) / 100 : null;
  // Customer churn (30d) using customers list
  const churnWindow = lastNDaysWindow(30);
  const customerChurn = computeCustomerChurn(
    customers.map((c: any) => ({
      id: c.id,
      status: c.status,
      createdAt: c.createdAt,
      subscriptionStartDate: c.subscriptionStartDate,
      updatedAt: c.updatedAt,
      cancelledAt: c.cancelledAt || null,
      mrr: c.mrr || c.plan?.monthlyPrice || 0,
    })),
    churnWindow
  );
  const ltv = arpu !== null && customerChurn.rate !== null && customerChurn.rate > 0
    ? Math.round((arpu / (customerChurn.rate / 100)) * 100) / 100
    : null;
  const mrrChurn = computeMRRChurn(
    customers.map((c: any) => ({
      id: c.id,
      status: c.status,
      createdAt: c.createdAt,
      subscriptionStartDate: c.subscriptionStartDate,
      updatedAt: c.updatedAt,
      cancelledAt: c.cancelledAt || null,
      mrr: c.mrr || c.plan?.monthlyPrice || 0,
    })),
    churnWindow
  );

  // Top customers by MRR (from customers DB)
  const topCustomersByRevenue = customers
    .map((c: any) => ({
      company: c.company,
      plan: c.plan?.name || '—',
      properties: c._count?.properties ?? c.propertiesCount ?? 0,
      revenue: c.mrr || c.plan?.monthlyPrice || 0,
      growth: 0,
    }))
    .sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 5);

  // Geographic aggregation (by country)
  const countryAgg = customers.reduce((acc: Record<string, { customers: number; revenue: number }>, c: any) => {
    const key = c.country || 'Unknown';
    acc[key] = acc[key] || { customers: 0, revenue: 0 };
    acc[key].customers += 1;
    acc[key].revenue += (c.mrr || c.plan?.monthlyPrice || 0);
    return acc;
  }, {});
  const geographicData = Object.entries(countryAgg).map(([region, v]) => ({
    region,
    customers: v.customers,
    revenue: v.revenue,
    growth: 0,
  }));

  const revenueByPlanName = customers.reduce((acc: Record<string, number>, c: any) => {
    const name = c.plan?.name || 'Unknown';
    acc[name] = (acc[name] || 0) + (c.mrr || c.plan?.monthlyPrice || 0);
    return acc;
  }, {} as Record<string, number>);
  const planPerf = (dashboardData?.planDistribution || []).map((pd: any) => ({
    plan: pd.planName || 'Unknown',
    customers: pd.count || 0,
    revenue: revenueByPlanName[pd.planName || 'Unknown'] || 0,
    percentage: totalCustomers ? Math.round(((pd.count || 0) / totalCustomers) * 100) : 0,
  }));
  const dailyRecent = (dailyStats || []).slice(-4);

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

  // --- Custom Reports: export helpers ---
  const toCSV = (rows: Array<Record<string, any>>): string => {
    if (!rows || rows.length === 0) return '';
    const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    const esc = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      if (s.search(/([",\n])/g) >= 0) return `"${s}"`;
      return s;
    };
    const headerLine = headers.join(',');
    const lines = rows.map(r => headers.map(h => esc(r[h])).join(','));
    return [headerLine, ...lines].join('\n');
  };

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateCustomReport = async () => {
    try {
      setIsExportingReport(true);
      // Fetch data based on selected range
      const [ovrRes, dashRes, sysRes, invRes, custRes] = await Promise.all([
        getAnalyticsOverview({ period: reportRange }),
        getAnalyticsDashboard(),
        getSystemHealth(),
        getInvoices(),
        getCustomers(),
      ]);

      const ovr = ovrRes.data || {};
      const dsh = dashRes.data || {};
      const sys = sysRes.data || {};
      const invoices = Array.isArray(invRes?.data) ? invRes.data : [];
      const custList = Array.isArray(custRes?.data) ? custRes.data : [];

      // Compute start date for range
      const now = new Date();
      let start = new Date(now);
      if (reportRange === '7d') start.setDate(start.getDate() - 7);
      else if (reportRange === '30d') start.setDate(start.getDate() - 30);
      else if (reportRange === '90d') start.setDate(start.getDate() - 90);
      else if (reportRange === '1y') start.setFullYear(start.getFullYear() - 1);

      // Aggregate invoice revenue by date within range (paid only)
      const revenueByDate: Record<string, { revenue: number; count: number; currency?: string }> = {};
      for (const inv of invoices) {
        try {
          const created = new Date(inv.createdAt);
          if (created >= start && created <= now && (inv.status === 'paid' || inv.status === 'refunded' || inv.status === 'partially_refunded')) {
            const key = created.toISOString().split('T')[0];
            if (!revenueByDate[key]) revenueByDate[key] = { revenue: 0, count: 0, currency: inv.currency };
            revenueByDate[key].revenue += Number(inv.amount || 0);
            revenueByDate[key].count += 1;
            revenueByDate[key].currency = inv.currency || revenueByDate[key].currency;
          }
        } catch {}
      }

      let rows: Array<Record<string, any>> = [];
      const safeName = (reportName || `custom-report-${reportMetric}-${reportRange}`).replace(/\s+/g, '-').toLowerCase();

      if (reportMetric === 'revenue') {
        // Include dailyStats (date, revenue, customers) and overview revenue
        const ds = (ovr.dailyStats || []) as Array<any>;
        rows = ds.map(d => ({ section: 'daily_stats_overview', date: d.date, customers: d.customers, revenue: d.revenue }));
        rows.unshift({ section: 'overview', period: ovr.period, totalRevenue: (ovr.overview?.revenue ?? 0), mrr: (ovr.overview?.mrr ?? 0) });
        // Append invoice-derived revenue per day
        const invoiceDaily = Object.entries(revenueByDate)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, v]) => ({ section: 'daily_stats_invoices', date, revenue: Math.round(v.revenue * 100) / 100, invoiceCount: v.count, currency: v.currency || 'USD' }));
        rows = rows.concat(invoiceDaily);
      } else if (reportMetric === 'customers') {
        // Include overview customer counts and (if available) growth series
        const ov = ovr.overview || {};
        rows.push({ section: 'customers_overview', totalCustomers: ov.totalCustomers ?? 0, activeCustomers: ov.activeCustomers ?? 0, trialCustomers: ov.trialCustomers ?? 0 });
        // daily new customers
        const ds = (ovr.dailyStats || []) as Array<any>;
        rows = rows.concat(ds.map(d => ({ section: 'daily_new_customers', date: d.date, newCustomers: d.customers })));
        // detailed customers list
        const customerRows = custList.map((c: any) => ({
          section: 'customers_list',
          id: c.id,
          company: c.company,
          owner: c.owner,
          email: c.email,
          status: c.status,
          billingCycle: c.billingCycle,
          planId: c.planId || (c.plan?.id || ''),
          planName: c.plan?.name || '',
          mrr: c.mrr ?? (c.plan?.monthlyPrice ?? 0),
          propertiesCount: c.propertiesCount ?? (c._count?.properties ?? 0),
          usersCount: c._count?.users ?? (Array.isArray(c.users) ? c.users.length : 0),
          country: c.country,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
        rows = rows.concat(customerRows);
      } else if (reportMetric === 'performance') {
        // System health snapshot
        rows.push({ section: 'system_health', status: sys.status || 'unknown', latencyMs: sys.database?.latency ?? null, connections: sys.database?.connections ?? null, dbSize: sys.database?.size ?? null, errorLogs24h: sys.errorLogs ?? 0, timestamp: sys.timestamp || null });
      } else if (reportMetric === 'plan_distribution') {
        const pd = (dsh.planDistribution || []) as Array<any>;
        rows = pd.map(p => ({ section: 'plan_distribution', planId: p.planId, planName: p.planName, customers: p.count }));
      } else if (reportMetric === 'daily_stats') {
        const ds = (ovr.dailyStats || []) as Array<any>;
        rows = ds.map(d => ({ section: 'daily_stats', date: d.date, customers: d.customers, revenue: d.revenue }));
      } else {
        // Default: overview snapshot
        const ov = ovr.overview || {};
        rows.push({ section: 'overview', totalCustomers: ov.totalCustomers ?? 0, activeCustomers: ov.activeCustomers ?? 0, mrr: ov.mrr ?? 0, revenue: ov.revenue ?? 0 });
      }

      if (!rows.length) {
        toast.info('No data for selected report.');
        return;
      }

      const csv = toCSV(rows);
      downloadTextFile(csv, `${safeName}.csv`);
      toast.success('Report exported successfully');
    } catch (e: any) {
      console.error('Custom report export failed:', e);
      toast.error('Failed to generate report');
    } finally {
      setIsExportingReport(false);
    }
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
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics…</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !overview && (!customers || customers.length === 0) && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <p className="text-lg font-semibold text-gray-900">No analytics data yet</p>
            <p className="mt-2 text-gray-600">Once customers and invoices are created, your analytics will appear here. You can also try changing the date range.</p>
            <div className="mt-4">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </div>
      )}

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
                <div className="text-2xl font-bold">{totalCustomers}</div>
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>{overview?.customerGrowth ? `${overview.customerGrowth}%` : '+0%'} vs prev.</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(mrr)}</div>
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>{revenueGrowthPct ? `${Math.round(revenueGrowthPct * 10) / 10}%` : '+0%'} vs prev.</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProperties.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
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
                {systemHealth && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-600">{systemHealth.environment} • mode: {systemHealth.mode}{systemHealth.cached ? ' • cached' : ''}</span>
                    {systemHealth.mode !== 'live' && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Simulated in dev</span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>System Uptime</span>
                  </div>
                  <span className="font-medium">
                    {typeof systemHealth?.uptimePercent === 'number'
                      ? `${systemHealth.uptimePercent.toFixed(2)}%`
                      : (systemHealth?.status === 'healthy' ? '99.9%' : '—')}
                  </span>
                </div>
                <Progress value={typeof systemHealth?.uptimePercent === 'number' ? systemHealth.uptimePercent : 99.9} className="h-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>Avg Response Time</span>
                  </div>
                  <span className="font-medium">
                    {typeof systemHealth?.database?.latency === 'number' && systemHealth.database.latency !== null
                      ? `${systemHealth.database.latency}ms`
                      : '—'}
                  </span>
                </div>
                <Progress value={85} className="h-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>Open Support Tickets</span>
                  </div>
                  <span className="font-medium">
                    {typeof systemHealth?.support?.open === 'number'
                      ? systemHealth.support.open
                      : '—'}
                  </span>
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
                        <p className="font-medium">{formatCurrency(region.revenue)}</p>
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
              {dailyRecent.length > 0 ? (
                <div className="space-y-4">
                  {dailyRecent.map((data: any, index: number) => {
                    const customerCount = Number(data.customers) || 0;
                    const revenueAmount = Number(data.revenue) || 0;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium">{new Date(data.date).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-600">{customerCount} new customer{customerCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="text-sm text-green-600">+{customerCount}</p>
                              <p className="text-xs text-gray-500">New</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-red-600">0</p>
                              <p className="text-xs text-gray-500">Churned</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-blue-600">+{customerCount}</p>
                              <p className="text-xs text-gray-500">Net Growth</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-gray-700">{formatCurrency(revenueAmount)}</p>
                              <p className="text-xs text-gray-500">Revenue</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No customer growth data yet</p>
                  <p className="text-sm mt-1">Data will appear once customers are added within the selected period</p>
                </div>
              )}
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
                <div className="text-2xl font-bold">
                  {customerAnalytics?.acquisition?.current ?? acquisitionCount}
                </div>
                <div className="flex items-center space-x-1 text-xs mt-1">
                  {customerAnalytics?.acquisition?.growth !== undefined && customerAnalytics.acquisition.growth > 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">+{Math.round(customerAnalytics.acquisition.growth)}%</span>
                    </>
                  ) : customerAnalytics?.acquisition?.growth !== undefined && customerAnalytics.acquisition.growth < 0 ? (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">{Math.round(customerAnalytics.acquisition.growth)}%</span>
                    </>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                  <span className="text-muted-foreground">vs previous period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customerAnalytics?.churn?.customerChurnRate !== undefined
                    ? `${customerAnalytics.churn.customerChurnRate}%`
                    : customerChurn.rate !== null ? `${customerChurn.rate}%` : '—'}
                </div>
                <p className="text-xs text-muted-foreground">
                  MRR churn: {customerAnalytics?.churn?.mrrChurnRate !== undefined
                    ? `${customerAnalytics.churn.mrrChurnRate}%`
                    : mrrChurn.rate !== null ? `${mrrChurn.rate}%` : '—'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Revenue/Customer</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customerAnalytics?.arpu !== undefined
                    ? formatCurrency(customerAnalytics.arpu)
                    : arpu !== null ? formatCurrency(arpu) : '—'}
                </div>
                <p className="text-xs text-muted-foreground">Avg revenue per active customer</p>
              </CardContent>
            </Card>
          </div>

          {/* Customer Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Growth Analysis</CardTitle>
              <CardDescription>Daily customer acquisition and retention trends</CardDescription>
              <div className="flex items-center gap-3 pt-2">
                <Label htmlFor="growth-range" className="text-xs text-gray-600">Range</Label>
                <Select value={growthRange} onValueChange={(v) => setGrowthRange(v)}>
                  <SelectTrigger id="growth-range" className="h-8 w-[140px]">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last 1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {customerAnalytics?.dailyGrowth && customerAnalytics.dailyGrowth.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const total = customerAnalytics.dailyGrowth?.length || 0;
                    const totalPages = Math.max(1, Math.ceil(total / growthPageSize));
                    const currentPage = Math.min(growthPage, totalPages);
                    const startIdx = (currentPage - 1) * growthPageSize;
                    const endIdx = startIdx + growthPageSize;
                    return customerAnalytics.dailyGrowth.slice(startIdx, endIdx).map((data: any, index: number) => (
                      <div key={index} className="grid grid-cols-5 gap-4 p-3 border rounded-lg">
                        <div className="text-center">
                          <p className="font-medium">{new Date(data.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">Daily</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">+{data.newCustomers}</p>
                          <p className="text-xs text-gray-500">New Customers</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-600">{data.churned > 0 ? `-${data.churned}` : '—'}</p>
                          <p className="text-xs text-gray-500">Churned</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-lg font-bold ${data.netGrowth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{data.netGrowth >= 0 ? '+' : ''}{data.netGrowth}</p>
                          <p className="text-xs text-gray-500">Net Growth</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{data.total}</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                      </div>
                    ));
                  })()}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGrowthPage((p) => Math.max(1, p - 1))}
                      disabled={growthPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-gray-600">
                      Page {Math.min(growthPage, Math.max(1, Math.ceil((customerAnalytics.dailyGrowth?.length || 0) / growthPageSize)))} of {Math.max(1, Math.ceil((customerAnalytics.dailyGrowth?.length || 0) / growthPageSize))}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const totalPages = Math.max(1, Math.ceil((customerAnalytics.dailyGrowth?.length || 0) / growthPageSize));
                        setGrowthPage((p) => Math.min(totalPages, p + 1));
                      }}
                      disabled={growthPage >= Math.max(1, Math.ceil((customerAnalytics.dailyGrowth?.length || 0) / growthPageSize))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : dailyStats.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const total = dailyStats?.length || 0;
                    const totalPages = Math.max(1, Math.ceil(total / growthPageSize));
                    const currentPage = Math.min(growthPage, totalPages);
                    const startIdx = (currentPage - 1) * growthPageSize;
                    const endIdx = startIdx + growthPageSize;
                    return dailyStats.slice(startIdx, endIdx).map((data: any, index: number) => (
                      <div key={index} className="grid grid-cols-5 gap-4 p-3 border rounded-lg">
                        <div className="text-center">
                          <p className="font-medium">{new Date(data.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">Daily</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">+{data.customers}</p>
                          <p className="text-xs text-gray-500">New Customers</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-600">—</p>
                          <p className="text-xs text-gray-500">Churned</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600">+{data.customers}</p>
                          <p className="text-xs text-gray-500">Net Growth</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{totalCustomers}</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                      </div>
                    ));
                  })()}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGrowthPage((p) => Math.max(1, p - 1))}
                      disabled={growthPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-gray-600">
                      Page {Math.min(growthPage, Math.max(1, Math.ceil((dailyStats?.length || 0) / growthPageSize)))} of {Math.max(1, Math.ceil((dailyStats?.length || 0) / growthPageSize))}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const totalPages = Math.max(1, Math.ceil((dailyStats?.length || 0) / growthPageSize));
                        setGrowthPage((p) => Math.min(totalPages, p + 1));
                      }}
                      disabled={growthPage >= Math.max(1, Math.ceil((dailyStats?.length || 0) / growthPageSize))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No customer growth data yet</p>
                  <p className="text-sm mt-1">Data will appear once customers are added within the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Revenue</CardTitle>
              <CardDescription>Highest value customers and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              {(customerAnalytics?.topCustomers && customerAnalytics.topCustomers.length > 0) || topCustomersByRevenue.length > 0 ? (
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
                    {(customerAnalytics?.topCustomers || topCustomersByRevenue).map((customer: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{customer.company}</TableCell>
                        <TableCell>
                          <Badge variant={
                            customer.plan?.toLowerCase().includes('enterprise') ? 'default' :
                            customer.plan?.toLowerCase().includes('professional') ? 'secondary' : 'outline'
                          }>
                            {customer.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(customer.mrr || customer.revenue || 0)}</TableCell>
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
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No customer revenue data yet</p>
                  <p className="text-sm mt-1">Top customers will appear once revenue data is available</p>
                </div>
              )}
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
                <div className="text-2xl font-bold">{formatCurrency(mrr)}</div>
                <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ARR</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(mrr * 12)}</div>
                <p className="text-xs text-muted-foreground">Annual Recurring Revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ltv !== null ? formatCurrency(ltv) : '—'}</div>
                <p className="text-xs text-muted-foreground">Average Lifetime Value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.revenueGrowth ? `${overview.revenueGrowth.toFixed(1)}%` : '—'}</div>
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
                {planPerf.map((plan: { plan: string; customers: number; revenue: number; percentage: number }, index: number) => (
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
                        <p className="font-medium">{formatCurrency(plan.revenue)}/mo</p>
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
                  {dailyRecent.map((data: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(data.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">{totalCustomers} customers</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency((Number(data.revenue) || 0))}</p>
                        <div className="flex items-center space-x-1 text-xs text-green-600">
                          <ArrowUpRight className="h-3 w-3" />
                          <span>+{revenueGrowthPct ? Math.round(revenueGrowthPct * 10) / 10 : 0}%</span>
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
                  <span className="font-medium">{arpu !== null ? formatCurrency(arpu) : '—'}</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Customer Lifetime Value</span>
                  </div>
                  <span className="font-medium">{ltv !== null ? formatCurrency(ltv) : '—'}</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Monthly Churn Rate</span>
                  </div>
                  <span className="font-medium">{mrrChurn.rate !== null ? `${mrrChurn.rate}%` : '—'}</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    <span>Monthly Growth Rate</span>
                  </div>
                  <span className="font-medium">{overview?.revenueGrowth ? `${overview.revenueGrowth.toFixed(1)}%` : '—'}</span>
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
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground">65% of total users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground">Average session time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mobile Usage</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground">vs — web</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
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
                <div className="text-sm text-gray-600">No usage data</div>
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
                      <span className="font-medium">—</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        <span>Web Application</span>
                      </div>
                      <span className="font-medium">—</span>
                    </div>
                    <Progress value={0} className="h-2" />
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
                  <span className="font-medium">—</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span>Daily Active Users</span>
                  </div>
                  <span className="font-medium">—</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span>Avg Session Duration</span>
                  </div>
                  <span className="font-medium">—</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Bounce Rate</span>
                  </div>
                  <span className="font-medium">—</span>
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
                <div className="text-2xl font-bold">{systemHealth?.status === 'healthy' ? '99.9%' : '—'}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemHealth?.database?.latency ? `${systemHealth.database.latency}ms` : '—'}</div>
                <p className="text-xs text-muted-foreground">Page load average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemHealth?.errorLogs !== undefined ? `${systemHealth.errorLogs}` : '—'}</div>
                <p className="text-xs text-muted-foreground">System error rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
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
                  <span className="font-medium">—</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    <span>In Progress</span>
                    </div>
                  <span className="font-medium">—</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Resolved</span>
                    </div>
                  <span className="font-medium">—</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="font-medium text-gray-600">Avg Resolution Time</h3>
                    <p className="text-2xl font-bold text-blue-600">—</p>
                    <p className="text-sm text-gray-500">—</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="font-medium text-gray-600">Customer Satisfaction</h3>
                    <p className="text-2xl font-bold text-green-600">—</p>
                    <p className="text-sm text-gray-500">—</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="font-medium text-gray-600">NPS Score</h3>
                    <p className="text-2xl font-bold text-purple-600">—</p>
                    <p className="text-sm text-gray-500">—</p>
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
                    <span className="font-medium">{systemHealth?.status === 'healthy' ? '99.9%' : '—'}</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
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
                    <span className="font-medium">{systemHealth?.database?.latency ? `${systemHealth.database.latency}ms` : '—'}</span>
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
                    <span className="font-medium">—</span>
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
                  <Input id="report-name" placeholder="e.g., Q3 Performance Analysis" value={reportName} onChange={(e) => setReportName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metrics">Select Metrics</Label>
                  <Select value={reportMetric} onValueChange={(v) => setReportMetric(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose metrics to include" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue Metrics</SelectItem>
                      <SelectItem value="customers">Customer Analytics</SelectItem>
                      <SelectItem value="plan_distribution">Plan Distribution</SelectItem>
                      <SelectItem value="daily_stats">Daily Stats</SelectItem>
                      <SelectItem value="performance">System Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-range-report">Date Range</Label>
                  <Select value={reportRange} onValueChange={(v) => setReportRange(v)}>
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

                <Button className="w-full" onClick={handleGenerateCustomReport} disabled={isExportingReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  {isExportingReport ? 'Generating…' : 'Generate Custom Report'}
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
