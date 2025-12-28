/**
 * Tax Management Component
 * Implements Nigeria Tax Reform 2026 tax calculator
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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
import {
  Calculator,
  Settings,
  History,
  FileText,
  Download,
  Loader2,
  Info,
  TrendingUp,
  DollarSign,
  Percent,
  Receipt,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  calculateTax,
  getTaxSettings,
  updateTaxSettings,
  getTaxHistory,
  getTaxCalculation,
  finalizeTaxCalculation,
  deleteTaxCalculation,
  autoFetchTaxData,
  type TaxCalculationInput,
  type TaxCalculationResult,
  type TaxSettings,
  type TaxCalculation,
} from "../lib/api/tax";
import { getProperties } from "../lib/api/properties";
import { formatCurrency } from "../lib/currency";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface TaxManagementProps {
  user: any;
  properties?: any[];
}

export const TaxManagement: React.FC<TaxManagementProps> = ({
  user,
  properties: propsFromParent,
}) => {
  const [activeTab, setActiveTab] = useState("calculator");
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [properties, setProperties] = useState<any[]>(propsFromParent || []);
  const [taxHistory, setTaxHistory] = useState<TaxCalculation[]>([]);
  const [selectedCalculation, setSelectedCalculation] =
    useState<TaxCalculation | null>(null);

  // Tax calculation form state
  const [formData, setFormData] = useState<TaxCalculationInput>({
    taxYear: new Date().getFullYear(),
    otherDeductions: 0,
  });

  // Expense breakdown state (for showing which expenses are included)
  const [expenseBreakdown, setExpenseBreakdown] = useState<
    Array<{ category: string; amount: number }>
  >([]);

  // Revenue and expenses summary (for display)
  const [propertyRevenue, setPropertyRevenue] = useState<number>(0);
  const [propertyExpenses, setPropertyExpenses] = useState<number>(0);

  // Collapsible sections state
  const [isStampDutyExpanded, setIsStampDutyExpanded] = useState(false);
  const [isLandUseChargeExpanded, setIsLandUseChargeExpanded] = useState(false);

  // Tax settings state
  const [settings, setSettings] = useState<TaxSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<TaxSettings>>({});

  // Calculation result
  const [calculationResult, setCalculationResult] =
    useState<TaxCalculationResult | null>(null);
  const [savedCalculationId, setSavedCalculationId] = useState<string | null>(
    null
  );

  // Load properties if not provided
  useEffect(() => {
    if (!propsFromParent || propsFromParent.length === 0) {
      loadProperties();
    }
  }, []);

  // Load tax settings
  useEffect(() => {
    loadTaxSettings();
    loadTaxHistory();
  }, []);

  // Auto-fetch tax data when property or tax year changes
  useEffect(() => {
    // Reset revenue and expenses when property or year changes
    setPropertyRevenue(0);
    setPropertyExpenses(0);
    setExpenseBreakdown([]);
    // Clear calculation result when property or year changes
    setCalculationResult(null);
    setSavedCalculationId(null);

    if (formData.taxYear && formData.propertyId) {
      autoFetchTaxData({
        taxYear: formData.taxYear,
        propertyId: formData.propertyId,
      })
        .then((response) => {
          console.log('[Tax Calculator] Auto-fetch response (full):', JSON.stringify(response, null, 2));
          console.log('[Tax Calculator] Response structure check:', {
            hasData: !!response.data,
            hasSuccess: !!response.data?.success,
            hasDataData: !!response.data?.data,
            responseData: response.data,
          });

          if (response.data?.success && response.data.data) {
            const autoData = response.data.data;
            console.log('[Tax Calculator] Auto-fetched data:', autoData);
            console.log('[Tax Calculator] Data values:', {
              rentalIncome: autoData.rentalIncome,
              otherDeductions: autoData.otherDeductions,
              expenseBreakdown: autoData.expenseBreakdown,
            });

            setFormData((prev) => ({
              ...prev,
              // Revenue and expenses from financial reports
              otherDeductions: autoData.otherDeductions || prev.otherDeductions || 0,
              propertyPurchasePrice: autoData.propertyPurchasePrice || prev.propertyPurchasePrice,
              propertySalePrice: autoData.propertySalePrice || prev.propertySalePrice,
            }));

            // Store revenue and expenses for display
            const revenue = autoData.rentalIncome || 0;
            const expenses = autoData.otherDeductions || 0;
            console.log('[Tax Calculator] Setting revenue:', revenue, 'expenses:', expenses);
            console.log('[Tax Calculator] Revenue type:', typeof revenue, 'Expenses type:', typeof expenses);

            setPropertyRevenue(revenue);
            setPropertyExpenses(expenses);

            // Store expense breakdown for display
            if (autoData.expenseBreakdown) {
              setExpenseBreakdown(autoData.expenseBreakdown);
            } else {
              setExpenseBreakdown([]);
            }
          } else {
            console.warn('[Tax Calculator] Auto-fetch response missing data:', response);
            console.warn('[Tax Calculator] Response check failed:', {
              responseData: response.data,
              hasSuccess: response.data?.success,
              hasData: response.data?.data,
            });
          }
        })
        .catch((error) => {
          // Log error for debugging
          console.error('[Tax Calculator] Auto-fetch tax data failed:', error);
          console.error('[Tax Calculator] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          // Reset to 0 if fetch fails
          setPropertyRevenue(0);
          setPropertyExpenses(0);
          setExpenseBreakdown([]);
        });
    }
  }, [formData.propertyId, formData.taxYear]);

  // Clear calculation result when form values that affect calculation change
  useEffect(() => {
    // Clear result when any calculation inputs change
    // This ensures user sees fresh calculation when they adjust values
    if (calculationResult) {
      setCalculationResult(null);
      setSavedCalculationId(null);
    }
  }, [
    formData.otherDeductions,
    formData.propertyPurchasePrice,
    formData.propertySalePrice,
    formData.stampDutyValue,
    formData.stampDutyType,
    formData.leaseDuration,
    formData.lucState,
    formData.lucUsageType,
    formData.lucPaymentDate,
    // Any other fields that affect tax calculation
  ]);

  const loadProperties = async () => {
    try {
      const response = await getProperties();
      if (response.data) {
        setProperties(response.data);
      }
    } catch (error: any) {
      console.error("Failed to load properties:", error);
    }
  };

  const loadTaxSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await getTaxSettings();
      if (response.data?.settings) {
        setSettings(response.data.settings);
        setSettingsForm({
          taxpayerType: response.data.settings.taxpayerType,
          taxIdentificationNumber:
            response.data.settings.taxIdentificationNumber || "",
          // annualRentPaid removed - not used in property-specific calculations
          defaultTaxYear: response.data.settings.defaultTaxYear,
          currency: response.data.settings.currency,
        });
      }
    } catch (error: any) {
      console.error("Failed to load tax settings:", error);
      if (error.response?.status === 403) {
        toast.error(
          "Tax Calculator is not available in your current plan. Please upgrade to Professional or Business plan."
        );
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadTaxHistory = async () => {
    setLoading(true);
    try {
      const response = await getTaxHistory({ limit: 50 });
      if (response.data) {
        setTaxHistory(response.data.calculations);
      }
    } catch (error: any) {
      console.error("Failed to load tax history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!formData.taxYear) {
      toast.error("Please select a tax year");
      return;
    }
    if (!formData.propertyId) {
      toast.error("Please select a property");
      return;
    }

    setCalculating(true);
    try {
      // Log the form data being sent to ensure we're using latest values
      console.log('[Tax Calculator] Calculating with form data:', {
        taxYear: formData.taxYear,
        propertyId: formData.propertyId,
        rentalIncome: propertyRevenue, // Use auto-fetched revenue
        otherDeductions: formData.otherDeductions,
        propertyRevenue: propertyRevenue,
        propertyExpenses: propertyExpenses,
        stampDutyValue: formData.stampDutyValue,
        stampDutyType: formData.stampDutyType,
        leaseDuration: formData.leaseDuration,
        lucState: formData.lucState,
        lucUsageType: formData.lucUsageType,
        lucPaymentDate: formData.lucPaymentDate,
      });

      // Include rentalIncome from auto-fetched propertyRevenue
      const response = await calculateTax({
        ...formData,
        rentalIncome: propertyRevenue, // Use auto-fetched revenue (cash basis from payment transactions)
      });
      if (response.data?.success && response.data.calculation) {
        setCalculationResult(response.data.calculation);
        setSavedCalculationId(response.data.calculation.id);
        toast.success("Tax calculation completed successfully");
        loadTaxHistory(); // Refresh history
      } else {
        throw new Error("Calculation failed");
      }
    } catch (error: any) {
      console.error("Tax calculation error:", error);
      toast.error(
        error.response?.data?.error ||
          "Failed to calculate tax. Please check your inputs."
      );
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await updateTaxSettings(settingsForm);
      if (response.data?.success) {
        setSettings(response.data.settings);
        toast.success("Tax settings updated successfully");
      }
    } catch (error: any) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update tax settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleViewCalculation = async (id: string) => {
    try {
      const response = await getTaxCalculation(id);
      if (response.data?.calculation) {
        setSelectedCalculation(response.data.calculation);
        setActiveTab("history");
      }
    } catch (error: any) {
      console.error("Failed to load calculation:", error);
      toast.error("Failed to load calculation details");
    }
  };

  const handleFinalize = async (id: string) => {
    try {
      const response = await finalizeTaxCalculation(id);
      if (response.data?.success) {
        toast.success("Calculation finalized successfully");
        loadTaxHistory();
        if (selectedCalculation?.id === id) {
          setSelectedCalculation(response.data.calculation);
        }
      }
    } catch (error: any) {
      console.error("Failed to finalize:", error);
      toast.error("Failed to finalize calculation");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this calculation?")) {
      return;
    }

    try {
      const response = await deleteTaxCalculation(id);
      if (response.data?.success) {
        toast.success("Calculation deleted successfully");
        loadTaxHistory();
        if (selectedCalculation?.id === id) {
          setSelectedCalculation(null);
        }
      }
    } catch (error: any) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete calculation");
    }
  };

  const handleExportCalculation = async (calc: TaxCalculation) => {
    try {
      toast.info("Generating tax report...");

      // Fetch full calculation details with breakdown
      let calculation = calc;
      if (!calculation.taxBreakdown) {
        const response = await getTaxCalculation(calc.id);
        if (response.data?.calculation) {
          calculation = response.data.calculation;
        }
      }

      // Helper function to format numbers for PDF (with NGN prefix, no special symbols)
      const formatNumberForPDF = (amount: number | null | undefined): string => {
        if (amount === null || amount === undefined || isNaN(amount)) return "NGN 0.00";
        const formatted = amount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `NGN ${formatted}`;
      };

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "pt", "a4");

      // Brand Colors
      const primaryPurple = [124, 58, 237]; // #7C3AED
      const darkPurple = [91, 33, 182]; // #5B21B6
      const textDark = [17, 24, 39]; // #111827
      const textGray = [107, 114, 128]; // #6B7280
      const lightGray = [249, 250, 251]; // #F9FAFB

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      // ==================== HEADER SECTION ====================
      // Header background
      pdf.setFillColor(...primaryPurple);
      pdf.rect(0, 0, pageWidth, 100, "F");

      // Dark purple accent bar
      pdf.setFillColor(...darkPurple);
      pdf.rect(0, 95, pageWidth, 5, "F");

      // Company name
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.text("CONTREZZ", margin, 30);

      // Subtitle
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text("Property Management System", margin, 45);

      // Report title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("Tax Calculation Report", margin, 65);

      // Report number and dates (right side)
      const rightX = pageWidth - margin;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`Report #: ${calculation.id.substring(0, 8).toUpperCase()}`, rightX, 30, { align: "right" });
      pdf.text(`Date of Issue: ${new Date(calculation.calculationDate || calculation.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, rightX, 45, { align: "right" });
      pdf.text(`Tax Year: ${calculation.taxYear}`, rightX, 60, { align: "right" });
      pdf.text(`Status: ${calculation.isFinalized ? "Finalized" : "Draft"}`, rightX, 75, { align: "right" });

      yPos = 120;

      // ==================== PROPERTY INFORMATION ====================
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...textDark);
      pdf.text("Property Information", margin, yPos);
      yPos += 5;

      // Property info box
      pdf.setFillColor(...lightGray);
      pdf.rect(margin, yPos, contentWidth, 40, "F");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...textGray);
      pdf.text(`Property: ${calculation.properties?.name || "Portfolio"}`, margin + 10, yPos + 12);
      pdf.text(`Property ID: ${calculation.propertyId || "N/A"}`, margin + 10, yPos + 25);
      if (calculation.properties?.address) {
        pdf.text(`Address: ${calculation.properties.address}`, margin + 10, yPos + 38);
      }

      yPos += 55;

      // ==================== INCOME BREAKDOWN ====================
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...textDark);
      pdf.text("Income Breakdown", margin, yPos);
      yPos += 20;

      // Table header
      pdf.setFillColor(...primaryPurple);
      pdf.rect(margin, yPos, contentWidth, 25, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Description", margin + 10, yPos + 16);
      pdf.text("Amount", rightX - 10, yPos + 16, { align: "right" });
      yPos += 25;

      // Income items
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...textDark);
      const incomeItems = [
        { desc: "Total Rental Income", amount: calculation.totalRentalIncome || 0 },
        { desc: "Other Income", amount: calculation.otherIncome || 0 },
      ];

      incomeItems.forEach((item, idx) => {
        if (yPos > pageHeight - 100) {
          pdf.addPage();
          yPos = margin;
        }
        if (idx % 2 === 0) {
          pdf.setFillColor(255, 255, 255);
        } else {
          pdf.setFillColor(...lightGray);
        }
        pdf.rect(margin, yPos, contentWidth, 20, "F");
        pdf.text(item.desc, margin + 10, yPos + 14);
        pdf.text(formatNumberForPDF(item.amount), rightX - 10, yPos + 14, { align: "right" });
        yPos += 20;
      });

      // Total Income
      pdf.setFillColor(...darkPurple);
      pdf.rect(margin, yPos, contentWidth, 25, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Total Income", margin + 10, yPos + 16);
      pdf.text(formatNumberForPDF(calculation.totalIncome || 0), rightX - 10, yPos + 16, { align: "right" });
      yPos += 35;

      // ==================== DEDUCTIONS BREAKDOWN ====================
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...textDark);
      pdf.text("Deductions Breakdown", margin, yPos);
      yPos += 20;

      // Table header
      pdf.setFillColor(...primaryPurple);
      pdf.rect(margin, yPos, contentWidth, 25, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Description", margin + 10, yPos + 16);
      pdf.text("Amount", rightX - 10, yPos + 16, { align: "right" });
      yPos += 25;

      // Deduction items
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...textDark);
      const deductionItems = [
        { desc: "Property Expenses (Deductions)", amount: calculation.otherDeductions || 0 },
        { desc: "Rent Relief", amount: calculation.rentRelief || 0 },
      ];

      deductionItems.forEach((item, idx) => {
        if (yPos > pageHeight - 100) {
          pdf.addPage();
          yPos = margin;
        }
        if (idx % 2 === 0) {
          pdf.setFillColor(255, 255, 255);
        } else {
          pdf.setFillColor(...lightGray);
        }
        pdf.rect(margin, yPos, contentWidth, 20, "F");
        pdf.text(item.desc, margin + 10, yPos + 14);
        pdf.text(formatNumberForPDF(item.amount), rightX - 10, yPos + 14, { align: "right" });
        yPos += 20;
      });

      // Total Deductions
      pdf.setFillColor(...darkPurple);
      pdf.rect(margin, yPos, contentWidth, 25, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Total Deductions", margin + 10, yPos + 16);
      pdf.text(formatNumberForPDF(calculation.totalDeductions || 0), rightX - 10, yPos + 16, { align: "right" });
      yPos += 35;

      // ==================== TAXABLE INCOME ====================
      pdf.setFillColor(...lightGray);
      pdf.rect(margin, yPos, contentWidth, 30, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...textDark);
      pdf.text("Net Taxable Income", margin + 10, yPos + 20);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(formatNumberForPDF(calculation.taxableIncome || 0), rightX - 10, yPos + 20, { align: "right" });
      yPos += 45;

      // ==================== TAX BREAKDOWN ====================
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...textDark);
      pdf.text("Tax Calculation Breakdown", margin, yPos);
      yPos += 20;

      // Table header
      pdf.setFillColor(...primaryPurple);
      pdf.rect(margin, yPos, contentWidth, 25, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Tax Type", margin + 10, yPos + 16);
      pdf.text("Amount", rightX - 10, yPos + 16, { align: "right" });
      yPos += 25;

      // Tax items
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...textDark);
      const taxItems = [
        { desc: "Personal Income Tax (PIT)", amount: calculation.personalIncomeTax || 0 },
        { desc: "Withholding Tax (WHT) - 10%", amount: calculation.withholdingTax || 0 },
      ];

      // Add optional taxes if > 0
      if ((calculation as any).capitalGainsTax > 0) {
        taxItems.push({ desc: "Capital Gains Tax", amount: (calculation as any).capitalGainsTax });
      }
      if ((calculation as any).propertyTaxes > 0) {
        taxItems.push({ desc: "Property Taxes", amount: (calculation as any).propertyTaxes });
      }
      if ((calculation as any).stampDuty > 0) {
        taxItems.push({ desc: "Stamp Duty", amount: (calculation as any).stampDuty });
      }
      if ((calculation as any).landUseCharge > 0) {
        taxItems.push({ desc: "Land Use Charge", amount: (calculation as any).landUseCharge });
      }

      taxItems.forEach((item, idx) => {
        if (yPos > pageHeight - 100) {
          pdf.addPage();
          yPos = margin;
        }
        if (idx % 2 === 0) {
          pdf.setFillColor(255, 255, 255);
        } else {
          pdf.setFillColor(...lightGray);
        }
        pdf.rect(margin, yPos, contentWidth, 20, "F");
        pdf.text(item.desc, margin + 10, yPos + 14);
        pdf.text(formatNumberForPDF(item.amount), rightX - 10, yPos + 14, { align: "right" });
        yPos += 20;
      });

      // Total Tax Liability
      pdf.setFillColor(...darkPurple);
      pdf.rect(margin, yPos, contentWidth, 30, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Total Tax Liability", margin + 10, yPos + 20);
      pdf.setFontSize(14);
      pdf.text(formatNumberForPDF(calculation.totalTaxLiability || 0), rightX - 10, yPos + 20, { align: "right" });
      yPos += 45;

      // ==================== TAX BRACKET BREAKDOWN ====================
      if (calculation.taxBreakdown?.taxBrackets && calculation.taxBreakdown.taxBrackets.length > 0) {
        if (yPos > pageHeight - 150) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(...textDark);
        pdf.text("Personal Income Tax - Bracket Breakdown", margin, yPos);
        yPos += 20;

        // Table header
        pdf.setFillColor(...primaryPurple);
        pdf.rect(margin, yPos, contentWidth, 25, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.text("Bracket", margin + 10, yPos + 16);
        pdf.text("Income", margin + contentWidth * 0.4, yPos + 16);
        pdf.text("Rate", margin + contentWidth * 0.65, yPos + 16);
        pdf.text("Tax", rightX - 10, yPos + 16, { align: "right" });
        yPos += 25;

        // Bracket items
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...textDark);
        calculation.taxBreakdown.taxBrackets.forEach((bracket: any, idx: number) => {
          if (yPos > pageHeight - 100) {
            pdf.addPage();
            yPos = margin;
          }
          if (idx % 2 === 0) {
            pdf.setFillColor(255, 255, 255);
          } else {
            pdf.setFillColor(...lightGray);
          }
          pdf.rect(margin, yPos, contentWidth, 18, "F");
          pdf.text(bracket.bracket, margin + 10, yPos + 12);
          pdf.text(formatNumberForPDF(bracket.income), margin + contentWidth * 0.4, yPos + 12);
          pdf.text(`${bracket.rate}%`, margin + contentWidth * 0.65, yPos + 12);
          pdf.text(formatNumberForPDF(bracket.tax), rightX - 10, yPos + 12, { align: "right" });
          yPos += 18;
        });
        yPos += 20;
      }

      // ==================== FOOTER ====================
      const footerY = pageHeight - 40;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...textGray);
      pdf.text(
        "This is an estimate for tax planning purposes. Please verify all calculations with a qualified tax professional before filing.",
        margin,
        footerY,
        { maxWidth: contentWidth }
      );
      pdf.text(
        `Page 1 of 1 | Generated: ${new Date().toLocaleString()}`,
        rightX,
        footerY + 15,
        { align: "right" }
      );

      // ==================== SAVE PDF ====================
      const propertyName = (calculation.properties?.name || "portfolio").replace(/[^a-z0-9]/gi, "-").toLowerCase();
      const fileName = `tax-calculation-${calculation.taxYear}-${propertyName}-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      toast.success("Tax report exported successfully");
    } catch (error: any) {
      console.error("Failed to export calculation:", error);
      toast.error("Failed to export tax report");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Calculator</h1>
          <p className="text-gray-500 mt-1">
            Calculate your tax obligations under Nigeria Tax Reform 2026
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                <strong className="text-purple-700">Nigeria Tax Reform 2026:</strong> This calculator
                implements the new progressive tax structure effective January 1,
                2026. Tax calculations are estimates and should be verified with a
                tax professional.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger
            value="calculator"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculator
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Auto-fetch Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      Automatic Data Fetching
                    </h4>
                    <p className="text-xs text-blue-700">
                      <strong>Rental Income</strong> is automatically calculated from your active leases for the selected property.
                      <strong> Property Expenses</strong> (maintenance, repairs, etc.) are auto-calculated from your expense records.
                      <strong> Property prices</strong> are auto-fetched for capital gains calculations.
                      Tax is calculated on: <strong>Rental Income - Property Expenses = Net Taxable Income</strong>
                    </p>
                  </div>
                </div>
              </div>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg">
                      <Calculator className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Property Tax Calculator</CardTitle>
                      <CardDescription>
                        Calculate tax owed to the tax office for this property (Rental Income - Expenses)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tax Year */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="taxYear">Tax Year *</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Select the tax year for which you want to calculate taxes. Revenue and expenses will be filtered based on payment dates within this year.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select
                      value={formData.taxYear?.toString() || new Date().getFullYear().toString()}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          taxYear: parseInt(value) || new Date().getFullYear(),
                        })
                      }
                    >
                      <SelectTrigger id="taxYear">
                        <SelectValue placeholder="Select tax year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 7 }, (_, i) => {
                          const year = 2026 - i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the tax year for calculation (2020 - 2026)
                    </p>
                  </div>

                  {/* Property Selection */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="propertyId">Property *</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Select the property for tax calculation. Revenue will be calculated from actual payment transactions, and expenses will be fetched from your expense records for this property.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select
                      value={formData.propertyId || ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          propertyId: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((prop) => (
                          <SelectItem key={prop.id} value={prop.id}>
                            {prop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select a property for tax calculation
                    </p>
                  </div>

                  {/* Revenue and Expenses Summary */}
                  {formData.propertyId && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Label className="text-base font-semibold">
                          Property Financial Summary ({formData.taxYear})
                          <span className="ml-2 text-xs text-green-600 font-normal">
                            (Auto-fetched from financial reports)
                          </span>
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Revenue is calculated from actual payment transactions (cash basis) for the selected tax year. Expenses are fetched from your expense records based on payment dates. These values are used to calculate your taxable income.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Revenue */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="p-4 bg-green-50 border border-green-200 rounded-lg cursor-help">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
                                    <p className="text-2xl font-bold text-green-700">
                                      {formatCurrency(propertyRevenue, "NGN")}
                                    </p>
                                  </div>
                                  <TrendingUp className="h-8 w-8 text-green-600" />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  From payment transactions for {formData.taxYear}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Total revenue from actual rent payments received in {formData.taxYear}. Calculated from payment transactions with status "completed" or "success" and paid within the selected tax year (cash basis accounting).</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Expenses */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="p-4 bg-red-50 border border-red-200 rounded-lg cursor-help">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
                                    <p className="text-2xl font-bold text-red-700">
                                      {formatCurrency(propertyExpenses, "NGN")}
                                    </p>
                                  </div>
                                  <Receipt className="h-8 w-8 text-red-600" />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Deductions for {formData.taxYear}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Total expenses paid in {formData.taxYear} for this property. Includes all expenses with status "paid" or "pending" and paid within the tax year. Property Tax category is excluded as it's calculated separately.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Net Income */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-help">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Net Taxable Income</p>
                                  <p className="text-xl font-bold text-blue-700">
                                    {formatCurrency(
                                      Math.max(0, propertyRevenue - propertyExpenses),
                                      "NGN"
                                    )}
                                  </p>
                                </div>
                                <DollarSign className="h-6 w-6 text-blue-600" />
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Revenue - Expenses = {formatCurrency(propertyRevenue, "NGN")} - {formatCurrency(propertyExpenses, "NGN")}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Net taxable income is calculated as Total Revenue minus Total Expenses. This is the amount on which your Personal Income Tax will be calculated using the progressive tax brackets (NTA 2025).</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}

                  {/* Property Expenses (Deductions) - Auto-fetched */}
                  {formData.propertyId && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-semibold">
                          Property Expenses (Deductions)
                          <span className="ml-2 text-xs text-green-600 font-normal">
                            (Auto-fetched from expenses)
                          </span>
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Expenses are automatically fetched from your expense records. Only expenses with status "paid" or "pending" and paid within the selected tax year are included. Property Tax category is excluded as it's calculated separately.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Expense Breakdown */}
                      {expenseBreakdown.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-700">
                            Expense Breakdown (by Category)
                          </p>
                          <p className="text-xs text-gray-500">
                            Excludes: Property Tax (shown separately)
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          {expenseBreakdown.map((exp, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-xs"
                            >
                              <span className="text-gray-600 capitalize">
                                {exp.category}
                              </span>
                              <span className="font-medium text-gray-900">
                                {formatCurrency(exp.amount, "NGN")}
                              </span>
                            </div>
                          ))}
                          <div className="pt-1.5 border-t border-gray-300 flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-900">
                              Total Deductions
                            </span>
                            <span className="text-xs font-bold text-gray-900">
                              {formatCurrency(
                                expenseBreakdown.reduce(
                                  (sum, exp) => sum + exp.amount,
                                  0
                                ),
                                "NGN"
                              )}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                          <strong>Note:</strong> This includes all expenses with status "paid" or "pending"
                          for the selected property and year, excluding "Property Tax" category
                          (which is calculated separately).
                        </p>
                      </div>
                    )}

                      {expenseBreakdown.length === 0 && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-blue-800">
                              <strong>No expenses recorded</strong> for this property in {formData.taxYear}.
                              <br />
                              Expenses are automatically included when recorded in the <strong>Expenses section</strong>.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}


                  {/* Stamp Duty Section (NTA 2025) */}
                  {formData.propertyId && (
                    <div className="border-t pt-4 mt-4">
                      <button
                        type="button"
                        onClick={() => setIsStampDutyExpanded(!isStampDutyExpanded)}
                        className="flex items-center justify-between w-full gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold cursor-pointer">
                            Stamp Duty (Optional)
                            <span className="ml-2 text-xs text-gray-500 font-normal">
                              (NTA 2025)
                            </span>
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Stamp duty is required to legalize lease and sale agreements. Exempt if value is less than ₦10 million. Rates: Sales 0.78%, Short-term leases (&lt;7 years) 0.78%, Long-term leases (8-21 years) 3%.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {isStampDutyExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      {isStampDutyExpanded && (
                        <div className="mt-2">
                          <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="stampDutyType">Agreement Type</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Select whether this is a lease agreement or sale agreement. Different rates apply based on the agreement type.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Select
                            value={formData.stampDutyType || ""}
                            onValueChange={(value: 'lease' | 'sale') =>
                              setFormData({
                                ...formData,
                                stampDutyType: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lease">Lease Agreement</SelectItem>
                              <SelectItem value="sale">Sale Agreement</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="stampDutyValue">
                              {formData.stampDutyType === 'lease' ? 'Annual Rent Value (₦)' : 'Property Value (₦)'}
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>{formData.stampDutyType === 'lease'
                                    ? 'Enter the annual rent value for the lease agreement. This will be multiplied by lease duration for long-term leases.'
                                    : 'Enter the total property value for the sale agreement. Stamp duty is calculated as 0.78% of this value.'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            id="stampDutyValue"
                            type="number"
                            value={formData.stampDutyValue || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                stampDutyValue: e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              })
                            }
                            min={0}
                            placeholder="Enter value"
                          />
                        </div>
                      </div>
                      {formData.stampDutyType === 'lease' && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="leaseDuration">Lease Duration (Years)</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Enter the duration of the lease in years. Short-term leases (&lt;7 years) are charged 0.78%, while long-term leases (8-21 years) are charged 3% of the total lease value (annual rent × duration).</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            id="leaseDuration"
                            type="number"
                            value={formData.leaseDuration || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                leaseDuration: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              })
                            }
                            min={1}
                            max={21}
                            placeholder="Enter lease duration"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Short-term (&lt; 7 years): 0.78% | Long-term (8-21 years): 3%
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Exempt if value &lt; ₦10 million. Sales: 0.78% of property value.
                      </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Land Use Charge Section (NTA 2025) */}
                  {formData.propertyId && (
                    <div className="border-t pt-4 mt-4">
                      <button
                        type="button"
                        onClick={() => setIsLandUseChargeExpanded(!isLandUseChargeExpanded)}
                        className="flex items-center justify-between w-full gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold cursor-pointer">
                            Land Use Charge (Optional)
                            <span className="ml-2 text-xs text-gray-500 font-normal">
                              (NTA 2025 - State-specific)
                            </span>
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Land Use Charge is a state-specific property tax. Rates vary by state and usage type. Owner-occupied residential properties typically have lower rates than rented or commercial properties. Early payment (within 30 days of fiscal year) qualifies for a 15% discount.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {isLandUseChargeExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      {isLandUseChargeExpanded && (
                        <div className="mt-2">
                          <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="lucState">State</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Enter the state where the property is located. Land Use Charge rates vary by state and Local Government Area (LGA). Example: Lagos, Oyo, Abuja.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            id="lucState"
                            type="text"
                            value={formData.lucState || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                lucState: e.target.value || undefined,
                              })
                            }
                            placeholder="e.g., Lagos, Oyo"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="lucUsageType">Usage Type</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Select how the property is used. Owner-occupied residential properties typically have the lowest rates, while commercial properties have the highest rates.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Select
                            value={formData.lucUsageType || ""}
                            onValueChange={(value: 'owner_occupied' | 'rented_residential' | 'commercial') =>
                              setFormData({
                                ...formData,
                                lucUsageType: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select usage type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner_occupied">Owner-Occupied Residential</SelectItem>
                              <SelectItem value="rented_residential">Rented Residential</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="lucPaymentDate">Payment Date (for early payment discount)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Enter the date you plan to pay the Land Use Charge. If paid within the first 30 days of the fiscal year (January 1-30), you qualify for a 15% discount on the total amount.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id="lucPaymentDate"
                          type="date"
                          value={formData.lucPaymentDate || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lucPaymentDate: e.target.value || undefined,
                            })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          15% discount if paid within first 30 days of fiscal year
                        </p>
                      </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleCalculate}
                    disabled={calculating || !formData.taxYear || !formData.propertyId}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0 shadow-lg"
                  >
                    {calculating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate Tax
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-1">
              {calculationResult ? (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg">
                        <Receipt className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Tax Calculation Results</CardTitle>
                        <CardDescription>Tax Year {formData.taxYear}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Total Tax Liability */}
                    <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium text-gray-900 cursor-help">
                                Total Tax Liability
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                The total amount of tax you owe to the tax office. This includes Personal Income Tax (PIT) and Withholding Tax (WHT). PIT is calculated on your net taxable income (rental income minus expenses) using progressive tax brackets. WHT is 10% of your total rental income, deducted at source.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-2xl font-bold text-red-600">
                          {formatCurrency(
                            calculationResult.totalTaxLiability,
                            "NGN"
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Income Breakdown */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Property Income</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-gray-600 cursor-help">Rental Income:</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>
                                  The total rental income received from tenants for this property during the tax year. This is calculated from actual payment transactions (cash basis accounting) - only successful rent payments with paid dates within the selected tax year are included.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="font-medium">
                            {formatCurrency(
                              calculationResult.totalRentalIncome,
                              "NGN"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">Total Rental Income:</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>
                                  The sum of all rental income received for this property in the tax year. This is the gross amount before any deductions or taxes are applied. Used as the base for calculating Withholding Tax (10%).
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span>
                            {formatCurrency(calculationResult.totalRentalIncome, "NGN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Property Expenses (Deductions)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-gray-600 cursor-help">Property Expenses:</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>
                                  Allowable expenses that reduce your taxable income. Includes maintenance, repairs, management fees, insurance, and other property-related costs paid during the tax year. These expenses are automatically fetched from your Expenses page for the selected property and tax year.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="font-medium text-green-600">
                            -{formatCurrency(
                              calculationResult.otherDeductions,
                              "NGN"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">Total Deductions:</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>
                                  The total amount of all allowable property expenses that can be deducted from your rental income. This reduces your taxable income, which in turn reduces your Personal Income Tax liability. Property Tax expenses are excluded from this calculation as they are shown separately.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="text-green-600">
                            -{formatCurrency(
                              calculationResult.totalDeductions,
                              "NGN"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Taxable Income */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium cursor-help">Taxable Income:</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                Your net taxable income after deducting property expenses from rental income. Formula: Rental Income - Property Expenses. This is the amount used to calculate Personal Income Tax using progressive tax brackets. If expenses exceed income, taxable income is set to ₦0.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-lg font-bold">
                          {formatCurrency(
                            calculationResult.taxableIncome,
                            "NGN"
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Tax Breakdown */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Tax Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-gray-600 cursor-help">Personal Income Tax:</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>
                                  Tax calculated on your net taxable income using progressive tax brackets (NTA 2025). First ₦800,000 is tax-free (0%), then 15% on next ₦2,200,000, 18% on next ₦9,000,000, and higher rates for larger incomes. This tax is based on your profit (rental income minus expenses), not your gross income.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="font-medium">
                            {formatCurrency(
                              calculationResult.personalIncomeTax,
                              "NGN"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-gray-600 cursor-help">Withholding Tax (10%):</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>
                                  A flat 10% tax on your total rental income, calculated separately from Personal Income Tax. This tax is typically deducted at source by tenants or property managers when rent is paid. It's calculated on your gross rental income (before expenses), not your net taxable income. Both PIT and WHT must be paid.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="font-medium">
                            {formatCurrency(
                              calculationResult.withholdingTax,
                              "NGN"
                            )}
                          </span>
                        </div>
                        {calculationResult.capitalGainsTax > 0 && (
                          <div className="flex justify-between">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-gray-600 cursor-help">Capital Gains Tax:</span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>
                                    Tax on the profit from selling a property. Calculated as: (Sale Price - Purchase Price - Improvements - Disposal Costs) × Tax Rate. For individuals, uses progressive rates (15-25%). For companies, flat 30%. Primary residence is exempt (0%). Currently not applicable for rental income calculations.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="font-medium">
                              {formatCurrency(
                                calculationResult.capitalGainsTax,
                                "NGN"
                              )}
                            </span>
                          </div>
                        )}
                        {(calculationResult.stampDuty || 0) > 0 && (
                          <div className="flex justify-between">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-gray-600 cursor-help">Stamp Duty:</span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>
                                    Tax on lease and sale agreements (NTA 2025). For sales: Property Value × 0.78%. For leases: (Annual Rent × Duration) × 0.78% (short-term) or 3% (long-term). Properties under ₦10 million are exempt. Currently not applicable for rental income calculations.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="font-medium">
                              {formatCurrency(
                                calculationResult.stampDuty || 0,
                                "NGN"
                              )}
                            </span>
                          </div>
                        )}
                        {(calculationResult.landUseCharge || 0) > 0 && (
                          <div className="flex justify-between">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-gray-600 cursor-help">Land Use Charge:</span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>
                                    State-specific property tax (NTA 2025). Calculated based on property value, usage type (residential/commercial), and state regulations. Rates vary by state. This is separate from Personal Income Tax and Withholding Tax. Currently not applicable for rental income calculations.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="font-medium">
                              {formatCurrency(
                                calculationResult.landUseCharge || 0,
                                "NGN"
                              )}
                            </span>
                          </div>
                        )}
                        {calculationResult.propertyTaxes > 0 && (
                          <div className="flex justify-between">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-gray-600 cursor-help">Property Taxes:</span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>
                                    Property taxes paid during the tax year, such as Land Use Charge or other local property taxes. These are fetched from your Expenses page where expenses are categorized as "Property Tax". This is shown separately from other deductions and is included in your total tax liability.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="font-medium">
                              {formatCurrency(
                                calculationResult.propertyTaxes,
                                "NGN"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tax Brackets */}
                    {calculationResult.breakdown.taxBrackets.length > 0 && (
                      <div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h4 className="text-sm font-semibold mb-2 cursor-help">
                                Tax Bracket Breakdown
                              </h4>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                Detailed breakdown showing how your Personal Income Tax is calculated across different income brackets. Nigeria uses progressive tax rates (NTA 2025), meaning different portions of your income are taxed at different rates. The first ₦800,000 is tax-free, then rates increase for higher income levels.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="space-y-1 text-xs">
                          {calculationResult.breakdown.taxBrackets.map(
                            (bracket, idx) => (
                              <TooltipProvider key={idx}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex justify-between p-2 bg-gray-50 rounded cursor-help">
                                      <div className="flex-1">
                                        <span className="text-gray-600">{bracket.bracket}</span>
                                      </div>
                                      <span className="font-medium">
                                        {formatCurrency(bracket.tax, "NGN")} (
                                        {bracket.rate}%)
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>
                                      This bracket shows the tax calculated on ₦{bracket.income.toLocaleString()} of your taxable income at a rate of {bracket.rate}%. The tax amount is ₦{bracket.tax.toLocaleString()}. Your total Personal Income Tax is the sum of all bracket taxes.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500">
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg w-fit mx-auto mb-3">
                        <Calculator className="h-8 w-8 text-purple-600 opacity-50" />
                      </div>
                      <p className="text-sm">
                        Enter your tax information and click "Calculate Tax" to see
                        results here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Tax Settings</CardTitle>
                  <CardDescription>
                    Configure your tax preferences and information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {settingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="taxpayerType">Taxpayer Type</Label>
                    <Select
                      value={settingsForm.taxpayerType || "individual"}
                      onValueChange={(value: "individual" | "company") =>
                        setSettingsForm({ ...settingsForm, taxpayerType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="taxIdentificationNumber">
                      Tax Identification Number (TIN)
                    </Label>
                    <Input
                      id="taxIdentificationNumber"
                      value={settingsForm.taxIdentificationNumber || ""}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          taxIdentificationNumber: e.target.value,
                        })
                      }
                      placeholder="Enter your TIN"
                    />
                  </div>


                  <div>
                    <Label htmlFor="defaultTaxYear">Default Tax Year</Label>
                    <Input
                      id="defaultTaxYear"
                      type="number"
                      value={settingsForm.defaultTaxYear || new Date().getFullYear()}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          defaultTaxYear: parseInt(e.target.value) || new Date().getFullYear(),
                        })
                      }
                      min={2020}
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    disabled={settingsLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0 shadow-lg"
                  >
                    {settingsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {selectedCalculation ? (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>
                        Calculation Details - {selectedCalculation.taxYear}
                      </CardTitle>
                      <CardDescription>
                        {selectedCalculation.properties?.name || "Portfolio Calculation"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!selectedCalculation.isFinalized && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFinalize(selectedCalculation.id)}
                        >
                          Finalize
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(selectedCalculation.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCalculation(null)}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Total Income</Label>
                      <p className="text-2xl font-bold">
                        {formatCurrency(selectedCalculation.totalIncome, "NGN")}
                      </p>
                    </div>
                    <div>
                      <Label>Total Tax Liability</Label>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(
                          selectedCalculation.totalTaxLiability,
                          "NGN"
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>Net Taxable Income</Label>
                    <p className="text-lg">
                      {formatCurrency(selectedCalculation.taxableIncome, "NGN")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Rental Income - Property Expenses
                    </p>
                  </div>
                    {selectedCalculation.isFinalized && (
                      <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Finalized
                      </Badge>
                    )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg">
                    <History className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Calculation History</CardTitle>
                    <CardDescription>
                      View and manage your previous tax calculations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : taxHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Total Income</TableHead>
                        <TableHead>Tax Liability</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Generated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxHistory.map((calc) => (
                        <TableRow key={calc.id}>
                          <TableCell>{calc.taxYear}</TableCell>
                          <TableCell>
                            {calc.properties?.name || "Portfolio"}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(calc.totalIncome, "NGN")}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(calc.totalTaxLiability, "NGN")}
                          </TableCell>
                          <TableCell>
                            {calc.isFinalized ? (
                              <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200">
                                Finalized
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-purple-200 text-purple-700">Draft</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {calc.calculationDate
                              ? new Date(calc.calculationDate).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-purple-50"
                                >
                                  <MoreVertical className="h-4 w-4 text-gray-600" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => handleViewCalculation(calc.id)}
                                  className="cursor-pointer"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleExportCalculation(calc)}
                                  className="cursor-pointer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Export
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg w-fit mx-auto mb-3">
                      <History className="h-8 w-8 text-purple-600 opacity-50" />
                    </div>
                    <p>No calculation history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

