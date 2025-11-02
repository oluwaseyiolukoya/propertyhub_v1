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
  getCustomers,
  type Customer
} from '../lib/api';
import { getInvoices, createRefund } from '../lib/api/invoices';
import { getSystemSetting } from '../lib/api/system';
import { initializeSocket, subscribeToCustomerEvents, unsubscribeFromCustomerEvents } from '../lib/socket';
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
import { useCurrency } from '../lib/CurrencyContext';
import { computeCustomerChurn, computeMRRChurn, lastNDaysWindow } from '../lib/metrics';

export function BillingPlansAdmin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const { currency: selectedCurrency, setCurrency: setSelectedCurrency, currencies, getCurrency, convertAmount, formatCurrency } = useCurrency();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; invoice?: any }>(() => ({ open: false }));
  const [viewDialog, setViewDialog] = useState<{ open: boolean; invoice?: any; transaction?: any }>(() => ({ open: false }));
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);

  // Transactions tab filters & controls
  const [txShowFilters, setTxShowFilters] = useState(false);
  const [txStatusFilter, setTxStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed' | 'refunded'>('all');
  const [txPlanFilter, setTxPlanFilter] = useState<string>('all'); // plan id or 'all'
  const [txMinAmount, setTxMinAmount] = useState<string>('');
  const [txMaxAmount, setTxMaxAmount] = useState<string>('');
  const [txStartDate, setTxStartDate] = useState<string>(''); // YYYY-MM-DD
  const [txEndDate, setTxEndDate] = useState<string>('');

  const clearTxFilters = () => {
    setTxStatusFilter('all');
    setTxPlanFilter('all');
    setTxMinAmount('');
    setTxMaxAmount('');
    setTxStartDate('');
    setTxEndDate('');
  };

  // Current currency details from context
  const currentCurrency = getCurrency(selectedCurrency);

  // Fetch plans on component mount
  useEffect(() => {
    fetchPlans();
    fetchCustomersData();
    fetchInvoices();
    // Load brand logo from system settings (prefer platform_logo_url; fallback to brand_logo_url)
    (async () => {
      try {
        let res = await getSystemSetting('platform_logo_url');
        if (res?.data?.value) {
          setBrandLogoUrl(res.data.value as string);
        } else {
          // Fallback to legacy key
          res = await getSystemSetting('brand_logo_url');
          if (res?.data?.value) setBrandLogoUrl(res.data.value as string);
        }
      } catch {}
    })();
    // Realtime: refresh customers when they update (e.g., cancellations)
    const token = localStorage.getItem('token');
    if (token) {
      try { initializeSocket(token); } catch {}
      try {
        subscribeToCustomerEvents({
          onCreated: () => fetchCustomersData(),
          onUpdated: () => fetchCustomersData(),
          onDeleted: () => fetchCustomersData(),
        });
      } catch {}
    }
    return () => {
      try { unsubscribeFromCustomerEvents(); } catch {}
    };
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

  const fetchCustomersData = async () => {
    try {
      setCustomersLoading(true);
      const response = await getCustomers({});
      if (response.error) {
        toast.error(response.error.error || 'Failed to load customers');
      } else if (response.data) {
        setCustomers(response.data as unknown as Customer[]);
      }
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await getInvoices();
      if (!response.error) setInvoices(response.data || []);
    } catch {}
  };

  // Transform API plans to match component format
  const subscriptionPlans = plans.map((plan: any) => {
    const planCurrency = plan.currency || 'USD';
    const customersOnPlan = customers.filter(c => c.planId === plan.id && (c.status === 'active' || c.status === 'trial'));
    const monthlyRevenueFromPlan = customersOnPlan.reduce((sum, c) => sum + convertAmount((c.mrr || 0), planCurrency, selectedCurrency), 0);
    return ({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      monthlyPrice: plan.priceMonthly || plan.monthlyPrice,
      yearlyPrice: plan.priceYearly || plan.annualPrice || ((plan.priceMonthly || plan.monthlyPrice) * 10),
      maxProperties: plan.propertyLimit,
      maxUnits: plan.userLimit,
      currency: planCurrency,
      features: Array.isArray(plan.features) ? plan.features :
                (typeof plan.features === 'string' ? JSON.parse(plan.features) : []),
      activeSubscriptions: customersOnPlan.length,
      revenue: monthlyRevenueFromPlan,
      status: plan.isActive ? 'active' : 'deprecated',
      created: new Date(plan.createdAt).toISOString().split('T')[0]
    });
  });

  // Calculate billing overview from plans
  const totalMonthlyRevenue = subscriptionPlans.reduce((sum, plan) => sum + plan.revenue, 0);
  const totalActiveSubscriptions = subscriptionPlans.reduce((sum, plan) => sum + plan.activeSubscriptions, 0);
  const avgRevenuePer = totalActiveSubscriptions > 0
    ? Math.round((totalMonthlyRevenue / totalActiveSubscriptions) * 100) / 100
    : null;

  const billingOverview = {
    totalRevenue: totalMonthlyRevenue * 12,
    monthlyRevenue: totalMonthlyRevenue,
    activeSubscriptions: totalActiveSubscriptions,
    churnRate: null as number | null,
    avgRevenuePer
  };

  // Compute 30-day churn metrics
  const churnWindow = lastNDaysWindow(30);
  const customerChurn = computeCustomerChurn(
    customers.map(c => ({
      id: c.id as any,
      status: (c as any).status,
      createdAt: (c as any).createdAt,
      subscriptionStartDate: (c as any).subscriptionStartDate,
      updatedAt: (c as any).updatedAt,
      cancelledAt: null,
      mrr: (c as any).mrr || 0,
    })),
    churnWindow
  );
  const mrrChurn = computeMRRChurn(
    customers.map(c => ({
      id: c.id as any,
      status: (c as any).status,
      createdAt: (c as any).createdAt,
      subscriptionStartDate: (c as any).subscriptionStartDate,
      updatedAt: (c as any).updatedAt,
      cancelledAt: null,
      mrr: (c as any).mrr || 0,
    })),
    churnWindow
  );

  // Derive transactions from invoices if present; fallback to customers
  const transactions = invoices.length > 0
    ? invoices.map((inv: any, idx: number) => ({
        id: idx + 1,
        customer: inv.customer?.company || customers.find((c: any) => c.id === inv.customerId)?.company || '—',
        plan: getPlanNameForCustomer(inv.customerId),
        amount: inv.amount,
        refundedAmount: Array.isArray(inv.refunds) ? inv.refunds.reduce((s: number, r: any) => s + (r.amount || 0), 0) : 0,
        status:
          inv.status === 'paid'
            ? 'completed'
            : inv.status === 'refunded' || inv.status === 'partially_refunded'
            ? 'refunded'
            : 'pending',
        date: new Date(inv.createdAt).toISOString().split('T')[0],
        type: 'invoice',
        invoice: inv.invoiceNumber,
        _invoiceId: inv.id,
      }))
    : [...customers]
        .sort((a, b) => {
          const da = new Date((a as any).subscriptionStartDate || a.createdAt).getTime();
          const db = new Date((b as any).subscriptionStartDate || b.createdAt).getTime();
          return db - da;
        })
        .slice(0, 10)
        .map((c, idx) => ({
          id: idx + 1,
          customer: c.company,
          plan: (plans.find(p => p.id === (c as any).planId)?.name) || '—',
          amount: (c as any).mrr || 0,
          status: ((c as any).status === 'active' || (c as any).status === 'trial') ? 'completed' : 'pending',
          date: new Date(((c as any).subscriptionStartDate || c.createdAt)).toISOString().split('T')[0],
          type: 'subscription',
          invoice: `SUB-${(c.id || '').slice(0, 6).toUpperCase()}`,
        }));

  // Helpers for transactions filtering/export
  const getTxAmountInSelected = (tx: any) => {
    if (tx && tx._invoiceId) {
      const inv = invoices.find((i: any) => i.id === tx._invoiceId);
      const src = inv?.currency || 'USD';
      return convertAmount(tx.amount || 0, src, selectedCurrency);
    }
    const planCurrency = (plans.find((p: any) => p.name === tx?.plan)?.currency) || 'USD';
    return convertAmount(tx?.amount || 0, planCurrency, selectedCurrency);
  };

  // Dynamically load jsPDF from CDN and return constructor
  const ensureJsPdf = async (): Promise<any> => {
    const w = window as any;
    if (w.jspdf && w.jspdf.jsPDF) return w.jspdf.jsPDF;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.body.appendChild(s);
    });
    return (window as any).jspdf.jsPDF;
  };

  // Convert image URL to data URL (for logo)
  const toDataUrl = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const filteredTransactions = transactions.filter((tx: any) => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matches =
        tx.customer.toLowerCase().includes(q) ||
        (tx.plan || '').toLowerCase().includes(q) ||
        (tx.invoice || '').toLowerCase().includes(q);
      if (!matches) return false;
    }

    // Status
    if (txStatusFilter !== 'all' && tx.status !== txStatusFilter) return false;

    // Plan
    if (txPlanFilter !== 'all') {
      const found = plans.find(p => p.name === tx.plan);
      if (!found || found.id !== txPlanFilter) return false;
    }

    // Amount range (in selected currency)
    const amt = getTxAmountInSelected(tx);
    const minA = txMinAmount ? parseFloat(txMinAmount) : undefined;
    const maxA = txMaxAmount ? parseFloat(txMaxAmount) : undefined;
    if (minA !== undefined && amt < minA) return false;
    if (maxA !== undefined && amt > maxA) return false;

    // Date range
    if (txStartDate && new Date(tx.date) < new Date(txStartDate)) return false;
    if (txEndDate && new Date(tx.date) > new Date(txEndDate)) return false;

    return true;
  });

  const exportTransactionsCSV = () => {
    const headers = ['Customer','Plan','Amount','Currency','Status','Date','Invoice'];
    const rows = filteredTransactions.map((tx: any) => {
      const plan = plans.find(p => p.name === tx.plan);
      const currency = plan?.currency || 'USD';
      const amountInSelected = getTxAmountInSelected(tx);
      return [
        tx.customer,
        tx.plan || '',
        amountInSelected.toString(),
        selectedCurrency,
        tx.status,
        tx.date,
        tx.invoice
      ];
    });
    const csv = [headers, ...rows]
      .map(r => r.map(field => {
        const s = String(field ?? '');
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const billingIssues: { id: number; customer: string; issue: string; description: string; severity: 'low' | 'medium' | 'high'; created: string; status: 'pending' | 'in-progress' | 'resolved' }[] = customers
    .filter(c => c.status === 'suspended')
    .map((c, idx) => ({
      id: idx + 1,
      customer: c.company,
      issue: 'Account Suspended',
      description: 'Customer account is suspended. Review billing status.',
      severity: 'medium',
      created: new Date(c.updatedAt).toISOString().split('T')[0],
      status: 'pending'
    }));

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const getLastNMonths = (n: number) => {
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      months.push({
        label: `${monthNames[start.getMonth()]} ${start.getFullYear()}`,
        start,
        end
      });
    }
    return months;
  };

  const last6Months = getLastNMonths(6);

  // Helper checks
  const isActiveAt = (c: any, at: Date) => {
    const subStart = (c as any).subscriptionStartDate ? new Date((c as any).subscriptionStartDate) : null;
    const createdAt = new Date((c as any).createdAt);
    const status = (c as any).status;
    // Consider trial/active as active; treat lack of subStart as createdAt
    const startDate = subStart || createdAt;
    return startDate <= at && (status === 'active' || status === 'trial');
  };

  const within = (dateStr: string | null | undefined, start: Date, end: Date) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d <= end;
  };

  // Build DB-backed series from customers
  const monthlySeries = last6Months.map(({ label, start, end }) => {
    // MRR: sum MRR of customers active at end of month
    const mrr = customers.reduce((sum, c: any) => {
      if (isActiveAt(c, end)) {
        const m = (c as any).mrr || 0;
        const srcCurrency = (plans.find(p => p.id === c.planId)?.currency) || (c.plan?.currency) || 'USD';
        return sum + convertAmount(m, srcCurrency, selectedCurrency);
      }
      return sum;
    }, 0);

    // New subscriptions in month
    const newSubs = customers.filter((c: any) => {
      const s = (c as any).subscriptionStartDate || (c as any).createdAt;
      return within(s, start, end);
    }).length;

    // Cancellations in month
    const cancellations = customers.filter((c: any) => {
      return (c as any).status === 'cancelled' && within((c as any).updatedAt, start, end);
    }).length;

    return { label, mrr, newSubs, cancellations };
  });

  const mrrTrend = monthlySeries.map(s => s.mrr);
  const newSubsTrend = monthlySeries.map(s => s.newSubs);
  const cancellationsTrend = monthlySeries.map(s => s.cancellations);
  const monthLabels = monthlySeries.map(s => s.label);

  // Helper to resolve plan name for a customer's current plan (use function declaration for hoisting)
  function getPlanNameForCustomer(customerId: string): string {
    const c: any = customers.find((x: any) => x.id === customerId);
    if (!c) return '—';
    const plan = plans.find((p: any) => p.id === c.planId);
    return plan?.name || '—';
  }

  // Lightweight SVG charts
  const LineChart = ({ data, labels, height = 140 }: { data: number[]; labels: string[]; height?: number }) => {
    const width = 400;
    const maxY = Math.max(1, ...data);
    const minY = 0;
    const padding = 24;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const points = data.map((v, i) => {
      const x = padding + (innerW * (i / Math.max(1, data.length - 1)));
      const y = padding + innerH - ((v - minY) / (maxY - minY || 1)) * innerH;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
        <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={points} />
      </svg>
    );
  };

  const BarChart = ({ data, labels, height = 140, color = '#0ea5e9' }: { data: number[]; labels: string[]; height?: number; color?: string }) => {
    const width = 400;
    const maxY = Math.max(1, ...data);
    const padding = 24;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const barW = innerW / Math.max(1, data.length * 1.5);
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
        {data.map((v, i) => {
          const x = padding + i * (innerW / data.length) + (barW / 2);
          const h = ((v) / (maxY || 1)) * innerH;
          const y = padding + innerH - h;
          return <rect key={i} x={x} y={y} width={barW} height={h} fill={color} rx={3} />;
        })}
      </svg>
    );
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setIsCreatePlanOpen(true);
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsCreatePlanOpen(true);
  };

  const handleSubmitPlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const featuresText = formData.get('features') as string;
      const features = featuresText.split('\n').filter(f => f.trim() !== '');

      const planData = {
        name: formData.get('planName') as string,
        description: formData.get('planDescription') as string,
        monthlyPrice: parseFloat(formData.get('monthlyPrice') as string),
        annualPrice: parseFloat(formData.get('yearlyPrice') as string),
        currency: selectedCurrency,
        propertyLimit: parseInt(formData.get('maxProperties') as string),
        userLimit: parseInt(formData.get('maxUnits') as string),
        storageLimit: parseInt(formData.get('storageLimit') as string) || 1000,
        features,
        isActive: formData.get('active') === 'on',
        isPopular: formData.get('popular') === 'on'
      };

      let response;
      if (selectedPlan) {
        response = await updateBillingPlan(selectedPlan.id, planData);
      } else {
        response = await createBillingPlan(planData);
      }

      if (response.error) {
        toast.error(response.error.error || `Failed to ${selectedPlan ? 'update' : 'create'} plan`);
      } else {
        toast.success(`Plan ${selectedPlan ? 'updated' : 'created'} successfully!`);
        setIsCreatePlanOpen(false);
        setSelectedPlan(null);
        await fetchPlans();
      }
    } catch (error) {
      console.error('Error submitting plan:', error);
      toast.error(`Failed to ${selectedPlan ? 'update' : 'create'} plan`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await deleteBillingPlan(planId);

      if (response.error) {
        toast.error(response.error.error || 'Failed to delete plan');
      } else {
        toast.success('Plan deleted successfully!');
        await fetchPlans();
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
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
    <form id="planForm" onSubmit={handleSubmitPlan} className="space-y-4">
      <div>
        <Label htmlFor="planName">Plan Name *</Label>
        <Input
          id="planName"
          name="planName"
          placeholder="e.g., Professional"
          defaultValue={selectedPlan?.name}
          required
        />
      </div>

      <div>
        <Label htmlFor="planDescription">Description</Label>
        <Textarea
          id="planDescription"
          name="planDescription"
          placeholder="Brief description of the plan"
          defaultValue={selectedPlan?.description}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="monthlyPrice">Monthly Price ({currentCurrency.symbol}) *</Label>
          <Input
            id="monthlyPrice"
            name="monthlyPrice"
            type="number"
            step="0.01"
            placeholder="299"
            defaultValue={selectedPlan?.monthlyPrice || ''}
            required
          />
        </div>
        <div>
          <Label htmlFor="yearlyPrice">Yearly Price ({currentCurrency.symbol}) *</Label>
          <Input
            id="yearlyPrice"
            name="yearlyPrice"
            type="number"
            step="0.01"
            placeholder="2990"
            defaultValue={selectedPlan?.yearlyPrice || selectedPlan?.annualPrice || ''}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="maxProperties">Max Properties *</Label>
          <Input
            id="maxProperties"
            name="maxProperties"
            type="number"
            placeholder="25"
            defaultValue={selectedPlan?.maxProperties || selectedPlan?.propertyLimit || ''}
            required
          />
        </div>
        <div>
          <Label htmlFor="maxUnits">Max Users *</Label>
          <Input
            id="maxUnits"
            name="maxUnits"
            type="number"
            placeholder="10"
            defaultValue={selectedPlan?.maxUnits || selectedPlan?.userLimit || ''}
            required
          />
        </div>
        <div>
          <Label htmlFor="storageLimit">Storage (MB) *</Label>
          <Input
            id="storageLimit"
            name="storageLimit"
            type="number"
            placeholder="1000"
            defaultValue={selectedPlan?.storageLimit || 1000}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="features">Features (one per line) *</Label>
        <Textarea
          id="features"
          name="features"
          placeholder="Property Management&#10;Tenant Management&#10;Payment Processing"
          defaultValue={selectedPlan?.features?.join('\n') || ''}
          rows={5}
          required
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch id="active" name="active" defaultChecked={selectedPlan?.status === 'active' || selectedPlan?.isActive !== false} />
          <Label htmlFor="active">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="popular" name="popular" defaultChecked={selectedPlan?.isPopular} />
          <Label htmlFor="popular">Mark as Popular</Label>
        </div>
      </div>
    </form>
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
          {activeTab === 'plans' && (
            <Button onClick={handleCreatePlan}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          )}
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
                <div className="text-2xl font-bold">{formatCurrency(billingOverview.monthlyRevenue, selectedCurrency)}</div>
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
                <div className="text-2xl font-bold">
                  {customerChurn.rate !== null ? `${customerChurn.rate}%` : '—'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {mrrChurn.rate !== null ? `MRR churn: ${mrrChurn.rate}%` : 'MRR churn: —'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Revenue/Customer</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {billingOverview.avgRevenuePer !== null ? formatCurrency(billingOverview.avgRevenuePer, selectedCurrency) : '—'}
                </div>
                <p className="text-xs text-muted-foreground">per active subscription</p>
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
                        <p className="font-medium">{formatCurrency(plan.revenue, selectedCurrency)}/mo</p>
                        <p className="text-sm text-gray-600">{formatCurrency(convertAmount(plan.monthlyPrice, plan.currency, selectedCurrency), selectedCurrency)}/user</p>
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
                  {transactions.slice(0, 5).map((transaction) => (
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
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePlan(plan.id)}
                      disabled={plan.activeSubscriptions > 0}
                      title={plan.activeSubscriptions > 0 ? 'Cannot delete plan with active subscriptions' : 'Delete plan'}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Pricing</h4>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">{formatCurrency(convertAmount(plan.monthlyPrice, plan.currency, selectedCurrency), selectedCurrency)}</p>
                        <p className="text-sm text-gray-600">per month</p>
                        <p className="text-sm text-gray-600">{formatCurrency(convertAmount(plan.yearlyPrice, plan.currency, selectedCurrency), selectedCurrency)}/year (save 17%)</p>
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
                        <p className="text-sm">{formatCurrency(plan.revenue, selectedCurrency)}/month revenue</p>
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
            <Button variant="outline" onClick={() => setTxShowFilters(!txShowFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              {txShowFilters ? 'Hide Filters' : 'Filter'}
            </Button>
            <Button variant="outline" onClick={exportTransactionsCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {txShowFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={txStatusFilter} onValueChange={(v: any) => setTxStatusFilter(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select value={txPlanFilter} onValueChange={(v: any) => setTxPlanFilter(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        {plans.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Min Amount ({selectedCurrency})</Label>
                    <Input value={txMinAmount} onChange={(e) => setTxMinAmount(e.target.value)} placeholder="e.g. 500" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Amount ({selectedCurrency})</Label>
                    <Input value={txMaxAmount} onChange={(e) => setTxMaxAmount(e.target.value)} placeholder="e.g. 5000" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={txStartDate} onChange={(e) => setTxStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={txEndDate} onChange={(e) => setTxEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={clearTxFilters}>Clear</Button>
                  <Button variant="outline" onClick={() => setTxShowFilters(false)}>Apply</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Summary */}
          <div className="text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
            {(searchTerm || txStatusFilter !== 'all' || txPlanFilter !== 'all' || txMinAmount || txMaxAmount || txStartDate || txEndDate) && (
              <span className="ml-2 text-gray-500">(filters applied)</span>
            )}
          </div>

          {invoices.length > 0 && (
            <div className="text-xs text-gray-500">
              {(() => {
                const customersWithoutInvoices = customers.filter((c: any) => !invoices.some((inv: any) => inv.customerId === c.id));
                if (customersWithoutInvoices.length === 0) return null;
                const names = customersWithoutInvoices.map((c: any) => c.company);
                const preview = names.slice(0, 3).join(', ');
                return (
                  <span>
                    Customers without transactions: {customersWithoutInvoices.length}
                    {names.length > 0 && (
                      <>
                        {' '}({preview}{names.length > 3 ? `, +${names.length - 3} more` : ''})
                      </>
                    )}
                  </span>
                );
              })()}
            </div>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Refunded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="font-medium">{transaction.customer}</div>
                    </TableCell>
                    <TableCell>{transaction.plan}</TableCell>
                    <TableCell>{formatCurrency(getTxAmountInSelected(transaction), selectedCurrency)}</TableCell>
                    <TableCell className="text-red-600">{transaction.refundedAmount ? formatCurrency(
                      convertAmount(
                        transaction.refundedAmount,
                        (invoices.find((i:any)=>i.id===transaction._invoiceId)?.currency)||'USD',
                        selectedCurrency
                      ),
                      selectedCurrency
                    ) : '-'}</TableCell>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const inv = invoices.find((i: any) => i.id === transaction._invoiceId);
                            setViewDialog({ open: true, invoice: inv, transaction });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={async () => {
                          const inv = invoices.find((i: any) => i.id === transaction._invoiceId);
                          if (!inv) return;
                          const jsPDF = await ensureJsPdf();
                          const doc = new jsPDF();
                          let y = 20;
                          if (brandLogoUrl) {
                            const logoData = await toDataUrl(brandLogoUrl);
                            if (logoData) {
                              try { doc.addImage(logoData, 'PNG', 15, 10, 30, 12); } catch {}
                            }
                          }
                          doc.setFontSize(16);
                          doc.text('Receipt', 195, 16, { align: 'right' });
                          doc.setFontSize(10);
                          doc.text(new Date(inv.createdAt).toLocaleDateString(), 195, 21, { align: 'right' });
                          y = 32;
                          doc.setLineWidth(0.2); doc.line(15, y, 195, y); y += 8;
                          doc.setFontSize(12);
                          doc.text(`Invoice #`, 15, y); doc.text(String(inv.invoiceNumber), 195, y, { align: 'right' }); y += 8;
                          doc.text(`Customer`, 15, y); doc.text(String(transaction.customer || '—'), 195, y, { align: 'right' }); y += 8;
                          doc.text(`Plan`, 15, y); doc.text(String(transaction.plan || '—'), 195, y, { align: 'right' }); y += 8;
                          const invCurrency = inv.currency || 'USD';
                          const amt = convertAmount(inv.amount, invCurrency, selectedCurrency);
                          doc.text(`Amount`, 15, y); doc.text(`${formatCurrency(amt, selectedCurrency)}`, 195, y, { align: 'right' }); y += 8;
                          doc.text(`Status`, 15, y); doc.text(String(inv.status), 195, y, { align: 'right' }); y += 12;
                          doc.setFontSize(9);
                          doc.setTextColor(100);
                          doc.text('Generated by PropertyHub', 15, y);
                          doc.save(`${inv.invoiceNumber}-receipt.pdf`);
                        }}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {transaction._invoiceId && (
                          <Button variant="outline" size="sm" onClick={() => setRefundDialog({ open: true, invoice: invoices.find((i: any) => i.id === transaction._invoiceId) })}>
                            Refund
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Refund Dialog */}
          <Dialog open={refundDialog.open} onOpenChange={(o) => setRefundDialog(o ? refundDialog : { open: false })}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue Refund</DialogTitle>
                <DialogDescription>
                  {refundDialog.invoice ? `Invoice ${refundDialog.invoice.invoiceNumber} • ${formatCurrency(refundDialog.invoice.amount, selectedCurrency)}` : ''}
                </DialogDescription>
              </DialogHeader>
              {refundDialog.invoice && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    const amount = parseFloat((form.elements.namedItem('refundAmount') as HTMLInputElement).value);
                    const reason = (form.elements.namedItem('refundReason') as HTMLInputElement).value;
                    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
                    try {
                      setIsSubmitting(true);
                      // Always refund in the invoice's currency to avoid currency mismatch
                      const { error } = await createRefund(refundDialog.invoice.id, { amount, currency: refundDialog.invoice.currency, reason });
                      if (error) throw new Error(error.error || 'Refund failed');
                      toast.success('Refund created');
                      setRefundDialog({ open: false });
                      await fetchInvoices();
                    } catch (err: any) {
                      toast.error(err.message || 'Refund failed');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label>Amount ({refundDialog.invoice.currency})</Label>
                    <Input name="refundAmount" placeholder="e.g. 500" />
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Input name="refundReason" placeholder="Optional" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setRefundDialog({ open: false })}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Refund'}</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* View Transaction/Invoice Dialog */}
          <Dialog open={viewDialog.open} onOpenChange={(o) => setViewDialog(o ? viewDialog : { open: false })}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
                <DialogDescription>
                  {viewDialog.invoice ? `Invoice ${viewDialog.invoice.invoiceNumber}` : 'Subscription'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {brandLogoUrl && (
                  <div className="flex justify-center"><img src={brandLogoUrl} alt="Logo" style={{ height: 40 }} /></div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Customer</span>
                  <span>{viewDialog.transaction?.customer || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span>{viewDialog.transaction?.plan || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span>{formatCurrency(getTxAmountInSelected(viewDialog.transaction || {} as any), selectedCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span>{viewDialog.invoice?.status || viewDialog.transaction?.status || '—'}</span>
                </div>
                {viewDialog.invoice && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Invoice #</span>
                      <span>{viewDialog.invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date</span>
                      <span>{new Date(viewDialog.invoice.createdAt).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewDialog({ open: false })}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
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
                <CardTitle>MRR Trend</CardTitle>
                <CardDescription>Monthly Recurring Revenue over last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart data={mrrTrend} labels={monthLabels} />
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  {monthLabels.map((m, i) => (
                    <span key={i}>{m.split(' ')[0]}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New Subscriptions</CardTitle>
                <CardDescription>New subscriptions created per month</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart data={newSubsTrend} labels={monthLabels} />
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  {monthLabels.map((m, i) => (
                    <span key={i}>{m.split(' ')[0]}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Based on current database data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-600">Current MRR</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(mrrTrend[mrrTrend.length - 1] || 0, selectedCurrency)}</p>
                  <p className="text-sm text-gray-500">as of this month</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-600">New Subscriptions (30d)</h3>
                  <p className="text-2xl font-bold text-green-600">{customers.filter((c: any) => {
                    const s = (c as any).subscriptionStartDate || (c as any).createdAt;
                    const start = new Date();
                    start.setDate(start.getDate() - 30);
                    return s && new Date(s) >= start;
                  }).length}</p>
                  <p className="text-sm text-gray-500">last 30 days</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-600">Cancellations (30d)</h3>
                  <p className="text-2xl font-bold text-purple-600">{customers.filter((c: any) => {
                    const start = new Date();
                    start.setDate(start.getDate() - 30);
                    return (c as any).status === 'cancelled' && (c as any).updatedAt && new Date((c as any).updatedAt) >= start;
                  }).length}</p>
                  <p className="text-sm text-gray-500">last 30 days</p>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreatePlanOpen(false);
                setSelectedPlan(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="planForm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (selectedPlan ? 'Update Plan' : 'Create Plan')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
