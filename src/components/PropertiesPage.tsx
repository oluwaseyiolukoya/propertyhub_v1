import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { toast } from "sonner";
import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnit,
} from "../lib/api/units";
import { archiveProperty, deleteProperty } from "../lib/api/properties";
import { Switch } from "./ui/switch";
import {
  getMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
} from "../lib/api/maintenance";
import { getOwnerDashboardOverview } from "../lib/api";
import {
  getFinancialOverview,
  getMonthlyRevenue,
  type MonthlyRevenueData,
} from "../lib/api/financial";
import { formatCurrency, getSmartBaseCurrency } from "../lib/currency";
import { usePersistentState } from "../lib/usePersistentState";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  PAYMENT_METHODS,
  type Expense,
} from "../lib/api/expenses";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  MoreHorizontal,
  Plus,
  MapPin,
  Calendar,
  Home,
  Bed,
  Bath,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
  FileText,
  Download,
  BarChart3,
  Trash2,
  PieChart,
  LineChart,
  Activity,
  Percent,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Loader2,
  Send,
  Copy,
  Archive,
  ExternalLink,
  Zap,
  Shield,
  Settings,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  X,
} from "lucide-react";
import { createProperty } from "../lib/api/properties";

interface PropertiesPageProps {
  user: any;
  onBack: () => void;
  onAddProperty?: (propertyData: any) => void;
  onNavigateToAddProperty?: () => void;
  properties: any[];
  onUpdateProperty?: (propertyId: number, updates: any) => void;
  onViewProperty?: (propertyId: string) => void;
  onEditProperty?: (propertyId: string) => void;
  onNavigateToTenants?: () => void;
  onNavigateToMaintenance?: () => void;
  onRefreshProperties?: () => void;
  onPropertyDeleted?: (propertyId: string) => void;
}

type ReportType = "financial" | "occupancy" | "maintenance" | "tenant" | "all";
type SingleReportType = Exclude<ReportType, "all">;

interface GeneratedReport {
  type: ReportType;
  generatedAt: string;
  filters: {
    propertyId: string;
    startDate: string | null;
    endDate: string | null;
  };
  data: any;
}

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  financial: "Financial",
  occupancy: "Occupancy",
  maintenance: "Maintenance",
  tenant: "Tenant",
  all: "All",
};

const ALL_REPORT_TYPES: SingleReportType[] = [
  "financial",
  "occupancy",
  "maintenance",
  "tenant",
];

const expenseCategoryIconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  maintenance: Wrench,
  utilities: Zap,
  insurance: Shield,
  management_fee: Users,
  property_tax: FileText,
};

const MAINTENANCE_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" },
  { value: "landscaping", label: "Landscaping" },
  { value: "safety", label: "Safety" },
];

export function PropertiesPage({
  user,
  onBack,
  onAddProperty,
  onNavigateToAddProperty,
  properties,
  onUpdateProperty,
  onViewProperty,
  onEditProperty,
  onNavigateToTenants,
  onNavigateToMaintenance,
  onRefreshProperties,
  onPropertyDeleted,
}: PropertiesPageProps) {
  const [activeTab, setActiveTab] = usePersistentState(
    "properties-page-tab",
    "overview"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Calculate smart base currency based on properties
  const smartBaseCurrency = getSmartBaseCurrency(properties);
  const [unitsData, setUnitsData] = useState<any[]>([]);
  const [showAddUnitDialog, setShowAddUnitDialog] = useState(false);
  const [unitSaving, setUnitSaving] = useState(false);
  const [unitForm, setUnitForm] = useState<any>({
    propertyId: "",
    unitNumber: "",
    type: "",
    floor: "",
    bedrooms: "",
    bathrooms: "",
    size: "",
    monthlyRent: "",
    securityDeposit: "",
    status: "vacant",
    rentFrequency: "monthly",
    serviceCharge: "",
    legalFee: "",
    agentCommission: "",
    agreementFee: "",
    electricityMeter: "",
    prepaidMeter: false,
    wasteFee: "",
    estateDues: "",
    waterSource: "public",
    parkingAvailable: true,
  });
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [reportType, setReportType] = useState<ReportType>("financial");
  const [reportPropertyFilter, setReportPropertyFilter] = useState("all");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportPreview, setReportPreview] = useState<GeneratedReport | null>(
    null
  );
  const [reportGenerating, setReportGenerating] = useState(false);
  const reportPreviewRef = useRef<HTMLDivElement | null>(null);
  const [financialStats, setFinancialStats] = useState<{
    gross?: number;
    net?: number;
    expenses?: number;
    capRate?: number;
    occupancyRate?: number;
    operatingMargin?: number;
  }>({});
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<
    MonthlyRevenueData[]
  >([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPropertyDeleteDialog, setShowPropertyDeleteDialog] =
    useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);
  const [deletedPropertyIds, setDeletedPropertyIds] = useState<Set<string>>(
    new Set()
  );
  const [isDeletingProperty, setIsDeletingProperty] = useState(false);

  // Expense management states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseStats, setExpenseStats] = useState<any>(null);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState<any>({
    propertyId: "",
    unitId: "none",
    category: "",
    description: "",
    amount: "",
    currency: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "pending",
    paymentMethod: "",
    notes: "",
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [showExpenseDeleteDialog, setShowExpenseDeleteDialog] = useState(false);
  const [showAddMaintenanceDialog, setShowAddMaintenanceDialog] =
    useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceEditingId, setMaintenanceEditingId] = useState<
    string | null
  >(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    propertyId: "",
    unitId: "none",
    title: "",
    description: "",
    priority: "medium",
    category: "general",
    scheduledDate: "",
    notifyTenant: false,
  });
  const [showFinancialDetailDialog, setShowFinancialDetailDialog] =
    useState(false);
  const [financialDetailProperty, setFinancialDetailProperty] =
    useState<null | {
      property: any;
      monthlyRevenue: number;
      totalExpenses: number;
      netIncome: number;
      occupancyRate: number;
      propertyExpenses: Expense[];
    }>(null);

  // View and Edit Unit states
  const [showViewUnitDialog, setShowViewUnitDialog] = useState(false);
  const [showEditUnitDialog, setShowEditUnitDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [editingUnit, setEditingUnit] = useState(false);
  const [selectedMaintenanceRequest, setSelectedMaintenanceRequest] =
    useState<any>(null);
  const [showMaintenanceViewDialog, setShowMaintenanceViewDialog] =
    useState(false);

  // Import Properties states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Derived helpers for currently selected unit (view/edit)
  const selectedUnitNigeria =
    (selectedUnit &&
      selectedUnit.features &&
      (selectedUnit.features as any).nigeria) ||
    {};
  const selectedUnitCurrency = selectedUnit?.properties?.currency || "USD";

  const refreshMaintenanceRequests = useCallback(async () => {
    try {
      const response = await getMaintenanceRequests();
      if (!response.error && Array.isArray(response.data)) {
        setMaintenanceData(response.data);
      }
    } catch (err) {
      console.error("Failed to load maintenance requests", err);
      toast.error("Unable to load maintenance requests");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [uRes, mRes, dRes, fRes, expRes, expStatsRes, monthlyRevenueRes] =
          await Promise.all([
            getUnits(),
            getMaintenanceRequests(),
            getOwnerDashboardOverview(),
            getFinancialOverview(),
            getExpenses(),
            getExpenseStats(),
            getMonthlyRevenue(6),
          ]);
        if (!uRes.error && Array.isArray(uRes.data)) setUnitsData(uRes.data);
        if (!mRes.error && Array.isArray(mRes.data))
          setMaintenanceData(mRes.data);
        if (!dRes.error && dRes.data?.recentActivity)
          setRecentActivity(dRes.data.recentActivity);
        if (!fRes.error && fRes.data) {
          // Use real financial data from backend
          const gross = Number(fRes.data.totalRevenue || 0);
          const expenses = Number(fRes.data.estimatedExpenses || 0);
          const net = Number(fRes.data.netOperatingIncome || 0);
          const capRate = Number(fRes.data.portfolioCapRate || 0);
          const occupancyRate = Number(fRes.data.occupancyRate || 0);
          const operatingMargin = Number(
            fRes.data.operatingMargin || (gross > 0 ? (net / gross) * 100 : 0)
          );
          setFinancialStats({
            gross,
            net,
            expenses,
            capRate,
            occupancyRate,
            operatingMargin,
          });
        }
        if (
          !expRes.error &&
          expRes.data?.data &&
          Array.isArray(expRes.data.data)
        ) {
          setExpenses(expRes.data.data);
        }
        if (!expStatsRes.error && expStatsRes.data) {
          setExpenseStats(expStatsRes.data);
        }
        if (!monthlyRevenueRes.error && Array.isArray(monthlyRevenueRes.data)) {
          setMonthlyRevenueData(monthlyRevenueRes.data);
        }
      } catch (e: any) {
        // Non-blocking: show a toast once
        toast.error("Failed to load financial data");
      }
    })();
  }, [properties.length, refreshMaintenanceRequests]);

  // Handle delete unit
  const handleDeleteUnit = async () => {
    if (!unitToDelete) return;

    try {
      setIsDeleting(true);
      const res = await deleteUnit(unitToDelete.id);

      if ((res as any).error) {
        throw new Error((res as any).error.error || "Failed to delete unit");
      }

      toast.success("Unit deleted successfully");
      setShowDeleteDialog(false);
      setUnitToDelete(null);

      // Refresh units list
      const uRes = await getUnits();
      if (!uRes.error && Array.isArray(uRes.data)) {
        setUnitsData(uRes.data);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete unit");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle view unit details
  const handleViewUnit = async (unit: any) => {
    try {
      const res = await getUnit(unit.id);
      if (res.error) {
        throw new Error(res.error.error || "Failed to fetch unit details");
      }
      setSelectedUnit(res.data);
      setShowViewUnitDialog(true);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load unit details");
    }
  };

  // Handle edit unit
  const handleEditUnit = async (unit: any) => {
    try {
      const res = await getUnit(unit.id);
      if (res.error) {
        throw new Error(res.error.error || "Failed to fetch unit details");
      }

      const data = res.data;
      // Newer units store Nigeria-specific fields inside features.nigeria
      const nigeriaFeatures =
        (data?.features && (data.features as any).nigeria) || {};

      // Populate form with unit data (prefer features.nigeria, fall back to top-level / property defaults)
      setUnitForm({
        propertyId: data.propertyId || "",
        unitNumber: data.unitNumber || "",
        type: data.type || "",
        floor: (data.floor ?? "").toString(),
        bedrooms: (data.bedrooms ?? "").toString(),
        bathrooms: (data.bathrooms ?? "").toString(),
        size: (data.size ?? "").toString(),
        monthlyRent: (data.monthlyRent ?? "").toString(),
        securityDeposit: (
          data.securityDeposit ??
          data.properties?.securityDeposit ??
          ""
        ).toString(),
        status: data.status || "vacant",

        // Nigeria-specific features (saved in JSON)
        rentFrequency: nigeriaFeatures.rentFrequency || "monthly",
        serviceCharge:
          nigeriaFeatures.serviceCharge?.toString() ??
          (data.properties?.serviceCharge != null
            ? String(data.properties.serviceCharge)
            : ""),
        cautionFee:
          nigeriaFeatures.cautionFee?.toString() ??
          (data.properties?.cautionFee != null
            ? String(data.properties.cautionFee)
            : ""),
        legalFee:
          nigeriaFeatures.legalFee?.toString() ??
          (data.properties?.legalFee != null
            ? String(data.properties.legalFee)
            : ""),
        agentCommission:
          nigeriaFeatures.agentCommission?.toString() ??
          (data.properties?.agentCommission != null
            ? String(data.properties.agentCommission)
            : ""),
        agreementFee:
          nigeriaFeatures.agreementFee?.toString() ??
          (data.properties?.agreementFee != null
            ? String(data.properties.agreementFee)
            : ""),
        electricityMeter:
          nigeriaFeatures.electricityMeter ?? data.electricityMeter ?? "",
        prepaidMeter:
          nigeriaFeatures.prepaidMeter ?? data.prepaidMeter ?? false,
        wasteFee: nigeriaFeatures.wasteFee?.toString() || "",
        estateDues: nigeriaFeatures.estateDues?.toString() || "",
        waterSource: nigeriaFeatures.waterSource || "public",
        parkingAvailable:
          nigeriaFeatures.parkingAvailable ?? data.parkingAvailable ?? true,
      });

      setSelectedUnit(data);
      setShowEditUnitDialog(true);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load unit details");
    }
  };

  // Handle save edited unit
  const handleSaveEditedUnit = async () => {
    if (!selectedUnit) return;

    try {
      setEditingUnit(true);

      // Persist core scalar fields on the unit, and pack Nigeria‑specific
      // financial/utilities data into features.nigeria (same as Add Unit flow).
      const payload: any = {
        propertyId: unitForm.propertyId,
        unitNumber: unitForm.unitNumber,
        type: unitForm.type,
        floor: unitForm.floor ? Number(unitForm.floor) : null,
        bedrooms: unitForm.bedrooms ? Number(unitForm.bedrooms) : 0,
        bathrooms: unitForm.bathrooms ? Number(unitForm.bathrooms) : 0,
        size: unitForm.size ? Number(unitForm.size) : null,
        monthlyRent: unitForm.monthlyRent ? Number(unitForm.monthlyRent) : 0,
        securityDeposit: unitForm.securityDeposit
          ? Number(unitForm.securityDeposit)
          : null,
        status: unitForm.status,
        features: {
          nigeria: {
            rentFrequency: unitForm.rentFrequency,
            serviceCharge: unitForm.serviceCharge
              ? Number(unitForm.serviceCharge)
              : undefined,
            cautionFee: unitForm.cautionFee
              ? Number(unitForm.cautionFee)
              : undefined,
            legalFee: unitForm.legalFee ? Number(unitForm.legalFee) : undefined,
            agentCommission: unitForm.agentCommission
              ? Number(unitForm.agentCommission)
              : undefined,
            agreementFee: unitForm.agreementFee
              ? Number(unitForm.agreementFee)
              : undefined,
            electricityMeter: unitForm.electricityMeter || undefined,
            prepaidMeter: unitForm.prepaidMeter,
            wasteFee: unitForm.wasteFee ? Number(unitForm.wasteFee) : undefined,
            estateDues: unitForm.estateDues
              ? Number(unitForm.estateDues)
              : undefined,
            waterSource: unitForm.waterSource,
            parkingAvailable: unitForm.parkingAvailable,
          },
        },
      };

      const res = await updateUnit(selectedUnit.id, payload);

      if ((res as any).error) {
        throw new Error((res as any).error.error || "Failed to update unit");
      }

      toast.success("Unit updated successfully");
      setShowEditUnitDialog(false);
      setSelectedUnit(null);

      // Refresh units list
      const uRes = await getUnits();
      if (!uRes.error && Array.isArray(uRes.data)) {
        setUnitsData(uRes.data);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update unit");
    } finally {
      setEditingUnit(false);
    }
  };

  // Import Properties Functions
  const sampleCSVData = `name,propertyType,address,city,state,postalCode,country,totalUnits,floors,yearBuilt,totalArea,lotSize,parking,currency,avgRent,securityDeposit,applicationFee,legalFee,agentCommission,serviceCharge,agreementFee,insuranceProvider,insurancePolicyNumber,insurancePremium,insuranceExpiration,propertyTaxes,description,notes,coverImage,images
"Sunrise Apartments","Apartment Complex","123 Main Street","Lagos","Lagos","100001","Nigeria","12","3","2020","5000","2500","24","NGN","150000","300000","25000","50000","150000","30000","20000","AXA Mansard","POL-2024-001","500000","2025-12-31","250000","Modern apartment complex with swimming pool, gym, and 24/7 security","Near major shopping centers","https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800","https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800|https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"
"Palm Estate","Residential","45 Palm Avenue","Abuja","FCT","900001","Nigeria","8","2","2018","3500","1800","16","NGN","200000","400000","30000","75000","200000","40000","25000","Leadway Assurance","POL-2024-002","400000","2025-06-30","180000","Gated community with 24/7 security and backup power","Family-friendly neighborhood","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800|https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"
"Ocean View Towers","High Rise","78 Marina Road","Lagos","Lagos","100002","Nigeria","24","8","2022","12000","4000","50","NGN","350000","700000","50000","100000","350000","60000","35000","AIICO Insurance","POL-2024-003","800000","2025-09-15","450000","Luxury waterfront apartments with panoramic ocean views","Premium location with easy access to Victoria Island","https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800","https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800|https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"`;

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSVData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "property_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sample CSV template downloaded");
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ""));

      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  };

  const validateImportData = (
    data: any[]
  ): { valid: any[]; errors: string[] } => {
    const errors: string[] = [];
    const valid: any[] = [];
    const requiredFields = [
      "name",
      "propertyType",
      "address",
      "city",
      "state",
      "totalUnits",
    ];

    data.forEach((row, index) => {
      const rowErrors: string[] = [];

      // Check required fields
      requiredFields.forEach((field) => {
        if (!row[field] || row[field].toString().trim() === "") {
          rowErrors.push(`Missing ${field}`);
        }
      });

      // Validate numeric fields
      const numericFields = [
        "totalUnits",
        "floors",
        "yearBuilt",
        "totalArea",
        "lotSize",
        "parking",
        "avgRent",
        "securityDeposit",
        "applicationFee",
        "legalFee",
        "agentCommission",
        "serviceCharge",
        "agreementFee",
        "insurancePremium",
        "propertyTaxes",
      ];

      numericFields.forEach((field) => {
        if (
          row[field] &&
          row[field].toString().trim() !== "" &&
          isNaN(parseFloat(row[field]))
        ) {
          rowErrors.push(`${field} must be a number`);
        }
      });

      if (rowErrors.length > 0) {
        errors.push(`Row ${index + 1}: ${rowErrors.join(", ")}`);
      } else {
        // Parse images - can be pipe-separated URLs
        const imagesArray = row.images
          ? row.images
              .split("|")
              .map((url: string) => url.trim())
              .filter((url: string) => url)
          : [];

        valid.push({
          // Basic Information
          name: row.name,
          propertyType: row.propertyType,
          address: row.address,
          city: row.city,
          state: row.state,
          postalCode: row.postalCode || "",
          country: row.country || "Nigeria",

          // Property Details
          totalUnits: parseInt(row.totalUnits) || 1,
          floors: row.floors ? parseInt(row.floors) : undefined,
          yearBuilt: row.yearBuilt ? parseInt(row.yearBuilt) : undefined,
          totalArea: row.totalArea ? parseFloat(row.totalArea) : undefined,
          lotSize: row.lotSize ? parseFloat(row.lotSize) : undefined,
          parking: row.parking ? parseInt(row.parking) : undefined,

          // Financial Information
          currency: row.currency || "NGN",
          avgRent: row.avgRent ? parseFloat(row.avgRent) : undefined,
          securityDeposit: row.securityDeposit
            ? parseFloat(row.securityDeposit)
            : undefined,
          applicationFee: row.applicationFee
            ? parseFloat(row.applicationFee)
            : undefined,
          legalFee: row.legalFee ? parseFloat(row.legalFee) : undefined,
          agentCommission: row.agentCommission
            ? parseFloat(row.agentCommission)
            : undefined,
          serviceCharge: row.serviceCharge
            ? parseFloat(row.serviceCharge)
            : undefined,
          agreementFee: row.agreementFee
            ? parseFloat(row.agreementFee)
            : undefined,

          // Insurance & Legal
          insuranceProvider: row.insuranceProvider || undefined,
          insurancePolicyNumber: row.insurancePolicyNumber || undefined,
          insurancePremium: row.insurancePremium
            ? parseFloat(row.insurancePremium)
            : undefined,
          insuranceExpiration: row.insuranceExpiration || undefined,
          propertyTaxes: row.propertyTaxes
            ? parseFloat(row.propertyTaxes)
            : undefined,

          // Additional Information
          description: row.description || "",
          notes: row.notes || "",

          // Images
          coverImage:
            row.coverImage || (imagesArray.length > 0 ? imagesArray[0] : ""),
          images: imagesArray,
        });
      }
    });

    return { valid, errors };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setImportFile(file);
    setImportErrors([]);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      const { valid, errors } = validateImportData(parsed);

      setImportData(valid);
      setImportErrors(errors);

      if (valid.length === 0 && errors.length > 0) {
        toast.error("No valid properties found in the file");
      } else if (valid.length > 0) {
        toast.success(`Found ${valid.length} valid properties to import`);
      }
    };
    reader.readAsText(file);
  };

  const handleImportProperties = async () => {
    if (importData.length === 0) {
      toast.error("No valid properties to import");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < importData.length; i++) {
      const property = importData[i];

      try {
        const res = await createProperty(property);
        if (res.error) {
          throw new Error(res.error.error || "Failed to create property");
        }
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`"${property.name}": ${error.message || "Unknown error"}`);
      }

      setImportProgress(Math.round(((i + 1) / importData.length) * 100));
    }

    setImportResults({ success, failed, errors });
    setIsImporting(false);

    if (success > 0) {
      toast.success(`Successfully imported ${success} properties`);
      // Trigger a refresh of the properties list
      window.location.reload();
    }

    if (failed > 0) {
      toast.error(`Failed to import ${failed} properties`);
    }
  };

  const resetImportDialog = () => {
    setShowImportDialog(false);
    setImportFile(null);
    setImportData([]);
    setImportErrors([]);
    setImportProgress(0);
    setImportResults(null);
  };

  // Expense Management Functions
  const loadExpenses = async () => {
    try {
      const [expRes, expStatsRes] = await Promise.all([
        getExpenses(),
        getExpenseStats(),
      ]);
      if (
        !expRes.error &&
        expRes.data?.data &&
        Array.isArray(expRes.data.data)
      ) {
        setExpenses(expRes.data.data);
      }
      if (!expStatsRes.error && expStatsRes.data) {
        setExpenseStats(expStatsRes.data);
      }
    } catch (error: any) {
      toast.error("Failed to load expenses");
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      propertyId: properties[0]?.id || "",
      unitId: "none",
      category: "",
      description: "",
      amount: "",
      currency: properties[0]?.currency || "NGN",
      date: new Date().toISOString().split("T")[0],
      dueDate: "",
      status: "pending",
      paymentMethod: "",
      notes: "",
    });
    setShowExpenseDialog(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      propertyId: expense.propertyId,
      unitId: expense.unitId || "",
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      currency: expense.currency,
      date: expense.date.split("T")[0],
      dueDate: expense.dueDate ? expense.dueDate.split("T")[0] : "",
      status: expense.status,
      paymentMethod: expense.paymentMethod || "",
      notes: expense.notes || "",
    });
    setShowExpenseDialog(true);
  };

  const handleSaveExpense = async () => {
    try {
      setExpenseSaving(true);

      if (
        !expenseForm.propertyId ||
        !expenseForm.category ||
        !expenseForm.description ||
        !expenseForm.amount
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const expenseData = {
        propertyId: expenseForm.propertyId,
        unitId:
          expenseForm.unitId && expenseForm.unitId !== "none"
            ? expenseForm.unitId
            : undefined,
        category: expenseForm.category,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        currency: expenseForm.currency,
        date: expenseForm.date,
        dueDate: expenseForm.dueDate || undefined,
        status: expenseForm.status,
        paymentMethod: expenseForm.paymentMethod || undefined,
        notes: expenseForm.notes || undefined,
      };

      if (editingExpense) {
        const res = await updateExpense(editingExpense.id, expenseData);
        if (res.error) {
          throw new Error(
            res.error.message || res.error.error || "Failed to update expense"
          );
        }
        toast.success("Expense updated successfully");
      } else {
        const res = await createExpense(expenseData);
        if (res.error) {
          throw new Error(
            res.error.message || res.error.error || "Failed to create expense"
          );
        }
        toast.success("Expense created successfully");
      }

      setShowExpenseDialog(false);
      await loadExpenses();

      // Refresh financial overview
      const fRes = await getFinancialOverview();
      if (!fRes.error && fRes.data) {
        const gross = Number(fRes.data.totalRevenue || 0);
        const expenses = Number(fRes.data.estimatedExpenses || 0);
        const net = Number(fRes.data.netOperatingIncome || 0);
        const capRate = Number(fRes.data.portfolioCapRate || 0);
        const occupancyRate = Number(fRes.data.occupancyRate || 0);
        const operatingMargin = Number(
          fRes.data.operatingMargin || (gross > 0 ? (net / gross) * 100 : 0)
        );
        setFinancialStats({
          gross,
          net,
          expenses,
          capRate,
          occupancyRate,
          operatingMargin,
        });
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to save expense");
    } finally {
      setExpenseSaving(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      setIsDeleting(true);
      const res = await deleteExpense(expenseToDelete.id);
      if (res.error) {
        throw new Error(
          res.error.message || res.error.error || "Failed to delete expense"
        );
      }

      toast.success("Expense deleted successfully");
      setShowExpenseDeleteDialog(false);
      setExpenseToDelete(null);
      await loadExpenses();

      // Refresh financial overview
      const fRes = await getFinancialOverview();
      if (!fRes.error && fRes.data) {
        const gross = Number(fRes.data.totalRevenue || 0);
        const expenses = Number(fRes.data.estimatedExpenses || 0);
        const net = Number(fRes.data.netOperatingIncome || 0);
        const capRate = Number(fRes.data.portfolioCapRate || 0);
        const occupancyRate = Number(fRes.data.occupancyRate || 0);
        const operatingMargin = Number(
          fRes.data.operatingMargin || (gross > 0 ? (net / gross) * 100 : 0)
        );
        setFinancialStats({
          gross,
          net,
          expenses,
          capRate,
          occupancyRate,
          operatingMargin,
        });
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete expense");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveMaintenance = async () => {
    if (!maintenanceForm.propertyId || !maintenanceForm.title) {
      toast.error("Please select a property and enter a title");
      return;
    }
    if (!maintenanceForm.description) {
      toast.error("Please provide a brief description");
      return;
    }

    try {
      setMaintenanceSaving(true);
      const payload: any = {
        propertyId: maintenanceForm.propertyId,
        title: maintenanceForm.title,
        description: maintenanceForm.description,
        priority: maintenanceForm.priority,
        category: maintenanceForm.category,
      };

      if (maintenanceForm.unitId && maintenanceForm.unitId !== "none") {
        payload.unitId = maintenanceForm.unitId;
      }
      if (maintenanceForm.scheduledDate) {
        payload.scheduledDate = maintenanceForm.scheduledDate;
      }
      if (maintenanceForm.notifyTenant) {
        payload.notifyTenant = true;
      }

      let response;
      if (maintenanceEditingId) {
        response = await updateMaintenanceRequest(
          maintenanceEditingId,
          payload
        );
      } else {
        response = await createMaintenanceRequest(payload);
      }

      if (response.error) {
        throw new Error(response.error.message || "Unable to save request");
      }

      toast.success(
        maintenanceEditingId
          ? "Maintenance request updated"
          : "Maintenance request created"
      );
      setShowAddMaintenanceDialog(false);
      resetMaintenanceForm();
      await refreshMaintenanceRequests();
    } catch (error: any) {
      console.error("Save maintenance error", error);
      toast.error(error?.message || "Failed to save maintenance request");
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const resetMaintenanceForm = () => {
    setMaintenanceForm({
      propertyId: "",
      unitId: "none",
      title: "",
      description: "",
      priority: "medium",
      category: "general",
      scheduledDate: "",
      notifyTenant: false,
    });
    setMaintenanceEditingId(null);
  };

  const formatDateTimeInput = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const tzOffset = date.getTimezoneOffset();
    const localISO = new Date(date.getTime() - tzOffset * 60000)
      .toISOString()
      .slice(0, 16);
    return localISO;
  };

  const handleMaintenanceView = (request: any) => {
    setSelectedMaintenanceRequest(request);
    setShowMaintenanceViewDialog(true);
  };

  const handleMaintenanceEdit = (request: any) => {
    setMaintenanceEditingId(request.id);
    setMaintenanceForm({
      propertyId: request.propertyId || request.property?.id || "",
      unitId: request.unitId || "none",
      title: request.title || "",
      description: request.description || "",
      priority: request.priority || "medium",
      category: request.category || "general",
      scheduledDate: formatDateTimeInput(request.scheduledDate),
      notifyTenant: false,
    });
    setShowAddMaintenanceDialog(true);
  };

  const handleMaintenanceDelete = async (request: any) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this maintenance request?"
    );
    if (!confirmed) return;

    try {
      const response = await deleteMaintenanceRequest(request.id);
      if (response.error) {
        throw new Error(response.error.message || "Unable to delete request");
      }
      toast.success("Maintenance request deleted");
      await refreshMaintenanceRequests();
    } catch (error: any) {
      console.error("Delete maintenance error", error);
      toast.error(error?.message || "Failed to delete maintenance request");
    }
  };

  const handleGenerateReport = () => {
    if (
      reportPropertyFilter !== "all" &&
      !properties.some(
        (property) => String(property.id) === reportPropertyFilter
      )
    ) {
      toast.error("Selected property not found");
      return;
    }

    setReportGenerating(true);

    try {
      const targetProperties =
        reportPropertyFilter === "all"
          ? visibleProperties
          : visibleProperties.filter(
              (property) => String(property.id) === reportPropertyFilter
            );

      const propertyIds = targetProperties.map((property) =>
        String(property.id)
      );

      const filteredExpenses =
        reportPropertyFilter === "all"
          ? expenses
          : expenses.filter((expense) =>
              propertyIds.includes(String(expense.propertyId))
            );

      const filteredMaintenance =
        reportPropertyFilter === "all"
          ? maintenanceRequests
          : maintenanceRequests.filter(
              (request: any) =>
                String(request.propertyId) === reportPropertyFilter
            );

      const filteredUnits =
        reportPropertyFilter === "all"
          ? unitsData
          : unitsData.filter(
              (unit) => String(unit.propertyId) === reportPropertyFilter
            );

      const totalUnits = targetProperties.reduce(
        (sum, property) => sum + (property._count?.units ?? 0),
        0
      );
      const occupiedUnits = targetProperties.reduce(
        (sum, property) => sum + (property.occupiedUnits ?? 0),
        0
      );

      const sortedExpenses = [...filteredExpenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const sortedMaintenance = [...filteredMaintenance].sort(
        (a: any, b: any) =>
          new Date(b.createdAt || b.updatedAt || 0).getTime() -
          new Date(a.createdAt || a.updatedAt || 0).getTime()
      );

      const filters = {
        propertyId: reportPropertyFilter,
        startDate: reportStartDate || null,
        endDate: reportEndDate || null,
      };

      const now = new Date();

      const buildReportData = (type: SingleReportType) => {
        switch (type) {
          case "financial": {
            const totalRevenue = targetProperties.reduce(
              (sum, property) => sum + Number(property.totalMonthlyIncome || 0),
              0
            );

            const totalExpensesAmount = filteredExpenses.reduce(
              (sum, expense) => sum + Number(expense.amount || 0),
              0
            );

            const expenseCategoriesMap = filteredExpenses.reduce(
              (acc, expense) => {
                const category = expense.category || "other";
                const current = acc.get(category) || { amount: 0, count: 0 };
                current.amount += Number(expense.amount || 0);
                current.count += 1;
                acc.set(category, current);
                return acc;
              },
              new Map<string, { amount: number; count: number }>()
            );

            const expenseCategories = Array.from(expenseCategoriesMap.entries())
              .map(([category, info]) => ({
                category,
                label: formatCategoryLabel(category),
                amount: info.amount,
                count: info.count,
              }))
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5);

            return {
              portfolio: {
                totalProperties: targetProperties.length,
                totalUnits,
                occupiedUnits,
                occupancyRate:
                  totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
                totalRevenue,
                totalExpenses: totalExpensesAmount,
                netOperatingIncome: totalRevenue - totalExpensesAmount,
              },
              expenses: {
                total: totalExpensesAmount,
                categories: expenseCategories,
              },
              revenueTrends: monthlyRevenueData.slice(-6),
              recentExpenses: sortedExpenses.slice(0, 6),
            };
          }
          case "occupancy": {
            const propertyBreakdown = targetProperties.map((property) => {
              const propertyUnits = filteredUnits.filter(
                (unit) => String(unit.propertyId) === String(property.id)
              );
              const propertyTotalUnits =
                property._count?.units ?? propertyUnits.length ?? 0;
              const propertyOccupiedUnits = propertyUnits.filter(
                (unit) => unit.status === "occupied"
              ).length;
              const propertyVacant = Math.max(
                propertyTotalUnits - propertyOccupiedUnits,
                0
              );

              return {
                id: property.id,
                name: property.name,
                totalUnits: propertyTotalUnits,
                occupiedUnits: propertyOccupiedUnits,
                vacantUnits: propertyVacant,
                occupancyRate:
                  propertyTotalUnits > 0
                    ? (propertyOccupiedUnits / propertyTotalUnits) * 100
                    : 0,
                monthlyRevenue: Number(property.totalMonthlyIncome || 0),
                currency: property.currency || smartBaseCurrency,
              };
            });

            return {
              summary: {
                totalProperties: targetProperties.length,
                totalUnits,
                occupiedUnits,
                vacantUnits: Math.max(totalUnits - occupiedUnits, 0),
                occupancyRate:
                  totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
              },
              propertyBreakdown,
            };
          }
          case "maintenance": {
            const totalRequests = filteredMaintenance.length;
            const completed = filteredMaintenance.filter(
              (request: any) =>
                (request.status || "").toLowerCase() === "completed"
            ).length;
            const highPriority = filteredMaintenance.filter(
              (request: any) =>
                (request.priority || "").toLowerCase() === "high"
            ).length;
            const costTotal = filteredMaintenance.reduce(
              (sum, request: any) =>
                sum + Number(request.actualCost ?? request.estimatedCost ?? 0),
              0
            );

            const upcoming = maintenanceRequests
              .filter((request: any) => {
                if (!request.scheduledDate) return false;
                const scheduledDate = new Date(request.scheduledDate);
                if (Number.isNaN(scheduledDate.getTime())) return false;
                if (
                  reportPropertyFilter !== "all" &&
                  String(request.propertyId) !== reportPropertyFilter
                ) {
                  return false;
                }
                return scheduledDate.getTime() > Date.now();
              })
              .sort(
                (a: any, b: any) =>
                  new Date(a.scheduledDate).getTime() -
                  new Date(b.scheduledDate).getTime()
              )
              .slice(0, 5);

            return {
              summary: {
                totalRequests,
                completed,
                open: Math.max(totalRequests - completed, 0),
                highPriority,
                averageCost: totalRequests ? costTotal / totalRequests : 0,
              },
              highPriorityRequests: filteredMaintenance
                .filter(
                  (request: any) =>
                    (request.priority || "").toLowerCase() === "high"
                )
                .slice(0, 5),
              recentRequests: sortedMaintenance.slice(0, 6),
              upcoming,
            };
          }
          case "tenant": {
            const tenantUnits = unitsData.filter((unit) => {
              const hasTenant = Boolean(unit.leases?.[0]?.users);
              if (!hasTenant) return false;
              if (reportPropertyFilter === "all") return true;
              return String(unit.propertyId) === reportPropertyFilter;
            });

            const tenants = tenantUnits.map((unit) => {
              const lease = unit.leases?.[0];
              return {
                propertyId: unit.propertyId,
                unitId: unit.id,
                unitNumber: unit.unitNumber,
                tenantName: lease?.users?.name || "Unknown tenant",
                email: lease?.users?.email || "",
                phone: lease?.users?.phone || "",
                leaseEnd: lease?.endDate || null,
                status: unit.status,
              };
            });

            const expiringSoon = tenants.filter((tenant) => {
              if (!tenant.leaseEnd) return false;
              const leaseEndDate = new Date(tenant.leaseEnd);
              if (Number.isNaN(leaseEndDate.getTime())) return false;
              const daysUntil =
                (leaseEndDate.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24);
              return daysUntil <= 30;
            }).length;

            return {
              totalTenants: tenants.length,
              expiringSoon,
              tenants: tenants.slice(0, 10),
            };
          }
          default:
            return null;
        }
      };

      let data: any;
      if (reportType === "all") {
        data = ALL_REPORT_TYPES.reduce((acc, type) => {
          acc[type] = buildReportData(type);
          return acc;
        }, {} as Record<SingleReportType, any>);
      } else {
        data = buildReportData(reportType as SingleReportType);
      }

      if (!data) {
        throw new Error("Unable to generate report data");
      }
      const payload: GeneratedReport = {
        type: reportType,
        generatedAt: new Date().toISOString(),
        filters,
        data,
      };

      setReportPreview(payload);
      toast.success("Report generated");
    } catch (error) {
      console.error("Failed to generate report", error);
      toast.error("Failed to generate report");
    } finally {
      setReportGenerating(false);
    }
  };

  const handleResetReportFilters = () => {
    setReportPropertyFilter("all");
    setReportStartDate("");
    setReportEndDate("");
    setReportPreview(null);
    setReportGenerating(false);
  };

  const handleDownloadReport = async () => {
    if (!reportPreview) {
      toast.error("Generate a report first");
      return;
    }
    if (!reportPreviewRef.current) {
      toast.error("Nothing to export yet");
      return;
    }

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportPreviewRef.current, {
        scale: Math.max(window.devicePixelRatio, 2),
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const usableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      pdf.setFontSize(14);
      pdf.text("Portfolio Report", margin, margin - 6);
      pdf.setFontSize(10);
      pdf.text(
        `Type: ${REPORT_TYPE_LABELS[reportPreview.type]} | Property: ${
          reportPreviewPropertyLabel || "All properties"
        }`,
        margin,
        margin + 8
      );
      pdf.text(
        `Generated: ${new Date(reportPreview.generatedAt).toLocaleString()}`,
        margin,
        margin + 20
      );
      if (reportPreviewDateRange) {
        pdf.text(`Range: ${reportPreviewDateRange}`, margin, margin + 32);
      }

      let position = margin + (reportPreviewDateRange ? 44 : 32);
      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);

      let heightLeft = imgHeight - (pageHeight - position - margin);
      let offset = position - imgHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, offset, usableWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
        offset -= pageHeight - margin * 2;
      }

      const suffix = new Date().toISOString().split("T")[0];
      const filename = `portfolio-report-${reportPreview.type}-${suffix}.pdf`;
      pdf.save(filename);
      toast.success("PDF downloaded");
    } catch (error) {
      console.error("PDF download failed", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleEmailReport = () => {
    if (!reportPreview) {
      toast.error("Generate a report first");
      return;
    }

    toast.success(
      "Report queued for delivery. You'll receive it via email shortly."
    );
  };

  const handleOpenFinancialDetails = (property: any) => {
    const details = computePropertyFinancialDetails(property);
    setFinancialDetailProperty(details);
    setShowFinancialDetailDialog(true);
  };

  const getPropertyUnitsForExpense = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    if (!property) return [];
    return unitsData.filter((u) => u.propertyId === propertyId);
  };

  // Filter out deleted properties for immediate UI feedback
  const visibleProperties = properties.filter(
    (property) => !deletedPropertyIds.has(property.id)
  );

  // Calculate portfolio metrics from visible properties (excludes deleted)
  // Use _count.units (actual unit records) instead of totalUnits (metadata field)
  const getActualUnitCount = (p: any) => p._count?.units ?? 0;

  const portfolioMetrics = {
    totalProperties: visibleProperties.length,
    totalUnits: visibleProperties.reduce(
      (sum, p) => sum + getActualUnitCount(p),
      0
    ),
    occupiedUnits: visibleProperties.reduce(
      (sum, p) => sum + (p.occupiedUnits ?? 0),
      0
    ),
    vacantUnits: visibleProperties.reduce((sum, p) => {
      const total = getActualUnitCount(p);
      const occ = p.occupiedUnits ?? 0;
      return sum + Math.max(total - occ, 0);
    }, 0),
    totalRevenue: visibleProperties.reduce(
      (sum, p) => sum + (p.totalMonthlyIncome || 0),
      0
    ),
    avgOccupancy:
      visibleProperties.length > 0
        ? visibleProperties.reduce((sum, p) => {
            const total = getActualUnitCount(p);
            const occ = p.occupiedUnits ?? 0;
            return (
              sum + (p.occupancyRate ?? (total > 0 ? (occ / total) * 100 : 0))
            );
          }, 0) / visibleProperties.length
        : 0,
    maintenanceRequests: maintenanceData.length,
  };

  const maintenanceRequests = maintenanceData;

  const maintenanceStatsAggregates = useMemo(() => {
    const total = maintenanceRequests.length;
    const highPriority = maintenanceRequests.filter(
      (request: any) => (request.priority || "").toLowerCase() === "high"
    ).length;

    const costEntries = maintenanceRequests
      .map((request: any) =>
        Number(
          request.actualCost ?? request.estimatedCost ?? request.cost ?? null
        )
      )
      .filter((value) => Number.isFinite(value)) as number[];
    const avgCost =
      costEntries.length > 0
        ? costEntries.reduce((sum, value) => sum + value, 0) /
          costEntries.length
        : 0;

    const responseEntries = maintenanceRequests
      .map((request: any) => {
        if (typeof request.responseTimeHours === "number") {
          return request.responseTimeHours;
        }
        const createdAt = request.createdAt
          ? new Date(request.createdAt).getTime()
          : null;
        const firstResponseAt =
          request.firstResponseAt ||
          request.scheduledDate ||
          request.completedAt;
        if (createdAt && firstResponseAt) {
          const responseTime =
            (new Date(firstResponseAt).getTime() - createdAt) /
            (1000 * 60 * 60);
          return responseTime;
        }
        return null;
      })
      .filter(
        (value): value is number => typeof value === "number" && value >= 0
      );

    const avgResponseHours =
      responseEntries.length > 0
        ? responseEntries.reduce((sum, value) => sum + value, 0) /
          responseEntries.length
        : null;

    return {
      total,
      highPriority,
      avgCost,
      avgResponseHours,
    };
  }, [maintenanceRequests]);

  const scheduledMaintenanceList = useMemo(() => {
    const now = Date.now();
    return maintenanceRequests
      .filter((request: any) => {
        if ((request.status || "").toLowerCase() === "scheduled") {
          return true;
        }
        if (request.scheduledDate) {
          const scheduledTime = new Date(request.scheduledDate).getTime();
          return scheduledTime >= now;
        }
        return false;
      })
      .sort((a: any, b: any) => {
        const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
        const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 3);
  }, [maintenanceRequests]);

  const formatCategoryLabel = (value: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ||
    value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatMonthLabel = (month: string) => {
    if (!month) return "—";
    const parsed = new Date(month);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
    }
    return month;
  };

  const formatReportDateRange = (
    start?: string | null,
    end?: string | null
  ) => {
    if (start && end) {
      return `${start} → ${end}`;
    }
    if (start) {
      return `From ${start}`;
    }
    if (end) {
      return `Until ${end}`;
    }
    return null;
  };

  const expenseCategoryBreakdown = useMemo(() => {
    if (!expenseStats?.byCategory?.length) {
      return { total: expenseStats?.totalAmount ?? 0, items: [] };
    }

    const total =
      expenseStats.totalAmount ??
      expenseStats.byCategory.reduce(
        (sum: number, category: any) =>
          sum + Number(category._sum?.amount ?? 0),
        0
      );

    const sorted = [...expenseStats.byCategory].sort(
      (a, b) => Number(b._sum?.amount ?? 0) - Number(a._sum?.amount ?? 0)
    );

    const items = sorted.slice(0, 5).map((category) => {
      const amount = Number(category._sum?.amount ?? 0);
      const percent = total > 0 ? (amount / total) * 100 : 0;
      const Icon = expenseCategoryIconMap[category.category] ?? FileText;

      return {
        key: category.category,
        label: formatCategoryLabel(category.category),
        amount,
        percent,
        Icon,
      };
    });

    return { total, items };
  }, [expenseStats]);

  const renderReportSection = (
    type: SingleReportType,
    sectionData: any,
    context: { propertyLabel: string; filters: typeof reportPreview.filters }
  ) => {
    if (!sectionData) {
      return (
        <p className="text-sm text-muted-foreground">
          No data available for this report.
        </p>
      );
    }

    switch (type) {
      case "financial": {
        const { portfolio, expenses, revenueTrends, recentExpenses } =
          sectionData || {};
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Total revenue</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(
                    portfolio?.totalRevenue ?? 0,
                    smartBaseCurrency
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Net{" "}
                  {formatCurrency(
                    portfolio?.netOperatingIncome ?? 0,
                    smartBaseCurrency
                  )}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Total expenses</p>
                <p className="text-xl font-semibold text-red-600">
                  {formatCurrency(expenses?.total ?? 0, smartBaseCurrency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {context.propertyLabel}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Occupancy rate</p>
                <p className="text-xl font-semibold">
                  {portfolio?.occupancyRate
                    ? `${portfolio.occupancyRate.toFixed(1)}%`
                    : "0%"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {portfolio?.occupiedUnits ?? 0} of{" "}
                  {portfolio?.totalUnits ?? 0} units
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Net income</p>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(
                    (portfolio?.netOperatingIncome ?? 0) -
                      (expenses?.total ?? 0),
                    smartBaseCurrency
                  )}
                </p>
                <p className="text-xs text-muted-foreground">After expenses</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Top expense categories</h4>
                <Badge variant="outline">
                  {expenses?.categories?.length ?? 0}
                </Badge>
              </div>
              {expenses?.categories?.length ? (
                <div className="space-y-2">
                  {expenses.categories.map((category: any) => (
                    <div
                      key={category.category}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{category.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.count} expense
                          {category.count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatCurrency(category.amount, smartBaseCurrency)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No expenses recorded for the selected filters.
                </p>
              )}
            </div>

            {revenueTrends?.length ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Revenue trend</h4>
                  <Badge variant="outline">
                    Last {revenueTrends.length} months
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {revenueTrends.map((item: MonthlyRevenueData) => (
                    <div
                      key={item.month}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatMonthLabel(item.month)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Net{" "}
                          {formatCurrency(
                            item.netIncome || 0,
                            smartBaseCurrency
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(item.revenue || 0, smartBaseCurrency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expenses{" "}
                          {formatCurrency(
                            item.expenses || 0,
                            smartBaseCurrency
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Recent expenses</h4>
                <Badge variant="outline">{recentExpenses?.length ?? 0}</Badge>
              </div>
              {recentExpenses?.length ? (
                <div className="space-y-2">
                  {recentExpenses.map((expense: Expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.property?.name || "—"} •{" "}
                          {formatCategoryLabel(expense.category)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(
                            expense.amount,
                            expense.currency || smartBaseCurrency
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {expense.date
                            ? new Date(expense.date).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No expense data available for this filter.
                </p>
              )}
            </div>
          </div>
        );
      }
      case "occupancy": {
        const { summary, propertyBreakdown } = sectionData || {};
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Total units</p>
                <p className="text-xl font-semibold">
                  {summary?.totalUnits ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Occupied</p>
                <p className="text-xl font-semibold text-green-600">
                  {summary?.occupiedUnits ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Vacant</p>
                <p className="text-xl font-semibold text-yellow-600">
                  {summary?.vacantUnits ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Occupancy rate</p>
                <p className="text-xl font-semibold">
                  {summary?.occupancyRate
                    ? `${summary.occupancyRate.toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
            </div>

            {propertyBreakdown?.length ? (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Total Units</TableHead>
                      <TableHead>Occupied</TableHead>
                      <TableHead>Vacant</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propertyBreakdown.map((property: any) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">
                          {property.name}
                        </TableCell>
                        <TableCell>{property.totalUnits}</TableCell>
                        <TableCell>{property.occupiedUnits}</TableCell>
                        <TableCell>{property.vacantUnits}</TableCell>
                        <TableCell>
                          {property.occupancyRate
                            ? `${property.occupancyRate.toFixed(1)}%`
                            : "0%"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            property.monthlyRevenue || 0,
                            property.currency || smartBaseCurrency
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No occupancy data available for the selected filters.
              </p>
            )}
          </div>
        );
      }
      case "maintenance": {
        const { summary, highPriorityRequests, recentRequests, upcoming } =
          sectionData || {};
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Active requests</p>
                <p className="text-xl font-semibold">
                  {summary?.totalRequests ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-semibold text-green-600">
                  {summary?.completed ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">High priority</p>
                <p className="text-xl font-semibold text-red-600">
                  {summary?.highPriority ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Avg. cost</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(summary?.averageCost ?? 0, smartBaseCurrency)}
                </p>
              </div>
            </div>

            {highPriorityRequests?.length ? (
              <div className="space-y-3">
                <h4 className="font-semibold">High-priority queue</h4>
                <div className="space-y-2">
                  {highPriorityRequests.map((request: any) => (
                    <div key={request.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{request.title}</p>
                        <Badge variant="destructive">High</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {request.property?.name || "—"} •{" "}
                        {request.category || "general"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-semibold">Recent activity</h4>
                {recentRequests?.length ? (
                  <div className="space-y-2">
                    {recentRequests.map((request: any) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.property?.name || "—"} •{" "}
                            {request.status || "pending"}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {request.priority || "medium"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No maintenance activity recorded for this filter.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Upcoming schedule</h4>
                {upcoming?.length ? (
                  <div className="space-y-2">
                    {upcoming.map((request: any) => (
                      <div key={request.id} className="rounded-lg border p-3">
                        <p className="font-medium">{request.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.property?.name || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.scheduledDate).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No upcoming visits scheduled.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      }
      case "tenant": {
        const { totalTenants, expiringSoon, tenants } = sectionData || {};
        const selectedVacantUnits =
          context.filters.propertyId === "all"
            ? portfolioMetrics.vacantUnits
            : (() => {
                const property = visibleProperties.find(
                  (p) => String(p.id) === context.filters.propertyId
                );
                if (!property) return 0;
                const total = property._count?.units ?? 0;
                const occupied = property.occupiedUnits ?? 0;
                return Math.max(total - occupied, 0);
              })();

        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Active tenants</p>
                <p className="text-xl font-semibold">{totalTenants ?? 0}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">
                  Expiring within 30 days
                </p>
                <p className="text-xl font-semibold text-yellow-600">
                  {expiringSoon ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Vacant units</p>
                <p className="text-xl font-semibold">{selectedVacantUnits}</p>
              </div>
            </div>

            {tenants?.length ? (
              <div className="space-y-2">
                {tenants.map((tenant: any) => {
                  const propertyName =
                    visibleProperties.find(
                      (property) => property.id === tenant.propertyId
                    )?.name || "—";
                  return (
                    <div
                      key={`${tenant.unitId}-${tenant.tenantName}-${tenant.email}`}
                      className="rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tenant.tenantName}</p>
                          <p className="text-xs text-muted-foreground">
                            {propertyName} • Unit {tenant.unitNumber}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {tenant.status || "occupied"}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        {tenant.email && <p>{tenant.email}</p>}
                        {tenant.phone && <p>{tenant.phone}</p>}
                        {tenant.leaseEnd && (
                          <p>
                            Lease ends{" "}
                            {new Date(tenant.leaseEnd).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tenant data available. Assign tenants to units to populate
                this report.
              </p>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderReportPreview = () => {
    if (!reportPreview) return null;

    const propertyLabel = reportPreviewPropertyLabel || "All properties";
    const context = { propertyLabel, filters: reportPreview.filters };

    if (reportPreview.type === "all") {
      return (
        <div className="space-y-10">
          {ALL_REPORT_TYPES.map((type) => {
            const sectionData = reportPreview.data?.[type];
            if (!sectionData) return null;
            return (
              <div key={type} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold">
                      {REPORT_TYPE_LABELS[type]} Report
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Snapshot for {propertyLabel}
                    </p>
                  </div>
                  <Badge variant="outline">{REPORT_TYPE_LABELS[type]}</Badge>
                </div>
                {renderReportSection(type, sectionData, context)}
              </div>
            );
          })}
        </div>
      );
    }

    return renderReportSection(
      reportPreview.type as SingleReportType,
      reportPreview.data,
      context
    );
  };
  const reportPreviewPropertyLabel = reportPreview
    ? reportPreview.filters.propertyId === "all"
      ? "All properties"
      : visibleProperties.find(
          (property) => String(property.id) === reportPreview.filters.propertyId
        )?.name || "Selected property"
    : null;

  const reportPreviewDateRange = reportPreview
    ? formatReportDateRange(
        reportPreview.filters.startDate,
        reportPreview.filters.endDate
      )
    : null;

  const financialTrendCards = useMemo(() => {
    const cards: Array<{
      title: string;
      value: string;
      change: number | null;
      positive: boolean;
      progress: number;
      subtitle?: string;
      tooltip?: string;
    }> = [];

    if (monthlyRevenueData.length) {
      const sortedData = [...monthlyRevenueData];
      const latest = sortedData[sortedData.length - 1];
      const previous =
        sortedData.length > 1 ? sortedData[sortedData.length - 2] : null;
      const change =
        previous && previous.revenue !== 0
          ? ((latest.revenue - previous.revenue) / previous.revenue) * 100
          : null;
      const maxRevenue = Math.max(
        ...sortedData.map((entry) => Number(entry.revenue || 0))
      );
      const progress =
        maxRevenue > 0 ? (Number(latest.revenue || 0) / maxRevenue) * 100 : 0;

      cards.push({
        title: "Revenue Growth",
        value: formatCurrency(Number(latest.revenue || 0), smartBaseCurrency),
        change,
        positive: change == null ? true : change >= 0,
        progress: Math.max(0, Math.min(100, progress)),
        tooltip: previous
          ? `Latest monthly revenue ${formatCurrency(
              Number(latest.revenue || 0),
              smartBaseCurrency
            )} compared to ${formatCurrency(
              Number(previous.revenue || 0),
              smartBaseCurrency
            )} in the prior month.`
          : "Latest recorded monthly revenue.",
      });
    }

    const occupancyPercent = Number.isFinite(portfolioMetrics.avgOccupancy)
      ? portfolioMetrics.avgOccupancy
      : 0;
    cards.push({
      title: "Occupancy Rate",
      value: `${occupancyPercent.toFixed(1)}%`,
      change: null,
      positive: true,
      progress: Math.max(0, Math.min(100, occupancyPercent)),
      tooltip:
        "Portfolio-wide occupancy calculated from all visible properties and their unit counts.",
    });

    const operatingMargin =
      typeof financialStats.operatingMargin === "number"
        ? financialStats.operatingMargin
        : financialStats.gross
        ? (Number(financialStats.net || 0) /
            Number(financialStats.gross || 1)) *
          100
        : 0;
    cards.push({
      title: "Operating Efficiency",
      value: `${operatingMargin.toFixed(1)}%`,
      change: null,
      positive: true,
      progress: Math.max(0, Math.min(100, operatingMargin)),
      tooltip:
        "Operating margin based on Net Operating Income divided by total revenue.",
    });

    if (expenseStats) {
      const maintenanceCategory = expenseStats.byCategory?.find(
        (category: any) => category.category === "maintenance"
      );
      const maintenanceAmount = Number(maintenanceCategory?._sum?.amount ?? 0);
      const totalExpenses = expenseStats.totalAmount || 0;
      const maintenancePercent =
        totalExpenses > 0 ? (maintenanceAmount / totalExpenses) * 100 : 0;
      cards.push({
        title: "Maintenance Costs",
        value: formatCurrency(maintenanceAmount, smartBaseCurrency),
        change: null,
        positive: maintenancePercent <= 50,
        progress: Math.max(0, Math.min(100, maintenancePercent)),
        subtitle:
          totalExpenses > 0
            ? `${maintenancePercent.toFixed(1)}% of total spend`
            : undefined,
        tooltip:
          "Share of maintenance expenses relative to total recorded expenses for the selected period.",
      });
    }

    return cards;
  }, [
    expenseStats,
    financialStats.gross,
    financialStats.net,
    financialStats.operatingMargin,
    monthlyRevenueData,
    portfolioMetrics.avgOccupancy,
    smartBaseCurrency,
  ]);

  const computePropertyFinancialDetails = (property: any) => {
    const propertyExpenses = expenses
      .filter((expense) => expense.propertyId === property.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalExpenses = propertyExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );

    const monthlyRevenue = Number(property.totalMonthlyIncome || 0);
    const netIncome = monthlyRevenue - totalExpenses;
    const occupancyRate =
      property._count?.units && property._count.units > 0
        ? ((property.occupiedUnits ?? 0) / property._count.units) * 100
        : 0;

    return {
      property,
      monthlyRevenue,
      totalExpenses,
      netIncome,
      occupancyRate,
      propertyExpenses,
    };
  };

  const units = unitsData.map((u) => ({
    id: u.id,
    propertyId: u.propertyId,
    unit: u.unitNumber,
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms,
    sqft: u.size,
    rent: u.monthlyRent,
    deposit: u.securityDeposit,
    status: u.status,
    tenant: u.leases?.[0]?.users?.name || null,
    leaseStart: u.leases?.[0]?.startDate
      ? new Date(u.leases[0].startDate).toISOString().split("T")[0]
      : null,
    leaseEnd: u.leases?.[0]?.endDate
      ? new Date(u.leases[0].endDate).toISOString().split("T")[0]
      : null,
    moveInDate: u.leases?.[0]?.signedAt
      ? new Date(u.leases[0].signedAt).toISOString().split("T")[0]
      : null,
    phoneNumber: u.leases?.[0]?.users?.phone || null,
    email: u.leases?.[0]?.users?.email || null,
  }));

  const filteredProperties = visibleProperties.filter((property) => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "maintenance":
        return <Wrench className="h-4 w-4 text-yellow-600" />;
      case "vacant":
        return <Home className="h-4 w-4 text-gray-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 font-semibold hover:bg-[#10B981]/20";
      case "maintenance":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30 font-semibold hover:bg-[#F59E0B]/20";
      case "vacant":
        return "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/30 font-semibold hover:bg-[#6B7280]/20";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300 font-semibold hover:bg-gray-200";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30 font-semibold hover:bg-[#EF4444]/20";
      case "medium":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30 font-semibold hover:bg-[#F59E0B]/20";
      case "low":
        return "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 font-semibold hover:bg-[#10B981]/20";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300 font-semibold hover:bg-gray-200";
    }
  };

  const getUnitStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 font-semibold";
      case "vacant":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30 font-semibold";
      case "maintenance":
        return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30 font-semibold";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300 font-semibold";
    }
  };

  const handlePropertyAction = async (action: string, propertyId: string) => {
    try {
      switch (action) {
        case "view": {
          if (onViewProperty) {
            onViewProperty(propertyId);
          }
          break;
        }
        case "edit": {
          if (onEditProperty) {
            onEditProperty(propertyId);
          }
          break;
        }
        case "duplicate": {
          const property = properties.find((p) => p.id === propertyId);
          if (property && onAddProperty) {
            const duplicatedProperty = {
              ...property,
              id: Date.now(),
              name: `${property.name} (Copy)`,
              occupiedUnits: 0,
              monthlyRevenue: 0,
              occupancyRate: 0,
            } as any;
            onAddProperty(duplicatedProperty);
            toast.success("Property duplicated successfully");
          }
          break;
        }
        case "archive": {
          // Call backend API to archive property
          const response = await archiveProperty(propertyId);
          if ((response as any).error) {
            throw new Error((response as any).error);
          }
          toast.success("Property archived successfully");

          // Refresh properties list if callback provided
          if (onUpdateProperty) {
            onUpdateProperty(propertyId as any, { status: "archived" });
          }
          break;
        }
        case "delete": {
          // Show confirmation dialog
          const property = properties.find((p) => p.id === propertyId);
          if (property) {
            setPropertyToDelete(property);
            setShowPropertyDeleteDialog(true);
          }
          break;
        }
        default:
          break;
      }
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    }
  };

  const handleConfirmDeleteProperty = async () => {
    if (!propertyToDelete) return;

    const propertyId = propertyToDelete.id;
    const propertyName = propertyToDelete.name;

    try {
      setIsDeletingProperty(true);

      // Close dialog immediately and show progress toast
      setShowPropertyDeleteDialog(false);
      const toastId = toast.loading(`Deleting "${propertyName}"...`);

      // Immediately remove from UI for instant feedback
      setDeletedPropertyIds((prev) => new Set([...prev, propertyId]));

      const response = await deleteProperty(propertyId);

      if ((response as any).error) {
        // Extract the error message from the error object
        const errorMessage =
          (response as any).error.error ||
          (response as any).error.message ||
          "Failed to delete property";
        throw new Error(errorMessage);
      }

      toast.success(`"${propertyName}" deleted successfully`, { id: toastId });
      setPropertyToDelete(null);

      // Notify parent to refresh the properties list
      if (onPropertyDeleted) {
        onPropertyDeleted(propertyId);
      } else if (onRefreshProperties) {
        onRefreshProperties();
      }
    } catch (e: any) {
      // Revert the UI change on error
      setDeletedPropertyIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
      toast.error(e?.message || "Failed to delete property");
    } finally {
      setIsDeletingProperty(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Inverted Brand Color (Gray 900) */}
      <header className="bg-[#111827] shadow-lg sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={onBack}
                className="mr-4 text-white hover:bg-white/10 hover:text-white"
              >
                ← Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold text-white">Properties</h1>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white hover:border-white/30"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button
                onClick={onNavigateToAddProperty}
                className="bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white hover:from-[#9333EA] hover:to-[#6D28D9] font-semibold shadow-lg shadow-purple-500/25"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm rounded-xl p-1 mb-6">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="properties"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                Properties
              </TabsTrigger>
              <TabsTrigger
                value="units"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                Units
              </TabsTrigger>
              <TabsTrigger
                value="financials"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                Financials
              </TabsTrigger>
              <TabsTrigger
                value="maintenance"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                Maintenance
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Portfolio Metrics - Brand Styled */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Properties
                    </CardTitle>
                    <div className="p-2 bg-[#7C3AED]/10 rounded-lg">
                      <Building2 className="h-4 w-4 text-[#7C3AED]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {portfolioMetrics.totalProperties}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {portfolioMetrics.totalUnits} total units
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#10B981] to-[#34D399]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Occupancy Rate
                    </CardTitle>
                    <div className="p-2 bg-[#10B981]/10 rounded-lg">
                      <Users className="h-4 w-4 text-[#10B981]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {portfolioMetrics.avgOccupancy.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {portfolioMetrics.occupiedUnits}/
                      {portfolioMetrics.totalUnits} units occupied
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Monthly Revenue
                    </CardTitle>
                    <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
                      <DollarSign className="h-4 w-4 text-[#3B82F6]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(
                        Number(portfolioMetrics.totalRevenue) || 0,
                        smartBaseCurrency
                      )}
                    </div>
                    <p className="text-sm mt-1">
                      {properties.length > 1 &&
                        properties.some(
                          (p) => p.currency !== smartBaseCurrency
                        ) && (
                          <span className="text-orange-600 mr-2">
                            Multi-currency ·{" "}
                          </span>
                        )}
                      <span className="text-[#10B981]">
                        +8.2% from last month
                      </span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Maintenance Requests
                    </CardTitle>
                    <div className="p-2 bg-[#F59E0B]/10 rounded-lg">
                      <Wrench className="h-4 w-4 text-[#F59E0B]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {portfolioMetrics.maintenanceRequests}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      1 high priority
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Property Performance Summary - Brand Styled */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">
                      Property Performance
                    </CardTitle>
                    <CardDescription>
                      Revenue and occupancy by property
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {visibleProperties.map((property) => (
                        <div
                          key={property.id}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-[#7C3AED]/30 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C3AED]/10 to-[#A855F7]/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-[#7C3AED]" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {property.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {property.occupiedUnits ?? 0}/
                                {property._count?.units ?? 0} units
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(
                                Number(property.totalMonthlyIncome) || 0,
                                property.currency || "NGN"
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              {(property._count?.units ?? 0) > 0
                                ? (
                                    ((property.occupiedUnits ?? 0) /
                                      (property._count?.units ?? 1)) *
                                    100
                                  ).toFixed(1)
                                : "0.0"}
                              % occupied
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest updates across all properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentActivity.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="mx-auto w-12 h-12 bg-[#7C3AED]/10 rounded-full flex items-center justify-center mb-3">
                            <Clock className="h-6 w-6 text-[#7C3AED]" />
                          </div>
                          <p className="text-sm text-gray-500">
                            No recent activity
                          </p>
                        </div>
                      ) : (
                        recentActivity.map((log: any) => (
                          <div
                            key={log.id}
                            className="flex items-start space-x-3 p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
                          >
                            <div className="p-2 bg-[#7C3AED]/10 rounded-lg">
                              <Activity className="h-4 w-4 text-[#7C3AED]" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                [{log.entity}] {log.action}: {log.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions - Brand Styled */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common property management tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={onNavigateToAddProperty}
                      className="group h-24 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#7C3AED]/30 bg-[#7C3AED]/5 hover:border-[#7C3AED] hover:bg-[#7C3AED]/10 transition-all duration-200"
                    >
                      <div className="p-2 bg-[#7C3AED]/10 rounded-lg group-hover:bg-[#7C3AED]/20 transition-colors">
                        <Plus className="h-6 w-6 text-[#7C3AED]" />
                      </div>
                      <span className="mt-2 text-sm font-medium text-gray-700">
                        Add Property
                      </span>
                    </button>
                    <button
                      className="group h-24 flex flex-col items-center justify-center rounded-xl border border-gray-200 hover:border-[#7C3AED] hover:shadow-md transition-all duration-200"
                      onClick={() => {
                        if (onNavigateToTenants) {
                          onNavigateToTenants();
                        } else {
                          toast.info("Tenant management feature coming soon!");
                        }
                      }}
                    >
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#7C3AED]/10 transition-colors">
                        <Users className="h-6 w-6 text-gray-600 group-hover:text-[#7C3AED]" />
                      </div>
                      <span className="mt-2 text-sm font-medium text-gray-700">
                        Manage Tenants
                      </span>
                    </button>
                    <button
                      className="group h-24 flex flex-col items-center justify-center rounded-xl border border-gray-200 hover:border-[#7C3AED] hover:shadow-md transition-all duration-200"
                      onClick={() => {
                        if (onNavigateToMaintenance) {
                          onNavigateToMaintenance();
                        } else {
                          toast.info(
                            "Maintenance scheduling feature coming soon!"
                          );
                        }
                      }}
                    >
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#7C3AED]/10 transition-colors">
                        <Wrench className="h-6 w-6 text-gray-600 group-hover:text-[#7C3AED]" />
                      </div>
                      <span className="mt-2 text-sm font-medium text-gray-700">
                        Schedule Maintenance
                      </span>
                    </button>
                    <button
                      className="group h-24 flex flex-col items-center justify-center rounded-xl border border-gray-200 hover:border-[#7C3AED] hover:shadow-md transition-all duration-200"
                      onClick={() => setActiveTab("reports")}
                    >
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#7C3AED]/10 transition-colors">
                        <FileText className="h-6 w-6 text-gray-600 group-hover:text-[#7C3AED]" />
                      </div>
                      <span className="mt-2 text-sm font-medium text-gray-700">
                        Generate Report
                      </span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-6">
              {/* Search and Filters - Brand Styled */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    Property Search & Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1">
                      <Input
                        placeholder="Search properties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                      />
                    </div>

                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-full md:w-40 bg-gray-50 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="vacant">Vacant</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={
                          viewMode === "grid"
                            ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900"
                        }
                      >
                        Grid
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className={
                          viewMode === "list"
                            ? "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900"
                        }
                      >
                        List
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Properties Grid/List View - Brand Styled */}
              {viewMode === "grid" ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((property) => (
                    <Card
                      key={property.id}
                      className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        {Array.isArray(property.images) &&
                        property.images.length > 0 ? (
                          <img
                            src={property.images[0]}
                            alt={property.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <Building2 className="h-12 w-12 text-gray-300 mb-2" />
                            <span className="text-sm text-gray-400">
                              No image
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge
                            variant="outline"
                            className={`shadow-lg backdrop-blur-sm ${getStatusBadge(
                              property.status
                            )}`}
                          >
                            {property.status.charAt(0).toUpperCase() +
                              property.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="absolute top-3 left-3">
                          <div className="px-2 py-1 bg-[#111827]/80 backdrop-blur-sm rounded-lg">
                            <span className="text-xs font-medium text-white">
                              {property.propertyType || "Property"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 truncate">
                              {property.name}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-gray-400" />
                              <span className="truncate">
                                {property.address}
                              </span>
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() =>
                                  handlePropertyAction("view", property.id)
                                }
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4 text-blue-600" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handlePropertyAction("edit", property.id)
                                }
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4 text-[#7C3AED]" />
                                Edit Property
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handlePropertyAction("duplicate", property.id)
                                }
                                className="cursor-pointer"
                              >
                                <Copy className="mr-2 h-4 w-4 text-gray-600" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handlePropertyAction("archive", property.id)
                                }
                                className="cursor-pointer"
                              >
                                <Archive className="mr-2 h-4 w-4 text-orange-600" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handlePropertyAction("delete", property.id)
                                }
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Property
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2.5 mb-4">
                          <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600 flex items-center">
                              <Home className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              Units
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {property.occupiedUnits ?? 0}/
                              {property._count?.units ?? 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600 flex items-center">
                              <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              Occupancy
                            </span>
                            <span className="text-sm font-semibold text-[#10B981]">
                              {(
                                property.occupancyRate ??
                                ((property._count?.units ?? 0) > 0
                                  ? ((property.occupiedUnits ?? 0) /
                                      (property._count?.units ?? 1)) *
                                    100
                                  : 0)
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 px-3 bg-gradient-to-r from-[#10B981]/10 to-[#10B981]/5 rounded-lg border border-[#10B981]/20">
                            <span className="text-sm font-medium text-gray-700 flex items-center">
                              <DollarSign className="h-3.5 w-3.5 mr-1 text-[#10B981]" />
                              Monthly Revenue
                            </span>
                            <span className="text-sm font-bold text-[#10B981]">
                              {formatCurrency(
                                Number(property.totalMonthlyIncome) || 0,
                                property.currency || "NGN"
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600 flex items-center">
                              <Users className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              Manager
                            </span>
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                              {property.property_managers?.[0]?.users?.name ??
                                "Unassigned"}
                            </span>
                          </div>
                        </div>

                        {Array.isArray(property.features) &&
                          property.features.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {(Array.isArray(property.features)
                                ? property.features
                                : []
                              )
                                .slice(0, 3)
                                .map((feature: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs bg-[#7C3AED]/5 text-[#7C3AED] border-[#7C3AED]/20"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              {(Array.isArray(property.features)
                                ? property.features
                                : []
                              ).length > 3 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-gray-100 text-gray-600 border-gray-300"
                                >
                                  +{(property.features as any[]).length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                            onClick={() =>
                              handlePropertyAction("view", property.id)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                            onClick={() =>
                              handlePropertyAction("edit", property.id)
                            }
                          >
                            <Edit className="h-4 w-4 mr-1.5" />
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#111827] hover:bg-[#111827]">
                          <TableHead className="text-white font-semibold">
                            Property
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Location
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Units
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Occupancy
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Revenue
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Manager
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Status
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProperties.map((property, index) => (
                          <TableRow
                            key={property.id}
                            className={`hover:bg-[#7C3AED]/5 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                            }`}
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                                  {Array.isArray(property.images) &&
                                  property.images.length > 0 ? (
                                    <img
                                      src={property.images[0]}
                                      alt={property.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Building2 className="h-5 w-5 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 truncate">
                                    {property.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {property.propertyType}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-0">
                                <p className="text-sm text-gray-900 truncate">
                                  {property.address}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {property.city}, {property.state}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-medium text-gray-900">
                                {property.occupiedUnits ?? 0}/
                                {property._count?.units ?? 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-[#10B981] min-w-[45px]">
                                  {(property._count?.units ?? 0) > 0
                                    ? (
                                        ((property.occupiedUnits ?? 0) /
                                          (property._count?.units ?? 1)) *
                                        100
                                      ).toFixed(1)
                                    : "0.0"}
                                  %
                                </span>
                                <Progress
                                  value={
                                    (property._count?.units ?? 0) > 0
                                      ? ((property.occupiedUnits ?? 0) /
                                          (property._count?.units ?? 1)) *
                                        100
                                      : 0
                                  }
                                  className="w-20 h-2 bg-gray-200"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#10B981]/10 to-[#10B981]/5 border border-[#10B981]/20">
                                <span className="text-sm font-bold text-[#10B981]">
                                  {formatCurrency(
                                    Number(property.totalMonthlyIncome) || 0,
                                    property.currency || "NGN"
                                  )}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {property.manager || "Unassigned"}
                                </p>
                                {property.managerPhone && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {property.managerPhone}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="p-1 rounded-lg bg-gray-100">
                                  {getStatusIcon(property.status)}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={getStatusBadge(property.status)}
                                >
                                  {property.status.charAt(0).toUpperCase() +
                                    property.status.slice(1)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handlePropertyAction("view", property.id)
                                  }
                                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handlePropertyAction("edit", property.id)
                                  }
                                  className="hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] hover:border-[#7C3AED]/30"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="hover:bg-gray-100"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                  >
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handlePropertyAction(
                                          "duplicate",
                                          property.id
                                        )
                                      }
                                      className="cursor-pointer"
                                    >
                                      <Copy className="mr-2 h-4 w-4 text-gray-600" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handlePropertyAction(
                                          "archive",
                                          property.id
                                        )
                                      }
                                      className="cursor-pointer"
                                    >
                                      <Archive className="mr-2 h-4 w-4 text-orange-600" />
                                      Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handlePropertyAction(
                                          "delete",
                                          property.id
                                        )
                                      }
                                      className="text-red-600 focus:text-red-600 cursor-pointer"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Property
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Other tabs with full implementation */}
            <TabsContent value="units" className="space-y-6">
              {/* Units Overview - Brand Styled */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Units
                    </CardTitle>
                    <div className="p-2 bg-[#7C3AED]/10 rounded-lg">
                      <Home className="h-4 w-4 text-[#7C3AED]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {portfolioMetrics.totalUnits}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Across all properties
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#10B981] to-[#34D399]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Occupied
                    </CardTitle>
                    <div className="p-2 bg-[#10B981]/10 rounded-lg">
                      <Users className="h-4 w-4 text-[#10B981]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#10B981]">
                      {portfolioMetrics.occupiedUnits}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {(
                        (portfolioMetrics.occupiedUnits /
                          portfolioMetrics.totalUnits) *
                        100
                      ).toFixed(1)}
                      % occupied
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Vacant
                    </CardTitle>
                    <div className="p-2 bg-[#F59E0B]/10 rounded-lg">
                      <Home className="h-4 w-4 text-[#F59E0B]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#F59E0B]">
                      {portfolioMetrics.vacantUnits}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Available for rent
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Avg. Rent
                    </CardTitle>
                    <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
                      <DollarSign className="h-4 w-4 text-[#3B82F6]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      if (unitsData.length === 0) {
                        return (
                          <>
                            <div className="text-3xl font-bold text-gray-900">
                              {formatCurrency(0, smartBaseCurrency)}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              No units
                            </p>
                          </>
                        );
                      }

                      // Helper to safely get rent frequency from unit
                      const getRentFrequency = (unit: any): string => {
                        // Try to get features - it might be a string that needs parsing or an object
                        let features = unit.features;
                        if (typeof features === "string") {
                          try {
                            features = JSON.parse(features);
                          } catch {
                            features = {};
                          }
                        }
                        // Check various possible paths for rentFrequency
                        return (
                          features?.nigeria?.rentFrequency ||
                          features?.rentFrequency ||
                          unit.rentFrequency ||
                          "monthly"
                        );
                      };

                      // Get frequencies for all units
                      const frequencies = unitsData.map((u) =>
                        getRentFrequency(u)
                      );
                      const allMonthly = frequencies.every(
                        (f) => f === "monthly"
                      );
                      const allAnnual = frequencies.every(
                        (f) => f === "annual"
                      );

                      if (allAnnual) {
                        // All units are annual - show annual average directly
                        const avgAnnualRent =
                          unitsData.reduce(
                            (sum, u) => sum + (u.monthlyRent || 0),
                            0
                          ) / unitsData.length;
                        return (
                          <>
                            <div className="text-3xl font-bold text-gray-900">
                              {formatCurrency(avgAnnualRent, smartBaseCurrency)}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Per unit per year
                            </p>
                          </>
                        );
                      } else if (allMonthly) {
                        // All units are monthly - show monthly average directly
                        const avgMonthlyRent =
                          unitsData.reduce(
                            (sum, u) => sum + (u.monthlyRent || 0),
                            0
                          ) / unitsData.length;
                        return (
                          <>
                            <div className="text-3xl font-bold text-gray-900">
                              {formatCurrency(
                                avgMonthlyRent,
                                smartBaseCurrency
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Per unit per month
                            </p>
                          </>
                        );
                      } else {
                        // Mixed frequencies - convert all to monthly for comparison
                        const totalMonthlyRent = unitsData.reduce(
                          (sum, u, idx) => {
                            const rent = u.monthlyRent || 0;
                            const freq = frequencies[idx];
                            // If annual, divide by 12 to get monthly equivalent
                            return sum + (freq === "annual" ? rent / 12 : rent);
                          },
                          0
                        );
                        const avgMonthlyRent =
                          totalMonthlyRent / unitsData.length;
                        return (
                          <>
                            <div className="text-3xl font-bold text-gray-900">
                              {formatCurrency(
                                avgMonthlyRent,
                                smartBaseCurrency
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Per unit per month (avg)
                            </p>
                          </>
                        );
                      }
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Units Management - Brand Styled */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    Unit Management
                  </CardTitle>
                  <CardDescription>
                    Manage individual units across all properties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                        <Input
                          placeholder="Search units..."
                          className="w-full sm:w-64 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <Select defaultValue="all">
                          <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Units</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="vacant">Vacant</SelectItem>
                            <SelectItem value="maintenance">
                              Maintenance
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => setShowAddUnitDialog(true)}
                        className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md w-full md:w-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Unit
                      </Button>
                    </div>

                    <div className="rounded-xl overflow-hidden border-0 shadow-md">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-[#111827] hover:bg-[#111827]">
                            <TableHead className="text-white font-semibold">
                              Property
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Unit
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Details
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Rent
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Tenant
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Lease
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Status
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {units.map((unit, index) => {
                            const property = properties.find(
                              (p) => p.id === unit.propertyId
                            );
                            return (
                              <TableRow
                                key={unit.id}
                                className={`hover:bg-[#7C3AED]/5 transition-colors ${
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                }`}
                              >
                                <TableCell>
                                  <span className="font-medium text-gray-900">
                                    {property?.name}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#7C3AED]/10 text-sm font-semibold text-[#7C3AED]">
                                    {unit.unit}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3 text-sm">
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                                      <Bed className="h-3.5 w-3.5 text-gray-600" />
                                      <span className="font-medium text-gray-900">
                                        {unit.bedrooms}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                                      <Bath className="h-3.5 w-3.5 text-gray-600" />
                                      <span className="font-medium text-gray-900">
                                        {unit.bathrooms}
                                      </span>
                                    </div>
                                    <span className="text-gray-600">
                                      {unit.sqft} sqft
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#10B981]/10 to-[#10B981]/5 border border-[#10B981]/20">
                                    <span className="text-sm font-bold text-[#10B981]">
                                      {formatCurrency(
                                        unit.rent,
                                        property?.currency || "USD"
                                      )}
                                    </span>
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {unit.tenant ? (
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {unit.tenant}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {unit.phoneNumber}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-sm text-gray-500">
                                      Vacant
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {unit.leaseEnd ? (
                                    <div className="text-sm">
                                      <p className="font-medium text-gray-900">
                                        Expires: {unit.leaseEnd}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-sm text-gray-500">
                                      No lease
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={getUnitStatusColor(unit.status)}
                                  >
                                    {unit.status.charAt(0).toUpperCase() +
                                      unit.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-48"
                                    >
                                      <DropdownMenuLabel className="font-semibold">
                                        Unit Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator />

                                      <DropdownMenuItem
                                        onClick={() => handleViewUnit(unit)}
                                        className="cursor-pointer"
                                      >
                                        <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                        View Details
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={() => handleEditUnit(unit)}
                                        className="cursor-pointer"
                                      >
                                        <Edit className="h-4 w-4 mr-2 text-[#7C3AED]" />
                                        Edit Unit
                                      </DropdownMenuItem>

                                      <DropdownMenuSeparator />

                                      <DropdownMenuItem
                                        onClick={() => {
                                          setUnitToDelete(unit);
                                          setShowDeleteDialog(true);
                                        }}
                                        className="text-red-600 focus:text-red-600 cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Unit
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financials" className="space-y-6">
              {/* Financial Overview - Brand Styled */}
              <TooltipProvider>
                <div className="grid md:grid-cols-4 gap-6">
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-[#10B981] to-[#34D399]"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                          Gross Income
                        </CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-[#7C3AED] transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">
                              How it's calculated:
                            </p>
                            <p className="text-xs">
                              Sum of all monthly rent from occupied units across
                              all properties. This represents your total rental
                              income before any expenses.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="p-2 bg-[#10B981]/10 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-[#10B981]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-[#10B981]">
                        {formatCurrency(
                          Number(financialStats.gross) || 0,
                          smartBaseCurrency
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Live collected this period
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                          Net Income
                        </CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-[#7C3AED] transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">
                              How it's calculated:
                            </p>
                            <p className="text-xs">
                              Gross Income minus Operating Expenses. This is
                              your Net Operating Income (NOI) - the actual
                              profit from your rental operations.
                            </p>
                            <p className="text-xs mt-1 italic">
                              Formula: Gross Income - Operating Expenses
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
                        <DollarSign className="h-4 w-4 text-[#3B82F6]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-[#3B82F6]">
                        {formatCurrency(
                          Number(financialStats.net) || 0,
                          smartBaseCurrency
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Gross minus operating expenses
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-[#EF4444] to-[#F87171]"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                          Operating Expenses
                        </CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-[#7C3AED] transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">
                              How it's calculated:
                            </p>
                            <p className="text-xs">
                              Estimated at 30% of Gross Income, based on
                              industry standards. This includes maintenance,
                              property management fees, insurance, utilities,
                              and other operational costs.
                            </p>
                            <p className="text-xs mt-1 italic">
                              Formula: Gross Income × 0.30
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="p-2 bg-[#EF4444]/10 rounded-lg">
                        <TrendingDown className="h-4 w-4 text-[#EF4444]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-[#EF4444]">
                        {formatCurrency(
                          Number(financialStats.expenses) || 0,
                          smartBaseCurrency
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Sum of expense-type payments
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                          Cap Rate
                        </CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-[#7C3AED] transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">
                              How it's calculated:
                            </p>
                            <p className="text-xs">
                              Capitalization Rate measures your return on
                              investment. It's the annual Net Operating Income
                              divided by the total property value, expressed as
                              a percentage.
                            </p>
                            <p className="text-xs mt-1 italic">
                              Formula: (Annual NOI ÷ Total Property Value) × 100
                            </p>
                            <p className="text-xs mt-1 text-[#F59E0B]">
                              Higher cap rates indicate better potential
                              returns.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="p-2 bg-[#7C3AED]/10 rounded-lg">
                        <Percent className="h-4 w-4 text-[#7C3AED]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">
                        {(Number(financialStats.capRate) || 0).toLocaleString()}
                        %
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Approximation
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TooltipProvider>

              {/* Property Financial Performance - Brand Styled */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    Property Financial Performance
                  </CardTitle>
                  <CardDescription>
                    Revenue, expenses, and profitability by property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl overflow-hidden border-0 shadow-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#111827] hover:bg-[#111827]">
                          <TableHead className="text-white font-semibold">
                            Property
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Gross Rent
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Expenses
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Net Income
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Cap Rate
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Cash Flow
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleProperties.map((property, index) => (
                          <TableRow
                            key={property.id}
                            className={`hover:bg-[#7C3AED]/5 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                            }`}
                          >
                            <TableCell>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {property.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {property._count?.units ?? 0} units
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#10B981]/10 to-[#10B981]/5 border border-[#10B981]/20">
                                <span className="text-sm font-bold text-[#10B981]">
                                  {formatCurrency(
                                    Number(property.totalMonthlyIncome) || 0,
                                    property.currency || "NGN"
                                  )}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20">
                                <span className="text-sm font-bold text-[#EF4444]">
                                  {formatCurrency(
                                    0,
                                    property.currency || "NGN"
                                  )}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(
                                  Number(property.totalMonthlyIncome) || 0,
                                  property.currency || "NGN"
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {0}%
                                </span>
                                {false ? (
                                  <div className="p-1 bg-[#10B981]/10 rounded-lg">
                                    <ArrowUpRight className="h-4 w-4 text-[#10B981]" />
                                  </div>
                                ) : (
                                  <div className="p-1 bg-[#EF4444]/10 rounded-lg">
                                    <ArrowDownRight className="h-4 w-4 text-[#EF4444]" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20">
                                <span className="text-sm font-bold text-[#3B82F6]">
                                  {(
                                    Number(property.totalMonthlyIncome) || 0
                                  ).toLocaleString()}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleOpenFinancialDetails(property)
                                }
                                className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md hover:shadow-lg transition-all"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Expense Breakdown - Brand Styled */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">
                      Expense Categories
                    </CardTitle>
                    <CardDescription>
                      Monthly operating expenses breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {expenseCategoryBreakdown.items.length ? (
                        expenseCategoryBreakdown.items.map((item) => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-[#7C3AED]/10 rounded-lg">
                                <item.Icon className="h-4 w-4 text-[#7C3AED]" />
                              </div>
                              <span className="font-medium text-gray-900">
                                {item.label}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">
                                {formatCurrency(item.amount, smartBaseCurrency)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.percent.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="mx-auto w-12 h-12 bg-[#7C3AED]/10 rounded-full flex items-center justify-center mb-3">
                            <FileText className="h-6 w-6 text-[#7C3AED]" />
                          </div>
                          <p className="text-sm text-gray-500">
                            No expense data available yet.
                          </p>
                        </div>
                      )}

                      {expenseCategoryBreakdown.items.length > 0 && (
                        <>
                          <div className="h-px bg-gray-200 my-4" />

                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#7C3AED]/10 to-[#A855F7]/5 rounded-lg border border-[#7C3AED]/20">
                            <span className="font-bold text-gray-900">
                              Total Monthly Expenses
                            </span>
                            <span className="font-bold text-[#7C3AED]">
                              {formatCurrency(
                                expenseCategoryBreakdown.total,
                                smartBaseCurrency
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">
                      Financial Trends
                    </CardTitle>
                    <CardDescription>
                      6-month performance overview
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TooltipProvider>
                      <div className="space-y-3">
                        {financialTrendCards.length ? (
                          financialTrendCards.map((card) => (
                            <div
                              key={card.title}
                              className="p-4 border border-gray-200 rounded-xl hover:border-[#7C3AED]/30 hover:shadow-md transition-all duration-200 bg-white"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {card.title}
                                  </span>
                                  {card.tooltip && (
                                    <Tooltip delayDuration={150}>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-gray-400 cursor-help hover:text-[#7C3AED] transition-colors" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs text-xs">
                                        <p>{card.tooltip}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                {card.change !== null && (
                                  <div
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
                                      card.positive
                                        ? "bg-[#10B981]/10 text-[#10B981]"
                                        : "bg-[#EF4444]/10 text-[#EF4444]"
                                    }`}
                                  >
                                    {card.positive ? (
                                      <ArrowUpRight className="h-4 w-4" />
                                    ) : (
                                      <ArrowDownRight className="h-4 w-4" />
                                    )}
                                    <span className="text-sm font-semibold">
                                      {card.change > 0 ? "+" : ""}
                                      {card.change.toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                              <Progress
                                value={card.progress}
                                className="h-2.5 bg-gray-100"
                              />
                              <p className="text-sm font-medium text-gray-900 mt-2">
                                {card.value}
                              </p>
                              {card.subtitle && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {card.subtitle}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">
                            Financial trend data will appear once transactions
                            are recorded.
                          </p>
                        )}
                      </div>
                    </TooltipProvider>
                  </CardContent>
                </Card>
              </div>

              {/* Expense Management Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Expense Management</CardTitle>
                    <CardDescription>
                      Track and manage property expenses
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddExpense}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Expense Statistics */}
                  {expenseStats && (
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Total Expenses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(
                              expenseStats.totalAmount || 0,
                              smartBaseCurrency
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {expenseStats.totalCount || 0} transactions
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Paid
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(
                              expenseStats.byStatus?.find(
                                (s: any) => s.status === "paid"
                              )?._sum?.amount || 0,
                              smartBaseCurrency
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {expenseStats.byStatus?.find(
                              (s: any) => s.status === "paid"
                            )?._count || 0}{" "}
                            expenses
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Pending
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-yellow-600">
                            {formatCurrency(
                              expenseStats.byStatus?.find(
                                (s: any) => s.status === "pending"
                              )?._sum?.amount || 0,
                              smartBaseCurrency
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {expenseStats.byStatus?.find(
                              (s: any) => s.status === "pending"
                            )?._count || 0}{" "}
                            expenses
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Top Category
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {expenseStats.byCategory &&
                            expenseStats.byCategory.length > 0
                              ? EXPENSE_CATEGORIES.find(
                                  (c) =>
                                    c.value ===
                                    expenseStats.byCategory[0].category
                                )?.label || expenseStats.byCategory[0].category
                              : "N/A"}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {expenseStats.byCategory &&
                            expenseStats.byCategory.length > 0
                              ? formatCurrency(
                                  expenseStats.byCategory[0]._sum?.amount || 0,
                                  smartBaseCurrency
                                )
                              : "-"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Expense Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center text-muted-foreground py-8"
                            >
                              No expenses recorded yet. Click "Add Expense" to
                              get started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          expenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>
                                {new Date(expense.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {expense.property?.name || "Unknown"}
                                  </p>
                                  {expense.unit && (
                                    <p className="text-xs text-muted-foreground">
                                      Unit {expense.unit.unitNumber}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {EXPENSE_CATEGORIES.find(
                                    (c) => c.value === expense.category
                                  )?.label || expense.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {expense.description}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(
                                  expense.amount,
                                  expense.currency
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    expense.status === "paid"
                                      ? "default"
                                      : expense.status === "pending"
                                      ? "secondary"
                                      : expense.status === "overdue"
                                      ? "destructive"
                                      : "outline"
                                  }
                                >
                                  {expense.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleEditExpense(expense)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => {
                                        setExpenseToDelete(expense);
                                        setShowExpenseDeleteDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-6">
              {/* Maintenance Overview - Brand Styled */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Active Requests
                    </CardTitle>
                    <div className="p-2 bg-[#F59E0B]/10 rounded-lg">
                      <Wrench className="h-4 w-4 text-[#F59E0B]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {maintenanceStatsAggregates.total}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Across all properties
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#EF4444] to-[#F87171]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      High Priority
                    </CardTitle>
                    <div className="p-2 bg-[#EF4444]/10 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#EF4444]">
                      {maintenanceStatsAggregates.highPriority}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      High priority open tickets
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#10B981] to-[#34D399]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Average Cost
                    </CardTitle>
                    <div className="p-2 bg-[#10B981]/10 rounded-lg">
                      <DollarSign className="h-4 w-4 text-[#10B981]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(
                        maintenanceStatsAggregates.avgCost,
                        smartBaseCurrency
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Per request (actual/estimated)
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Response Time
                    </CardTitle>
                    <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
                      <Clock className="h-4 w-4 text-[#3B82F6]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {maintenanceStatsAggregates.avgResponseHours !== null
                        ? `${maintenanceStatsAggregates.avgResponseHours.toFixed(
                            1
                          )}h`
                        : "—"}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {maintenanceStatsAggregates.avgResponseHours !== null
                        ? "Average response time"
                        : "Not enough data yet"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Maintenance Requests - Brand Styled */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    Maintenance Requests
                  </CardTitle>
                  <CardDescription>
                    Track and manage property maintenance across your portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                        <Input
                          placeholder="Search requests..."
                          className="w-full sm:w-64 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <Select defaultValue="all">
                          <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select defaultValue="all">
                          <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => {
                          resetMaintenanceForm();
                          setShowAddMaintenanceDialog(true);
                        }}
                        className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md w-full md:w-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Request
                      </Button>
                    </div>

                    <div className="rounded-xl overflow-hidden border-0 shadow-md">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-[#111827] hover:bg-[#111827]">
                            <TableHead className="text-white font-semibold">
                              Property & Unit
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Issue
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Tenant
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Priority
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Status
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Assigned To
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Cost
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Date
                            </TableHead>
                            <TableHead className="text-white font-semibold">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {maintenanceRequests.map(
                            (request: any, index: number) => (
                              <TableRow
                                key={request.id}
                                className={`hover:bg-[#7C3AED]/5 transition-colors ${
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                }`}
                              >
                                <TableCell>
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      {request.property?.name || "—"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Unit {request.unit?.unitNumber || "—"}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-gray-900">
                                    {request.title}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-900">
                                    {request.reportedBy?.name || "—"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={getPriorityBadge(
                                      request.priority
                                    )}
                                  >
                                    {request.priority.charAt(0).toUpperCase() +
                                      request.priority.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      request.status === "completed"
                                        ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 font-semibold"
                                        : request.status === "in-progress"
                                        ? "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30 font-semibold"
                                        : request.status === "scheduled"
                                        ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30 font-semibold"
                                        : "bg-gray-100 text-gray-600 border-gray-300 font-semibold"
                                    }
                                  >
                                    {request.status.charAt(0).toUpperCase() +
                                      request.status.slice(1).replace("-", " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {request.assignedTo ? (
                                    <span className="text-sm font-medium text-gray-900">
                                      {request.assignedTo?.name}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-sm text-gray-500">
                                      Unassigned
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {request.estimatedCost ? (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
                                      <span className="text-sm font-bold text-[#10B981]">
                                        ${request.estimatedCost}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-sm text-gray-500">
                                      TBD
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600">
                                    {request.createdAt
                                      ? new Date(
                                          request.createdAt
                                        ).toLocaleDateString()
                                      : "—"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-48"
                                    >
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleMaintenanceView(request)
                                        }
                                        className="cursor-pointer"
                                      >
                                        <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleMaintenanceEdit(request)
                                        }
                                        className="cursor-pointer"
                                      >
                                        <Edit className="h-4 w-4 mr-2 text-[#7C3AED]" />
                                        Edit Request
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600 cursor-pointer"
                                        onClick={() =>
                                          handleMaintenanceDelete(request)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Request
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Maintenance</CardTitle>
                  <CardDescription>
                    Upcoming preventive maintenance and inspections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scheduledMaintenanceList.length ? (
                      scheduledMaintenanceList.map((request: any) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <div>
                              <h4 className="font-medium">{request.title}</h4>
                              <p className="text-sm text-gray-600">
                                {request.property?.name ||
                                  "Unassigned property"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {request.scheduledDate
                                  ? new Date(
                                      request.scheduledDate
                                    ).toLocaleString()
                                  : "No schedule date"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {(request.status || "scheduled")
                                .toString()
                                .replace(/_/g, " ")}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        No upcoming scheduled maintenance. Requests scheduled in
                        advance will appear here.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              {/* Report Overview - Brand Styled */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card className="border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      Reports Generated
                    </CardTitle>
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#111827] mb-1">47</div>
                    <p className="text-xs font-medium text-gray-500">This month</p>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      Financial Reports
                    </CardTitle>
                    <div className="p-2.5 bg-green-50 rounded-xl">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#111827] mb-1">12</div>
                    <p className="text-xs font-medium text-gray-500">
                      Monthly P&L statements
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      Occupancy Reports
                    </CardTitle>
                    <div className="p-2.5 bg-purple-50 rounded-xl">
                      <PieChart className="h-5 w-5 text-[#7C3AED]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#111827] mb-1">8</div>
                    <p className="text-xs font-medium text-gray-500">
                      Weekly occupancy tracking
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700">
                      Maintenance Reports
                    </CardTitle>
                    <div className="p-2.5 bg-orange-50 rounded-xl">
                      <LineChart className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#111827] mb-1">15</div>
                    <p className="text-xs font-medium text-gray-500">
                      Work order summaries
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Interactive Report Generation - Brand Styled */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-t-lg">
                  <CardTitle className="text-lg font-bold">Generate Reports</CardTitle>
                  <CardDescription className="text-purple-100">
                    Use live portfolio data with filters to view detailed
                    reports directly in this page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-type" className="text-sm font-semibold text-gray-700">Report type</Label>
                      <Select
                        value={reportType}
                        onValueChange={(value) =>
                          setReportType(value as ReportType)
                        }
                      >
                        <SelectTrigger id="report-type" className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All report types</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="occupancy">Occupancy</SelectItem>
                          <SelectItem value="maintenance">
                            Maintenance
                          </SelectItem>
                          <SelectItem value="tenant">Tenant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report-property" className="text-sm font-semibold text-gray-700">Property</Label>
                      <Select
                        value={reportPropertyFilter}
                        onValueChange={setReportPropertyFilter}
                      >
                        <SelectTrigger id="report-property" className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                          <SelectValue placeholder="All properties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All properties</SelectItem>
                          {visibleProperties.map((property) => (
                            <SelectItem
                              key={property.id}
                              value={String(property.id)}
                            >
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report-start" className="text-sm font-semibold text-gray-700">Start date</Label>
                      <Input
                        id="report-start"
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report-end" className="text-sm font-semibold text-gray-700">End date</Label>
                      <Input
                        id="report-end"
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 max-w-2xl">
                      Reports are generated instantly from the data already
                      loaded in this dashboard. Adjust filters to refine the
                      view.
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={handleResetReportFilters}
                        disabled={reportGenerating && !reportPreview}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={handleGenerateReport}
                        disabled={reportGenerating}
                        className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
                      >
                        {reportGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Generate report
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {reportPreview && (
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-t-lg">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <CardTitle className="text-lg font-bold">
                            {REPORT_TYPE_LABELS[reportPreview.type]} Report
                          </CardTitle>
                          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">Live preview</Badge>
                        </div>
                        <CardDescription className="flex flex-wrap items-center gap-2 text-purple-100">
                          <span>
                            Generated{" "}
                            {new Date(
                              reportPreview.generatedAt
                            ).toLocaleString()}
                          </span>
                          <span>•</span>
                          <span>{reportPreviewPropertyLabel}</span>
                          {reportPreviewDateRange && (
                            <>
                              <span>•</span>
                              <span>{reportPreviewDateRange}</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadReport}
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleEmailReport}
                          className="bg-white text-[#7C3AED] hover:bg-white/90 shadow-lg"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send to Email
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div ref={reportPreviewRef}>{renderReportPreview()}</div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Reports - Brand Styled */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-t-lg">
                  <CardTitle className="text-lg font-bold">Recent Reports</CardTitle>
                  <CardDescription className="text-purple-100">
                    Previously generated reports and downloads
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto rounded-xl border-0 shadow-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#111827] hover:bg-[#111827]">
                          <TableHead className="text-white font-semibold">Report Name</TableHead>
                          <TableHead className="text-white font-semibold">Type</TableHead>
                          <TableHead className="text-white font-semibold">Property</TableHead>
                          <TableHead className="text-white font-semibold">Generated</TableHead>
                          <TableHead className="text-white font-semibold">Size</TableHead>
                          <TableHead className="text-white font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-white hover:bg-[#7C3AED]/5 transition-colors">
                          <TableCell className="font-semibold text-gray-900">
                            March 2024 Financial Report
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Financial</Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">All Properties</TableCell>
                          <TableCell className="text-gray-600">March 21, 2024</TableCell>
                          <TableCell className="text-gray-600">2.3 MB</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toast.success("Downloading report...")
                                }
                                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toast.info("Opening report in new tab...")
                                }
                                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-gray-50/50 hover:bg-[#7C3AED]/5 transition-colors">
                          <TableCell className="font-semibold text-gray-900">
                            Q1 2024 Occupancy Analysis
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-[#7C3AED] hover:bg-purple-100 border-purple-200">Occupancy</Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">Portfolio</TableCell>
                          <TableCell className="text-gray-600">March 20, 2024</TableCell>
                          <TableCell className="text-gray-600">1.8 MB</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toast.success("Downloading report...")
                                }
                                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toast.info("Opening report in new tab...")
                                }
                                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-white hover:bg-[#7C3AED]/5 transition-colors">
                          <TableCell className="font-semibold text-gray-900">
                            Sunset Apartments Maintenance Summary
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">Maintenance</Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">Sunset Apartments</TableCell>
                          <TableCell className="text-gray-600">March 19, 2024</TableCell>
                          <TableCell className="text-gray-600">0.9 MB</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toast.success("Downloading report...")
                                }
                                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toast.info("Opening report in new tab...")
                                }
                                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Report Scheduling - Brand Styled */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-t-lg">
                  <CardTitle className="text-lg font-bold">Scheduled Reports</CardTitle>
                  <CardDescription className="text-purple-100">
                    Automatically generate and deliver reports
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-500 rounded-xl">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">
                            Monthly Financial Report
                          </h4>
                          <p className="text-sm text-gray-600 mt-0.5">
                            Generated on the 1st of each month
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Active</Badge>
                        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-white">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-500 rounded-xl">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">
                            Weekly Occupancy Update
                          </h4>
                          <p className="text-sm text-gray-600 mt-0.5">
                            Generated every Monday
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Active</Badge>
                        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-white">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 font-medium">
                        Set up automatic report generation and email delivery
                      </p>
                      <Button
                        onClick={() =>
                          toast.info("Report scheduling coming soon...")
                        }
                        className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Maintenance Request Dialog - Brand Styled */}
      <Dialog
        open={showAddMaintenanceDialog}
        onOpenChange={(open) => {
          setShowAddMaintenanceDialog(open);
          if (!open) {
            resetMaintenanceForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-lg mb-4">
            <DialogTitle className="text-xl font-bold">Create Maintenance Request</DialogTitle>
            <DialogDescription className="text-purple-100">
              Log a new maintenance ticket for one of your properties.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-1">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Property *</Label>
                <Select
                  value={maintenanceForm.propertyId}
                  onValueChange={(value) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      propertyId: value,
                      unitId: "none",
                    }))
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleProperties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Unit</Label>
                <Select
                  value={maintenanceForm.unitId}
                  onValueChange={(value) =>
                    setMaintenanceForm((prev) => ({ ...prev, unitId: value }))
                  }
                  disabled={!maintenanceForm.propertyId}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                    <SelectValue placeholder="Property-wide" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Property-wide</SelectItem>
                    {maintenanceForm.propertyId &&
                      getPropertyUnitsForExpense(
                        maintenanceForm.propertyId
                      ).map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          Unit {unit.unitNumber}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Priority</Label>
                <Select
                  value={maintenanceForm.priority}
                  onValueChange={(value) =>
                    setMaintenanceForm((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Category</Label>
                <Select
                  value={maintenanceForm.category}
                  onValueChange={(value) =>
                    setMaintenanceForm((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Title *</Label>
                <Input
                  value={maintenanceForm.title}
                  onChange={(e) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Short summary"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-medium border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED] transition-colors"
                    >
                      <Calendar className="mr-2 h-4 w-4 text-[#7C3AED]" />
                      {maintenanceForm.scheduledDate ? (
                        <span className="text-gray-900">
                          {(() => {
                            const date = new Date(maintenanceForm.scheduledDate);
                            return date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }) + ' at ' + date.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            });
                          })()}
                        </span>
                      ) : (
                        <span className="text-gray-500">Pick a date and time</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-[#7C3AED] shadow-lg bg-white" align="start">
                    <div className="px-4 py-3 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
                      <p className="text-sm font-semibold">Select Date & Time</p>
                    </div>
                    <div className="p-4 bg-white">
                      <CalendarComponent
                        mode="single"
                        selected={maintenanceForm.scheduledDate ? new Date(maintenanceForm.scheduledDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Preserve existing time or set to 9:00 AM default
                            let hours = 9;
                            let minutes = 0;
                            if (maintenanceForm.scheduledDate) {
                              const existingDate = new Date(maintenanceForm.scheduledDate);
                              hours = existingDate.getHours();
                              minutes = existingDate.getMinutes();
                            }
                            date.setHours(hours, minutes, 0, 0);
                            setMaintenanceForm((prev) => ({
                              ...prev,
                              scheduledDate: date.toISOString(),
                            }));
                          }
                        }}
                        className="rounded-md border-0 mx-auto"
                        classNames={{
                          months: "flex flex-col space-y-4",
                          month: "space-y-4 w-full",
                          caption: "flex justify-center pt-1 relative items-center mb-2",
                          caption_label: "text-sm font-semibold text-gray-900",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 border border-gray-300 rounded-md hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex w-full mb-1",
                          head_cell: "text-gray-500 rounded-md w-9 font-semibold text-xs uppercase",
                          row: "flex w-full mt-1",
                          cell: "relative p-0 text-center text-sm h-9 w-9 focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-medium text-gray-700 rounded-md hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] transition-colors inline-flex items-center justify-center",
                          day_selected: "bg-[#7C3AED] text-white hover:bg-[#6D28D9] focus:bg-[#6D28D9] font-bold shadow-md",
                          day_today: "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                          day_outside: "text-gray-400 opacity-50",
                          day_disabled: "text-gray-400 opacity-50 cursor-not-allowed",
                          day_hidden: "invisible",
                        }}
                      />
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Label className="text-xs font-semibold text-gray-700 mb-2 block">Time</Label>
                        <Input
                          type="time"
                          value={(() => {
                            if (!maintenanceForm.scheduledDate) return "09:00";
                            const date = new Date(maintenanceForm.scheduledDate);
                            const hours = date.getHours().toString().padStart(2, '0');
                            const mins = date.getMinutes().toString().padStart(2, '0');
                            return `${hours}:${mins}`;
                          })()}
                          onChange={(e) => {
                            const timeValue = e.target.value;
                            if (!timeValue) return;
                            const [hours, minutes] = timeValue.split(':').map(Number);
                            const date = maintenanceForm.scheduledDate
                              ? new Date(maintenanceForm.scheduledDate)
                              : new Date();
                            date.setHours(hours, minutes, 0, 0);
                            setMaintenanceForm((prev) => ({
                              ...prev,
                              scheduledDate: date.toISOString(),
                            }));
                          }}
                          className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Description *</Label>
              <Textarea
                value={maintenanceForm.description}
                onChange={(e) =>
                  setMaintenanceForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
                placeholder="Provide more context for this maintenance issue..."
                className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] resize-none"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white p-4 hover:border-[#7C3AED] transition-colors">
              <div>
                <p className="text-sm font-semibold text-gray-900">Notify tenant</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Sends an email letting them know we're on it.
                </p>
              </div>
              <Switch
                checked={maintenanceForm.notifyTenant}
                onCheckedChange={(checked) =>
                  setMaintenanceForm((prev) => ({
                    ...prev,
                    notifyTenant: checked,
                  }))
                }
                className="data-[state=checked]:bg-[#7C3AED]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 -mx-6 px-6 -mb-6 pb-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMaintenanceDialog(false);
                resetMaintenanceForm();
              }}
              disabled={maintenanceSaving}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMaintenance}
              disabled={maintenanceSaving}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
            >
              {maintenanceSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : maintenanceEditingId ? (
                "Update Request"
              ) : (
                "Create Request"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Maintenance Request View Dialog */}
      <Dialog
        open={showMaintenanceViewDialog}
        onOpenChange={(open) => {
          setShowMaintenanceViewDialog(open);
          if (!open) {
            setSelectedMaintenanceRequest(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Maintenance Request –{" "}
              {selectedMaintenanceRequest?.ticketNumber || "Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedMaintenanceRequest?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedMaintenanceRequest ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-3 space-y-1 text-sm">
                  <p className="text-gray-500">Property</p>
                  <p className="font-medium">
                    {selectedMaintenanceRequest.property?.name || "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Unit {selectedMaintenanceRequest.unit?.unitNumber || "—"}
                  </p>
                </div>
                <div className="border rounded-lg p-3 space-y-1 text-sm">
                  <p className="text-gray-500">Priority & Status</p>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={getPriorityBadge(
                        selectedMaintenanceRequest.priority
                      )}
                    >
                      {selectedMaintenanceRequest.priority}
                    </Badge>
                    <Badge
                      variant={
                        selectedMaintenanceRequest.status === "completed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedMaintenanceRequest.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3 text-sm space-y-2">
                <p className="text-gray-500">Description</p>
                <p className="text-gray-700">
                  {selectedMaintenanceRequest.description || "No description"}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-3 text-sm space-y-1">
                  <p className="text-gray-500">Reported By</p>
                  <p className="font-medium">
                    {selectedMaintenanceRequest.reportedBy?.name || "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedMaintenanceRequest.reportedBy?.email || ""}
                  </p>
                </div>
                <div className="border rounded-lg p-3 text-sm space-y-1">
                  <p className="text-gray-500">Assigned To</p>
                  <p className="font-medium">
                    {selectedMaintenanceRequest.assignedTo?.name ||
                      "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-3 text-sm space-y-1">
                  <p className="text-gray-500">Created On</p>
                  <p className="font-medium">
                    {selectedMaintenanceRequest.createdAt
                      ? new Date(
                          selectedMaintenanceRequest.createdAt
                        ).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div className="border rounded-lg p-3 text-sm space-y-1">
                  <p className="text-gray-500">Scheduled Date</p>
                  <p className="font-medium">
                    {selectedMaintenanceRequest.scheduledDate
                      ? new Date(
                          selectedMaintenanceRequest.scheduledDate
                        ).toLocaleString()
                      : "Not scheduled"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span className="text-gray-500">Estimated Cost</span>
                <span className="font-medium">
                  {selectedMaintenanceRequest.estimatedCost
                    ? formatCurrency(
                        selectedMaintenanceRequest.estimatedCost,
                        smartBaseCurrency
                      )
                    : "TBD"}
                </span>
              </div>

              {selectedMaintenanceRequest.images?.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Attachments</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedMaintenanceRequest.images.map(
                      (image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Maintenance attachment ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md border"
                        />
                      )
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Select a maintenance request to view details.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowMaintenanceViewDialog(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => handleMaintenanceEdit(selectedMaintenanceRequest)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this unit? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {unitToDelete && (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Unit Number
                  </span>
                  <span className="font-medium">{unitToDelete.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Property
                  </span>
                  <span className="font-medium">
                    {properties.find((p) => p.id === unitToDelete.propertyId)
                      ?.name || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Status
                  </span>
                  <Badge
                    variant={
                      unitToDelete.status === "occupied"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {unitToDelete.status}
                  </Badge>
                </div>
                {unitToDelete.tenant && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Tenant
                    </span>
                    <span className="font-medium">{unitToDelete.tenant}</span>
                  </div>
                )}
              </div>

              {unitToDelete.status === "occupied" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Warning: Unit is occupied</p>
                      <p className="mt-1">
                        This unit has an active tenant. Make sure to handle the
                        lease properly before deleting.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">This action is permanent</p>
                    <p className="mt-1">
                      All unit data, including history and records, will be
                      permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setUnitToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUnit}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Unit
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Unit Details Dialog */}
      <Dialog open={showViewUnitDialog} onOpenChange={setShowViewUnitDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Unit Details - {selectedUnit?.unitNumber}</DialogTitle>
            <DialogDescription>
              {selectedUnit?.properties?.name && (
                <span className="text-sm font-medium text-gray-700">
                  Property: {selectedUnit.properties.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedUnit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Basic Information
                  </h4>
                  <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Unit Number:</span>
                      <span className="font-medium">
                        {selectedUnit.unitNumber}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">
                        {selectedUnit.type || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Floor:</span>
                      <span className="font-medium">
                        {selectedUnit.floor || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <Badge
                        variant={
                          selectedUnit.status === "occupied"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedUnit.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Property Details
                  </h4>
                  <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bedrooms:</span>
                      <span className="font-medium">
                        {selectedUnit.bedrooms || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bathrooms:</span>
                      <span className="font-medium">
                        {selectedUnit.bathrooms || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">
                        {selectedUnit.size ? `${selectedUnit.size} sqft` : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Financial Details
                  </h4>
                  <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly Rent:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          selectedUnit.monthlyRent || 0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Security Deposit:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          selectedUnit.securityDeposit ||
                            selectedUnit.properties?.securityDeposit ||
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Service Charge:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).serviceCharge ??
                            selectedUnit.properties?.serviceCharge ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Application Fee:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).applicationFee ??
                            selectedUnit.properties?.applicationFee ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Additional Fees & Utilities
                  </h4>
                  <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Caution Fee:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).cautionFee ??
                            selectedUnit.properties?.cautionFee ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Legal Fee:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).legalFee ??
                            selectedUnit.properties?.legalFee ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Agent Commission:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).agentCommission ??
                            selectedUnit.properties?.agentCommission ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Agreement Fee:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).agreementFee ??
                            selectedUnit.properties?.agreementFee ??
                            0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Waste Management:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).wasteFee || 0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Estate Dues:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (selectedUnitNigeria as any).estateDues || 0,
                          selectedUnitCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Electricity Meter:</span>
                      <span className="font-medium">
                        {(selectedUnitNigeria as any).electricityMeter || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Prepaid Meter:</span>
                      <span className="font-medium">
                        {(selectedUnitNigeria as any).prepaidMeter
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Water Source:</span>
                      <span className="font-medium">
                        {(selectedUnitNigeria as any).waterSource
                          ? (selectedUnitNigeria as any).waterSource
                          : "Not specified"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Parking Available:</span>
                      <span className="font-medium">
                        {(selectedUnitNigeria as any).parkingAvailable
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewUnitDialog(false);
                    setSelectedUnit(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowViewUnitDialog(false);
                    handleEditUnit(selectedUnit);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Unit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={showEditUnitDialog} onOpenChange={setShowEditUnitDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>Update unit information</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editUnitNumber">
                  Unit Number
                </label>
                <Input
                  id="editUnitNumber"
                  value={unitForm.unitNumber}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, unitNumber: e.target.value })
                  }
                  placeholder="A101"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editType">
                  Type
                </label>
                <Input
                  id="editType"
                  value={unitForm.type}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, type: e.target.value })
                  }
                  placeholder="Apartment, Studio, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editFloor">
                  Floor
                </label>
                <Input
                  id="editFloor"
                  type="number"
                  value={unitForm.floor}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, floor: e.target.value })
                  }
                  placeholder="1"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editBedrooms">
                  Bedrooms
                </label>
                <Input
                  id="editBedrooms"
                  type="number"
                  value={unitForm.bedrooms}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, bedrooms: e.target.value })
                  }
                  placeholder="2"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editBathrooms">
                  Bathrooms
                </label>
                <Input
                  id="editBathrooms"
                  type="number"
                  value={unitForm.bathrooms}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, bathrooms: e.target.value })
                  }
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editSize">
                  Size (sqft)
                </label>
                <Input
                  id="editSize"
                  type="number"
                  value={unitForm.size}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, size: e.target.value })
                  }
                  placeholder="850"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editStatus">
                  Status
                </label>
                <Select
                  value={unitForm.status}
                  onValueChange={(v) => setUnitForm({ ...unitForm, status: v })}
                >
                  <SelectTrigger id="editStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-medium"
                    htmlFor="editMonthlyRent"
                  >
                    Rent
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Frequency</span>
                    <Select
                      value={unitForm.rentFrequency}
                      onValueChange={(v) =>
                        setUnitForm({ ...unitForm, rentFrequency: v })
                      }
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Input
                  id="editMonthlyRent"
                  type="number"
                  value={unitForm.monthlyRent}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, monthlyRent: e.target.value })
                  }
                  placeholder={
                    unitForm.rentFrequency === "annual"
                      ? "Enter annual rent"
                      : "Enter monthly rent"
                  }
                />
              </div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="editSecurityDeposit"
                >
                  Security Deposit
                </label>
                <Input
                  id="editSecurityDeposit"
                  type="number"
                  value={unitForm.securityDeposit}
                  onChange={(e) =>
                    setUnitForm({
                      ...unitForm,
                      securityDeposit: e.target.value,
                    })
                  }
                  placeholder="2400"
                />
              </div>
            </div>

            {/* Additional Fees & Utilities - mirror Add Unit fields */}
            <div className="grid gap-2">
              <label
                className="text-sm font-medium"
                htmlFor="editServiceCharge"
              >
                Service Charge
              </label>
              <Input
                id="editServiceCharge"
                type="number"
                value={unitForm.serviceCharge}
                onChange={(e) =>
                  setUnitForm({ ...unitForm, serviceCharge: e.target.value })
                }
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editLegalFee">
                  Legal Fee
                </label>
                <Input
                  id="editLegalFee"
                  type="number"
                  value={unitForm.legalFee}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, legalFee: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="editAgentCommission"
                >
                  Agency Fee
                </label>
                <Input
                  id="editAgentCommission"
                  type="number"
                  value={unitForm.agentCommission}
                  onChange={(e) =>
                    setUnitForm({
                      ...unitForm,
                      agentCommission: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="editAgreementFee"
                >
                  Agreement Fee
                </label>
                <Input
                  id="editAgreementFee"
                  type="number"
                  value={unitForm.agreementFee}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, agreementFee: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editWasteFee">
                  Waste Management
                </label>
                <Input
                  id="editWasteFee"
                  type="number"
                  value={unitForm.wasteFee}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, wasteFee: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="editEstateDues">
                  Estate Dues
                </label>
                <Input
                  id="editEstateDues"
                  type="number"
                  value={unitForm.estateDues}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, estateDues: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="editElectricityMeter"
                >
                  Electricity Meter No.
                </label>
                <Input
                  id="editElectricityMeter"
                  value={unitForm.electricityMeter}
                  onChange={(e) =>
                    setUnitForm({
                      ...unitForm,
                      electricityMeter: e.target.value,
                    })
                  }
                  placeholder="Prepaid meter no."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Prepaid Meter</label>
                <Switch
                  checked={unitForm.prepaidMeter}
                  onCheckedChange={(v) =>
                    setUnitForm({ ...unitForm, prepaidMeter: v })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="editWaterSource"
                >
                  Water Source
                </label>
                <Select
                  value={unitForm.waterSource}
                  onValueChange={(v) =>
                    setUnitForm({ ...unitForm, waterSource: v })
                  }
                >
                  <SelectTrigger id="editWaterSource">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="borehole">Borehole</SelectItem>
                    <SelectItem value="well">Well</SelectItem>
                    <SelectItem value="tanker">Tanker Supply</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Parking Available</label>
              <Switch
                checked={unitForm.parkingAvailable}
                onCheckedChange={(v) =>
                  setUnitForm({ ...unitForm, parkingAvailable: v })
                }
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditUnitDialog(false);
                  setSelectedUnit(null);
                }}
                disabled={editingUnit}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEditedUnit} disabled={editingUnit}>
                {editingUnit ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Property Confirmation Dialog */}
      <Dialog
        open={showPropertyDeleteDialog}
        onOpenChange={setShowPropertyDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this property? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {propertyToDelete && (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Property Name
                  </span>
                  <span className="font-medium">{propertyToDelete.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Location
                  </span>
                  <span className="font-medium">
                    {propertyToDelete.city}, {propertyToDelete.state}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Total Units
                  </span>
                  <span className="font-medium">
                    {propertyToDelete._count?.units ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Status
                  </span>
                  <Badge
                    variant={
                      propertyToDelete.status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {propertyToDelete.status}
                  </Badge>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Warning:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>
                        All units associated with this property will be deleted
                      </li>
                      <li>All lease records will be removed</li>
                      <li>All maintenance requests will be deleted</li>
                      <li>This action is permanent and cannot be reversed</li>
                    </ul>
                    <p className="mt-2 text-xs font-medium">
                      Note: Properties with active leases cannot be deleted.
                      Please end all active leases first.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowPropertyDeleteDialog(false);
                setPropertyToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteProperty}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Property
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? "Update expense details"
                : "Record a new property expense"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-property">Property *</Label>
                <Select
                  value={expenseForm.propertyId}
                  onValueChange={(value) => {
                    const property = properties.find((p) => p.id === value);
                    setExpenseForm({
                      ...expenseForm,
                      propertyId: value,
                      currency: property?.currency || "NGN",
                      unitId: "", // Reset unit when property changes
                    });
                  }}
                >
                  <SelectTrigger id="expense-property">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleProperties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-unit">Unit (Optional)</Label>
                <Select
                  value={expenseForm.unitId}
                  onValueChange={(value) =>
                    setExpenseForm({ ...expenseForm, unitId: value })
                  }
                >
                  <SelectTrigger id="expense-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Property-wide)</SelectItem>
                    {getPropertyUnitsForExpense(expenseForm.propertyId).map(
                      (unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          Unit {unit.unitNumber}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-category">Category *</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(value) =>
                    setExpenseForm({ ...expenseForm, category: value })
                  }
                >
                  <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount *</Label>
                <div className="flex gap-2">
                  <Input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <span className="flex items-center px-3 border rounded-md bg-muted text-sm">
                    {expenseForm.currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-description">Description *</Label>
              <Textarea
                id="expense-description"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    description: e.target.value,
                  })
                }
                placeholder="Enter expense description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-date">Date *</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-due-date">Due Date (Optional)</Label>
                <Input
                  id="expense-due-date"
                  type="date"
                  value={expenseForm.dueDate}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, dueDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-status">Status *</Label>
                <Select
                  value={expenseForm.status}
                  onValueChange={(value) =>
                    setExpenseForm({ ...expenseForm, status: value })
                  }
                >
                  <SelectTrigger id="expense-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-payment-method">Payment Method</Label>
                <Select
                  value={expenseForm.paymentMethod}
                  onValueChange={(value) =>
                    setExpenseForm({ ...expenseForm, paymentMethod: value })
                  }
                >
                  <SelectTrigger id="expense-payment-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-notes">Notes (Optional)</Label>
              <Textarea
                id="expense-notes"
                value={expenseForm.notes}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, notes: e.target.value })
                }
                placeholder="Add any additional notes"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExpenseDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveExpense} disabled={expenseSaving}>
              {expenseSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>{editingExpense ? "Update Expense" : "Add Expense"}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Confirmation Dialog */}
      <Dialog
        open={showExpenseDeleteDialog}
        onOpenChange={setShowExpenseDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {expenseToDelete && (
            <div className="py-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Property:</span>
                <span className="text-sm font-medium">
                  {expenseToDelete.property?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category:</span>
                <span className="text-sm font-medium">
                  {
                    EXPENSE_CATEGORIES.find(
                      (c) => c.value === expenseToDelete.category
                    )?.label
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-sm font-medium">
                  {formatCurrency(
                    expenseToDelete.amount,
                    expenseToDelete.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Description:
                </span>
                <span className="text-sm font-medium">
                  {expenseToDelete.description}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExpenseDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteExpense}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Expense
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Property Financial Detail Dialog */}
      <Dialog
        open={showFinancialDetailDialog}
        onOpenChange={(open) => {
          setShowFinancialDetailDialog(open);
          if (!open) {
            setFinancialDetailProperty(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-lg mb-6">
            <DialogTitle className="text-xl font-bold">Property Financial Summary</DialogTitle>
            <DialogDescription className="text-purple-100">
              {financialDetailProperty?.property?.name}
            </DialogDescription>
          </DialogHeader>

          {financialDetailProperty ? (
            <div className="space-y-6 px-1">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border-0 rounded-xl p-5 bg-gradient-to-br from-green-50 to-green-100/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Monthly Revenue</p>
                    <div className="p-2 bg-green-500 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(
                      financialDetailProperty.monthlyRevenue,
                      financialDetailProperty.property.currency ||
                        smartBaseCurrency
                    )}
                  </p>
                </div>
                <div className="border-0 rounded-xl p-5 bg-gradient-to-br from-red-50 to-red-100/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Monthly Expenses</p>
                    <div className="p-2 bg-red-500 rounded-lg">
                      <TrendingDown className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[#EF4444]">
                    {formatCurrency(
                      financialDetailProperty.totalExpenses,
                      financialDetailProperty.property.currency ||
                        smartBaseCurrency
                    )}
                  </p>
                </div>
                <div className="border-0 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Net Income</p>
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[#10B981]">
                    {formatCurrency(
                      financialDetailProperty.netIncome,
                      financialDetailProperty.property.currency ||
                        smartBaseCurrency
                    )}
                  </p>
                </div>
                <div className="border-0 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Occupancy Rate</p>
                    <div className="p-2 bg-[#7C3AED] rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {financialDetailProperty.occupancyRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="border-0 rounded-xl p-5 bg-white shadow-md">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-[#7C3AED]" />
                  Recent Expenses
                </h4>
                {financialDetailProperty.propertyExpenses.length ? (
                  <div className="rounded-xl overflow-hidden border-0 shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#111827] hover:bg-[#111827]">
                          <TableHead className="text-white font-semibold">Date</TableHead>
                          <TableHead className="text-white font-semibold">Description</TableHead>
                          <TableHead className="text-white font-semibold">Unit</TableHead>
                          <TableHead className="text-white font-semibold">Category</TableHead>
                          <TableHead className="text-right text-white font-semibold">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialDetailProperty.propertyExpenses
                          .slice(0, 5)
                          .map((expense, idx) => (
                            <TableRow
                              key={expense.id}
                              className={`hover:bg-[#7C3AED]/5 transition-colors ${
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                              }`}
                            >
                              <TableCell className="font-medium text-gray-900">
                                {new Date(expense.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="max-w-[220px] truncate text-gray-700">
                                {expense.description}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {expense.unit?.unitNumber
                                  ? `Unit ${expense.unit.unitNumber}`
                                  : "Property-wide"}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">
                                  {formatCategoryLabel(expense.category)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-gray-900">
                                {formatCurrency(
                                  expense.amount,
                                  expense.currency || smartBaseCurrency
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No expenses recorded for this property yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              Select a property to view details.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Unit Dialog - Brand Styled */}
      <Dialog open={showAddUnitDialog} onOpenChange={setShowAddUnitDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-lg mb-4">
            <DialogTitle className="text-xl font-bold">Add New Unit</DialogTitle>
            <DialogDescription className="text-purple-100">
              Create a unit under one of your properties.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 px-1">
            <div className="grid gap-2">
              <label
                className="text-sm font-semibold text-gray-700"
                htmlFor="dialog-propertyId"
              >
                Property *
              </label>
              <Select
                value={unitForm.propertyId}
                onValueChange={(v) =>
                  setUnitForm({ ...unitForm, propertyId: v })
                }
              >
                <SelectTrigger id="dialog-propertyId" className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {visibleProperties.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="dialog-unitNumber"
                >
                  Unit Number *
                </label>
                <Input
                  id="dialog-unitNumber"
                  value={unitForm.unitNumber}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, unitNumber: e.target.value })
                  }
                  placeholder="A101"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="dialog-type">
                  Type *
                </label>
                <Input
                  id="dialog-type"
                  value={unitForm.type}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, type: e.target.value })
                  }
                  placeholder="2-bedroom"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="dialog-bedrooms"
                >
                  Bedrooms
                </label>
                <Input
                  id="dialog-bedrooms"
                  type="number"
                  value={unitForm.bedrooms}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, bedrooms: e.target.value })
                  }
                  placeholder="2"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="dialog-bathrooms"
                >
                  Bathrooms
                </label>
                <Input
                  id="dialog-bathrooms"
                  type="number"
                  value={unitForm.bathrooms}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, bathrooms: e.target.value })
                  }
                  placeholder="1"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="dialog-floor">
                  Floor
                </label>
                <Input
                  id="dialog-floor"
                  type="number"
                  value={unitForm.floor}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, floor: e.target.value })
                  }
                  placeholder="3"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="dialog-size">
                  Size (sqft)
                </label>
                <Input
                  id="dialog-size"
                  type="number"
                  value={unitForm.size}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, size: e.target.value })
                  }
                  placeholder="900"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-medium"
                    htmlFor="dialog-monthlyRent"
                  >
                    Rent *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Frequency</span>
                    <Select
                      value={unitForm.rentFrequency}
                      onValueChange={(v) =>
                        setUnitForm({ ...unitForm, rentFrequency: v })
                      }
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Input
                  id="dialog-monthlyRent"
                  type="number"
                  value={unitForm.monthlyRent}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, monthlyRent: e.target.value })
                  }
                  placeholder="1200000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="dialog-securityDeposit"
                >
                  Security Deposit
                </label>
                <Input
                  id="dialog-securityDeposit"
                  type="number"
                  value={unitForm.securityDeposit}
                  onChange={(e) =>
                    setUnitForm({
                      ...unitForm,
                      securityDeposit: e.target.value,
                    })
                  }
                  placeholder="500"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="dialog-status">
                  Status
                </label>
                <Select
                  value={unitForm.status}
                  onValueChange={(v) => setUnitForm({ ...unitForm, status: v })}
                >
                  <SelectTrigger id="dialog-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Fees Section - Brand Styled */}
            <div className="border-t border-gray-200 pt-5 mt-4">
              <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-[#7C3AED]" />
                Additional Fees & Utilities
              </h4>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="dialog-serviceCharge"
                >
                  Service Charge
                </label>
                <Input
                  id="dialog-serviceCharge"
                  type="number"
                  value={unitForm.serviceCharge}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, serviceCharge: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="dialog-legalFee"
                  >
                    Legal Fee
                  </label>
                  <Input
                    id="dialog-legalFee"
                    type="number"
                    value={unitForm.legalFee}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, legalFee: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="dialog-agentCommission"
                  >
                    Agency Fee
                  </label>
                  <Input
                    id="dialog-agentCommission"
                    type="number"
                    value={unitForm.agentCommission}
                    onChange={(e) =>
                      setUnitForm({
                        ...unitForm,
                        agentCommission: e.target.value,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="dialog-agreementFee"
                  >
                    Agreement Fee
                  </label>
                  <Input
                    id="dialog-agreementFee"
                    type="number"
                    value={unitForm.agreementFee}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, agreementFee: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="dialog-wasteFee"
                  >
                    Waste Management
                  </label>
                  <Input
                    id="dialog-wasteFee"
                    type="number"
                    value={unitForm.wasteFee}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, wasteFee: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="dialog-estateDues"
                  >
                    Estate Dues
                  </label>
                  <Input
                    id="dialog-estateDues"
                    type="number"
                    value={unitForm.estateDues}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, estateDues: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="dialog-electricityMeter"
                  >
                    Electricity Meter No.
                  </label>
                  <Input
                    id="dialog-electricityMeter"
                    value={unitForm.electricityMeter}
                    onChange={(e) =>
                      setUnitForm({
                        ...unitForm,
                        electricityMeter: e.target.value,
                      })
                    }
                    placeholder="Prepaid meter no."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl hover:border-[#7C3AED] transition-colors">
                  <label className="text-sm font-semibold text-gray-900">Prepaid Meter</label>
                  <Switch
                    checked={unitForm.prepaidMeter}
                    onCheckedChange={(v) =>
                      setUnitForm({ ...unitForm, prepaidMeter: v })
                    }
                    className="data-[state=checked]:bg-[#7C3AED]"
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="dialog-waterSource"
                  >
                    Water Source
                  </label>
                  <Select
                    value={unitForm.waterSource}
                    onValueChange={(v) =>
                      setUnitForm({ ...unitForm, waterSource: v })
                    }
                  >
                    <SelectTrigger id="dialog-waterSource">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="borehole">Borehole</SelectItem>
                      <SelectItem value="well">Well</SelectItem>
                      <SelectItem value="tanker">Tanker Supply</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl hover:border-[#7C3AED] transition-colors mt-3">
                <label className="text-sm font-semibold text-gray-900">Parking Available</label>
                <Switch
                  checked={unitForm.parkingAvailable}
                  onCheckedChange={(v) =>
                    setUnitForm({ ...unitForm, parkingAvailable: v })
                  }
                  className="data-[state=checked]:bg-[#7C3AED]"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 -mx-6 px-6 -mb-6 pb-6">
            <Button
              variant="outline"
              onClick={() => setShowAddUnitDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              disabled={unitSaving}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25"
              onClick={async () => {
                try {
                  if (
                    !unitForm.propertyId ||
                    !unitForm.unitNumber ||
                    !unitForm.type ||
                    !unitForm.monthlyRent
                  ) {
                    toast.error(
                      "Please fill required fields (Property, Unit Number, Type, Rent)"
                    );
                    return;
                  }
                  setUnitSaving(true);
                  const payload: any = {
                    propertyId: unitForm.propertyId,
                    unitNumber: unitForm.unitNumber,
                    type: unitForm.type,
                    floor: unitForm.floor ? Number(unitForm.floor) : undefined,
                    bedrooms: unitForm.bedrooms
                      ? Number(unitForm.bedrooms)
                      : undefined,
                    bathrooms: unitForm.bathrooms
                      ? Number(unitForm.bathrooms)
                      : undefined,
                    size: unitForm.size ? Number(unitForm.size) : undefined,
                    monthlyRent: Number(unitForm.monthlyRent),
                    securityDeposit: unitForm.securityDeposit
                      ? Number(unitForm.securityDeposit)
                      : undefined,
                    status: unitForm.status,
                    features: {
                      nigeria: {
                        rentFrequency: unitForm.rentFrequency,
                        serviceCharge: unitForm.serviceCharge
                          ? Number(unitForm.serviceCharge)
                          : undefined,
                        legalFee: unitForm.legalFee
                          ? Number(unitForm.legalFee)
                          : undefined,
                        agentCommission: unitForm.agentCommission
                          ? Number(unitForm.agentCommission)
                          : undefined,
                        agreementFee: unitForm.agreementFee
                          ? Number(unitForm.agreementFee)
                          : undefined,
                        electricityMeter:
                          unitForm.electricityMeter || undefined,
                        prepaidMeter: unitForm.prepaidMeter,
                        wasteFee: unitForm.wasteFee
                          ? Number(unitForm.wasteFee)
                          : undefined,
                        estateDues: unitForm.estateDues
                          ? Number(unitForm.estateDues)
                          : undefined,
                        waterSource: unitForm.waterSource,
                        parkingAvailable: unitForm.parkingAvailable,
                      },
                    },
                  };
                  const res = await createUnit(payload);
                  if ((res as any).error)
                    throw new Error(
                      (res as any).error.error || "Failed to create unit"
                    );

                  // Get the created unit from response
                  const createdUnit = (res as any).data;

                  // Optimistic UI update - add unit immediately to the list
                  if (createdUnit) {
                    setUnitsData((prev) => [...prev, createdUnit]);
                  }

                  toast.success("Unit created successfully");
                  setShowAddUnitDialog(false);
                  setUnitForm({
                    propertyId: "",
                    unitNumber: "",
                    type: "",
                    floor: "",
                    bedrooms: "",
                    bathrooms: "",
                    size: "",
                    monthlyRent: "",
                    securityDeposit: "",
                    status: "vacant",
                    rentFrequency: "monthly",
                    serviceCharge: "",
                    legalFee: "",
                    agentCommission: "",
                    agreementFee: "",
                    electricityMeter: "",
                    prepaidMeter: false,
                    wasteFee: "",
                    estateDues: "",
                    waterSource: "public",
                    parkingAvailable: true,
                  });

                  // Background sync - refresh from server to ensure consistency
                  getUnits().then((uRes) => {
                    if (!uRes.error && Array.isArray(uRes.data))
                      setUnitsData(uRes.data);
                  });
                } catch (e: any) {
                  toast.error(e?.message || "Failed to create unit");
                } finally {
                  setUnitSaving(false);
                }
              }}
            >
              {unitSaving ? "Saving..." : "Save Unit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Properties Dialog */}
      <Dialog
        open={showImportDialog}
        onOpenChange={(open) =>
          !isImporting &&
          (open ? setShowImportDialog(true) : resetImportDialog())
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Properties
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple properties at once. Download
              the sample template to see the required format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Step 1: Download Template */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  1
                </span>
                Download Template
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Download our CSV template with sample data to understand the
                required format.
              </p>
              <Button variant="outline" onClick={downloadSampleCSV}>
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </Button>
            </div>

            {/* Step 2: Upload File */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  2
                </span>
                Upload Your File
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Select your CSV file with property data. Required fields: name,
                propertyType, address, city, state, totalUnits.
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={isImporting}
                  className="flex-1"
                />
                {importFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImportFile(null);
                      setImportData([]);
                      setImportErrors([]);
                      setImportResults(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {importFile && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Selected: {importFile.name}
                </p>
              )}
            </div>

            {/* Validation Results */}
            {(importData.length > 0 || importErrors.length > 0) &&
              !importResults && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <span className="bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      3
                    </span>
                    Validation Results
                  </h4>

                  {importData.length > 0 && (
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        {importData.length} valid properties ready to import
                      </span>
                    </div>
                  )}

                  {importErrors.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">
                          {importErrors.length} rows with errors (will be
                          skipped)
                        </span>
                      </div>
                      <div className="max-h-32 overflow-y-auto bg-red-50 rounded p-2">
                        {importErrors.slice(0, 5).map((error, idx) => (
                          <p key={idx} className="text-xs text-red-600">
                            {error}
                          </p>
                        ))}
                        {importErrors.length > 5 && (
                          <p className="text-xs text-red-600 font-medium">
                            ...and {importErrors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  {importData.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">
                        Preview (first 3 properties):
                      </p>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Name</TableHead>
                              <TableHead className="text-xs">
                                Location
                              </TableHead>
                              <TableHead className="text-xs">Units</TableHead>
                              <TableHead className="text-xs">Rent</TableHead>
                              <TableHead className="text-xs">Images</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importData.slice(0, 3).map((prop, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs">
                                  <div>
                                    <p className="font-medium">{prop.name}</p>
                                    <p className="text-gray-500">
                                      {prop.propertyType}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {prop.city}, {prop.state}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {prop.totalUnits}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {prop.avgRent
                                    ? formatCurrency(
                                        prop.avgRent,
                                        prop.currency || "NGN"
                                      )
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {prop.images && prop.images.length > 0 ? (
                                    <span className="text-green-600">
                                      ✓ {prop.images.length} image(s)
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">
                                      No images
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Import Progress */}
            {isImporting && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Importing Properties...</h4>
                <Progress value={importProgress} className="mb-2" />
                <p className="text-sm text-gray-600">
                  {importProgress}% complete
                </p>
              </div>
            )}

            {/* Import Results */}
            {importResults && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Import Complete</h4>
                <div className="space-y-2">
                  {importResults.success > 0 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        {importResults.success} properties imported successfully
                      </span>
                    </div>
                  )}
                  {importResults.failed > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">
                        {importResults.failed} properties failed to import
                      </span>
                    </div>
                  )}
                  {importResults.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto bg-red-50 rounded p-2 mt-2">
                      {importResults.errors.map((error, idx) => (
                        <p key={idx} className="text-xs text-red-600">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={resetImportDialog}
              disabled={isImporting}
            >
              {importResults ? "Close" : "Cancel"}
            </Button>
            {!importResults && (
              <Button
                onClick={handleImportProperties}
                disabled={importData.length === 0 || isImporting}
                className="bg-gray-900 hover:bg-black"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {importData.length} Properties
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
