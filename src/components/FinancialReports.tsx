import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
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
  Percent,
  Info,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  getFinancialOverview,
  getMonthlyRevenue,
  getPropertyPerformance,
  FinancialOverview,
  MonthlyRevenueData,
  PropertyPerformance,
} from "../lib/api/financial";
import { getExpenseStats } from "../lib/api/expenses";
import { toast } from "sonner";
import { formatCurrency, getSmartBaseCurrency } from "../lib/currency";

interface FinancialReportsProps {
  properties: any[];
  user: any;
}

export const FinancialReports = ({
  properties,
  user,
}: FinancialReportsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("12months");
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [reportView, setReportView] = useState("overview");
  const [financialData, setFinancialData] = useState<FinancialOverview | null>(
    null
  );
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenueData[]>([]);
  const [propertyPerformanceData, setPropertyPerformanceData] = useState<
    PropertyPerformance[]
  >([]);
  const [expenseStats, setExpenseStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Load financial data
  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        setLoading(true);
        const [overviewRes, monthlyRes, performanceRes, expenseRes] =
          await Promise.all([
            getFinancialOverview(),
            getMonthlyRevenue(12),
            getPropertyPerformance(),
            getExpenseStats(),
          ]);

        if (!overviewRes.error && overviewRes.data) {
          setFinancialData(overviewRes.data);
        }

        if (!monthlyRes.error && Array.isArray(monthlyRes.data)) {
          console.log("📊 Monthly Revenue Data:", monthlyRes.data);
          setMonthlyData(monthlyRes.data);
        } else {
          console.error("❌ Monthly Revenue Error:", monthlyRes.error);
        }

        if (!performanceRes.error && Array.isArray(performanceRes.data)) {
          setPropertyPerformanceData(performanceRes.data);
        }

        if (!expenseRes.error && expenseRes.data) {
          setExpenseStats(expenseRes.data);
        }
      } catch (error: any) {
        console.error("Failed to load financial data:", error);
        toast.error("Failed to load financial data");
      } finally {
        setLoading(false);
      }
    };

    loadFinancialData();
  }, []);

  // Mock financial data (fallback)
  const monthlyRevenueData =
    monthlyData.length > 0
      ? monthlyData
      : [
          { month: "Jan", revenue: 85000, expenses: 25000, netIncome: 60000 },
          { month: "Feb", revenue: 87000, expenses: 28000, netIncome: 59000 },
          { month: "Mar", revenue: 89000, expenses: 26000, netIncome: 63000 },
          { month: "Apr", revenue: 91000, expenses: 30000, netIncome: 61000 },
          { month: "May", revenue: 88000, expenses: 24000, netIncome: 64000 },
          { month: "Jun", revenue: 92000, expenses: 27000, netIncome: 65000 },
          { month: "Jul", revenue: 94000, expenses: 29000, netIncome: 65000 },
          { month: "Aug", revenue: 93000, expenses: 25000, netIncome: 68000 },
          { month: "Sep", revenue: 95000, expenses: 31000, netIncome: 64000 },
          { month: "Oct", revenue: 96000, expenses: 28000, netIncome: 68000 },
          { month: "Nov", revenue: 98000, expenses: 26000, netIncome: 72000 },
          { month: "Dec", revenue: 100000, expenses: 30000, netIncome: 70000 },
        ];

  // Derive real expense breakdown from backend stats when available
  const expenseBreakdown = React.useMemo(() => {
    if (!expenseStats || !Array.isArray(expenseStats.byCategory)) {
      return [] as {
        name: string;
        value: number;
        amount: number;
        color: string;
      }[];
    }

    const totalAmount = Number(expenseStats.totalAmount || 0);
    if (totalAmount <= 0) {
      return [];
    }

    const palette = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff7f"];
    const labelMap: Record<string, string> = {
      maintenance: "Maintenance",
      utilities: "Utilities",
      insurance: "Insurance",
      property_tax: "Property Tax",
      management_fee: "Management Fees",
    };

    return expenseStats.byCategory.map(
      (item: { category: string; _sum: { amount: number } }, index: number) => {
        const rawAmount = Number(item._sum?.amount || 0);
        const percentage =
          totalAmount > 0 ? (rawAmount / totalAmount) * 100 : 0;
        const key = (item.category || "").toLowerCase();
        const name = labelMap[key] || item.category || "Other";

        return {
          name,
          value: Number(percentage.toFixed(1)),
          amount: rawAmount,
          color: palette[index % palette.length],
        };
      }
    );
  }, [expenseStats]);

  // Use real property performance data if available, otherwise calculate from properties prop
  const propertyPerformance =
    propertyPerformanceData.length > 0
      ? propertyPerformanceData.map((p) => ({
          id: p.id,
          name: p.name,
          propertyType: p.propertyType,
          address: p.address,
          city: p.city,
          state: p.state,
          revenue: p.monthlyRevenue,
          expenses: p.monthlyExpenses,
          netIncome: p.monthlyNOI,
          roi: p.roi,
          capRate: p.capRate,
          cashFlow: p.cashFlow,
          units: p.totalUnits,
          occupancyRate: p.occupancyRate,
          occupiedUnits: p.occupiedUnits,
          vacantUnits: p.vacantUnits,
          propertyValue: p.propertyValue,
          purchasePrice: p.purchasePrice,
          currentValue: p.currentValue,
        }))
      : properties.map((property) => {
          // Fallback calculation from properties prop
          const monthlyRevenue =
            property.avgRent || property.monthlyRevenue || 0;
          return {
            ...property,
            revenue: monthlyRevenue,
            expenses: monthlyRevenue * 0.3,
            netIncome: monthlyRevenue * 0.7,
            roi:
              monthlyRevenue > 0
                ? ((monthlyRevenue * 12 * 0.7) / (monthlyRevenue * 12 * 15)) *
                  100
                : 0,
            capRate: property.financials?.capRate || 6.5,
            cashFlow: property.financials?.cashFlow || monthlyRevenue * 0.6,
            units: property.totalUnits || property._count?.units || 0,
          };
        });

  const currentYear = new Date().getFullYear();

  // Calculate totals from real property performance data (from API)
  // This ensures we use actual database values, not mock data
  const calculatedTotalRevenue =
    propertyPerformanceData.length > 0
      ? propertyPerformanceData.reduce(
          (sum, p) => sum + (p.monthlyRevenue || 0),
          0
        )
      : 0;

  const calculatedTotalExpenses =
    propertyPerformanceData.length > 0
      ? propertyPerformanceData.reduce(
          (sum, p) => sum + (p.monthlyExpenses || 0),
          0
        )
      : 0;

  const calculatedTotalNetIncome =
    calculatedTotalRevenue - calculatedTotalExpenses;

  // Use API financial data if available, otherwise use calculated values from property performance
  // Note: We check if financialData exists AND has properties loaded (not just truthy values)
  const hasRealFinancialData =
    financialData &&
    (financialData.totalProperties > 0 || propertyPerformanceData.length > 0);

  const totalRevenue = hasRealFinancialData
    ? financialData?.totalRevenue ?? calculatedTotalRevenue
    : calculatedTotalRevenue;

  const totalExpenses = hasRealFinancialData
    ? financialData?.estimatedExpenses ?? calculatedTotalExpenses
    : calculatedTotalExpenses;

  const totalNetIncome = hasRealFinancialData
    ? financialData?.netOperatingIncome ?? calculatedTotalNetIncome
    : calculatedTotalNetIncome;

  // Calculate occupancy from property performance data
  const calculatedOccupancy =
    propertyPerformanceData.length > 0
      ? propertyPerformanceData.reduce(
          (sum, p) => sum + (p.occupancyRate || 0),
          0
        ) / propertyPerformanceData.length
      : 0;

  const averageOccupancy = hasRealFinancialData
    ? financialData?.occupancyRate ?? calculatedOccupancy
    : calculatedOccupancy;

  // Calculate cap rate from property performance data
  const calculatedCapRate =
    propertyPerformanceData.length > 0
      ? propertyPerformanceData.reduce((sum, p) => sum + (p.capRate || 0), 0) /
        propertyPerformanceData.length
      : 0;

  const portfolioCapRate = hasRealFinancialData
    ? financialData?.portfolioCapRate ?? calculatedCapRate
    : calculatedCapRate;

  // Calculate operating margin
  const calculatedOperatingMargin =
    totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;

  const operatingMargin = hasRealFinancialData
    ? financialData?.operatingMargin ?? calculatedOperatingMargin
    : calculatedOperatingMargin;

  // Derive simple growth indicators from monthly revenue data instead of using hard-coded mocks
  // Use first vs last month in the current 12-month window as an approximation
  let revenueGrowth = 0;
  let expenseGrowth = 0;
  let yearOverYearGrowth = 0;

  if (monthlyRevenueData.length >= 2) {
    const first = monthlyRevenueData[0];
    const last = monthlyRevenueData[monthlyRevenueData.length - 1];

    if (first.revenue > 0) {
      revenueGrowth = ((last.revenue - first.revenue) / first.revenue) * 100;
    }
    if (first.expenses > 0) {
      expenseGrowth = ((last.expenses - first.expenses) / first.expenses) * 100;
    }
    if (first.netIncome > 0) {
      yearOverYearGrowth =
        ((last.netIncome - first.netIncome) / first.netIncome) * 100;
    }
  }

  const filteredProperties =
    selectedProperty === "all"
      ? propertyPerformance
      : propertyPerformance.filter((p) => p.id.toString() === selectedProperty);

  // Smart base currency: Use single currency if all properties use same currency, otherwise USD
  const baseCurrency = getSmartBaseCurrency(properties);

  // Get the currency to use for display
  const displayCurrency =
    selectedProperty === "all"
      ? baseCurrency // Use smart base currency for "all properties" view
      : filteredProperties[0]?.currency ||
        properties.find((p) => p.id.toString() === selectedProperty)
          ?.currency ||
        "NGN";

  // Calculate filtered totals based on selected property
  // For "All Properties", use the API-driven portfolio totals (totalRevenue/totalExpenses)
  const filteredTotalRevenue =
    selectedProperty === "all"
      ? totalRevenue
      : filteredProperties.reduce(
          (sum, p) => sum + (p.revenue || p.monthlyRevenue || 0),
          0
        );

  const filteredTotalExpenses =
    selectedProperty === "all"
      ? totalExpenses
      : filteredProperties.reduce(
          (sum, p) => sum + (p.expenses || p.monthlyExpenses || 0),
          0
        );

  const filteredTotalNetIncome = filteredTotalRevenue - filteredTotalExpenses;

  // Calculate filtered cap rate and operating margin based on selected property
  const filteredCapRate =
    selectedProperty === "all"
      ? portfolioCapRate
      : filteredProperties.length > 0
      ? filteredProperties.reduce((sum, p) => sum + (p.capRate || 0), 0) /
        filteredProperties.length
      : 0;

  const filteredOperatingMargin =
    selectedProperty === "all"
      ? operatingMargin
      : filteredTotalRevenue > 0
      ? (filteredTotalNetIncome / filteredTotalRevenue) * 100
      : 0;

  const exportReport = async (format: "csv" | "pdf") => {
    try {
      const generatedAt = new Date().toISOString();
      const datePart = generatedAt.split("T")[0];

      if (format === "csv") {
        // Use array of arrays for proper CSV structure
        const rows: (string | number)[][] = [];

        // Helper to format numbers
        const formatNumber = (num: number): string => {
          return num.toFixed(2);
        };

        const propertyName =
          selectedProperty === "all"
            ? "All Properties"
            : filteredProperties[0]?.name || selectedProperty;

        const totalPropertiesCount =
          financialData?.totalProperties ||
          propertyPerformanceData.length ||
          properties.length;

        const totalUnitsCount =
          financialData?.totalUnits ||
          propertyPerformance.reduce((sum, p) => sum + (p.units || 0), 0);

        // ==================== REPORT HEADER ====================
        rows.push(["FINANCIAL REPORT - CONTREZZ PROPERTY MANAGEMENT"]);
        rows.push([]);
        rows.push(["Report Information"]);
        rows.push([
          "Generated Date",
          new Date(generatedAt).toLocaleDateString(),
        ]);
        rows.push([
          "Generated Time",
          new Date(generatedAt).toLocaleTimeString(),
        ]);
        rows.push([
          "Period",
          selectedPeriod === "all" ? "All Time" : selectedPeriod,
        ]);
        rows.push(["Property", propertyName]);
        rows.push(["Currency", displayCurrency]);
        rows.push([]);

        // ==================== KEY PERFORMANCE INDICATORS ====================
        rows.push(["KEY PERFORMANCE INDICATORS"]);
        rows.push(["Metric", "Value", "Change (%)"]);
        rows.push([
          "Total Revenue",
          formatNumber(filteredTotalRevenue),
          `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}`,
        ]);
        rows.push([
          "Total Expenses",
          formatNumber(filteredTotalExpenses),
          `${expenseGrowth >= 0 ? "+" : ""}${expenseGrowth.toFixed(1)}`,
        ]);
        rows.push([
          "Net Operating Income",
          formatNumber(filteredTotalNetIncome),
          "",
        ]);
        rows.push(["Portfolio Cap Rate (%)", filteredCapRate.toFixed(2), ""]);
        rows.push([
          "Operating Margin (%)",
          filteredOperatingMargin.toFixed(2),
          "",
        ]);
        rows.push(["Average Occupancy (%)", averageOccupancy.toFixed(2), ""]);
        rows.push(["Total Properties", totalPropertiesCount, ""]);
        rows.push(["Total Units", totalUnitsCount, ""]);
        rows.push([]);

        // ==================== MONTHLY REVENUE VS EXPENSES ====================
        rows.push(["MONTHLY REVENUE VS EXPENSES TREND"]);
        rows.push(["Month", "Revenue", "Expenses", "Net Income"]);
        if (monthlyRevenueData.length === 0) {
          rows.push(["No data available", "", "", ""]);
        } else {
          monthlyRevenueData.forEach((m) => {
            rows.push([
              m.month,
              formatNumber(m.revenue || 0),
              formatNumber(m.expenses || 0),
              formatNumber(m.netIncome || 0),
            ]);
          });
          // Add totals row
          const totalMonthlyRevenue = monthlyRevenueData.reduce(
            (sum, m) => sum + (m.revenue || 0),
            0
          );
          const totalMonthlyExpenses = monthlyRevenueData.reduce(
            (sum, m) => sum + (m.expenses || 0),
            0
          );
          const totalMonthlyNetIncome = monthlyRevenueData.reduce(
            (sum, m) => sum + (m.netIncome || 0),
            0
          );
          rows.push([
            "TOTAL",
            formatNumber(totalMonthlyRevenue),
            formatNumber(totalMonthlyExpenses),
            formatNumber(totalMonthlyNetIncome),
          ]);
        }
        rows.push([]);

        // ==================== EXPENSE BREAKDOWN ====================
        rows.push(["EXPENSE BREAKDOWN BY CATEGORY"]);
        rows.push(["Category", "Amount", "Percentage (%)"]);
        if (expenseBreakdown.length === 0) {
          rows.push(["No expense data recorded", "", ""]);
        } else {
          expenseBreakdown.forEach((e) => {
            rows.push([e.name, formatNumber(e.amount), e.value]);
          });
          // Add total row
          const expenseTotal = expenseBreakdown.reduce(
            (sum, e) => sum + e.amount,
            0
          );
          rows.push(["TOTAL", formatNumber(expenseTotal), "100.0"]);
        }
        rows.push([]);

        // ==================== PROPERTY PERFORMANCE ====================
        if (propertyPerformance.length > 0) {
          rows.push(["PROPERTY PERFORMANCE SUMMARY"]);
          rows.push([
            "Property Name",
            "Revenue",
            "Expenses",
            "Net Operating Income",
            "Occupancy (%)",
            "Units",
          ]);
          propertyPerformance.forEach((p) => {
            rows.push([
              p.name || "Unknown",
              formatNumber(p.revenue || 0),
              formatNumber(p.expenses || 0),
              formatNumber(p.netIncome || 0),
              (p.occupancy || 0).toFixed(1),
              p.units || 0,
            ]);
          });
          // Add totals row
          const totalPropRevenue = propertyPerformance.reduce(
            (sum, p) => sum + (p.revenue || 0),
            0
          );
          const totalPropExpenses = propertyPerformance.reduce(
            (sum, p) => sum + (p.expenses || 0),
            0
          );
          const totalPropNOI = propertyPerformance.reduce(
            (sum, p) => sum + (p.netIncome || 0),
            0
          );
          const avgOccupancy =
            propertyPerformance.length > 0
              ? propertyPerformance.reduce(
                  (sum, p) => sum + (p.occupancy || 0),
                  0
                ) / propertyPerformance.length
              : 0;
          const totalPropUnits = propertyPerformance.reduce(
            (sum, p) => sum + (p.units || 0),
            0
          );
          rows.push([
            "TOTAL / AVERAGE",
            formatNumber(totalPropRevenue),
            formatNumber(totalPropExpenses),
            formatNumber(totalPropNOI),
            avgOccupancy.toFixed(1),
            totalPropUnits,
          ]);
          rows.push([]);
        }

        // ==================== FOOTER ====================
        rows.push([]);
        rows.push(["Report generated by Contrezz Property Management"]);
        rows.push(["Export Date", new Date().toLocaleString()]);

        // Convert rows to proper CSV format
        // Wrap ALL cells in quotes to ensure proper parsing
        const csvLines = rows.map((row) => {
          return row
            .map((cell) => {
              const cellStr = String(cell ?? "");
              // Escape any existing quotes by doubling them
              const escaped = cellStr.replace(/"/g, '""');
              // Wrap every cell in quotes for maximum compatibility
              return `"${escaped}"`;
            })
            .join(",");
        });

        // Create CSV with BOM and sep hint for Excel
        const BOM = "\uFEFF";
        const sepHint = "sep=,";
        const csvContent = BOM + sepHint + "\r\n" + csvLines.join("\r\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `financial-report-${datePart}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Financial report exported as CSV");
        return;
      }

      if (format === "pdf") {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF("p", "mm", "a4");

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - margin * 2;

        // Single font family for consistency (helvetica is Arial equivalent in jsPDF)
        const fontFamily = "helvetica";

        // Brand Colors
        const primaryPurple: [number, number, number] = [124, 58, 237]; // #7C3AED
        const darkPurple: [number, number, number] = [91, 33, 182]; // #5B21B6
        const primaryColor: [number, number, number] = [17, 24, 39]; // gray-900
        const secondaryColor: [number, number, number] = [107, 114, 128]; // gray-500
        const successColor: [number, number, number] = [34, 197, 94]; // green-500
        const dangerColor: [number, number, number] = [239, 68, 68]; // red-500
        const lightBg: [number, number, number] = [249, 250, 251]; // gray-50
        const borderColor: [number, number, number] = [229, 231, 235]; // gray-200

        // Helper: Format currency for PDF (numbers only, no currency prefix)
        const formatCurrencyForPDF = (
          amount: number,
          _currency: string
        ): string => {
          return amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        };

        let yPos = 130; // Start after header

        // Helper: Add header to each page
        const addHeader = (pageNumber: number) => {
          // Purple gradient header background
          doc.setFillColor(...primaryPurple);
          doc.rect(0, 0, pageWidth, 110, "F");

          // Dark purple accent bar
          doc.setFillColor(...darkPurple);
          doc.rect(0, 105, pageWidth, 5, "F");

          // Logo/Title area
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(22);
          doc.text("CONTREZZ", margin, 35);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.text("Property Management System", margin, 50);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.text("Financial Report", margin, 72);

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          const propertyName =
            selectedProperty === "all"
              ? "All Properties"
              : filteredProperties[0]?.name || selectedProperty;
          doc.text(propertyName, margin, 85);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          const reportDate = new Date(generatedAt).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          });
          doc.text(`Report Date: ${reportDate}`, margin, 95);
          doc.text(`Generated At: ${new Date(generatedAt).toLocaleTimeString("en-US")}`, margin, 102);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(
            `Period: ${selectedPeriod === "all" ? "All Time" : selectedPeriod}`,
            pageWidth - margin,
            88,
            { align: "right" }
          );

          doc.text(`Currency: ${displayCurrency}`, pageWidth - margin, 95, { align: "right" });
        };

        // Helper: Check page break
        const checkPageBreak = (neededHeight: number) => {
          if (yPos + neededHeight > pageHeight - 50) { // 50 for footer space
            doc.addPage();
            addHeader(doc.internal.getNumberOfPages());
            yPos = 130;
            return true;
          }
          return false;
        };

        // Helper: Draw horizontal line
        const drawLine = (
          yPos: number,
          color: [number, number, number] = borderColor
        ) => {
          doc.setDrawColor(...color);
          doc.setLineWidth(0.3);
          doc.line(margin, yPos, pageWidth - margin, yPos);
        };

        // Helper: Draw section header with purple gradient effect
        const drawSectionHeader = (title: string) => {
          checkPageBreak(15);
          // Purple rounded header
          doc.setFillColor(...primaryPurple);
          doc.roundedRect(margin, yPos, contentWidth, 10, 3, 3, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont(fontFamily, "bold");
          doc.text(title, margin + 5, yPos + 7);
          yPos += 14;
          doc.setTextColor(...primaryColor);
        };

        // Helper: Draw metric card
        const drawMetricCard = (
          x: number,
          yPos: number,
          width: number,
          label: string,
          value: string,
          trend?: number
        ) => {
          doc.setFillColor(...lightBg);
          doc.roundedRect(x, yPos, width, 22, 2, 2, "F");
          doc.setDrawColor(...borderColor);
          doc.roundedRect(x, yPos, width, 22, 2, 2, "S");

          doc.setTextColor(...secondaryColor);
          doc.setFontSize(8);
          doc.setFont(fontFamily, "normal");
          doc.text(label, x + 4, yPos + 6);

          doc.setTextColor(...primaryColor);
          doc.setFontSize(12);
          doc.setFont(fontFamily, "bold");
          doc.text(value, x + 4, yPos + 14);

          if (trend !== undefined) {
            const trendText = `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`;
            const trendColor = trend >= 0 ? successColor : dangerColor;
            doc.setTextColor(...trendColor);
            doc.setFontSize(8);
            doc.setFont(fontFamily, "normal");
            doc.text(trendText, x + 4, yPos + 19);
          }
        };

        // Helper: Draw table with proper column alignment
        const drawTable = (
          headers: string[],
          rows: string[][],
          colWidths: number[],
          startY: number,
          alignments?: ("left" | "right")[]
        ) => {
          const rowHeight = 7;
          const headerHeight = 8;
          let currentY = startY;
          const cellPadding = 3;

          // Calculate column positions (start x for each column)
          const colPositions: number[] = [];
          let pos = margin;
          colWidths.forEach((w) => {
            colPositions.push(pos);
            pos += w;
          });

          // Default alignments: first column left, rest right
          const colAlignments =
            alignments || headers.map((_, i) => (i === 0 ? "left" : "right"));

          // Header row with dark background
          doc.setFillColor(17, 24, 39); // #111827
          doc.rect(margin, currentY, contentWidth, headerHeight, "F");
          doc.setTextColor(255, 255, 255); // White text
          doc.setFontSize(9);
          doc.setFont(fontFamily, "bold");

          headers.forEach((header, i) => {
            const colX = colPositions[i];
            const colW = colWidths[i];
            if (colAlignments[i] === "right") {
              // Right-align header
              const textWidth = doc.getTextWidth(header);
              doc.text(
                header,
                colX + colW - cellPadding - textWidth,
                currentY + 5.5
              );
            } else {
              // Left-align header
              doc.text(header, colX + cellPadding, currentY + 5.5);
            }
          });
          currentY += headerHeight;
          drawLine(currentY);

          // Data rows
          doc.setFont(fontFamily, "normal");
          doc.setFontSize(9);

          rows.forEach((row, rowIndex) => {
            checkPageBreak(rowHeight);

            // Alternating row background - white and light gray
            if (rowIndex % 2 === 0) {
              doc.setFillColor(255, 255, 255); // White
              doc.rect(margin, currentY, contentWidth, rowHeight, "F");
            } else {
              doc.setFillColor(249, 250, 251); // Light gray
              doc.rect(margin, currentY, contentWidth, rowHeight, "F");
            }

            doc.setTextColor(...primaryColor);
            row.forEach((cell, i) => {
              const colX = colPositions[i];
              const colW = colWidths[i];
              if (colAlignments[i] === "right") {
                // Right-align cell value under right-aligned header
                const textWidth = doc.getTextWidth(cell);
                doc.text(
                  cell,
                  colX + colW - cellPadding - textWidth,
                  currentY + 5
                );
              } else {
                // Left-align cell
                doc.text(cell, colX + cellPadding, currentY + 5);
              }
            });
            currentY += rowHeight;
          });

          drawLine(currentY);
          return currentY + 4;
        };

        // ==================== HEADER ====================
        // Purple gradient header background
        doc.setFillColor(...primaryPurple);
        doc.rect(0, 0, pageWidth, 110, "F");

        // Dark purple accent bar
        doc.setFillColor(...darkPurple);
        doc.rect(0, 105, pageWidth, 5, "F");

        // Logo/Title area - Left side
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("CONTREZZ", margin, 35);

        // Subtitle
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text("Property Management System", margin, 50);

        // Report title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text("Financial Report", margin, 72);

        // Property name
        doc.setFontSize(10);
        doc.setFont(fontFamily, "normal");
        const propertyName =
          selectedProperty === "all"
            ? "All Properties"
            : filteredProperties[0]?.name || selectedProperty;
        doc.text(propertyName, margin, 85);

        // Report metadata - Left side
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        const reportDate = new Date(generatedAt).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        doc.text(`Report Date: ${reportDate}`, margin, 95);
        doc.text(`Generated At: ${new Date(generatedAt).toLocaleTimeString("en-US")}`, margin, 102);

        // Right side metadata
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(
          `Period: ${selectedPeriod === "all" ? "All Time" : selectedPeriod}`,
          pageWidth - margin,
          88,
          { align: "right" }
        );

        // Currency display (right aligned, no background)
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(`Currency: ${displayCurrency}`, pageWidth - margin, 95, { align: "right" });

        // ==================== KEY METRICS ====================
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont(fontFamily, "bold");
        doc.text("Key Performance Indicators", margin, yPos);
        yPos += 8;

        const cardWidth = (contentWidth - 8) / 3;

        // Row 1: Revenue, Expenses, NOI
        drawMetricCard(
          margin,
          yPos,
          cardWidth,
          "Total Revenue",
          formatCurrencyForPDF(filteredTotalRevenue, displayCurrency),
          revenueGrowth
        );
        drawMetricCard(
          margin + cardWidth + 4,
          yPos,
          cardWidth,
          "Total Expenses",
          formatCurrencyForPDF(filteredTotalExpenses, displayCurrency),
          expenseGrowth
        );
        drawMetricCard(
          margin + (cardWidth + 4) * 2,
          yPos,
          cardWidth,
          "Net Operating Income",
          formatCurrencyForPDF(filteredTotalNetIncome, displayCurrency)
        );
        yPos += 28;

        // Row 2: Cap Rate, Operating Margin, Occupancy
        drawMetricCard(
          margin,
          yPos,
          cardWidth,
          "Portfolio Cap Rate",
          `${filteredCapRate.toFixed(1)}%`
        );
        drawMetricCard(
          margin + cardWidth + 4,
          yPos,
          cardWidth,
          "Operating Margin",
          `${filteredOperatingMargin.toFixed(1)}%`
        );
        drawMetricCard(
          margin + (cardWidth + 4) * 2,
          yPos,
          cardWidth,
          "Average Occupancy",
          `${averageOccupancy.toFixed(1)}%`
        );
        yPos += 28;

        // Row 3: Properties, Units
        const halfWidth = (contentWidth - 4) / 2;
        const totalPropertiesCount =
          financialData?.totalProperties ||
          propertyPerformanceData.length ||
          properties.length;
        const totalUnitsCount =
          financialData?.totalUnits ||
          propertyPerformance.reduce((sum, p) => sum + (p.units || 0), 0);

        drawMetricCard(
          margin,
          yPos,
          halfWidth,
          "Total Properties",
          String(totalPropertiesCount)
        );
        drawMetricCard(
          margin + halfWidth + 4,
          yPos,
          halfWidth,
          "Total Units",
          String(totalUnitsCount)
        );
        yPos += 32;

        // ==================== MONTHLY TREND ====================
        drawSectionHeader("Revenue vs Expenses Trend");

        if (monthlyRevenueData.length === 0) {
          doc.setTextColor(...secondaryColor);
          doc.setFontSize(10);
          doc.setFont(fontFamily, "normal");
          doc.text(
            "No monthly data available for the selected period.",
            margin,
            yPos
          );
          yPos += 10;
        } else {
          const trendHeaders = ["Month", "Revenue", "Expenses", "Net Income"];
          const trendColWidths = [40, 45, 45, 45];
          const trendRows = monthlyRevenueData.map((m) => [
            m.month,
            formatCurrencyForPDF(m.revenue || 0, displayCurrency),
            formatCurrencyForPDF(m.expenses || 0, displayCurrency),
            formatCurrencyForPDF(m.netIncome || 0, displayCurrency),
          ]);
          yPos = drawTable(trendHeaders, trendRows, trendColWidths, yPos, [
            "left",
            "right",
            "right",
            "right",
          ]);
        }

        yPos += 6;

        // ==================== EXPENSE BREAKDOWN ====================
        checkPageBreak(40);
        drawSectionHeader("Expense Breakdown by Category");

        if (expenseBreakdown.length === 0) {
          doc.setTextColor(...secondaryColor);
          doc.setFontSize(10);
          doc.setFont(fontFamily, "normal");
          doc.text(
            "No expense data recorded. Add operating expenses to see category breakdown.",
            margin,
            yPos
          );
          yPos += 10;
        } else {
          const expenseHeaders = ["Category", "Amount", "Percentage"];
          const expenseColWidths = [70, 55, 50];
          const expenseRows = expenseBreakdown.map((e) => [
            e.name,
            formatCurrencyForPDF(e.amount, displayCurrency),
            `${e.value}%`,
          ]);

          // Add total row
          const expenseTotal = expenseBreakdown.reduce(
            (sum, e) => sum + e.amount,
            0
          );
          expenseRows.push([
            "Total",
            formatCurrencyForPDF(expenseTotal, displayCurrency),
            "100%",
          ]);

          yPos = drawTable(expenseHeaders, expenseRows, expenseColWidths, yPos, [
            "left",
            "right",
            "right",
          ]);
        }

        yPos += 6;

        // ==================== PROPERTY PERFORMANCE ====================
        if (propertyPerformance.length > 0) {
          checkPageBreak(50);
          drawSectionHeader("Property Performance Summary");

          const perfHeaders = [
            "Property",
            "Revenue",
            "Expenses",
            "NOI",
            "Occupancy",
          ];
          const perfColWidths = [50, 35, 35, 35, 25];
          const perfRows = propertyPerformance
            .slice(0, 10)
            .map((p) => [
              (p.name || "Unknown").substring(0, 20),
              formatCurrencyForPDF(p.revenue || 0, displayCurrency),
              formatCurrencyForPDF(p.expenses || 0, displayCurrency),
              formatCurrencyForPDF(p.netIncome || 0, displayCurrency),
              `${(p.occupancy || 0).toFixed(0)}%`,
            ]);

          yPos = drawTable(perfHeaders, perfRows, perfColWidths, yPos, [
            "left",
            "right",
            "right",
            "right",
            "right",
          ]);

          if (propertyPerformance.length > 10) {
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(8);
            doc.setFont(fontFamily, "normal");
            doc.text(
              `Showing top 10 of ${propertyPerformance.length} properties`,
              margin,
              yPos
            );
            yPos += 6;
          }
        }

        // ==================== FOOTER ====================
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);

          // Purple footer background
          doc.setFillColor(...primaryPurple);
          doc.rect(0, pageHeight - 40, pageWidth, 40, "F");

          // Dark purple accent line
          doc.setFillColor(...darkPurple);
          doc.rect(0, pageHeight - 40, pageWidth, 3, "F");

          doc.setFont("helvetica", "normal");
          doc.setTextColor(255, 255, 255); // White text
          doc.setFontSize(9);

          // Company name
          doc.text("Generated by CONTREZZ Property Management System", margin, pageHeight - 40 + 15);
          // Copyright
          doc.text("© 2024 Contrezz. All rights reserved.", margin, pageHeight - 40 + 28);

          // Page number
          doc.setFont("helvetica", "bold");
          doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 40 + 22, { align: "right" });
        }

        doc.save(`financial-report-${datePart}.pdf`);
        toast.success("Financial report exported as PDF");
      }
    } catch (error: any) {
      console.error("Export report error:", error);
      toast.error(error?.message || "Failed to export financial report");
    }
  };

  // Currency formatter for tooltips
  const currencyFormatter = (value: any) =>
    formatCurrency(Number(value), displayCurrency);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Financial Reports
              </h2>
            </div>
            <p className="text-purple-100 text-lg">
              Comprehensive financial analytics for your property portfolio
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40 bg-white border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                <Calendar className="h-4 w-4 mr-2 text-[#7C3AED]" />
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
              <SelectTrigger className="w-48 bg-white border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                <Building className="h-4 w-4 mr-2 text-[#7C3AED]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => exportReport("csv")}
                className="bg-white hover:bg-purple-50 border-white/50 text-[#7C3AED] font-semibold"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => exportReport("pdf")}
                className="bg-white hover:bg-purple-50 text-[#7C3AED] font-semibold shadow-md"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold text-white">
                    Total Revenue
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-white/80 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">How it's calculated:</p>
                      <p className="text-xs">
                        Sum of all monthly rental income from occupied units
                        across your entire property portfolio. This represents
                        your gross rental revenue before any deductions.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 bg-white">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(filteredTotalRevenue, displayCurrency)}
              </div>
              <div className="flex items-center text-sm font-semibold text-green-600 mt-2">
                <ArrowUpRight className="h-4 w-4 mr-1" />+{revenueGrowth.toFixed(1)}% vs last year
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold text-white">
                    Net Operating Income
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-white/80 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">How it's calculated:</p>
                      <p className="text-xs">
                        Total Revenue minus Operating Expenses. This is your NOI -
                        the actual profit from property operations before
                        financing costs and taxes.
                      </p>
                      <p className="text-xs mt-1 italic">
                        Formula: Total Revenue - Operating Expenses
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 bg-white">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(filteredTotalNetIncome, displayCurrency)}
              </div>
              <div className="flex items-center text-sm font-semibold text-blue-600 mt-2">
                <ArrowUpRight className="h-4 w-4 mr-1" />+{yearOverYearGrowth.toFixed(1)}% vs last year
              </div>
              {filteredTotalExpenses === 0 && filteredTotalRevenue > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  No expenses recorded yet. Net Operating Income currently
                  equals total revenue.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold text-white">
                    {selectedProperty === "all"
                      ? "Portfolio Cap Rate"
                      : "Property Cap Rate"}
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-white/80 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">How it's calculated:</p>
                      <p className="text-xs">
                        {selectedProperty === "all"
                          ? "Your portfolio-wide Capitalization Rate. Measures the annual return on investment across all properties combined."
                          : "This property's Capitalization Rate. Measures the annual return on investment for this specific property."}
                      </p>
                      <p className="text-xs mt-1 italic">
                        Formula: (Annual NOI ÷ Property Value) × 100
                      </p>
                      <p className="text-xs mt-1 text-purple-200">
                        Industry benchmark: 4-10% depending on market and property
                        type.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Percent className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 bg-white">
              <div className="text-3xl font-bold text-gray-900">
                {filteredCapRate.toFixed(1)}%
              </div>
              <div className="flex items-center text-sm font-semibold text-[#7C3AED] mt-2">
                {filteredCapRate > 6
                  ? "Above market average"
                  : filteredCapRate > 4
                  ? "Market average"
                  : "Below market average"}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold text-white">
                    Operating Margin
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-white/80 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">How it's calculated:</p>
                      <p className="text-xs">
                        The percentage of revenue remaining after operating
                        expenses. Indicates operational efficiency and
                        profitability.
                      </p>
                      <p className="text-xs mt-1 italic">
                        Formula: (NOI ÷ Total Revenue) × 100
                      </p>
                      <p className="text-xs mt-1 text-amber-200">
                        Higher margins indicate better operational efficiency.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 bg-white">
              <div className="text-3xl font-bold text-gray-900">
                {filteredOperatingMargin.toFixed(1)}%
              </div>
              <div className="flex items-center text-sm font-semibold text-amber-600 mt-2">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                {filteredOperatingMargin > 60
                  ? "Healthy margin"
                  : filteredOperatingMargin > 40
                  ? "Moderate margin"
                  : "Low margin"}
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      {/* Report Tabs */}
      <Tabs
        value={reportView}
        onValueChange={setReportView}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-xl h-auto">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg font-semibold py-2.5"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="revenue"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg font-semibold py-2.5"
          >
            Revenue
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg font-semibold py-2.5"
          >
            Expenses
          </TabsTrigger>
          <TabsTrigger
            value="properties"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg font-semibold py-2.5"
          >
            Properties
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg font-semibold py-2.5"
          >
            Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Expenses Chart */}
            <Card className="border-gray-200 shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <LineChart className="h-5 w-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      Revenue vs Expenses Trend
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Visual comparison of monthly revenue (blue bars),
                              operating expenses (green bars), and net income
                              (orange line) over the past 12 months. Helps identify
                              trends and seasonality.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Monthly financial performance over the last 12 months
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyRevenueData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                    <BarChart3 className="h-12 w-12 mb-3 text-gray-300" />
                    <p className="font-medium">No financial data available</p>
                    <p className="text-xs mt-1">
                      Record payments and expenses to see monthly trends.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={monthlyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value) => [currencyFormatter(value), ""]}
                      />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                      <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
                      <Line
                        type="monotone"
                        dataKey="netIncome"
                        stroke="#ff7300"
                        strokeWidth={3}
                        name="Net Income"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card className="border-gray-200 shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <PieChart className="h-5 w-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      Expense Breakdown
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Pie chart showing the percentage distribution of your
                              operating expenses across categories like maintenance,
                              utilities, insurance, taxes, and management fees.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Distribution of operating expenses
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {expenseBreakdown.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <PieChart className="h-10 w-10 mb-3 text-gray-300" />
                    <p className="font-medium">No expense data available</p>
                    <p className="text-xs mt-1">
                      Record operating expenses to see category breakdown.
                    </p>
                  </div>
                ) : (
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
                      <RechartsTooltip
                        formatter={(value) => [`${value}%`, ""]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats - Using Real Database Data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-gray-700">
                        Average Occupancy
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              The average percentage of occupied units across
                              all your properties. Higher occupancy means better
                              rental income and property utilization.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {averageOccupancy.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      {financialData?.occupiedUnits || 0} of{" "}
                      {financialData?.totalUnits || 0} units occupied
                    </p>
                  </div>
                  <div className="h-14 w-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                    <Building className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 bg-gradient-to-br from-green-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-gray-700">
                        Total Properties
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              The total number of active properties in your
                              portfolio. Each property can contain multiple
                              units or apartments.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {financialData?.totalProperties ||
                        propertyPerformanceData.length ||
                        properties.length}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      Active properties in portfolio
                    </p>
                  </div>
                  <div className="h-14 w-14 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                    <Eye className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#7C3AED] shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-gray-700">
                        Total Units
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              The combined number of rentable units (apartments,
                              rooms, or spaces) across all your properties.
                              Includes both occupied and vacant units.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-3xl font-bold text-[#7C3AED] mt-2">
                      {financialData?.totalUnits ||
                        propertyPerformance.reduce(
                          (sum, p) => sum + (p.units || 0),
                          0
                        )}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      {financialData?.vacantUnits || 0} vacant units
                    </p>
                  </div>
                  <div className="h-14 w-14 bg-[#7C3AED] rounded-xl flex items-center justify-center shadow-md">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    Revenue Analysis
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Area chart showing monthly rental revenue trends over
                            time. Use this to identify seasonal patterns, growth
                            trends, and forecast future income.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Detailed revenue trends and projections
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value) => [currencyFormatter(value), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-gray-700" />
                  </div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    Revenue by Property
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Comparative view of monthly revenue generated by each
                            property. Progress bars show relative performance to
                            help identify your top-performing assets.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProperties.map((property) => {
                    const revenue =
                      property.monthlyRevenue || property.revenue || 0;
                    const maxRevenue = Math.max(
                      ...filteredProperties.map(
                        (p) => p.monthlyRevenue || p.revenue || 0
                      ),
                      1
                    );
                    const revenuePercent =
                      maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                    return (
                      <div
                        key={property.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{property.name}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${revenuePercent}%` }}
                            />
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-medium">
                            {formatCurrency(
                              revenue,
                              property.currency || displayCurrency
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {property.units || 0} units
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-gray-700" />
                  </div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    Revenue Metrics
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Key revenue performance indicators including total
                            annual revenue, average monthly income, per-unit
                            earnings, and year-over-year growth rate.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Annual Revenue</span>
                    <span className="font-bold">
                      {formatCurrency(filteredTotalRevenue, displayCurrency)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Monthly</span>
                    <span className="font-bold">
                      {formatCurrency(
                        filteredTotalRevenue / 12,
                        displayCurrency
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Revenue per Unit
                    </span>
                    <span className="font-bold">
                      {formatCurrency(
                        Math.round(
                          filteredTotalRevenue /
                            (selectedProperty === "all"
                              ? properties.reduce(
                                  (sum, p) =>
                                    sum + (p.units || p.totalUnits || 0),
                                  0
                                )
                              : filteredProperties.reduce(
                                  (sum, p) => sum + (p.totalUnits || 0),
                                  0
                                ))
                        ),
                        displayCurrency
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">YoY Growth</span>
                    <span className="font-bold text-green-600">
                      +{revenueGrowth}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-gray-700" />
                  </div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    Monthly Expense Trend
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Line chart tracking monthly operating expenses over
                            time. Monitor spending patterns and identify
                            opportunities to reduce costs.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value) => [
                        currencyFormatter(value),
                        "Expenses",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ff7300"
                      strokeWidth={2}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <PieChart className="h-5 w-5 text-gray-700" />
                  </div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    Expense Categories
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Detailed breakdown of expenses by category with both
                            dollar amounts and percentages. Shows where your money
                            is going: maintenance, utilities, insurance, taxes,
                            and fees.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenseBreakdown.map((expense, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: expense.color }}
                        />
                        <span className="font-medium">{expense.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatCurrency(expense.amount, displayCurrency)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {expense.value}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-gray-700" />
                </div>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  Expense Analysis
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Summary of key expense metrics: total annual expenses,
                          cost per unit, and expense ratio (expenses as a
                          percentage of revenue). Lower expense ratios indicate
                          better profitability.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {formatCurrency(filteredTotalExpenses, displayCurrency)}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                    <span>Total Annual Expenses</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Sum of all operating expenses across your portfolio
                            for the selected period, including maintenance,
                            utilities, insurance, taxes, and management fees.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center justify-center text-red-600 mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span className="text-xs">
                      +{expenseGrowth}% vs last year
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  {(() => {
                    const totalUnitsForExpense =
                      selectedProperty === "all"
                        ? propertyPerformance.reduce(
                            (sum, p) => sum + (p.units || 0),
                            0
                          )
                        : filteredProperties.reduce(
                            (sum, p) => sum + (p.units || 0),
                            0
                          );

                    const expensePerUnit =
                      totalUnitsForExpense > 0
                        ? filteredTotalExpenses / totalUnitsForExpense
                        : 0;

                    return (
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          Math.round(expensePerUnit),
                          displayCurrency
                        )}
                      </p>
                    );
                  })()}
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                    <span>Expense per Unit</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Average operating expense per rentable unit. Helps
                            you compare cost efficiency across properties and
                            track how much it costs to operate each unit.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {filteredTotalRevenue > 0
                      ? (
                          (filteredTotalExpenses / filteredTotalRevenue) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                    <span>Expense Ratio</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Operating expenses as a percentage of revenue. Lower
                            ratios indicate better profitability and cost
                            control.
                          </p>
                          <p className="text-xs mt-1 italic">
                            Formula: (Total Expenses ÷ Total Revenue) × 100
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-gray-900">Property Financial Performance</CardTitle>
                  <CardDescription className="text-gray-600">
                    Individual property analysis and comparison
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto rounded-b-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Property
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Monthly Revenue
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Occupancy
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Cap Rate
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Cash Flow
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        ROI
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property, index) => (
                      <TableRow
                        key={property.id}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-[#7C3AED]/5 transition-colors`}
                      >
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900">{property.name}</p>
                            <p className="text-sm text-gray-600 font-medium">
                              {property.units} units
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-gray-900">
                            {formatCurrency(
                              property.monthlyRevenue || property.revenue || 0,
                              property.currency || displayCurrency
                            )}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-green-600 h-2.5 rounded-full transition-all"
                                style={{ width: `${property.occupancyRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {property.occupancyRate || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              property.capRate > 7
                                ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            } font-semibold`}
                          >
                            {(property.capRate || 0).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-gray-900">
                            {formatCurrency(
                              property.cashFlow || 0,
                              property.currency || displayCurrency
                            )}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {property.roi > 8 ? (
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-md">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-green-700 font-bold">
                                  {property.roi.toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-md">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <span className="text-red-700 font-bold">
                                  {property.roi.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              property.status === "active"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            } font-semibold capitalize`}
                          >
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
            <Card className="border-gray-200 shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-gray-700" />
                  </div>
                  <CardTitle className="text-gray-900">Performance Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-bold text-green-900">
                        Strong Performance
                      </span>
                    </div>
                    <p className="text-sm text-green-800 font-medium">
                      Your portfolio is generating 12.5% YoY growth with healthy
                      margins above 70%.
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-bold text-blue-900">
                        Occupancy Optimization
                      </span>
                    </div>
                    <p className="text-sm text-blue-800 font-medium">
                      Average occupancy of {averageOccupancy.toFixed(1)}% is
                      above market. Consider strategic rent increases.
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border-2 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-bold text-amber-900">
                        Expense Management
                      </span>
                    </div>
                    <p className="text-sm text-amber-800 font-medium">
                      Maintenance costs are trending up. Consider preventive
                      maintenance programs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-700" />
                  </div>
                  <CardTitle className="text-gray-900">Recommendations</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        Increase rent for underperforming units
                      </p>
                      <p className="text-sm text-gray-700 font-medium mt-1">
                        Units below market rate could generate additional $15K
                        annually
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        Implement energy efficiency upgrades
                      </p>
                      <p className="text-sm text-gray-700 font-medium mt-1">
                        Could reduce utility expenses by 15-20%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                    <div className="w-6 h-6 bg-[#7C3AED] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        Consider property acquisition
                      </p>
                      <p className="text-sm text-gray-700 font-medium mt-1">
                        Strong cash flow supports expansion opportunities
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                    <div className="w-6 h-6 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Review insurance policies</p>
                      <p className="text-sm text-gray-700 font-medium mt-1">
                        Annual review could reduce premiums by 5-10%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-gray-900">Financial Projections</CardTitle>
                  <CardDescription className="text-gray-600">
                    12-month outlook based on current trends
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-green-600 mb-2">
                    {formatCurrency(
                      filteredTotalRevenue * 1.08,
                      displayCurrency
                    )}
                  </p>
                  <p className="text-sm text-gray-700 font-semibold mb-1">
                    Projected Annual Revenue
                  </p>
                  <p className="text-xs text-green-600 font-bold">+8% growth</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    {formatCurrency(
                      filteredTotalNetIncome * 1.12,
                      displayCurrency
                    )}
                  </p>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Projected Net Income</p>
                  <p className="text-xs text-blue-600 font-bold">+12% growth</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-[#7C3AED] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Percent className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-[#7C3AED] mb-2">
                    {(portfolioCapRate + 0.3).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Target Cap Rate</p>
                  <p className="text-xs text-[#7C3AED] font-bold">Optimization goal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
