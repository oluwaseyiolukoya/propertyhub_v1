import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Filter,
  Calendar,
  CreditCard,
  Users,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertCircle,
  Eye,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getPayments,
  getPaymentStats,
  recordManualPayment,
} from "../lib/api/payments";
import { getLeases } from "../lib/api/leases";
import {
  initializeSocket,
  isConnected,
  subscribeToPaymentEvents,
  unsubscribeFromPaymentEvents,
} from "../lib/socket";

export const PaymentOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Record Payment Dialog State
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [leases, setLeases] = useState<any[]>([]);
  const [recordForm, setRecordForm] = useState({
    leaseId: "",
    amount: "",
    paymentMethod: "cash",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
    type: "rent",
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordOptions, setRecordOptions] = useState({
    sendReceipt: true,
    markAsPaid: true,
    notifyTeam: false,
  });
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [showEditPayment, setShowEditPayment] = useState(false);
  const [editForm, setEditForm] = useState({
    amount: "",
    paymentMethod: "",
    paymentDate: "",
    type: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
    const token = localStorage.getItem("auth_token");
    if (token && !isConnected()) {
      try {
        initializeSocket(token);
      } catch {}
    }
    subscribeToPaymentEvents({
      onUpdated: () => fetchData(),
      onReceived: () => fetchData(),
    });
    const handleBrowserPaymentUpdate = () => fetchData();
    window.addEventListener("payment:updated", handleBrowserPaymentUpdate);
    return () => {
      unsubscribeFromPaymentEvents();
      window.removeEventListener("payment:updated", handleBrowserPaymentUpdate);
    };
  }, [page, statusFilter, methodFilter, searchTerm]);

  const fetchData = async () => {
    try {
      const filters: any = { page, pageSize };
      if (statusFilter !== "all") filters.status = statusFilter;
      if (methodFilter !== "all") filters.method = methodFilter;
      if (searchTerm) filters.search = searchTerm;

      const [paymentsResp, statsResp] = await Promise.all([
        getPayments(filters),
        getPaymentStats(),
      ]);

      if (paymentsResp.data) {
        let list: any[] = [];
        let totalCount = 0;

        if (paymentsResp.data.items) {
          list = paymentsResp.data.items;
          totalCount = paymentsResp.data.total || 0;
        } else if (Array.isArray(paymentsResp.data)) {
          list = paymentsResp.data;
          totalCount = list.length;
        }

        const transformed = list.map((p: any) => ({
          id: p.id,
          reference: p.providerReference || p.id,
          tenant: p.leases?.users?.name || "Unknown",
          tenantEmail: p.leases?.users?.email || "",
          property: p.leases?.properties?.name || "Unknown",
          unit: p.leases?.units?.unitNumber || "N/A",
          amount: p.amount,
          currency: p.currency || "NGN",
          status: p.status,
          method: p.paymentMethod || p.provider || "Paystack",
          type: p.type || "rent",
          date: new Date(p.paidAt || p.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          time: new Date(p.paidAt || p.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        }));

        setPayments(transformed);
        setTotal(totalCount);
      }

      if (statsResp.data) {
        setStats(statsResp.data);
        console.log("Payment Stats:", statsResp.data);
      }
    } catch (error) {
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default";
      case "failed":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const exportData = async () => {
    try {
      toast.info("Generating payment report...");

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "pt", "a4");

      // Set Arial as default font for entire document
      pdf.setFont("helvetica"); // Arial equivalent in jsPDF

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 50;
      let yPos = margin;

      // Brand Colors
      const primaryPurple = [124, 58, 237]; // #7C3AED
      const darkPurple = [91, 33, 182]; // #5B21B6
      const textDark = [17, 24, 39]; // #111827
      const textGray = [107, 114, 128]; // #6B7280
      const lightGray = [249, 250, 251]; // #F9FAFB

      // Header with gradient effect (purple background)
      pdf.setFillColor(...primaryPurple);
      pdf.rect(0, 0, pageWidth, 110, "F");

      // Dark purple accent bar
      pdf.setFillColor(...darkPurple);
      pdf.rect(0, 105, pageWidth, 5, "F");

      // Logo/Title area - Left side
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.text("CONTREZZ", margin, 35);

      // Subtitle
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Property Management System", margin, 50);

      // Report title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Payment Overview Report", margin, 72);

      // Report metadata - Left side
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      const reportDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      pdf.text(`Report Date: ${reportDate}`, margin, 88);
      pdf.text(
        `Generated At: ${new Date().toLocaleTimeString("en-US")}`,
        margin,
        98
      );

      // Right side metadata
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(`Total Transactions: ${total}`, pageWidth - margin - 130, 88);

      yPos = 130;

      // Summary Statistics Section
      pdf.setFillColor(...lightGray);
      pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 145, 8, 8, "F");

      // Section header
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...textDark);
      pdf.setFontSize(16);
      pdf.text("Financial Summary", margin + 20, yPos + 28);

      // Report Currency text (no background)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...primaryPurple);
      pdf.text("Currency: NGN", pageWidth - margin - 100, yPos + 28);

      // Divider line
      pdf.setDrawColor(...primaryPurple);
      pdf.setLineWidth(1);
      pdf.line(margin + 20, yPos + 40, pageWidth - margin - 20, yPos + 40);

      // Statistics cards
      const cardWidth = (pageWidth - margin * 2 - 60) / 4;
      const cardHeight = 70;
      const cardY = yPos + 55;
      let cardX = margin + 20;

      // Card 1: Total Collected
      pdf.setFillColor(240, 253, 244); // Light green
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, "F");
      pdf.setDrawColor(34, 197, 94); // Green
      pdf.setLineWidth(2);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, "S");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...textGray);
      pdf.text("Total Collected", cardX + 10, cardY + 20);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(34, 197, 94);
      pdf.text(totalCollected.toLocaleString(), cardX + 10, cardY + 45);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...textGray);
      pdf.text(`${successCount} successful`, cardX + 10, cardY + 60);

      cardX += cardWidth + 15;

      // Card 2: Pending Amount
      pdf.setFillColor(254, 243, 199); // Light amber
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, "F");
      pdf.setDrawColor(245, 158, 11); // Amber
      pdf.setLineWidth(2);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, "S");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...textGray);
      pdf.text("Pending Amount", cardX + 10, cardY + 20);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(245, 158, 11);
      pdf.text(pendingAmount.toLocaleString(), cardX + 10, cardY + 45);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...textGray);
      pdf.text(`${pendingCount} pending`, cardX + 10, cardY + 60);

      cardX += cardWidth + 15;

      // Card 3: Success Rate
      pdf.setFillColor(239, 246, 255); // Light blue
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, "F");
      pdf.setDrawColor(59, 130, 246); // Blue
      pdf.setLineWidth(2);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, "S");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...textGray);
      pdf.text("Success Rate", cardX + 10, cardY + 20);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(59, 130, 246);
      pdf.text(
        `${total > 0 ? Math.round((successCount / total) * 100) : 0}%`,
        cardX + 10,
        cardY + 45
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...textGray);
      pdf.text(`of ${total} payments`, cardX + 10, cardY + 60);

      cardX += cardWidth + 15;

      // Card 4: Failed Payments
      pdf.setFillColor(254, 242, 242); // Light red
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, "F");
      pdf.setDrawColor(239, 68, 68); // Red
      pdf.setLineWidth(2);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, "S");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...textGray);
      pdf.text("Failed Payments", cardX + 10, cardY + 20);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(239, 68, 68);
      pdf.text(`${failedCount}`, cardX + 10, cardY + 45);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...textGray);
      pdf.text("need attention", cardX + 10, cardY + 60);

      yPos += 165;

      // Payment Transactions Table
      // Section header
      pdf.setFillColor(...primaryPurple);
      pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 8, 8, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text("Transaction Details", margin + 20, yPos + 23);

      yPos += 50;

      // Table Headers
      pdf.setFillColor(...textDark);
      pdf.rect(margin, yPos, pageWidth - margin * 2, 28, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);

      const colWidths = {
        tenant: 115,
        property: 100,
        amount: 75,
        date: 75,
        method: 75,
        status: 55,
      };

      let colX = margin + 15;
      pdf.text("TENANT", colX, yPos + 18);
      colX += colWidths.tenant;
      pdf.text("PROPERTY", colX, yPos + 18);
      colX += colWidths.property;
      pdf.text("AMOUNT", colX, yPos + 18);
      colX += colWidths.amount;
      pdf.text("DATE", colX, yPos + 18);
      colX += colWidths.date;
      pdf.text("METHOD", colX, yPos + 18);
      colX += colWidths.method;
      pdf.text("STATUS", colX, yPos + 18);

      yPos += 28;

      // Table Rows
      const rowHeight = 35;
      let isAlternate = false;

      payments.forEach((payment, index) => {
        // Check if we need a new page
        if (yPos + rowHeight > pageHeight - 80) {
          pdf.addPage();
          yPos = margin;

          // Redraw headers on new page
          pdf.setFillColor(...textDark);
          pdf.rect(margin, yPos, pageWidth - margin * 2, 28, "F");

          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);

          colX = margin + 15;
          pdf.text("TENANT", colX, yPos + 18);
          colX += colWidths.tenant;
          pdf.text("PROPERTY", colX, yPos + 18);
          colX += colWidths.property;
          pdf.text("AMOUNT", colX, yPos + 18);
          colX += colWidths.amount;
          pdf.text("DATE", colX, yPos + 18);
          colX += colWidths.date;
          pdf.text("METHOD", colX, yPos + 18);
          colX += colWidths.method;
          pdf.text("STATUS", colX, yPos + 18);

          yPos += 28;
          isAlternate = false;
        }

        // Alternating row colors with borders
        if (isAlternate) {
          pdf.setFillColor(...lightGray);
          pdf.rect(margin, yPos, pageWidth - margin * 2, rowHeight, "F");
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(margin, yPos, pageWidth - margin * 2, rowHeight, "F");
        }

        // Row border
        pdf.setDrawColor(229, 231, 235); // Light gray border
        pdf.setLineWidth(0.5);
        pdf.line(
          margin,
          yPos + rowHeight,
          pageWidth - margin,
          yPos + rowHeight
        );

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...textDark);
        pdf.setFontSize(9);

        colX = margin + 15;

        // Tenant (truncate if too long)
        const tenantText =
          payment.tenant.length > 18
            ? payment.tenant.substring(0, 15) + "..."
            : payment.tenant;
        pdf.text(tenantText, colX, yPos + 22);

        colX += colWidths.tenant;
        // Property (truncate if too long)
        const propertyText =
          payment.property.length > 16
            ? payment.property.substring(0, 13) + "..."
            : payment.property;
        pdf.text(propertyText, colX, yPos + 22);

        colX += colWidths.property;
        // Amount
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...textDark);
        pdf.text(payment.amount.toLocaleString(), colX, yPos + 22);

        colX += colWidths.amount;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...textDark);
        pdf.text(payment.date, colX, yPos + 22);

        colX += colWidths.date;
        const methodText =
          payment.method.length > 12
            ? payment.method.substring(0, 9) + "..."
            : payment.method;
        pdf.text(methodText, colX, yPos + 22);

        colX += colWidths.method;
        // Status with colored badge
        const statusText = payment.status.toUpperCase();
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);

        if (payment.status === "success") {
          pdf.setFillColor(34, 197, 94);
          pdf.setTextColor(255, 255, 255);
          pdf.roundedRect(colX, yPos + 10, 50, 16, 3, 3, "F");
          pdf.text(statusText, colX + 6, yPos + 21);
        } else if (payment.status === "failed") {
          pdf.setFillColor(239, 68, 68);
          pdf.setTextColor(255, 255, 255);
          pdf.roundedRect(colX, yPos + 10, 50, 16, 3, 3, "F");
          pdf.text(statusText, colX + 8, yPos + 21);
        } else {
          pdf.setFillColor(245, 158, 11);
          pdf.setTextColor(255, 255, 255);
          pdf.roundedRect(colX, yPos + 10, 50, 16, 3, 3, "F");
          pdf.text(statusText, colX + 5, yPos + 21);
        }

        yPos += rowHeight;
        isAlternate = !isAlternate;
      });

      // Footer
      const footerY = pageHeight - 40;

      // Add footer to all pages
      const totalPagesExp = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPagesExp; i++) {
        pdf.setPage(i);

        // Footer background
        pdf.setFillColor(...primaryPurple);
        pdf.rect(0, footerY, pageWidth, 40, "F");

        // Dark accent line
        pdf.setFillColor(...darkPurple);
        pdf.rect(0, footerY, pageWidth, 3, "F");

        // Footer text
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.text(
          "Generated by CONTREZZ Property Management System",
          margin,
          footerY + 20
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(
          `© ${new Date().getFullYear()} Contrezz. All rights reserved.`,
          margin,
          footerY + 32
        );

        // Page numbers
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(
          `Page ${i} of ${totalPagesExp}`,
          pageWidth - margin - 60,
          footerY + 26
        );
      }

      // Save the PDF
      const fileName = `Payment_Report_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);

      toast.success("Payment report exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to generate payment report");
    }
  };

  const handleOpenRecordDialog = async () => {
    try {
      const leasesResp = await getLeases({ status: "active" });
      if (leasesResp.data) {
        const leaseList = Array.isArray(leasesResp.data)
          ? leasesResp.data
          : leasesResp.data.items || [];
        setLeases(leaseList);
      }
      setShowRecordDialog(true);
    } catch (error) {
      toast.error("Failed to load leases");
    }
  };

  const handleRecordPayment = async () => {
    try {
      if (
        !recordForm.leaseId ||
        !recordForm.amount ||
        parseFloat(recordForm.amount) <= 0
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      setIsRecording(true);
      const resp = await recordManualPayment({
        leaseId: recordForm.leaseId,
        amount: parseFloat(recordForm.amount),
        paymentMethod: recordForm.paymentMethod,
        paymentDate: recordForm.paymentDate,
        notes: recordForm.notes,
        type: recordForm.type,
      });

      if (resp.data?.success) {
        toast.success("Payment recorded successfully");
        setShowRecordDialog(false);
        setRecordForm({
          leaseId: "",
          amount: "",
          paymentMethod: "cash",
          paymentDate: new Date().toISOString().split("T")[0],
          notes: "",
          type: "rent",
        });
        fetchData();
      } else {
        toast.error(resp.error?.error || "Failed to record payment");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to record payment");
    } finally {
      setIsRecording(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    const amountValue = parseFloat(editForm.amount || "0");
    if (!editForm.amount || Number.isNaN(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!editForm.paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      setIsRecording(true);
      const { updatePayment } = await import("../lib/api/payments");
      const resp = await updatePayment(selectedPayment.id, {
        amount: amountValue,
        paymentMethod: editForm.paymentMethod,
        paymentDate: editForm.paymentDate,
        type: editForm.type,
        notes: editForm.notes,
      } as any);

      if (resp.error) {
        toast.error(resp.error.message || "Failed to update payment");
      } else {
        toast.success("Payment updated successfully");
        setShowEditPayment(false);
        setSelectedPayment(resp.data || selectedPayment);
        fetchData();
      }
    } catch (error: any) {
      console.error("Update payment error:", error);
      toast.error(error?.message || "Failed to update payment");
    } finally {
      setIsRecording(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment overview...</p>
        </div>
      </div>
    );
  }

  const totalCollected = stats?.totalCollected || 0;
  const pendingAmount = stats?.pendingAmount || 0;
  const successCount = payments.filter((p) => p.status === "success").length;
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const failedCount = payments.filter((p) => p.status === "failed").length;

  const isRecordValid =
    !!recordForm.leaseId &&
    !!recordForm.amount &&
    parseFloat(recordForm.amount) > 0 &&
    !!recordForm.paymentMethod &&
    !!recordForm.paymentDate;

  const selectedLease = leases.find(
    (lease: any) => lease.id === recordForm.leaseId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Payment Overview
              </h1>
              <p className="text-purple-100 mt-1">
                Track all payment transactions across your properties
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleOpenRecordDialog}
              className="bg-white text-[#7C3AED] hover:bg-purple-50 shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
            <Button
              onClick={exportData}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 shadow-md"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Total Collected
                </p>
                <div className="text-3xl font-bold text-gray-900">
                  ₦{totalCollected.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 flex items-center justify-center mt-2">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  All successful payments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-md">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Pending Amount
                </p>
                <div className="text-3xl font-bold text-gray-900">
                  ₦{pendingAmount.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {pendingCount} pending transactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Success Rate
                </p>
                <div className="text-3xl font-bold text-gray-900">
                  {total > 0 ? Math.round((successCount / total) * 100) : 0}%
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {successCount} of {total} payments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl shadow-md">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Failed Payments
                </p>
                <div className="text-3xl font-bold text-gray-900">
                  {failedCount}
                </div>
                <p className="text-xs text-gray-500 mt-2">Requires attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment by Method and Type Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-gray-900">
                  Payment by Method
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Distribution of payment methods used
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {stats?.byMethod && stats.byMethod.length > 0 ? (
              <div className="space-y-3">
                {stats.byMethod.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-2 rounded-lg">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {item.method || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 font-medium">
                        {item.count || 0} transactions
                      </span>
                      <span className="text-sm font-bold text-[#7C3AED]">
                        ₦{(item.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-[#7C3AED]" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  No payment methods data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Payment by Type</CardTitle>
                <CardDescription className="text-gray-600">
                  Breakdown of payment categories
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {stats?.byType && stats.byType.length > 0 ? (
              <div className="space-y-3">
                {stats.byType.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200 hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-lg">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-gray-900 capitalize">
                        {item.type || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 font-medium">
                        {item.count || 0} payments
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        ₦{(item.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Building className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  No payment types data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments Table */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-gray-900">
                All Payment Transactions
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Complete history of all payments received
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#7C3AED]" />
              <Input
                placeholder="Search by tenant, property, unit, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-40 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Paystack">Paystack</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-auto rounded-xl border-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Reference
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tenant
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Property
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Unit
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Time
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Method
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment, index) => (
                  <TableRow
                    key={payment.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-[#7C3AED]/5 transition-colors`}
                  >
                    <TableCell className="font-mono text-xs font-medium text-gray-700">
                      {payment.reference}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {payment.tenant}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.tenantEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {payment.property}
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">
                      {payment.unit}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="capitalize border-purple-200 text-[#7C3AED] bg-purple-50"
                      >
                        {payment.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-gray-900">
                      {payment.currency === "NGN" ? "₦" : ""}
                      {payment.amount.toLocaleString()}{" "}
                      {payment.currency !== "NGN" ? payment.currency : ""}
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">
                      {payment.date}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {payment.time}
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">
                      {payment.method}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <Badge
                          variant={getStatusColor(payment.status)}
                          className="capitalize"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-purple-100"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                            <span className="sr-only">Open actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-xl shadow-lg"
                        >
                          <DropdownMenuLabel className="font-bold">
                            Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowPaymentDetails(true);
                            }}
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayment(payment);
                              setEditForm({
                                amount: String(payment.amount ?? ""),
                                paymentMethod: payment.method || "",
                                paymentDate: payment.date
                                  ? format(
                                      new Date(
                                        payment.paidAt || payment.createdAt
                                      ),
                                      "yyyy-MM-dd"
                                    )
                                  : "",
                                type: payment.type || "",
                                notes: "",
                              });
                              setShowEditPayment(true);
                            }}
                            className="cursor-pointer"
                          >
                            Edit payment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 cursor-pointer"
                            onClick={async () => {
                              const confirmed = window.confirm(
                                "Are you sure you want to delete this payment? This action cannot be undone."
                              );
                              if (!confirmed) return;

                              try {
                                const { deletePayment } = await import(
                                  "../lib/api/payments"
                                );
                                const resp = await deletePayment(payment.id);
                                if (resp.error) {
                                  toast.error(
                                    resp.error.message ||
                                      "Failed to delete payment"
                                  );
                                } else {
                                  toast.success(
                                    resp.data?.message ||
                                      "Payment deleted successfully"
                                  );
                                  fetchData();
                                }
                              } catch (error: any) {
                                console.error("Delete payment error:", error);
                                toast.error(
                                  error?.message || "Failed to delete payment"
                                );
                              }
                            }}
                          >
                            Delete payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="bg-purple-100 p-4 rounded-full">
                          <Search className="h-10 w-10 text-[#7C3AED]" />
                        </div>
                        <p className="font-bold text-gray-900 text-lg">
                          No payments found
                        </p>
                        <p className="text-sm text-gray-500">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm font-semibold text-gray-700">
              Page {page} of {totalPages} • {total} total payments
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="border-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-w-lg border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -mx-6 -mt-6 px-6 py-4 rounded-t-xl">
            <DialogTitle className="text-white text-xl">
              Payment Details
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Full breakdown of the selected payment transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 mt-4">
              <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 space-y-2">
                <p className="text-xs font-bold text-gray-700">Reference</p>
                <p className="font-mono text-sm break-all font-semibold text-gray-900">
                  {selectedPayment.reference}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border-2 border-blue-200">
                  <p className="text-xs font-bold text-gray-700 mb-2">Tenant</p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedPayment.tenant}
                  </p>
                  {selectedPayment.tenantEmail && (
                    <p className="text-xs text-gray-600 font-medium mt-1">
                      {selectedPayment.tenantEmail}
                    </p>
                  )}
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-blue-200">
                  <p className="text-xs font-bold text-gray-700 mb-2">
                    Property / Unit
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedPayment.property}
                    {selectedPayment.unit ? ` • ${selectedPayment.unit}` : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border-2 border-green-200">
                  <p className="text-xs font-bold text-gray-700 mb-2">Amount</p>
                  <p className="text-lg font-bold text-green-600">
                    {selectedPayment.currency === "NGN" ? "₦" : ""}
                    {Number(selectedPayment.amount ?? 0).toLocaleString()}{" "}
                    {selectedPayment.currency !== "NGN"
                      ? selectedPayment.currency
                      : ""}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-purple-200">
                  <p className="text-xs font-bold text-gray-700 mb-2">Method</p>
                  <p className="text-sm capitalize font-bold text-gray-900">
                    {selectedPayment.method}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border-2 border-purple-200">
                  <p className="text-xs font-bold text-gray-700 mb-2">Type</p>
                  <Badge
                    variant="outline"
                    className="capitalize border-purple-200 text-[#7C3AED] bg-purple-50"
                  >
                    {selectedPayment.type}
                  </Badge>
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-gray-200">
                  <p className="text-xs font-bold text-gray-700 mb-2">Status</p>
                  <div className="inline-flex items-center gap-2">
                    {getStatusIcon(selectedPayment.status)}
                    <Badge
                      variant={getStatusColor(selectedPayment.status)}
                      className="capitalize"
                    >
                      {selectedPayment.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border-2 border-gray-200">
                  <p className="text-xs font-bold text-gray-700 mb-2">Date</p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedPayment.date} at {selectedPayment.time}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-gray-200">
                  <p className="text-xs font-bold text-gray-700 mb-2">
                    Created At
                  </p>
                  <p className="text-xs font-semibold text-gray-600">
                    {selectedPayment.createdAt
                      ? new Date(selectedPayment.createdAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={showEditPayment} onOpenChange={setShowEditPayment}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -mx-6 -mt-6 px-6 py-4 rounded-t-xl">
            <DialogTitle className="text-white text-xl">
              Edit Payment
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Adjust amount, method, date, or notes for this manual payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label
                htmlFor="edit-amount"
                className="text-sm font-semibold text-gray-700"
              >
                Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
                  ₦
                </span>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="pl-7 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-method"
                className="text-sm font-semibold text-gray-700"
              >
                Payment Method
              </Label>
              <Select
                value={editForm.paymentMethod}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, paymentMethod: value }))
                }
              >
                <SelectTrigger
                  id="edit-method"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                >
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-date"
                className="text-sm font-semibold text-gray-700"
              >
                Payment Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  >
                    <Calendar className="mr-2 h-4 w-4 text-[#7C3AED]" />
                    {editForm.paymentDate ? (
                      format(new Date(editForm.paymentDate), "PPP")
                    ) : (
                      <span className="text-gray-500">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-xl shadow-xl"
                  align="start"
                >
                  <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] px-4 py-3 rounded-t-xl">
                    <p className="text-sm font-semibold text-white">
                      Select Payment Date
                    </p>
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={
                      editForm.paymentDate
                        ? new Date(editForm.paymentDate)
                        : undefined
                    }
                    onSelect={(date) =>
                      setEditForm((prev) => ({
                        ...prev,
                        paymentDate: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    initialFocus
                    classNames={{
                      months: "flex flex-col space-y-4 p-3 bg-white",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-semibold text-gray-900",
                      nav: "space-x-1 flex items-center",
                      nav_button:
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-300 hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED] rounded-md transition-colors",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell:
                        "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-purple-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] rounded-md transition-colors",
                      day_selected:
                        "bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:text-white focus:bg-[#6D28D9] focus:text-white font-bold shadow-md",
                      day_today:
                        "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                      day_outside: "text-gray-400 opacity-50",
                      day_disabled: "text-gray-400 opacity-50",
                      day_range_middle:
                        "aria-selected:bg-purple-100 aria-selected:text-[#7C3AED]",
                      day_hidden: "invisible",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-type"
                className="text-sm font-semibold text-gray-700"
              >
                Payment Type
              </Label>
              <Select
                value={editForm.type}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger
                  id="edit-type"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-notes"
                className="text-sm font-semibold text-gray-700"
              >
                Notes
              </Label>
              <Textarea
                id="edit-notes"
                rows={3}
                placeholder="Add notes about this payment..."
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditPayment(false)}
              className="border-gray-300 hover:border-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePayment}
              disabled={isRecording}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
            >
              {isRecording ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="max-w-4xl border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -mx-6 -mt-6 px-6 py-4 rounded-t-xl space-y-2">
            <DialogTitle className="text-white text-xl">
              Record Manual Payment
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Capture one-off payments collected via cash, transfers or other
              offline channels. We'll update the ledger and optionally send a
              receipt to the tenant.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-[1.75fr,1fr] mt-4">
            <div className="space-y-6">
              {!isRecordValid && (
                <div className="flex items-start gap-3 rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 text-sm">
                  <div className="bg-amber-500 p-1.5 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="font-semibold text-amber-900">
                    Complete the required fields to enable recording.
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="lease"
                  className="text-sm font-semibold text-gray-700"
                >
                  Tenant Lease <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={recordForm.leaseId}
                  onValueChange={(value) =>
                    setRecordForm({ ...recordForm, leaseId: value })
                  }
                >
                  <SelectTrigger
                    id="lease"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  >
                    <SelectValue placeholder="Select a lease" />
                  </SelectTrigger>
                  <SelectContent>
                    {leases.length === 0 && (
                      <SelectItem value="__empty" disabled>
                        No active leases available
                      </SelectItem>
                    )}
                    {leases.map((lease: any) => (
                      <SelectItem key={lease.id} value={lease.id}>
                        {lease.leaseNumber} - {lease.users?.name || "Unknown"} (
                        {lease.properties?.name || "Unknown"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="amount"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Amount <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
                      ₦
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      value={recordForm.amount}
                      onChange={(e) =>
                        setRecordForm({
                          ...recordForm,
                          amount: e.target.value,
                        })
                      }
                      className="pl-7 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="method"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Payment Method <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={recordForm.paymentMethod}
                    onValueChange={(value) =>
                      setRecordForm({ ...recordForm, paymentMethod: value })
                    }
                  >
                    <SelectTrigger
                      id="method"
                      className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    >
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="date"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Payment Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                      >
                        <Calendar className="mr-2 h-4 w-4 text-[#7C3AED]" />
                        {recordForm.paymentDate ? (
                          format(new Date(recordForm.paymentDate), "PPP")
                        ) : (
                          <span className="text-gray-500">Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-xl shadow-xl"
                      align="start"
                    >
                      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] px-4 py-3 rounded-t-xl">
                        <p className="text-sm font-semibold text-white">
                          Select Payment Date
                        </p>
                      </div>
                      <CalendarComponent
                        mode="single"
                        selected={
                          recordForm.paymentDate
                            ? new Date(recordForm.paymentDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setRecordForm((prev) => ({
                            ...prev,
                            paymentDate: date ? format(date, "yyyy-MM-dd") : "",
                          }))
                        }
                        initialFocus
                        classNames={{
                          months: "flex flex-col space-y-4 p-3 bg-white",
                          month: "space-y-4",
                          caption:
                            "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-semibold text-gray-900",
                          nav: "space-x-1 flex items-center",
                          nav_button:
                            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-300 hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED] rounded-md transition-colors",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell:
                            "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-purple-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] rounded-md transition-colors",
                          day_selected:
                            "bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:text-white focus:bg-[#6D28D9] focus:text-white font-bold shadow-md",
                          day_today:
                            "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                          day_outside: "text-gray-400 opacity-50",
                          day_disabled: "text-gray-400 opacity-50",
                          day_range_middle:
                            "aria-selected:bg-purple-100 aria-selected:text-[#7C3AED]",
                          day_hidden: "invisible",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="type"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Payment Type
                  </Label>
                  <Select
                    value={recordForm.type}
                    onValueChange={(value) =>
                      setRecordForm({ ...recordForm, type: value })
                    }
                  >
                    <SelectTrigger
                      id="type"
                      className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-semibold text-gray-700"
                >
                  Internal Notes
                </Label>
                <Textarea
                  id="notes"
                  value={recordForm.notes}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, notes: e.target.value })
                  }
                  placeholder="Add any helpful context for the finance team..."
                  rows={3}
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] resize-none"
                />
                <p className="text-xs text-gray-500 font-medium">
                  Notes remain internal and are not visible to tenants.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-bold mb-1">
                      Amount to post
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      ₦{Number(recordForm.amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs uppercase border-green-300 bg-white text-green-700 font-bold"
                  >
                    {recordForm.paymentMethod
                      ? recordForm.paymentMethod.replace(/_/g, " ")
                      : "method TBD"}
                  </Badge>
                </div>
                {selectedLease ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-green-200">
                      <span className="text-gray-600 font-semibold">
                        Tenant
                      </span>
                      <span className="font-bold text-gray-900">
                        {selectedLease.users?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-green-200">
                      <span className="text-gray-600 font-semibold">Unit</span>
                      <span className="font-bold text-gray-900">
                        {selectedLease.units?.unitNumber ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-green-200">
                      <span className="text-gray-600 font-semibold">
                        Property
                      </span>
                      <span className="font-bold text-gray-900">
                        {selectedLease.properties?.name}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 font-medium text-center py-2">
                    Select a lease to view tenant and property details.
                  </p>
                )}
              </div>

              <div className="rounded-xl border-2 border-purple-200 divide-y divide-purple-100">
                <div className="flex items-start justify-between gap-3 p-4 hover:bg-purple-50/50 transition-colors rounded-t-xl">
                  <div>
                    <p className="font-bold text-gray-900">
                      Send digital receipt
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Email a branded receipt once this payment is recorded.
                    </p>
                  </div>
                  <Switch
                    checked={recordOptions.sendReceipt}
                    onCheckedChange={(checked) =>
                      setRecordOptions((prev) => ({
                        ...prev,
                        sendReceipt: checked,
                      }))
                    }
                    className="data-[state=checked]:bg-[#7C3AED]"
                  />
                </div>

                <div className="flex items-start justify-between gap-3 p-4 hover:bg-purple-50/50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">
                      Mark invoice as settled
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Close any open balance tied to this lease automatically.
                    </p>
                  </div>
                  <Switch
                    checked={recordOptions.markAsPaid}
                    onCheckedChange={(checked) =>
                      setRecordOptions((prev) => ({
                        ...prev,
                        markAsPaid: checked,
                      }))
                    }
                    className="data-[state=checked]:bg-[#7C3AED]"
                  />
                </div>

                <div className="flex items-start justify-between gap-3 p-4 hover:bg-purple-50/50 transition-colors rounded-b-xl">
                  <div>
                    <p className="font-bold text-gray-900">
                      Notify finance team
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Post an update to the finance Slack/email channel.
                    </p>
                  </div>
                  <Switch
                    checked={recordOptions.notifyTeam}
                    onCheckedChange={(checked) =>
                      setRecordOptions((prev) => ({
                        ...prev,
                        notifyTeam: checked,
                      }))
                    }
                    className="data-[state=checked]:bg-[#7C3AED]"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 pt-4 mt-4 border-t">
            <p className="text-sm text-gray-600 font-medium">
              Recorded payments sync to payment history, reminders, and cashflow
              analytics.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRecordDialog(false)}
                className="border-gray-300 hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={isRecording || !isRecordValid}
                className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
              >
                {isRecording ? "Recording..." : "Record payment"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
