import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import {
  getBillingPlans,
  createBillingPlan,
  updateBillingPlan,
  deleteBillingPlan,
  type BillingPlan,
} from "../lib/api";
import {
  syncPricingPlans,
  getPricingPlansFromDB,
  restorePlanToCanonical,
  exportPlanToCode,
  verifyPlansSync,
} from "../lib/api/pricing-sync";
import { getCustomers, type Customer } from "../lib/api";
import { getInvoices, createRefund } from "../lib/api/invoices";
import { getSystemSetting } from "../lib/api/system";
import {
  initializeSocket,
  subscribeToCustomerEvents,
  unsubscribeFromCustomerEvents,
} from "../lib/socket";
import {
  getBillingOverview,
  type BillingOverview,
} from "../lib/api/billing-analytics";
import {
  getBillingTransactions,
  type BillingTransaction,
} from "../lib/api/billing-transactions";
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
  Eye,
  RefreshCw,
  RotateCcw,
  Code,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCurrency } from "../lib/CurrencyContext";
import {
  computeCustomerChurn,
  computeMRRChurn,
  lastNDaysWindow,
} from "../lib/metrics";

export function BillingPlansAdmin() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [planCategory, setPlanCategory] = useState<
    "property_management" | "development"
  >("property_management");
  // Admin billing is locked to NGN; we still use currency utils but force NGN
  const { getCurrency, convertAmount, formatCurrency } = useCurrency();
  const selectedCurrency = "NGN";
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [refundDialog, setRefundDialog] = useState<{
    open: boolean;
    invoice?: any;
  }>(() => ({ open: false }));
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    invoice?: any;
    transaction?: any;
  }>(() => ({ open: false }));
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const [billingAnalytics, setBillingAnalytics] =
    useState<BillingOverview | null>(null);
  const [realTransactions, setRealTransactions] = useState<
    BillingTransaction[]
  >([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Transactions tab filters & controls
  const [txShowFilters, setTxShowFilters] = useState(false);
  const [txStatusFilter, setTxStatusFilter] = useState<
    "all" | "completed" | "pending" | "failed" | "refunded"
  >("all");
  const [txPlanFilter, setTxPlanFilter] = useState<string>("all"); // plan id or 'all'
  const [txMinAmount, setTxMinAmount] = useState<string>("");
  const [txMaxAmount, setTxMaxAmount] = useState<string>("");
  const [txStartDate, setTxStartDate] = useState<string>(""); // YYYY-MM-DD
  const [txEndDate, setTxEndDate] = useState<string>("");

  // Customer Subscriptions filters
  const [custShowFilters, setCustShowFilters] = useState(false);
  const [custSearchTerm, setCustSearchTerm] = useState("");
  const [custStatusFilter, setCustStatusFilter] = useState<
    "all" | "active" | "trial"
  >("all");
  const [custPlanFilter, setCustPlanFilter] = useState<string>("all");
  const [custPaymentStartDate, setCustPaymentStartDate] = useState<string>("");
  const [custPaymentEndDate, setCustPaymentEndDate] = useState<string>("");
  const [custSortBy, setCustSortBy] = useState<
    "nextPayment" | "mrr" | "company"
  >("nextPayment");
  const [custSortOrder, setCustSortOrder] = useState<"asc" | "desc">("asc");
  const [custCurrentPage, setCustCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const clearCustFilters = () => {
    setCustSearchTerm("");
    setCustStatusFilter("all");
    setCustPlanFilter("all");
    setCustPaymentStartDate("");
    setCustPaymentEndDate("");
    setCustSortBy("nextPayment");
    setCustSortOrder("asc");
    setCustCurrentPage(1);
  };

  const clearTxFilters = () => {
    setTxStatusFilter("all");
    setTxPlanFilter("all");
    setTxMinAmount("");
    setTxMaxAmount("");
    setTxStartDate("");
    setTxEndDate("");
  };

  // Current currency details (forced to NGN for admin)
  const currentCurrency = getCurrency(selectedCurrency);

  // Reset pagination when filters change
  useEffect(() => {
    setCustCurrentPage(1);
  }, [
    custSearchTerm,
    custStatusFilter,
    custPlanFilter,
    custPaymentStartDate,
    custPaymentEndDate,
  ]);

  // Fetch plans on component mount
  useEffect(() => {
    // Wrap all fetches in try-catch to prevent component crash
    const loadData = async () => {
      try {
        await Promise.allSettled([
          fetchPlans(),
          fetchCustomersData(),
          fetchInvoices(),
          fetchBillingAnalytics(),
          fetchTransactions(),
        ]);
      } catch (error) {
        console.error("Error loading billing data:", error);
        // Don't crash the component, just log the error
      }
    };

    loadData();

    // Load brand logo from system settings (prefer platform_logo_url; fallback to brand_logo_url)
    (async () => {
      try {
        let res = await getSystemSetting("platform_logo_url");
        if (res?.data?.value) {
          setBrandLogoUrl(res.data.value as string);
        } else {
          // Fallback to legacy key
          res = await getSystemSetting("brand_logo_url");
          if (res?.data?.value) setBrandLogoUrl(res.data.value as string);
        }
      } catch (error) {
        console.error("Failed to load brand logo:", error);
      }
    })();

    // Realtime: refresh customers when they update (e.g., cancellations)
    const token = localStorage.getItem("token");
    if (token) {
      try {
        initializeSocket(token);
      } catch (error) {
        console.error("Failed to initialize socket:", error);
      }
      try {
        subscribeToCustomerEvents({
          onCreated: () => fetchCustomersData(),
          onUpdated: () => fetchCustomersData(),
          onDeleted: () => fetchCustomersData(),
        });
      } catch (error) {
        console.error("Failed to subscribe to customer events:", error);
      }
    }
    return () => {
      try {
        unsubscribeFromCustomerEvents();
      } catch {}
    };
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      console.log("📥 Fetching plans from database...");

      // Use regular plans endpoint - Plan tab is source of truth
      const response = await getBillingPlans();

      if (response.error) {
        console.error("Error fetching plans:", response.error);
        toast.error(response.error.error || "Failed to load billing plans");
        setPlans([]); // Ensure plans is always an array
      } else if (response.data) {
        // Ensure data is an array
        const plansArray = Array.isArray(response.data) ? response.data : [];
        console.log("✅ Loaded plans from database:", plansArray.length);
        setPlans(plansArray);
      } else {
        console.warn("⚠️ No data returned from plans endpoint");
        setPlans([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching plans:", error);
      toast.error(
        "Failed to load billing plans: " + (error.message || "Unknown error")
      );
      setPlans([]); // Ensure plans is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersData = async () => {
    try {
      setCustomersLoading(true);
      const response = await getCustomers({});
      if (response.error) {
        toast.error(response.error.error || "Failed to load customers");
      } else if (response.data) {
        setCustomers(response.data as unknown as Customer[]);
      }
    } catch (error) {
      toast.error("Failed to load customers");
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

  const fetchBillingAnalytics = async () => {
    try {
      const response = await getBillingOverview();
      if (response.data) {
        setBillingAnalytics(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch billing analytics:", error);
    }
  };

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const response = await getBillingTransactions({ limit: 100 });
      if (response.data) {
        setRealTransactions(response.data.transactions);
        console.log(
          "✅ Fetched",
          response.data.transactions.length,
          "transactions from database"
        );
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Transform API plans to match component format
  // Ensure plans is always an array to prevent .map() errors
  const plansArray = Array.isArray(plans) ? plans : [];
  const subscriptionPlans = plansArray.map((plan: any) => {
    const planCurrency = plan.currency || "USD";
    const planCategory = (plan.category || "property_management") as
      | "property_management"
      | "development";
    const customersOnPlan = customers.filter(
      (c) =>
        c.planId === plan.id && (c.status === "active" || c.status === "trial")
    );
    const monthlyRevenueFromPlan = customersOnPlan.reduce(
      (sum, c) =>
        sum + convertAmount(c.mrr || 0, planCurrency, selectedCurrency),
      0
    );

    // Use correct field names from database: monthlyPrice and annualPrice
    const monthlyPrice = plan.monthlyPrice || 0;
    const yearlyPrice = plan.annualPrice || monthlyPrice * 10;

    // Debug logging
    if (monthlyPrice === 0) {
      console.warn(
        `⚠️ Plan "${plan.name}" has monthlyPrice = 0. Raw plan data:`,
        {
          monthlyPrice: plan.monthlyPrice,
          annualPrice: plan.annualPrice,
          currency: plan.currency,
        }
      );
    }

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description || "",
      monthlyPrice: monthlyPrice,
      yearlyPrice: yearlyPrice,
      // Normalized limits so overview reflects what was configured in the form
      category: planCategory,
      maxProperties: plan.propertyLimit ?? null,
      maxUnits: plan.unitLimit ?? null, // units per property (for property owners)
      maxUsers: plan.userLimit ?? null, // total users allowed on the plan
      projectLimit: plan.projectLimit ?? null, // for developer plans
      currency: planCurrency,
      features: Array.isArray(plan.features)
        ? plan.features
        : typeof plan.features === "string"
        ? JSON.parse(plan.features)
        : [],
      activeSubscriptions: customersOnPlan.length,
      revenue: monthlyRevenueFromPlan,
      status: plan.isActive ? "active" : "deprecated",
      created: new Date(plan.createdAt).toISOString().split("T")[0],
      trialDurationDays: plan.trialDurationDays, // Include trial duration
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      storageLimit: plan.storageLimit,
      annualPrice: plan.annualPrice,
      propertyLimit: plan.propertyLimit,
      userLimit: plan.userLimit,
      // Preserve raw DB unitLimit so the edit form can show the saved value
      unitLimit: plan.unitLimit ?? null,
      // Modification status from pricing sync
      isModified: plan.isModified || false,
      hasCanonicalVersion: plan.hasCanonicalVersion !== false,
      canonicalPlan: plan.canonicalPlan || null,
    };
  });

  // Calculate billing overview from plans
  const totalMonthlyRevenue = subscriptionPlans.reduce(
    (sum, plan) => sum + plan.revenue,
    0
  );
  const totalActiveSubscriptions = subscriptionPlans.reduce(
    (sum, plan) => sum + plan.activeSubscriptions,
    0
  );
  const avgRevenuePer =
    totalActiveSubscriptions > 0
      ? Math.round((totalMonthlyRevenue / totalActiveSubscriptions) * 100) / 100
      : null;

  const billingOverview = {
    totalRevenue: totalMonthlyRevenue * 12,
    monthlyRevenue: totalMonthlyRevenue,
    activeSubscriptions: totalActiveSubscriptions,
    churnRate: null as number | null,
    avgRevenuePer,
  };

  // Compute 30-day churn metrics
  const churnWindow = lastNDaysWindow(30);
  const customerChurn = computeCustomerChurn(
    customers.map((c) => ({
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
    customers.map((c) => ({
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
  // Use real transactions from database if available, otherwise fallback to old logic
  const transactions =
    realTransactions.length > 0
      ? realTransactions.map((tx: BillingTransaction, idx: number) => ({
          id: idx + 1,
          customer: tx.customer,
          plan: tx.plan,
          amount: tx.amount,
          refundedAmount: 0, // TODO: Add refund tracking
          status: tx.status,
          date: new Date(tx.date).toISOString().split("T")[0],
          type: tx.type,
          invoice: tx.invoice,
          description: tx.description,
          currency: tx.currency,
          _raw: tx._raw,
          _invoiceId: tx.type === "invoice" ? tx._raw?.id : undefined,
        }))
      : invoices.length > 0
      ? invoices.map((inv: any, idx: number) => ({
          id: idx + 1,
          customer:
            inv.customer?.company ||
            customers.find((c: any) => c.id === inv.customerId)?.company ||
            "—",
          plan: getPlanNameForCustomer(inv.customerId),
          amount: inv.amount,
          refundedAmount: Array.isArray(inv.refunds)
            ? inv.refunds.reduce((s: number, r: any) => s + (r.amount || 0), 0)
            : 0,
          status:
            inv.status === "paid"
              ? "completed"
              : inv.status === "refunded" || inv.status === "partially_refunded"
              ? "refunded"
              : "pending",
          date: new Date(inv.createdAt).toISOString().split("T")[0],
          type: "invoice",
          invoice: inv.invoiceNumber,
          _invoiceId: inv.id,
        }))
      : [...customers]
          .sort((a, b) => {
            const da = new Date(
              (a as any).subscriptionStartDate || a.createdAt
            ).getTime();
            const db = new Date(
              (b as any).subscriptionStartDate || b.createdAt
            ).getTime();
            return db - da;
          })
          .slice(0, 10)
          .map((c, idx) => ({
            id: idx + 1,
            customer: c.company,
            plan: plans.find((p) => p.id === (c as any).planId)?.name || "—",
            amount: (c as any).mrr || 0,
            status:
              (c as any).status === "active" || (c as any).status === "trial"
                ? "completed"
                : "pending",
            date: new Date((c as any).subscriptionStartDate || c.createdAt)
              .toISOString()
              .split("T")[0],
            type: "subscription",
            invoice: `SUB-${(c.id || "").slice(0, 6).toUpperCase()}`,
          }));

  // Helpers for transactions filtering/export
  const getTxAmountInSelected = (tx: any) => {
    // If transaction has currency field (from new API), use it directly
    if (tx && tx.currency) {
      return convertAmount(tx.amount || 0, tx.currency, selectedCurrency);
    }

    // Fallback to old logic for backwards compatibility
    if (tx && tx._invoiceId) {
      const inv = invoices.find((i: any) => i.id === tx._invoiceId);
      const src = inv?.currency || "USD";
      return convertAmount(tx.amount || 0, src, selectedCurrency);
    }
    const planCurrency =
      plans.find((p: any) => p.name === tx?.plan)?.currency || "USD";
    return convertAmount(tx?.amount || 0, planCurrency, selectedCurrency);
  };

  // Dynamically load jsPDF from CDN and return constructor
  const ensureJsPdf = async (): Promise<any> => {
    const w = window as any;
    if (w.jspdf && w.jspdf.jsPDF) return w.jspdf.jsPDF;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load jsPDF"));
      document.body.appendChild(s);
    });
    return (window as any).jspdf.jsPDF;
  };

  // Convert image URL to data URL (for logo)
  const toDataUrl = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url, { mode: "cors" });
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
        (tx.plan || "").toLowerCase().includes(q) ||
        (tx.invoice || "").toLowerCase().includes(q);
      if (!matches) return false;
    }

    // Status
    if (txStatusFilter !== "all" && tx.status !== txStatusFilter) return false;

    // Plan
    if (txPlanFilter !== "all") {
      const found = plans.find((p) => p.name === tx.plan);
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
    const headers = [
      "Customer",
      "Plan",
      "Amount",
      "Currency",
      "Status",
      "Date",
      "Invoice",
    ];
    const rows = filteredTransactions.map((tx: any) => {
      const plan = plans.find((p) => p.name === tx.plan);
      const currency = plan?.currency || "USD";
      const amountInSelected = getTxAmountInSelected(tx);
      return [
        tx.customer,
        tx.plan || "",
        amountInSelected.toString(),
        selectedCurrency,
        tx.status,
        tx.date,
        tx.invoice,
      ];
    });
    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((field) => {
            const s = String(field ?? "");
            return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const billingIssues: {
    id: number;
    customer: string;
    issue: string;
    description: string;
    severity: "low" | "medium" | "high";
    created: string;
    status: "pending" | "in-progress" | "resolved";
  }[] = customers
    .filter((c) => c.status === "suspended")
    .map((c, idx) => ({
      id: idx + 1,
      customer: c.company,
      issue: "Account Suspended",
      description: "Customer account is suspended. Review billing status.",
      severity: "medium",
      created: new Date(c.updatedAt).toISOString().split("T")[0],
      status: "pending",
    }));

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const now = new Date();
  const getLastNMonths = (n: number) => {
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0);
      const end = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59
      );
      months.push({
        label: `${monthNames[start.getMonth()]} ${start.getFullYear()}`,
        start,
        end,
      });
    }
    return months;
  };

  const last6Months = getLastNMonths(6);

  // Helper checks
  const isActiveAt = (c: any, at: Date) => {
    const subStart = (c as any).subscriptionStartDate
      ? new Date((c as any).subscriptionStartDate)
      : null;
    const createdAt = new Date((c as any).createdAt);
    const status = (c as any).status;
    // Consider trial/active as active; treat lack of subStart as createdAt
    const startDate = subStart || createdAt;
    return startDate <= at && (status === "active" || status === "trial");
  };

  const within = (
    dateStr: string | null | undefined,
    start: Date,
    end: Date
  ) => {
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
        const srcCurrency =
          plans.find((p) => p.id === c.planId)?.currency ||
          c.plan?.currency ||
          "USD";
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
      return (
        (c as any).status === "cancelled" &&
        within((c as any).updatedAt, start, end)
      );
    }).length;

    return { label, mrr, newSubs, cancellations };
  });

  const mrrTrend = monthlySeries.map((s) => s.mrr);
  const newSubsTrend = monthlySeries.map((s) => s.newSubs);
  const cancellationsTrend = monthlySeries.map((s) => s.cancellations);
  const monthLabels = monthlySeries.map((s) => s.label);

  // Helper to resolve plan name for a customer's current plan (use function declaration for hoisting)
  function getPlanNameForCustomer(customerId: string): string {
    const c: any = customers.find((x: any) => x.id === customerId);
    if (!c) return "—";
    const plan = plans.find((p: any) => p.id === c.planId);
    return plan?.name || "—";
  }

  // Lightweight SVG charts
  const LineChart = ({
    data,
    labels,
    height = 140,
  }: {
    data: number[];
    labels: string[];
    height?: number;
  }) => {
    const width = 400;
    const maxY = Math.max(1, ...data);
    const minY = 0;
    const padding = 24;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const points = data
      .map((v, i) => {
        const x = padding + innerW * (i / Math.max(1, data.length - 1));
        const y = padding + innerH - ((v - minY) / (maxY - minY || 1)) * innerH;
        return `${x},${y}`;
      })
      .join(" ");
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

  const BarChart = ({
    data,
    labels,
    height = 140,
    color = "#0ea5e9",
  }: {
    data: number[];
    labels: string[];
    height?: number;
    color?: string;
  }) => {
    const width = 400;
    const maxY = Math.max(1, ...data);
    const padding = 24;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const barW = innerW / Math.max(1, data.length * 1.5);
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
        {data.map((v, i) => {
          const x = padding + i * (innerW / data.length) + barW / 2;
          const h = (v / (maxY || 1)) * innerH;
          const y = padding + innerH - h;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              fill={color}
              rx={3}
            />
          );
        })}
      </svg>
    );
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setPlanCategory("property_management"); // Reset to default
    setIsCreatePlanOpen(true);
  };

  const handleSyncPricingPlans = async () => {
    try {
      setIsSyncing(true);
      toast.info("Syncing pricing plans from landing page...");

      const response = await syncPricingPlans();

      if (response.data) {
        toast.success(
          `Successfully synced! ${response.data.created} created, ${response.data.updated} updated`
        );
        // Reload plans
        await fetchPlans();
      } else if (response.error) {
        toast.error("Failed to sync pricing plans");
      }
    } catch (error: any) {
      console.error("Error syncing pricing plans:", error);
      toast.error("Failed to sync pricing plans");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVerifySync = async () => {
    try {
      setIsVerifying(true);
      console.log("🔍 Starting verification...");
      const response = await verifyPlansSync();

      console.log("📥 Verification response:", response);

      if (response.data) {
        console.log("✅ Verification data received:", response.data);
        setVerificationResult(response.data);
        setShowVerificationDialog(true);

        const summary = response.data.summary;
        const data = response.data.data;

        if (summary?.allMatch) {
          toast.success("✅ All plans match landing page!");
        } else if (data) {
          const mismatches = data.mismatches?.length || 0;
          const missing = data.missingInDatabase?.length || 0;
          toast.warning(
            `⚠️ Found ${mismatches} mismatches. ${missing} plans missing in database.`
          );
        }
      } else if (response.error) {
        console.error("❌ Verify error:", response.error);
        const errorMsg =
          response.error.error || response.error.message || "Unknown error";
        toast.error("Failed to verify plans: " + errorMsg);

        // Don't show dialog on error
        setVerificationResult(null);
        setShowVerificationDialog(false);
      } else {
        console.error("❌ No data or error in response:", response);
        toast.error("Failed to verify plans: No data returned");
        setVerificationResult(null);
        setShowVerificationDialog(false);
      }
    } catch (error: any) {
      console.error("❌ Error verifying plans:", error);
      toast.error(
        "Failed to verify plans: " + (error.message || "Unknown error")
      );
      setVerificationResult(null);
      setShowVerificationDialog(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRestorePlan = async (planId: string, planName: string) => {
    if (
      !confirm(
        `Restore "${planName}" to landing page version? This will overwrite any custom changes.`
      )
    ) {
      return;
    }

    try {
      toast.info(`Restoring ${planName}...`);

      const response = await restorePlanToCanonical(planId);

      if (response.data) {
        toast.success(`${planName} restored to landing page version`);
        await fetchPlans();
      } else {
        toast.error("Failed to restore plan");
      }
    } catch (error: any) {
      console.error("Error restoring plan:", error);
      toast.error("Failed to restore plan");
    }
  };

  const handleExportPlan = async (planId: string, planName: string) => {
    try {
      toast.info("Exporting plan code...");

      const response = await exportPlanToCode(planId);

      if (response.data) {
        // Copy to clipboard
        await navigator.clipboard.writeText(response.data.code);
        toast.success(
          `Code for "${planName}" copied to clipboard! Paste it into src/types/pricing.ts`
        );
      } else {
        toast.error("Failed to export plan");
      }
    } catch (error: any) {
      console.error("Error exporting plan:", error);
      toast.error("Failed to export plan");
    }
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setPlanCategory(plan.category || "property_management");
    setIsCreatePlanOpen(true);
  };

  const handleSubmitPlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const featuresText = formData.get("features") as string;
      const features = featuresText.split("\n").filter((f) => f.trim() !== "");

      const monthlyPrice = parseFloat(formData.get("monthlyPrice") as string);
      const trialDurationDaysValue = formData.get("trialDurationDays");

      const planData: any = {
        name: formData.get("planName") as string,
        description: formData.get("planDescription") as string,
        category: planCategory,
        monthlyPrice,
        annualPrice: parseFloat(formData.get("yearlyPrice") as string),
        currency: selectedCurrency,
        userLimit: parseInt(formData.get("userLimit") as string),
        storageLimit: parseInt(formData.get("storageLimit") as string) || 1000,
        features,
        isActive: formData.get("active") === "on",
        isPopular: formData.get("popular") === "on",
      };

      // Add category-specific limits
      if (planCategory === "property_management") {
        planData.propertyLimit = parseInt(
          formData.get("maxProperties") as string
        );
        planData.unitLimit = parseInt(formData.get("unitLimit") as string);
      } else {
        planData.projectLimit = parseInt(
          formData.get("projectLimit") as string
        );
      }

      // Only include trialDurationDays for Trial plans (monthlyPrice = 0)
      if (monthlyPrice === 0 && trialDurationDaysValue) {
        planData.trialDurationDays = parseInt(trialDurationDaysValue as string);
      }

      let response;
      if (selectedPlan) {
        response = await updateBillingPlan(selectedPlan.id, planData);
      } else {
        response = await createBillingPlan(planData);
      }

      if (response.error) {
        toast.error(
          response.error.error ||
            `Failed to ${selectedPlan ? "update" : "create"} plan`
        );
      } else {
        toast.success(
          `Plan ${selectedPlan ? "updated" : "created"} successfully!`
        );
        setIsCreatePlanOpen(false);
        setSelectedPlan(null);
        setPlanCategory("property_management"); // Reset to default
        await fetchPlans();
      }
    } catch (error) {
      console.error("Error submitting plan:", error);
      toast.error(`Failed to ${selectedPlan ? "update" : "create"} plan`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this plan? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await deleteBillingPlan(planId);

      if (response.error) {
        toast.error(response.error.error || "Failed to delete plan");
      } else {
        toast.success("Plan deleted successfully!");
        await fetchPlans();
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "refunded":
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

      {/* Plan Type Toggle */}
      <div>
        <Label htmlFor="planCategory">Plan Type *</Label>
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="categoryOwner"
              name="planCategory"
              value="property_management"
              checked={planCategory === "property_management"}
              onChange={(e) =>
                setPlanCategory(
                  e.target.value as "property_management" | "development"
                )
              }
              className="h-4 w-4 text-blue-600"
            />
            <Label
              htmlFor="categoryOwner"
              className="font-normal cursor-pointer"
            >
              Property Owner
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="categoryDeveloper"
              name="planCategory"
              value="development"
              checked={planCategory === "development"}
              onChange={(e) =>
                setPlanCategory(
                  e.target.value as "property_management" | "development"
                )
              }
              className="h-4 w-4 text-blue-600"
            />
            <Label
              htmlFor="categoryDeveloper"
              className="font-normal cursor-pointer"
            >
              Developer
            </Label>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {planCategory === "property_management"
            ? "For property owners managing properties and units"
            : "For developers managing construction projects"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="monthlyPrice">
            Monthly Price ({currentCurrency.symbol}) *
          </Label>
          <Input
            id="monthlyPrice"
            name="monthlyPrice"
            type="number"
            step="0.01"
            placeholder="299"
            defaultValue={selectedPlan?.monthlyPrice || ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="yearlyPrice">
            Yearly Price ({currentCurrency.symbol}) *
          </Label>
          <Input
            id="yearlyPrice"
            name="yearlyPrice"
            type="number"
            step="0.01"
            placeholder="2990"
            defaultValue={
              selectedPlan?.yearlyPrice || selectedPlan?.annualPrice || ""
            }
            required
          />
        </div>
      </div>

      {/* Trial Duration - Only show for Trial plans (monthlyPrice = 0) */}
      {(selectedPlan?.monthlyPrice === 0 || (!selectedPlan && false)) && (
        <div>
          <Label htmlFor="trialDurationDays">Trial Duration (Days) *</Label>
          <Input
            id="trialDurationDays"
            name="trialDurationDays"
            type="number"
            min="1"
            max="365"
            placeholder="14"
            defaultValue={selectedPlan?.trialDurationDays || 14}
            required={selectedPlan?.monthlyPrice === 0}
          />
          <p className="text-sm text-gray-500 mt-1">
            Number of days for the trial period. This applies to all new
            customers.
          </p>
        </div>
      )}

      {/* Conditional limits based on plan type */}
      {planCategory === "property_management" ? (
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label htmlFor="maxProperties">Max Properties *</Label>
            <Input
              id="maxProperties"
              name="maxProperties"
              type="number"
              placeholder="25"
              defaultValue={
                selectedPlan?.maxProperties || selectedPlan?.propertyLimit || ""
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="unitLimit">Max Units *</Label>
            <Input
              id="unitLimit"
              name="unitLimit"
              type="number"
              placeholder="100"
              defaultValue={selectedPlan?.unitLimit || ""}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Per property</p>
          </div>
          <div>
            <Label htmlFor="userLimit">Max Users *</Label>
            <Input
              id="userLimit"
              name="userLimit"
              type="number"
              placeholder="10"
              defaultValue={
                selectedPlan?.maxUnits || selectedPlan?.userLimit || ""
              }
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
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="projectLimit">Max Projects *</Label>
            <Input
              id="projectLimit"
              name="projectLimit"
              type="number"
              placeholder="10"
              defaultValue={selectedPlan?.projectLimit || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="userLimit">Max Users *</Label>
            <Input
              id="userLimit"
              name="userLimit"
              type="number"
              placeholder="10"
              defaultValue={
                selectedPlan?.maxUnits || selectedPlan?.userLimit || ""
              }
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
      )}

      <div>
        <Label htmlFor="features">Features (one per line) *</Label>
        <Textarea
          id="features"
          name="features"
          placeholder="Property Management&#10;Tenant Management&#10;Payment Processing"
          defaultValue={selectedPlan?.features?.join("\n") || ""}
          rows={5}
          required
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            name="active"
            defaultChecked={
              selectedPlan?.status === "active" ||
              selectedPlan?.isActive !== false
            }
          />
          <Label htmlFor="active">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="popular"
            name="popular"
            defaultChecked={selectedPlan?.isPopular}
          />
          <Label htmlFor="popular">Mark as Popular</Label>
        </div>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Animated Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 p-8 shadow-2xl">
        {/* Animated background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <CreditCard className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <DollarSign className="h-16 w-16 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  Billing & Plans
                </h2>
                <p className="text-purple-100 text-lg">
                  Manage subscription plans and billing • Currency: ₦ NGN
                </p>
              </div>
            </div>
            {activeTab === "plans" && (
              <Button
                onClick={handleCreatePlan}
                className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 rounded-t-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 h-auto bg-transparent p-2 gap-2">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="plans"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Plans</span>
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Transactions</span>
            </TabsTrigger>
            <TabsTrigger
              value="issues"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Issues</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4"
            >
              <span className="font-medium">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-0 p-6">
            {/* Enhanced Billing Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-green-50/30">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Monthly Revenue
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3">
                  <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-green-900 bg-clip-text text-transparent">
                    {formatCurrency(
                      billingOverview.monthlyRevenue,
                      selectedCurrency
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {billingAnalytics
                        ? billingAnalytics.growth.revenueGrowthPercent >= 0
                          ? `+${billingAnalytics.growth.revenueGrowthPercent}% from last month`
                          : `${billingAnalytics.growth.revenueGrowthPercent}% from last month`
                        : "Loading..."}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-blue-50/30">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Active Subscriptions
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3">
                  <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                    {billingOverview.activeSubscriptions}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {billingAnalytics
                        ? `+${billingAnalytics.currentMonth.newSubscriptions} new this month`
                        : "Loading..."}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-orange-50/30">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-400/30 to-red-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Churn Rate
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3">
                  <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-orange-900 bg-clip-text text-transparent">
                    {customerChurn.rate !== null
                      ? `${customerChurn.rate}%`
                      : "—"}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {mrrChurn.rate !== null
                        ? `MRR churn: ${mrrChurn.rate}%`
                        : "MRR churn: —"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-purple-50/30">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/30 to-violet-400/30 rounded-full -mr-20 -mt-20 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Avg Revenue/Customer
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3">
                  <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
                    {billingOverview.avgRevenuePer !== null
                      ? formatCurrency(
                          billingOverview.avgRevenuePer,
                          selectedCurrency
                        )
                      : "—"}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      per active subscription
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Recent Activity and Plan Performance */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Plan Performance
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Revenue by subscription plan
                  </CardDescription>
                </div>
                <CardContent>
                  <div className="space-y-4">
                    {subscriptionPlans
                      .filter((p) => p.status === "active")
                      .map((plan) => (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium flex items-center space-x-2">
                              <span>{plan.name}</span>
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase tracking-wide"
                              >
                                {plan.category === "development"
                                  ? "Developer plan"
                                  : "Property owner plan"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {plan.activeSubscriptions} subscriptions
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {plan.category === "property_management"
                                ? [
                                    plan.maxProperties != null
                                      ? `${plan.maxProperties} properties`
                                      : null,
                                    plan.maxUnits != null
                                      ? `${plan.maxUnits} units/property`
                                      : null,
                                    plan.maxUsers != null
                                      ? `${plan.maxUsers} users`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") || "No limits configured"
                                : [
                                    plan.projectLimit != null
                                      ? `${plan.projectLimit} projects`
                                      : null,
                                    plan.maxUsers != null
                                      ? `${plan.maxUsers} users`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") || "No limits configured"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(plan.revenue, selectedCurrency)}
                              /mo
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(
                                convertAmount(
                                  plan.monthlyPrice,
                                  plan.currency,
                                  selectedCurrency
                                ),
                                selectedCurrency
                              )}
                              /user
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Latest billing activity
                  </CardDescription>
                </div>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(transaction.status)}
                          <div>
                            <p className="text-sm font-medium">
                              {transaction.customer}
                            </p>
                            <p className="text-xs text-gray-600">
                              {transaction.plan} - {transaction.date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(
                              getTxAmountInSelected(transaction),
                              selectedCurrency
                            )}
                          </p>
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : transaction.status === "failed"
                                ? "destructive"
                                : transaction.status === "pending"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Billing Issues */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-purple-600" />
                      Billing Issues
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Recent billing problems requiring attention
                    </CardDescription>
                  </div>
                  <Badge
                    variant="destructive"
                    className="bg-red-100 text-red-700 border-red-300"
                  >
                    {
                      billingIssues.filter((i) => i.status !== "resolved")
                        .length
                    }{" "}
                    Open
                  </Badge>
                </div>
              </div>
              <CardContent>
                <div className="space-y-3">
                  {billingIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{issue.customer}</h4>
                          <Badge
                            variant={
                              issue.severity === "high"
                                ? "destructive"
                                : issue.severity === "medium"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {issue.severity}
                          </Badge>
                          <Badge
                            variant={
                              issue.status === "resolved"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {issue.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {issue.issue}
                        </p>
                        <p className="text-sm text-gray-600">
                          {issue.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {issue.created}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Customer Subscriptions with Next Payment Dates */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Customer Subscriptions
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Active subscriptions and upcoming payment dates
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCustShowFilters(!custShowFilters)}
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      Filters
                    </Button>
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {
                        customers.filter((c: any) => c.status === "active")
                          .length
                      }{" "}
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
              <CardContent>
                {/* Enhanced Filters */}
                {custShowFilters && (
                  <div className="mb-6 p-6 bg-gradient-to-br from-purple-50/50 to-violet-50/50 rounded-lg border border-purple-200/50 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Search */}
                      <div>
                        <Label
                          htmlFor="cust-search"
                          className="text-xs font-medium mb-1"
                        >
                          Search Customer
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="cust-search"
                            placeholder="Company or owner name..."
                            value={custSearchTerm}
                            onChange={(e) => setCustSearchTerm(e.target.value)}
                            className="pl-9 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                          />
                        </div>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <Label
                          htmlFor="cust-status"
                          className="text-xs font-medium mb-1"
                        >
                          Status
                        </Label>
                        <Select
                          value={custStatusFilter}
                          onValueChange={(val: any) => setCustStatusFilter(val)}
                        >
                          <SelectTrigger
                            id="cust-status"
                            className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="trial">Trial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Plan Filter */}
                      <div>
                        <Label
                          htmlFor="cust-plan"
                          className="text-xs font-medium mb-1"
                        >
                          Plan
                        </Label>
                        <Select
                          value={custPlanFilter}
                          onValueChange={setCustPlanFilter}
                        >
                          <SelectTrigger
                            id="cust-plan"
                            className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Plans</SelectItem>
                            {subscriptionPlans.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Payment Date Range */}
                      <div>
                        <Label
                          htmlFor="cust-payment-start"
                          className="text-xs font-medium mb-1"
                        >
                          Payment From
                        </Label>
                        <Input
                          id="cust-payment-start"
                          type="date"
                          value={custPaymentStartDate}
                          onChange={(e) =>
                            setCustPaymentStartDate(e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="cust-payment-end"
                          className="text-xs font-medium mb-1"
                        >
                          Payment To
                        </Label>
                        <Input
                          id="cust-payment-end"
                          type="date"
                          value={custPaymentEndDate}
                          onChange={(e) =>
                            setCustPaymentEndDate(e.target.value)
                          }
                        />
                      </div>

                      {/* Sort Options */}
                      <div>
                        <Label
                          htmlFor="cust-sort"
                          className="text-xs font-medium mb-1"
                        >
                          Sort By
                        </Label>
                        <div className="flex space-x-2">
                          <Select
                            value={custSortBy}
                            onValueChange={(val: any) => setCustSortBy(val)}
                          >
                            <SelectTrigger id="cust-sort" className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nextPayment">
                                Next Payment
                              </SelectItem>
                              <SelectItem value="mrr">MRR</SelectItem>
                              <SelectItem value="company">Company</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCustSortOrder(
                                custSortOrder === "asc" ? "desc" : "asc"
                              )
                            }
                            className="px-3"
                          >
                            {custSortOrder === "asc" ? "↑" : "↓"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="text-sm text-gray-600">
                        {(custSearchTerm ||
                          custStatusFilter !== "all" ||
                          custPlanFilter !== "all" ||
                          custPaymentStartDate ||
                          custPaymentEndDate) && <span>(filters applied)</span>}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCustFilters}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}

                {customersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No customers found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Billing Cycle</TableHead>
                          <TableHead>MRR</TableHead>
                          <TableHead>Next Payment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          // Apply all filters
                          let filteredCustomers = customers.filter((c: any) => {
                            // Status filter
                            if (
                              custStatusFilter !== "all" &&
                              c.status !== custStatusFilter
                            )
                              return false;

                            // Search filter
                            if (custSearchTerm) {
                              const search = custSearchTerm.toLowerCase();
                              const matchesCompany = c.company
                                ?.toLowerCase()
                                .includes(search);
                              const matchesOwner = c.owner
                                ?.toLowerCase()
                                .includes(search);
                              const matchesEmail = c.email
                                ?.toLowerCase()
                                .includes(search);
                              if (
                                !matchesCompany &&
                                !matchesOwner &&
                                !matchesEmail
                              )
                                return false;
                            }

                            // Plan filter
                            if (
                              custPlanFilter !== "all" &&
                              c.planId !== custPlanFilter
                            )
                              return false;

                            // Payment date range filter
                            if (c.nextPaymentDate) {
                              const paymentDate = new Date(c.nextPaymentDate);
                              if (custPaymentStartDate) {
                                const startDate = new Date(
                                  custPaymentStartDate
                                );
                                if (paymentDate < startDate) return false;
                              }
                              if (custPaymentEndDate) {
                                const endDate = new Date(custPaymentEndDate);
                                endDate.setHours(23, 59, 59, 999); // Include entire end date
                                if (paymentDate > endDate) return false;
                              }
                            }

                            return true;
                          });

                          // Apply sorting
                          filteredCustomers.sort((a: any, b: any) => {
                            let compareValue = 0;

                            if (custSortBy === "nextPayment") {
                              if (!a.nextPaymentDate) return 1;
                              if (!b.nextPaymentDate) return -1;
                              compareValue =
                                new Date(a.nextPaymentDate).getTime() -
                                new Date(b.nextPaymentDate).getTime();
                            } else if (custSortBy === "mrr") {
                              compareValue = (a.mrr || 0) - (b.mrr || 0);
                            } else if (custSortBy === "company") {
                              compareValue = (a.company || "").localeCompare(
                                b.company || ""
                              );
                            }

                            return custSortOrder === "asc"
                              ? compareValue
                              : -compareValue;
                          });

                          // Calculate pagination
                          const totalPages = Math.ceil(
                            filteredCustomers.length / itemsPerPage
                          );
                          const startIndex =
                            (custCurrentPage - 1) * itemsPerPage;
                          const endIndex = startIndex + itemsPerPage;
                          const displayCustomers = filteredCustomers.slice(
                            startIndex,
                            endIndex
                          );

                          return displayCustomers.map((customer: any) => {
                            const nextPaymentDate = customer.nextPaymentDate
                              ? new Date(customer.nextPaymentDate)
                              : null;
                            const daysUntil = nextPaymentDate
                              ? Math.ceil(
                                  (nextPaymentDate.getTime() -
                                    new Date().getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              : null;

                            return (
                              <TableRow key={customer.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {customer.company}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {customer.owner}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <span>
                                      {customer.plan?.name || "No Plan"}
                                    </span>
                                    {customer.plan && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px]"
                                      >
                                        {customer.planCategory === "development"
                                          ? "Dev"
                                          : "Property"}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      customer.status === "active"
                                        ? "default"
                                        : customer.status === "trial"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {customer.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="capitalize">
                                  {customer.billingCycle || "monthly"}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(
                                    customer.mrr || 0,
                                    selectedCurrency
                                  )}
                                </TableCell>
                                <TableCell>
                                  {nextPaymentDate ? (
                                    <div>
                                      <div className="font-medium">
                                        {nextPaymentDate.toLocaleDateString(
                                          "en-US",
                                          {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          }
                                        )}
                                      </div>
                                      <div
                                        className={`text-xs ${
                                          daysUntil! <= 3
                                            ? "text-red-600 font-medium"
                                            : daysUntil! <= 7
                                            ? "text-orange-600"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {daysUntil! < 0
                                          ? `${Math.abs(
                                              daysUntil!
                                            )} days overdue`
                                          : daysUntil === 0
                                          ? "Due today"
                                          : daysUntil === 1
                                          ? "Tomorrow"
                                          : `In ${daysUntil} days`}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">
                                      No date set
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                    {(() => {
                      const filteredCount = customers.filter((c: any) => {
                        if (
                          custStatusFilter !== "all" &&
                          c.status !== custStatusFilter
                        )
                          return false;
                        if (custSearchTerm) {
                          const search = custSearchTerm.toLowerCase();
                          const matches =
                            c.company?.toLowerCase().includes(search) ||
                            c.owner?.toLowerCase().includes(search) ||
                            c.email?.toLowerCase().includes(search);
                          if (!matches) return false;
                        }
                        if (
                          custPlanFilter !== "all" &&
                          c.planId !== custPlanFilter
                        )
                          return false;
                        if (c.nextPaymentDate) {
                          const paymentDate = new Date(c.nextPaymentDate);
                          if (
                            custPaymentStartDate &&
                            paymentDate < new Date(custPaymentStartDate)
                          )
                            return false;
                          if (custPaymentEndDate) {
                            const endDate = new Date(custPaymentEndDate);
                            endDate.setHours(23, 59, 59, 999);
                            if (paymentDate > endDate) return false;
                          }
                        }
                        return true;
                      }).length;

                      const totalPages = Math.ceil(
                        filteredCount / itemsPerPage
                      );
                      const startIndex =
                        (custCurrentPage - 1) * itemsPerPage + 1;
                      const endIndex = Math.min(
                        custCurrentPage * itemsPerPage,
                        filteredCount
                      );

                      return (
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Showing {startIndex} to {endIndex} of{" "}
                            {filteredCount} subscription
                            {filteredCount !== 1 ? "s" : ""}
                            {(custSearchTerm ||
                              custStatusFilter !== "all" ||
                              custPlanFilter !== "all" ||
                              custPaymentStartDate ||
                              custPaymentEndDate) && (
                              <span className="text-gray-400"> (filtered)</span>
                            )}
                          </div>
                          {totalPages > 1 && (
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCustCurrentPage((prev) =>
                                    Math.max(1, prev - 1)
                                  )
                                }
                                disabled={custCurrentPage === 1}
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <div className="flex items-center space-x-1">
                                {Array.from(
                                  { length: totalPages },
                                  (_, i) => i + 1
                                )
                                  .filter((page) => {
                                    // Show first page, last page, current page, and pages around current
                                    return (
                                      page === 1 ||
                                      page === totalPages ||
                                      (page >= custCurrentPage - 1 &&
                                        page <= custCurrentPage + 1)
                                    );
                                  })
                                  .map((page, index, array) => {
                                    // Add ellipsis if there's a gap
                                    const showEllipsisBefore =
                                      index > 0 && page - array[index - 1] > 1;
                                    return (
                                      <React.Fragment key={page}>
                                        {showEllipsisBefore && (
                                          <span className="px-2 text-gray-400">
                                            ...
                                          </span>
                                        )}
                                        <Button
                                          variant={
                                            page === custCurrentPage
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          onClick={() =>
                                            setCustCurrentPage(page)
                                          }
                                          className={
                                            page === custCurrentPage
                                              ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white border-0"
                                              : "border-purple-200 text-purple-700 hover:bg-purple-50"
                                          }
                                        >
                                          {page}
                                        </Button>
                                      </React.Fragment>
                                    );
                                  })}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCustCurrentPage((prev) =>
                                    Math.min(totalPages, prev + 1)
                                  )
                                }
                                disabled={custCurrentPage === totalPages}
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6 mt-0 p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading plans...</p>
                </div>
              </div>
            ) : subscriptionPlans.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Plans Found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      There are no pricing plans in the database. Create your
                      first plan to get started.
                    </p>
                    <Button onClick={handleCreatePlan}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {subscriptionPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={plan.status === "deprecated" ? "opacity-60" : ""}
                  >
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <CardTitle>{plan.name}</CardTitle>
                          <Badge
                            variant={
                              plan.status === "active" ? "default" : "secondary"
                            }
                          >
                            {plan.status}
                          </Badge>
                          {plan.isPopular && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-300"
                            >
                              ⭐ Popular
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          disabled={plan.activeSubscriptions > 0}
                          title={
                            plan.activeSubscriptions > 0
                              ? "Cannot delete plan with active subscriptions"
                              : "Delete plan"
                          }
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
                            <p className="text-2xl font-bold">
                              {formatCurrency(
                                convertAmount(
                                  plan.monthlyPrice,
                                  plan.currency,
                                  selectedCurrency
                                ),
                                selectedCurrency
                              )}
                            </p>
                            <p className="text-sm text-gray-600">per month</p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(
                                convertAmount(
                                  plan.yearlyPrice,
                                  plan.currency,
                                  selectedCurrency
                                ),
                                selectedCurrency
                              )}
                              /year (save 17%)
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Limits</h4>
                          <div className="space-y-1">
                            {plan.category === "development" ? (
                              <>
                                {plan.projectLimit != null && (
                                  <p className="text-sm">
                                    Up to {plan.projectLimit} projects
                                  </p>
                                )}
                                {plan.maxUsers != null && (
                                  <p className="text-sm">
                                    Up to {plan.maxUsers} users
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                {plan.maxProperties != null && (
                                  <p className="text-sm">
                                    Up to {plan.maxProperties} properties
                                  </p>
                                )}
                                {plan.maxUnits != null && (
                                  <p className="text-sm">
                                    Up to {plan.maxUnits} units
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Performance</h4>
                          <div className="space-y-1">
                            <p className="text-sm">
                              {plan.activeSubscriptions} active subscriptions
                            </p>
                            <p className="text-sm">
                              {formatCurrency(plan.revenue, selectedCurrency)}
                              /month revenue
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Features</h4>
                          <ul className="text-sm space-y-1">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <li key={index}>• {feature}</li>
                            ))}
                            {plan.features.length > 3 && (
                              <li className="text-gray-500">
                                +{plan.features.length - 3} more
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6 mt-0 p-6">
            {/* Enhanced Search and Filter Section */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setTxShowFilters(!txShowFilters)}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {txShowFilters ? "Hide Filters" : "Filter"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportTransactionsCSV}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {txShowFilters && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/50 to-violet-50/50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={txStatusFilter}
                        onValueChange={(v: any) => setTxStatusFilter(v)}
                      >
                        <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
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
                      <Select
                        value={txPlanFilter}
                        onValueChange={(v: any) => setTxPlanFilter(v)}
                      >
                        <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Plans</SelectItem>
                          {plans.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Min Amount ({selectedCurrency})</Label>
                      <Input
                        value={txMinAmount}
                        onChange={(e) => setTxMinAmount(e.target.value)}
                        placeholder="e.g. 500"
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Amount ({selectedCurrency})</Label>
                      <Input
                        value={txMaxAmount}
                        onChange={(e) => setTxMaxAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={txStartDate}
                        onChange={(e) => setTxStartDate(e.target.value)}
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={txEndDate}
                        onChange={(e) => setTxEndDate(e.target.value)}
                        className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button
                      variant="ghost"
                      onClick={clearTxFilters}
                      className="text-gray-700 hover:bg-gray-50"
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setTxShowFilters(false)}
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {invoices.length > 0 && (
              <div className="text-xs text-gray-500">
                {(() => {
                  const customersWithoutInvoices = customers.filter(
                    (c: any) =>
                      !invoices.some((inv: any) => inv.customerId === c.id)
                  );
                  if (customersWithoutInvoices.length === 0) return null;
                  const names = customersWithoutInvoices.map(
                    (c: any) => c.company
                  );
                  const preview = names.slice(0, 3).join(", ");
                  return (
                    <span>
                      Customers without transactions:{" "}
                      {customersWithoutInvoices.length}
                      {names.length > 0 && (
                        <>
                          {" "}
                          ({preview}
                          {names.length > 3
                            ? `, +${names.length - 3} more`
                            : ""}
                          )
                        </>
                      )}
                    </span>
                  );
                })()}
              </div>
            )}

            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Transactions
                </CardTitle>
                <CardDescription className="mt-1">
                  Showing {filteredTransactions.length} of {transactions.length}{" "}
                  transactions
                </CardDescription>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">
                        Customer
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Plan
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Amount
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Refunded
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Date
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Invoice
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-[140px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="hover:bg-purple-50/30 transition-colors duration-150"
                      >
                        <TableCell>
                          <div className="font-medium">
                            {transaction.customer}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.plan}</TableCell>
                        <TableCell>
                          {formatCurrency(
                            getTxAmountInSelected(transaction),
                            selectedCurrency
                          )}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {transaction.refundedAmount
                            ? formatCurrency(
                                convertAmount(
                                  transaction.refundedAmount,
                                  invoices.find(
                                    (i: any) => i.id === transaction._invoiceId
                                  )?.currency || "USD",
                                  selectedCurrency
                                ),
                                selectedCurrency
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(transaction.status)}
                            <Badge
                              variant={
                                transaction.status === "completed"
                                  ? "default"
                                  : transaction.status === "failed"
                                  ? "destructive"
                                  : transaction.status === "pending"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.invoice}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const inv = invoices.find(
                                  (i: any) => i.id === transaction._invoiceId
                                );
                                setViewDialog({
                                  open: true,
                                  invoice: inv,
                                  transaction,
                                });
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const inv = invoices.find(
                                  (i: any) => i.id === transaction._invoiceId
                                );
                                if (!inv) return;
                                const jsPDF = await ensureJsPdf();
                                const doc = new jsPDF();
                                let y = 20;
                                if (brandLogoUrl) {
                                  const logoData = await toDataUrl(
                                    brandLogoUrl
                                  );
                                  if (logoData) {
                                    try {
                                      doc.addImage(
                                        logoData,
                                        "PNG",
                                        15,
                                        10,
                                        30,
                                        12
                                      );
                                    } catch {}
                                  }
                                }
                                doc.setFontSize(16);
                                doc.text("Receipt", 195, 16, {
                                  align: "right",
                                });
                                doc.setFontSize(10);
                                doc.text(
                                  new Date(inv.createdAt).toLocaleDateString(),
                                  195,
                                  21,
                                  { align: "right" }
                                );
                                y = 32;
                                doc.setLineWidth(0.2);
                                doc.line(15, y, 195, y);
                                y += 8;
                                doc.setFontSize(12);
                                doc.text(`Invoice #`, 15, y);
                                doc.text(String(inv.invoiceNumber), 195, y, {
                                  align: "right",
                                });
                                y += 8;
                                doc.text(`Customer`, 15, y);
                                doc.text(
                                  String(transaction.customer || "—"),
                                  195,
                                  y,
                                  { align: "right" }
                                );
                                y += 8;
                                doc.text(`Plan`, 15, y);
                                doc.text(
                                  String(transaction.plan || "—"),
                                  195,
                                  y,
                                  { align: "right" }
                                );
                                y += 8;
                                const invCurrency = inv.currency || "USD";
                                const amt = convertAmount(
                                  inv.amount,
                                  invCurrency,
                                  selectedCurrency
                                );
                                doc.text(`Amount`, 15, y);
                                doc.text(
                                  `${formatCurrency(amt, selectedCurrency)}`,
                                  195,
                                  y,
                                  { align: "right" }
                                );
                                y += 8;
                                doc.text(`Status`, 15, y);
                                doc.text(String(inv.status), 195, y, {
                                  align: "right",
                                });
                                y += 12;
                                doc.setFontSize(9);
                                doc.setTextColor(100);
                                doc.text("Generated by Contrezz", 15, y);
                                doc.save(`${inv.invoiceNumber}-receipt.pdf`);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {transaction._invoiceId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setRefundDialog({
                                    open: true,
                                    invoice: invoices.find(
                                      (i: any) =>
                                        i.id === transaction._invoiceId
                                    ),
                                  })
                                }
                              >
                                Refund
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Refund Dialog */}
            <Dialog
              open={refundDialog.open}
              onOpenChange={(o) =>
                setRefundDialog(o ? refundDialog : { open: false })
              }
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Issue Refund</DialogTitle>
                  <DialogDescription>
                    {refundDialog.invoice
                      ? `Invoice ${
                          refundDialog.invoice.invoiceNumber
                        } • ${formatCurrency(
                          refundDialog.invoice.amount,
                          selectedCurrency
                        )}`
                      : ""}
                  </DialogDescription>
                </DialogHeader>
                {refundDialog.invoice && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget as HTMLFormElement;
                      const amount = parseFloat(
                        (
                          form.elements.namedItem(
                            "refundAmount"
                          ) as HTMLInputElement
                        ).value
                      );
                      const reason = (
                        form.elements.namedItem(
                          "refundReason"
                        ) as HTMLInputElement
                      ).value;
                      if (!amount || amount <= 0)
                        return toast.error("Enter a valid amount");
                      try {
                        setIsSubmitting(true);
                        // Always refund in the invoice's currency to avoid currency mismatch
                        const { error } = await createRefund(
                          refundDialog.invoice.id,
                          {
                            amount,
                            currency: refundDialog.invoice.currency,
                            reason,
                          }
                        );
                        if (error)
                          throw new Error(error.error || "Refund failed");
                        toast.success("Refund created");
                        setRefundDialog({ open: false });
                        await fetchInvoices();
                      } catch (err: any) {
                        toast.error(err.message || "Refund failed");
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRefundDialog({ open: false })}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Processing..." : "Refund"}
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* View Transaction/Invoice Dialog */}
            <Dialog
              open={viewDialog.open}
              onOpenChange={(o) =>
                setViewDialog(o ? viewDialog : { open: false })
              }
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Transaction Details</DialogTitle>
                  <DialogDescription>
                    {viewDialog.invoice
                      ? `Invoice ${viewDialog.invoice.invoiceNumber}`
                      : "Subscription"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {brandLogoUrl && (
                    <div className="flex justify-center">
                      <img
                        src={brandLogoUrl}
                        alt="Logo"
                        style={{ height: 40 }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Customer</span>
                    <span>{viewDialog.transaction?.customer || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Plan</span>
                    <span>{viewDialog.transaction?.plan || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span>
                      {formatCurrency(
                        getTxAmountInSelected(
                          viewDialog.transaction || ({} as any)
                        ),
                        selectedCurrency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span>
                      {viewDialog.invoice?.status ||
                        viewDialog.transaction?.status ||
                        "—"}
                    </span>
                  </div>
                  {viewDialog.invoice && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Invoice #</span>
                        <span>{viewDialog.invoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Date</span>
                        <span>
                          {new Date(
                            viewDialog.invoice.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setViewDialog({ open: false })}
                  >
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="issues" className="space-y-6 mt-0 p-6">
            <div className="grid gap-4">
              {billingIssues.map((issue) => (
                <Card
                  key={issue.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50">
                    <div className="flex items-center space-x-3">
                      <AlertCircle
                        className={`h-5 w-5 ${
                          issue.severity === "high"
                            ? "text-red-600"
                            : issue.severity === "medium"
                            ? "text-yellow-600"
                            : "text-blue-600"
                        }`}
                      />
                      <div>
                        <CardTitle className="text-lg">
                          {issue.customer}
                        </CardTitle>
                        <CardDescription>{issue.issue}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          issue.severity === "high"
                            ? "destructive"
                            : issue.severity === "medium"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {issue.severity} priority
                      </Badge>
                      <Badge
                        variant={
                          issue.status === "resolved" ? "default" : "secondary"
                        }
                      >
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
                      <span>ID: #{issue.id.toString().padStart(6, "0")}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-0 p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    MRR Trend
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Monthly Recurring Revenue over last 6 months
                  </CardDescription>
                </div>
                <CardContent>
                  <LineChart data={mrrTrend} labels={monthLabels} />
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    {monthLabels.map((m, i) => (
                      <span key={i}>{m.split(" ")[0]}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    New Subscriptions
                  </CardTitle>
                  <CardDescription className="mt-1">
                    New subscriptions created per month
                  </CardDescription>
                </div>
                <CardContent>
                  <BarChart data={newSubsTrend} labels={monthLabels} />
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    {monthLabels.map((m, i) => (
                      <span key={i}>{m.split(" ")[0]}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Key Metrics Summary */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Key Performance Indicators
                </CardTitle>
                <CardDescription className="mt-1">
                  Based on current database data
                </CardDescription>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                    <h3 className="font-semibold text-gray-700 mb-2">
                      Current MRR
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {formatCurrency(
                        mrrTrend[mrrTrend.length - 1] || 0,
                        selectedCurrency
                      )}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      as of this month
                    </p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                    <h3 className="font-semibold text-gray-700 mb-2">
                      New Subscriptions (30d)
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {
                        customers.filter((c: any) => {
                          const s =
                            (c as any).subscriptionStartDate ||
                            (c as any).createdAt;
                          const start = new Date();
                          start.setDate(start.getDate() - 30);
                          return s && new Date(s) >= start;
                        }).length
                      }
                    </p>
                    <p className="text-sm text-gray-500 mt-2">last 30 days</p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
                    <h3 className="font-semibold text-gray-700 mb-2">
                      Cancellations (30d)
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      {
                        customers.filter((c: any) => {
                          const start = new Date();
                          start.setDate(start.getDate() - 30);
                          return (
                            (c as any).status === "cancelled" &&
                            (c as any).updatedAt &&
                            new Date((c as any).updatedAt) >= start
                          );
                        }).length
                      }
                    </p>
                    <p className="text-sm text-gray-500 mt-2">last 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan ? "Edit Plan" : "Create New Plan"}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan
                ? "Update the subscription plan details below."
                : "Set up a new subscription plan for your customers."}
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
            <Button type="submit" form="planForm" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : selectedPlan
                ? "Update Plan"
                : "Create Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Results Dialog */}
      <Dialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pricing Plans Verification</DialogTitle>
            <DialogDescription>
              Comparison between landing page (code) and database plans
            </DialogDescription>
          </DialogHeader>

          {verificationResult && verificationResult.data ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Plans in Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {verificationResult.data.totalInCode || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Plans in Database</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {verificationResult.data.totalInDatabase || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Status */}
              {verificationResult.summary?.allMatch ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-medium text-green-900">
                      ✅ All plans match landing page!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <p className="font-medium text-yellow-900">
                      ⚠️ Plans need synchronization
                    </p>
                  </div>
                  <p className="text-sm text-yellow-800">
                    {verificationResult.data.mismatches?.length || 0}{" "}
                    mismatches,{" "}
                    {verificationResult.data.missingInDatabase?.length || 0}{" "}
                    missing in database
                  </p>
                </div>
              )}

              {/* Matches */}
              {verificationResult.data.matches &&
                verificationResult.data.matches.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-green-700">
                      ✅ Matching Plans (
                      {verificationResult.data.matches.length})
                    </h4>
                    <div className="space-y-1">
                      {verificationResult.data.matches.map((plan: any) => (
                        <div
                          key={plan.id}
                          className="text-sm text-gray-600 pl-4"
                        >
                          • {plan.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Mismatches */}
              {verificationResult.data.mismatches &&
                verificationResult.data.mismatches.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-yellow-700">
                      ⚠️ Mismatched Plans (
                      {verificationResult.data.mismatches.length})
                    </h4>
                    <div className="space-y-4">
                      {verificationResult.data.mismatches.map((plan: any) => (
                        <Card key={plan.id} className="border-yellow-200">
                          <CardHeader>
                            <CardTitle className="text-base">
                              {plan.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              {plan.differences?.price &&
                                !plan.differences.price.match && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Price:
                                    </span>
                                    <span>
                                      <span className="text-red-600">
                                        DB: {plan.differences.price.database}
                                      </span>
                                      {" → "}
                                      <span className="text-green-600">
                                        Code: {plan.differences.price.code}
                                      </span>
                                    </span>
                                  </div>
                                )}
                              {plan.differences?.name &&
                                !plan.differences.name.match && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Name:</span>
                                    <span>
                                      <span className="text-red-600">
                                        DB: {plan.differences.name.database}
                                      </span>
                                      {" → "}
                                      <span className="text-green-600">
                                        Code: {plan.differences.name.code}
                                      </span>
                                    </span>
                                  </div>
                                )}
                              {plan.differences?.description &&
                                !plan.differences.description.match && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Description:
                                    </span>
                                    <span className="text-yellow-600">
                                      Different
                                    </span>
                                  </div>
                                )}
                              {plan.differences?.features &&
                                !plan.differences.features.match && (
                                  <div>
                                    <span className="text-gray-600">
                                      Features:
                                    </span>
                                    <span className="text-yellow-600 ml-2">
                                      Different
                                    </span>
                                  </div>
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

              {/* Missing in Database */}
              {verificationResult.data.missingInDatabase &&
                verificationResult.data.missingInDatabase.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-700">
                      ❌ Missing in Database (
                      {verificationResult.data.missingInDatabase.length})
                    </h4>
                    <div className="space-y-1">
                      {verificationResult.data.missingInDatabase.map(
                        (plan: any) => (
                          <div
                            key={plan.id}
                            className="text-sm text-gray-600 pl-4"
                          >
                            • {plan.name} (₦
                            {plan.price?.toLocaleString() || "N/A"}/mo)
                          </div>
                        )
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Click "Sync from Landing Page" to create these plans.
                    </p>
                  </div>
                )}

              {/* Missing in Code */}
              {verificationResult.data.missingInCode &&
                verificationResult.data.missingInCode.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-blue-700">
                      ℹ️ Custom Plans (Not in Code) (
                      {verificationResult.data.missingInCode.length})
                    </h4>
                    <div className="space-y-1">
                      {verificationResult.data.missingInCode.map(
                        (plan: any) => (
                          <div
                            key={plan.id}
                            className="text-sm text-gray-600 pl-4"
                          >
                            • {plan.name} ({plan.category || "N/A"})
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          ) : verificationResult ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="font-medium text-red-900">
                  Error: Invalid verification data
                </p>
              </div>
              <p className="text-sm text-red-800 mt-2">
                The verification response was invalid. Please try again.
              </p>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-gray-600">Loading verification data...</p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowVerificationDialog(false)}
            >
              Close
            </Button>
            {verificationResult && !verificationResult.summary?.allMatch && (
              <Button
                onClick={() => {
                  setShowVerificationDialog(false);
                  handleSyncPricingPlans();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
