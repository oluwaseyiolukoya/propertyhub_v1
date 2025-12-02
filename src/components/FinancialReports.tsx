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

        // Colors
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

        let y = margin;

        // Helper: Check page break
        const checkPageBreak = (neededHeight: number) => {
          if (y + neededHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
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

        // Helper: Draw section header
        const drawSectionHeader = (title: string) => {
          checkPageBreak(15);
          doc.setFillColor(...primaryColor);
          doc.rect(margin, y, contentWidth, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(11);
          doc.setFont(fontFamily, "bold");
          doc.text(title, margin + 4, y + 5.5);
          y += 12;
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

          // Header row
          doc.setFillColor(...lightBg);
          doc.rect(margin, currentY, contentWidth, headerHeight, "F");
          doc.setTextColor(...primaryColor);
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

            // Alternating row background
            if (rowIndex % 2 === 1) {
              doc.setFillColor(253, 253, 253);
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
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 35, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(fontFamily, "bold");
        doc.text("Financial Report", margin, 18);

        doc.setFontSize(10);
        doc.setFont(fontFamily, "normal");
        const propertyName =
          selectedProperty === "all"
            ? "All Properties"
            : filteredProperties[0]?.name || selectedProperty;
        doc.text(propertyName, margin, 26);

        // Report metadata on right side
        doc.setFontSize(9);
        doc.text(
          `Generated: ${new Date(generatedAt).toLocaleString()}`,
          pageWidth - margin,
          18,
          { align: "right" }
        );
        doc.text(
          `Period: ${selectedPeriod === "all" ? "All Time" : selectedPeriod}`,
          pageWidth - margin,
          24,
          { align: "right" }
        );
        doc.text(`Currency: ${displayCurrency}`, pageWidth - margin, 30, {
          align: "right",
        });

        y = 45;

        // ==================== KEY METRICS ====================
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont(fontFamily, "bold");
        doc.text("Key Performance Indicators", margin, y);
        y += 8;

        const cardWidth = (contentWidth - 8) / 3;

        // Row 1: Revenue, Expenses, NOI
        drawMetricCard(
          margin,
          y,
          cardWidth,
          "Total Revenue",
          formatCurrencyForPDF(filteredTotalRevenue, displayCurrency),
          revenueGrowth
        );
        drawMetricCard(
          margin + cardWidth + 4,
          y,
          cardWidth,
          "Total Expenses",
          formatCurrencyForPDF(filteredTotalExpenses, displayCurrency),
          expenseGrowth
        );
        drawMetricCard(
          margin + (cardWidth + 4) * 2,
          y,
          cardWidth,
          "Net Operating Income",
          formatCurrencyForPDF(filteredTotalNetIncome, displayCurrency)
        );
        y += 28;

        // Row 2: Cap Rate, Operating Margin, Occupancy
        drawMetricCard(
          margin,
          y,
          cardWidth,
          "Portfolio Cap Rate",
          `${filteredCapRate.toFixed(1)}%`
        );
        drawMetricCard(
          margin + cardWidth + 4,
          y,
          cardWidth,
          "Operating Margin",
          `${filteredOperatingMargin.toFixed(1)}%`
        );
        drawMetricCard(
          margin + (cardWidth + 4) * 2,
          y,
          cardWidth,
          "Average Occupancy",
          `${averageOccupancy.toFixed(1)}%`
        );
        y += 28;

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
          y,
          halfWidth,
          "Total Properties",
          String(totalPropertiesCount)
        );
        drawMetricCard(
          margin + halfWidth + 4,
          y,
          halfWidth,
          "Total Units",
          String(totalUnitsCount)
        );
        y += 32;

        // ==================== MONTHLY TREND ====================
        drawSectionHeader("Revenue vs Expenses Trend");

        if (monthlyRevenueData.length === 0) {
          doc.setTextColor(...secondaryColor);
          doc.setFontSize(10);
          doc.setFont(fontFamily, "normal");
          doc.text(
            "No monthly data available for the selected period.",
            margin,
            y
          );
          y += 10;
        } else {
          const trendHeaders = ["Month", "Revenue", "Expenses", "Net Income"];
          const trendColWidths = [40, 45, 45, 45];
          const trendRows = monthlyRevenueData.map((m) => [
            m.month,
            formatCurrencyForPDF(m.revenue || 0, displayCurrency),
            formatCurrencyForPDF(m.expenses || 0, displayCurrency),
            formatCurrencyForPDF(m.netIncome || 0, displayCurrency),
          ]);
          y = drawTable(trendHeaders, trendRows, trendColWidths, y, [
            "left",
            "right",
            "right",
            "right",
          ]);
        }

        y += 6;

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
            y
          );
          y += 10;
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

          y = drawTable(expenseHeaders, expenseRows, expenseColWidths, y, [
            "left",
            "right",
            "right",
          ]);
        }

        y += 6;

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

          y = drawTable(perfHeaders, perfRows, perfColWidths, y, [
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
              y
            );
            y += 6;
          }
        }

        // ==================== FOOTER ====================
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setDrawColor(...borderColor);
          doc.setLineWidth(0.3);
          doc.line(
            margin,
            pageHeight - 15,
            pageWidth - margin,
            pageHeight - 15
          );

          doc.setTextColor(...secondaryColor);
          doc.setFontSize(8);
          doc.setFont(fontFamily, "normal");
          doc.text("Contrezz Property Management", margin, pageHeight - 10);
          doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth - margin,
            pageHeight - 10,
            {
              align: "right",
            }
          );
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Financial Reports
          </h2>
          <p className="text-gray-600 mt-1">
            Comprehensive financial analytics for your property portfolio
          </p>
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
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => exportReport("csv")}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => exportReport("pdf")}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(filteredTotalRevenue, displayCurrency)}
              </div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />+{revenueGrowth}% vs
                last year
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Net Operating Income
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(filteredTotalNetIncome, displayCurrency)}
              </div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />+{yearOverYearGrowth}%
                vs last year
              </div>
              {filteredTotalExpenses === 0 && filteredTotalRevenue > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No expenses recorded yet. Net Operating Income currently
                  equals total revenue.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  {selectedProperty === "all"
                    ? "Portfolio Cap Rate"
                    : "Property Cap Rate"}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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
                    <p className="text-xs mt-1 text-blue-600">
                      Industry benchmark: 4-10% depending on market and property
                      type.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredCapRate.toFixed(1)}%
              </div>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                {filteredCapRate > 6
                  ? "Above market average"
                  : filteredCapRate > 4
                  ? "Market average"
                  : "Below market average"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Operating Margin
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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
                    <p className="text-xs mt-1 text-green-600">
                      Higher margins indicate better operational efficiency.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredOperatingMargin.toFixed(1)}%
              </div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
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
                <CardTitle className="flex items-center gap-2">
                  Revenue vs Expenses Trend
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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
                <CardDescription>
                  Monthly financial performance over the last 12 months
                </CardDescription>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Expense Breakdown
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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
                <CardDescription>
                  Distribution of operating expenses
                </CardDescription>
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-gray-600">
                        Average Occupancy
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
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
                    <p className="text-2xl font-bold">
                      {averageOccupancy.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {financialData?.occupiedUnits || 0} of{" "}
                      {financialData?.totalUnits || 0} units occupied
                    </p>
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
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-gray-600">
                        Total Properties
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
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
                    <p className="text-2xl font-bold">
                      {financialData?.totalProperties ||
                        propertyPerformanceData.length ||
                        properties.length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Active properties in portfolio
                    </p>
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
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-gray-600">
                        Total Units
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
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
                    <p className="text-2xl font-bold">
                      {financialData?.totalUnits ||
                        propertyPerformance.reduce(
                          (sum, p) => sum + (p.units || 0),
                          0
                        )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {financialData?.vacantUnits || 0} vacant units
                    </p>
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
              <CardTitle className="flex items-center gap-2">
                Revenue Analysis
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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
              <CardDescription>
                Detailed revenue trends and projections
              </CardDescription>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Revenue by Property
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Revenue Metrics
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Monthly Expense Trend
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Expense Categories
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Expense Analysis
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
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
          <Card>
            <CardHeader>
              <CardTitle>Property Financial Performance</CardTitle>
              <CardDescription>
                Individual property analysis and comparison
              </CardDescription>
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
                            <p className="text-sm text-gray-500">
                              {property.units} units
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {formatCurrency(
                              property.monthlyRevenue || property.revenue || 0,
                              property.currency || displayCurrency
                            )}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${property.occupancyRate}%` }}
                              />
                            </div>
                            <span className="text-sm">
                              {property.occupancyRate || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              property.capRate > 7 ? "default" : "secondary"
                            }
                          >
                            {(property.capRate || 0).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {formatCurrency(
                              property.cashFlow || 0,
                              property.currency || displayCurrency
                            )}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {property.roi > 8 ? (
                              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                            )}
                            <span
                              className={
                                property.roi > 8
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {property.roi.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              property.status === "active"
                                ? "default"
                                : "secondary"
                            }
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
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">
                        Strong Performance
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your portfolio is generating 12.5% YoY growth with healthy
                      margins above 70%.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">
                        Occupancy Optimization
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Average occupancy of {averageOccupancy.toFixed(1)}% is
                      above market. Consider strategic rent increases.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-900">
                        Expense Management
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Maintenance costs are trending up. Consider preventive
                      maintenance programs.
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
                      <p className="font-medium">
                        Increase rent for underperforming units
                      </p>
                      <p className="text-sm text-gray-600">
                        Units below market rate could generate additional $15K
                        annually
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">
                        Implement energy efficiency upgrades
                      </p>
                      <p className="text-sm text-gray-600">
                        Could reduce utility expenses by 15-20%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">
                        Consider property acquisition
                      </p>
                      <p className="text-sm text-gray-600">
                        Strong cash flow supports expansion opportunities
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Review insurance policies</p>
                      <p className="text-sm text-gray-600">
                        Annual review could reduce premiums by 5-10%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Projections</CardTitle>
              <CardDescription>
                12-month outlook based on current trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      filteredTotalRevenue * 1.08,
                      displayCurrency
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    Projected Annual Revenue
                  </p>
                  <p className="text-xs text-green-600">+8% growth</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(
                      filteredTotalNetIncome * 1.12,
                      displayCurrency
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Projected Net Income</p>
                  <p className="text-xs text-blue-600">+12% growth</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-600">
                    {(portfolioCapRate + 0.3).toFixed(1)}%
                  </p>
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
