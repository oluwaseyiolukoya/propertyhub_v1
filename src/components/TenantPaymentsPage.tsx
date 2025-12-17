import React, { useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  CreditCard,
  Calendar,
  Download,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Building2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Wallet,
  Receipt,
  Eye,
  Trash2,
  Star,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import {
  getPayments,
  initializeTenantPayment,
  getScheduledPayments,
  verifyPayment,
  getAutopaySettings,
  updateAutopaySettings,
  AutoPaySettings,
} from "../lib/api/payments";
import {
  getPublicPaymentGatewaySettings,
  getTenantPublicPaymentGateway,
} from "../lib/api/settings";
import {
  initializeSocket,
  isConnected,
  subscribeToPaymentEvents,
  unsubscribeFromPaymentEvents,
} from "../lib/socket";
import {
  getPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  removePaymentMethod,
  PaymentMethod,
} from "../lib/api/payment-methods";

interface TenantPaymentsPageProps {
  dashboardData: any;
}

const TenantPaymentsPage: React.FC<TenantPaymentsPageProps> = ({
  dashboardData,
}) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "full" | "custom"
  >("full");
  const [autopaySettings, setAutopaySettings] =
    useState<AutoPaySettings | null>(null);
  const [autopayLoading, setAutopayLoading] = useState(false);
  const [selectedAutopayCard, setSelectedAutopayCard] = useState<string>("");
  const [autopayDay, setAutopayDay] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankTransferTemplate, setBankTransferTemplate] = useState<string>("");
  const [ownerPublicKey, setOwnerPublicKey] = useState<string | null>(null);

  // Add Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);

  const monthlyRent = dashboardData?.lease?.monthlyRent || 0;

  React.useEffect(() => {
    setPaymentAmount(monthlyRent.toString());
  }, [monthlyRent]);

  // Format data from API
  const currentRent = {
    amount: monthlyRent,
    dueDate: dashboardData?.rent?.nextPaymentDue
      ? new Date(dashboardData.rent.nextPaymentDue).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "numeric" }
        )
      : "N/A",
    daysUntilDue: dashboardData?.rent?.daysUntilDue || 0,
    balance: 0,
    autopayEnabled: autopaySettings?.enabled || false,
  };

  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Map backend status to frontend display status
  const mapPaymentStatus = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "success":
        return "paid";
      case "failed":
        return "failed";
      case "pending":
        return "pending";
      case "scheduled":
        return "scheduled";
      case "overdue":
        return "overdue";
      default:
        return status || "pending";
    }
  };

  const loadPaymentHistory = async (opts?: { resetPage?: boolean }) => {
    const nextPage = opts?.resetPage ? 1 : page;
    const resp = await getPayments({ page: nextPage, pageSize });
    if ((resp as any).data && Array.isArray((resp as any).data)) {
      const list = (resp as any).data.map((p: any) => ({
        id: p.id,
        date: new Date(p.paidAt || p.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        timestamp: new Date(p.paidAt || p.createdAt).toLocaleTimeString(
          "en-US",
          { hour: "2-digit", minute: "2-digit" }
        ),
        amount: p.amount,
        currency: p.currency || "NGN",
        status: mapPaymentStatus(p.status),
        method: p.paymentMethod || p.provider || "Paystack",
        type: p.type || "rent",
        confirmation: p.providerReference || p.id,
      }));
      setPaymentHistory(list);
      // When data is array (legacy), we cannot know total; fallback
      setTotal(list.length);
    } else if ((resp as any).data && (resp as any).data.items) {
      const payload = (resp as any).data;
      const list = payload.items.map((p: any) => ({
        id: p.id,
        date: new Date(p.paidAt || p.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        timestamp: new Date(p.paidAt || p.createdAt).toLocaleTimeString(
          "en-US",
          { hour: "2-digit", minute: "2-digit" }
        ),
        amount: p.amount,
        currency: p.currency || "NGN",
        status: mapPaymentStatus(p.status),
        method: p.paymentMethod || p.provider || "Paystack",
        type: p.type || "rent",
        confirmation: p.providerReference || p.id,
      }));
      setPaymentHistory(list);
      setTotal(payload.total || 0);
      setPage(payload.page || 1);
      setPageSize(payload.pageSize || 10);
    }
  };

  React.useEffect(() => {
    loadPaymentHistory();
    const token = localStorage.getItem("auth_token");
    if (token && !isConnected()) {
      try {
        initializeSocket(token);
      } catch {}
    }
    subscribeToPaymentEvents({
      onUpdated: () => loadPaymentHistory(),
      onReceived: () => loadPaymentHistory(),
    });
    const handleBrowserPaymentUpdate = () => loadPaymentHistory();
    window.addEventListener("payment:updated", handleBrowserPaymentUpdate);

    // Fetch public bank transfer template (tenant-safe)
    (async () => {
      const resp = await getPublicPaymentGatewaySettings();
      if (!resp.error && resp.data?.bankTransferTemplate) {
        setBankTransferTemplate(resp.data.bankTransferTemplate);
      }
    })();

    // Fetch owner's Paystack public key for card addition (tenant-safe)
    (async () => {
      const resp = await getTenantPublicPaymentGateway();
      if (!resp.error) {
        setOwnerPublicKey(resp.data?.publicKey ?? null);
      }
    })();

    return () => {
      unsubscribeFromPaymentEvents();
      window.removeEventListener("payment:updated", handleBrowserPaymentUpdate);
    };
  }, []);

  const [scheduledPayments, setScheduledPayments] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [addingCard, setAddingCard] = useState(false);

  // Load payment methods
  const loadPaymentMethods = async () => {
    try {
      setLoadingMethods(true);
      const response = await getPaymentMethods();
      console.log("[Payment Methods] Response:", response);
      if (response.error) {
        console.error("Failed to load payment methods:", response.error);
      } else if (response.data) {
        // Backend returns { success: true, data: [...] }
        // So we need to extract response.data.data
        const responseData = response.data as any;
        const list = Array.isArray(responseData.data)
          ? responseData.data
          : Array.isArray(responseData)
          ? responseData
          : responseData.paymentMethods || [];
        console.log("[Payment Methods] Extracted list:", list);
        setPaymentMethods(list);
      }
    } catch (error) {
      console.error("Load payment methods error:", error);
    } finally {
      setLoadingMethods(false);
    }
  };

  // Load payment methods on mount
  React.useEffect(() => {
    loadPaymentMethods();
  }, []);

  // Load scheduled payments
  const loadScheduledPayments = async () => {
    try {
      setLoadingScheduled(true);
      const response = await getScheduledPayments();
      if (!response.error && response.data) {
        setScheduledPayments(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Failed to load scheduled payments:", error);
    } finally {
      setLoadingScheduled(false);
    }
  };

  // Load scheduled payments on mount
  React.useEffect(() => {
    loadScheduledPayments();
  }, []);

  // Handle payment callback from Paystack/Monicredit redirect
  React.useEffect(() => {
    // Handle malformed URLs like: ?payment_ref=REF?transId=ACX...
    // URLSearchParams won't parse this correctly, so we need manual parsing
    const search = window.location.search;
    let paymentRef: string | null = null;
    let transId: string | null = null;

    // First, try normal URLSearchParams parsing
    const urlParams = new URLSearchParams(search);
    paymentRef =
      urlParams.get("transId") ||
      urlParams.get("transid") ||
      urlParams.get("payment_ref") ||
      urlParams.get("reference");
    transId = urlParams.get("transId") || urlParams.get("transid");

    // If payment_ref contains a malformed query (e.g., "REF?transId=ACX...")
    // Extract both the reference and transId manually
    if (paymentRef && paymentRef.includes("?")) {
      const parts = paymentRef.split("?");
      paymentRef = parts[0]; // First part is the actual reference

      // Try to extract transId from the malformed part
      if (parts.length > 1) {
        const malformedPart = parts.slice(1).join("?"); // Rejoin in case there are multiple ?
        const malformedParams = new URLSearchParams("?" + malformedPart);
        transId =
          malformedParams.get("transId") ||
          malformedParams.get("transid") ||
          transId;
      }
    }

    // Also check if the entire search string has malformed format
    // Pattern: ?payment_ref=REF?transId=ACX...
    if (
      !paymentRef &&
      search.includes("payment_ref=") &&
      search.includes("?transId=")
    ) {
      const paymentRefMatch = search.match(/[?&]payment_ref=([^?&]+)/);
      const transIdMatch = search.match(/[?&]transId=([^&]+)/);
      if (paymentRefMatch) {
        paymentRef = paymentRefMatch[1].split("?")[0]; // Clean any embedded query
      }
      if (transIdMatch) {
        transId = transIdMatch[1];
      }
    }

    // Prioritize transId if available (Monicredit), otherwise use payment_ref
    const finalRef = transId || paymentRef;

    // Clean the reference one more time to be safe
    if (finalRef) {
      paymentRef = finalRef.split("?")[0].split("&")[0];
    }

    const trxref = urlParams.get("trxref");
    const reference = paymentRef || trxref;

    if (reference) {
      // Clean up URL parameters immediately to prevent page flash
      const url = new URL(window.location.href);
      url.searchParams.delete("payment_ref");
      url.searchParams.delete("reference");
      url.searchParams.delete("trxref");
      url.searchParams.delete("transId"); // Monicredit support
      url.searchParams.delete("transid"); // Case variation
      window.history.replaceState({}, "", url.toString());

      // Verify the payment
      const verifyAndUpdate = async () => {
        toast.info("Verifying payment...");
        try {
          const response = await verifyPayment(reference);
          if (!response.error && response.data) {
            if (response.data.status === "success") {
              toast.success(
                "Payment successful! Your next payment has been scheduled."
              );
              // Wait a moment for backend to fully update database
              await new Promise((resolve) => setTimeout(resolve, 500));
              // Reload payment history and scheduled payments
              await loadPaymentHistory({ resetPage: true });
              await loadScheduledPayments();
              // Dispatch event to refresh dashboard data
              window.dispatchEvent(new CustomEvent("payment:success"));
            } else if (response.data.status === "failed") {
              toast.error("Payment failed. Please try again.");
              // Still refresh to show updated status
              await loadPaymentHistory({ resetPage: true });
            } else {
              toast.info("Payment is being processed...");
              // Refresh to show current status
              await loadPaymentHistory({ resetPage: true });
            }
          } else {
            toast.error("Failed to verify payment");
            // Refresh anyway to get latest status
            await loadPaymentHistory({ resetPage: true });
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          toast.error("Failed to verify payment");
          // Refresh to get latest status even on error
          await loadPaymentHistory({ resetPage: true });
        }
      };

      verifyAndUpdate();
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "success":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleMakePayment = async () => {
    try {
      if (!dashboardData?.lease?.id) {
        toast.error("Lease not found");
        return;
      }
      const amountNum = parseFloat(paymentAmount || "0");
      if (!amountNum || amountNum <= 0) {
        toast.error("Enter a valid amount");
        return;
      }

      // For non-Paystack methods, show instructions
      if (paymentMethod !== "paystack") {
        const methodName = paymentMethod === "cash" ? "Cash" : "Bank Transfer";
        toast.info(
          `${methodName} payment selected. Please contact your property manager to record the payment after completion.`,
          {
            duration: 8000,
          }
        );
        setShowPaymentDialog(false);
        return;
      }

      // Online payment flow (Paystack or Monicredit)
      setIsSubmitting(true);
      const resp = await initializeTenantPayment({
        leaseId: dashboardData.lease.id,
        amount: selectedPaymentType === "full" ? currentRent.amount : amountNum,
        currency: dashboardData?.lease?.currency || undefined,
      });
      setIsSubmitting(false);
      if ((resp as any).error) {
        const errorData = (resp as any).error;
        const msg = errorData?.error || "Failed to initialize payment";
        const details = errorData?.details || "";
        toast.error(
          <div>
            <div className="font-semibold">{msg}</div>
            {details && <div className="text-sm mt-1">{details}</div>}
          </div>,
          { duration: 8000 }
        );
        console.error("[Payment Init] Error:", errorData);
        return;
      }
      const { authorizationUrl } = (resp as any).data || {};
      if (!authorizationUrl) {
        toast.error("Failed to start payment. No authorization URL received.");
        console.error(
          "[Payment Init] Missing authorizationUrl in response:",
          (resp as any).data
        );
        return;
      }
      // Redirect to payment gateway checkout
      window.location.href = authorizationUrl;
    } catch (e: any) {
      setIsSubmitting(false);
      toast.error("Payment initialization failed");
      console.error(e);
    }
  };

  const handleOpenPaymentDialog = (type: "full" | "custom" = "full") => {
    setSelectedPaymentType(type);
    if (type === "full") {
      setPaymentAmount(currentRent.amount.toString());
    } else {
      setPaymentAmount("");
    }
    setShowPaymentDialog(true);
  };

  const handleAddCard = async () => {
    try {
      if (!dashboardData?.user?.email) {
        toast.error("User email not found");
        return;
      }

      // Validate owner's Paystack public key before initializing Inline
      const paystackPublicKey = ownerPublicKey || undefined;
      const isValidKey =
        typeof paystackPublicKey === "string" &&
        /^pk_(test|live)_/.test(paystackPublicKey) &&
        paystackPublicKey.length > 12;
      if (!isValidKey) {
        toast.error(
          "We could not start this transaction, please enter a valid key."
        );
        return;
      }

      // Validate Paystack library availability
      const PaystackPop = (window as any)?.PaystackPop;
      if (!PaystackPop || typeof PaystackPop.setup !== "function") {
        toast.error(
          "Payment provider unavailable. Please refresh and try again."
        );
        return;
      }

      // Use Paystack Inline to tokenize the card with a ₦50 verification charge
      const handler = PaystackPop.setup({
        key: paystackPublicKey,
        email: dashboardData.user.email,
        amount: 5000, // ₦50 in kobo (minimum for card verification)
        currency: "NGN",
        ref: `card_verify_${Date.now()}`,
        metadata: {
          custom_fields: [
            {
              display_name: "Purpose",
              variable_name: "purpose",
              value: "Card Verification",
            },
          ],
        },
        callback: function (response: any) {
          // Card successfully charged, now save the authorization using the reference
          const reference = response.reference;

          // Call backend to save the payment method using the reference
          addPaymentMethod(reference, makeDefault)
            .then((result) => {
              if (result.error) {
                toast.error(result.error.error || "Failed to save card");
                return;
              }

              toast.success(
                "Card added successfully! The ₦50 verification charge will be refunded."
              );
              setShowAddCardDialog(false);
              loadPaymentMethods(); // Reload the payment methods list

              // Reset form
              setCardNumber("");
              setCardName("");
              setCardExpiry("");
              setCardCVV("");
              setMakeDefault(false);
            })
            .catch((error) => {
              console.error("Error saving card:", error);
              toast.error("Failed to save card details");
            });
        },
        onClose: function () {
          toast.info("Card addition cancelled");
        },
      });

      // Close dialog before opening Paystack to avoid overlay/focus traps
      setShowAddCardDialog(false);
      // Defer opening to allow DOM update
      setTimeout(() => {
        handler.openIframe();
      }, 50);
    } catch (error) {
      console.error("Error adding card:", error);
      toast.error("Failed to initialize card addition");
    }
  };

  // Load auto-pay settings
  const loadAutopaySettings = async () => {
    try {
      setAutopayLoading(true);
      const response = await getAutopaySettings();
      if (!response.error && response.data) {
        setAutopaySettings(response.data);
        setSelectedAutopayCard(response.data.paymentMethodId || "");
        setAutopayDay(response.data.dayOfMonth || 1);
      }
    } catch (error) {
      console.error("Failed to load autopay settings:", error);
    } finally {
      setAutopayLoading(false);
    }
  };

  // Load auto-pay settings on mount
  React.useEffect(() => {
    loadAutopaySettings();
  }, []);

  const handleToggleAutoPay = async () => {
    const newStatus = !autopaySettings?.enabled;

    // If enabling, require a payment method
    if (newStatus && !selectedAutopayCard && paymentMethods.length === 0) {
      toast.error("Please add a payment method first before enabling auto-pay");
      return;
    }

    // If enabling and no card selected, use default
    const cardToUse =
      selectedAutopayCard ||
      paymentMethods.find((m) => m.isDefault)?.id ||
      paymentMethods[0]?.id;

    if (newStatus && !cardToUse) {
      toast.error("Please select a payment method for auto-pay");
      return;
    }

    try {
      setAutopayLoading(true);
      const response = await updateAutopaySettings({
        enabled: newStatus,
        paymentMethodId: newStatus ? cardToUse : null,
        dayOfMonth: autopayDay,
      });

      if (response.error) {
        toast.error(
          response.error.error || "Failed to update auto-pay settings"
        );
        return;
      }

      // Reload settings
      await loadAutopaySettings();
      await loadScheduledPayments();

      if (newStatus) {
        toast.success(
          `Auto-pay enabled! Your rent will be automatically charged on day ${autopayDay} of each month.`
        );
      } else {
        toast.success(
          "Auto-pay has been disabled. You will need to manually pay your rent."
        );
      }
    } catch (error) {
      console.error("Failed to toggle autopay:", error);
      toast.error("Failed to update auto-pay settings");
    } finally {
      setAutopayLoading(false);
    }
  };

  const handleUpdateAutopayCard = async (cardId: string) => {
    setSelectedAutopayCard(cardId);

    if (autopaySettings?.enabled) {
      try {
        const response = await updateAutopaySettings({
          enabled: true,
          paymentMethodId: cardId,
          dayOfMonth: autopayDay,
        });

        if (response.error) {
          toast.error("Failed to update payment method");
          return;
        }

        await loadAutopaySettings();
        toast.success("Auto-pay card updated");
      } catch (error) {
        toast.error("Failed to update auto-pay card");
      }
    }
  };

  const handleUpdateAutopayDay = async (day: number) => {
    setAutopayDay(day);

    if (autopaySettings?.enabled) {
      try {
        const response = await updateAutopaySettings({
          enabled: true,
          paymentMethodId: selectedAutopayCard,
          dayOfMonth: day,
        });

        if (response.error) {
          toast.error("Failed to update payment day");
          return;
        }

        await loadAutopaySettings();
        await loadScheduledPayments();
        toast.success(`Auto-pay day updated to ${day}`);
      } catch (error) {
        toast.error("Failed to update auto-pay day");
      }
    }
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] p-6 md:p-8 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg hidden md:flex">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Payments
              </h1>
              <p className="text-white/80 font-medium mt-1">
                Manage your rent payments and view history
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenPaymentDialog("custom")}
              size="lg"
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 font-semibold shadow-lg transition-all duration-200"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Custom Payment
            </Button>
            <Button
              onClick={() => handleOpenPaymentDialog("full")}
              size="lg"
              className="bg-white hover:bg-gray-50 text-[#7C3AED] font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Pay Rent
            </Button>
          </div>
        </div>
      </div>

      {/* Current Rent Status */}
      {currentRent.balance === 0 && currentRent.daysUntilDue <= 15 && (
        <Card className="border-0 shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div
            className={`p-4 md:p-5 ${
              currentRent.daysUntilDue <= 3
                ? "bg-gradient-to-r from-red-500 to-pink-500"
                : currentRent.daysUntilDue <= 7
                ? "bg-gradient-to-r from-orange-500 to-amber-500"
                : "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6]"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white/90 text-sm font-medium">
                    Rent Payment Due
                  </p>
                  <p className="text-white text-lg font-bold">
                    ₦{currentRent.amount.toLocaleString()} •{" "}
                    {currentRent.daysUntilDue} days remaining
                  </p>
                  <p className="text-white/80 text-xs font-medium mt-0.5">
                    Due on {currentRent.dueDate}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full sm:w-auto shrink-0 bg-white hover:bg-gray-50 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => handleOpenPaymentDialog("full")}
              >
                Pay Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {currentRent.balance > 0 && (
        <Card className="border-0 shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div className="p-4 md:p-5 bg-gradient-to-r from-red-500 to-pink-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white/90 text-sm font-medium">
                    Outstanding Balance
                  </p>
                  <p className="text-white text-lg font-bold">
                    ₦{currentRent.balance.toLocaleString()}
                  </p>
                  <p className="text-white/80 text-xs font-medium mt-0.5">
                    Please pay as soon as possible
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full sm:w-auto shrink-0 bg-white hover:bg-gray-50 text-red-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => handleOpenPaymentDialog("custom")}
              >
                Pay Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">
              Next Payment
            </CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 p-2 md:p-2.5 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">
              ₦{currentRent.amount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Due {currentRent.dueDate}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">
              Balance
            </CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2 md:p-2.5 shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">
              ₦{currentRent.balance.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {currentRent.balance === 0 ? "✨ All paid up!" : "Outstanding"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div
            className={`absolute inset-0 ${
              currentRent.autopayEnabled
                ? "bg-gradient-to-br from-green-500/5 to-emerald-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10"
                : "bg-gradient-to-br from-gray-500/5 to-slate-500/5 group-hover:from-gray-500/10 group-hover:to-slate-500/10"
            } transition-all duration-300`}
          ></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">
              Auto-Pay
            </CardTitle>
            <div
              className={`rounded-xl p-2 md:p-2.5 shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                currentRent.autopayEnabled
                  ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/25"
                  : "bg-gradient-to-br from-gray-400 to-slate-500 shadow-gray-500/25"
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div
              className={`text-xl md:text-3xl font-bold ${
                currentRent.autopayEnabled ? "text-green-600" : "text-gray-900"
              }`}
            >
              {currentRent.autopayEnabled ? "Enabled" : "Disabled"}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {currentRent.autopayEnabled
                ? "Auto-charging active"
                : "Manual payments"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">
              Cards
            </CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2 md:p-2.5 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">
              {paymentMethods.length}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Payment methods saved
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm p-1.5 border border-gray-200 shadow-lg rounded-xl h-auto flex-wrap">
          <TabsTrigger
            value="history"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Payment History
          </TabsTrigger>
          <TabsTrigger
            value="scheduled"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger
            value="methods"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Methods
          </TabsTrigger>
        </TabsList>

        {/* Payment History */}
        <TabsContent value="history" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2.5 shadow-lg shadow-green-500/25">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 font-bold text-lg">
                      Payment History
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium">
                      All your past payments and transactions
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-200 text-green-700 hover:bg-green-50 font-semibold"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {paymentHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gradient-to-br from-gray-100 to-slate-100 p-6 mb-4">
                    <Receipt className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Payment History
                  </h3>
                  <p className="text-gray-500 text-center max-w-sm">
                    Your payment history will appear here once you make your
                    first payment.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Date
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Time
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Type
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Method
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Confirmation
                          </TableHead>
                          <TableHead className="text-right whitespace-nowrap font-semibold text-gray-700">
                            Amount
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-gray-700">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentHistory.map((payment) => (
                          <TableRow
                            key={payment.id}
                            className="hover:bg-green-50/50 transition-colors border-b border-gray-100"
                          >
                            <TableCell className="whitespace-nowrap font-medium text-gray-900">
                              {payment.date}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                              {payment.timestamp}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-gray-600 capitalize">
                              {payment.type}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                              {payment.method}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500 whitespace-nowrap font-mono text-xs">
                              {payment.confirmation}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900 whitespace-nowrap">
                              {payment.currency === "NGN" ? "₦" : ""}
                              {payment.amount.toLocaleString()}{" "}
                              {payment.currency !== "NGN"
                                ? payment.currency
                                : ""}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge
                                className={
                                  getStatusColor(payment.status) +
                                  " font-semibold border capitalize"
                                }
                              >
                                {payment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between p-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">
                      Page {page} of {totalPages} • {total} items
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => {
                          setPage((p) => Math.max(1, p - 1));
                          setTimeout(() => loadPaymentHistory(), 0);
                        }}
                        className="font-semibold"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => {
                          setPage((p) => Math.min(totalPages, p + 1));
                          setTimeout(() => loadPaymentHistory(), 0);
                        }}
                        className="font-semibold"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Payments */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 p-2.5 shadow-lg shadow-blue-500/25">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">
                    Scheduled Payments
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Upcoming rent payments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingScheduled ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500 font-medium">
                      Loading scheduled payments...
                    </p>
                  </div>
                </div>
              ) : scheduledPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-6 mb-4">
                    <Calendar className="h-12 w-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Scheduled Payments
                  </h3>
                  <p className="text-gray-500 text-center max-w-sm">
                    Your next payment will appear here after you make a payment
                    or enable auto-pay.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {scheduledPayments.map((payment) => {
                    const scheduledDate = payment.scheduledDate
                      ? new Date(payment.scheduledDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )
                      : "TBD";
                    const daysUntil = payment.scheduledDate
                      ? Math.ceil(
                          (new Date(payment.scheduledDate).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : null;

                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-5 hover:bg-blue-50/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">
                              {payment.currency || "₦"}
                              {payment.amount?.toLocaleString()}
                              <span className="text-sm font-medium text-gray-500 ml-2">
                                (
                                {payment.rentFrequency === "annual"
                                  ? "Annual"
                                  : "Monthly"}{" "}
                                Rent)
                              </span>
                            </p>
                            <p className="text-sm text-gray-600 font-medium">
                              Due: {scheduledDate}
                              {daysUntil !== null && daysUntil > 0 && (
                                <span className="ml-2 text-blue-600">
                                  ({daysUntil} days remaining)
                                </span>
                              )}
                            </p>
                            {payment.lease && (
                              <p className="text-xs text-gray-500 mt-1">
                                {payment.lease.properties?.name} - Unit{" "}
                                {payment.lease.units?.unitNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold">
                          Scheduled
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="methods" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-2.5 shadow-lg shadow-purple-500/25">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 font-bold text-lg">
                      Payment Methods
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium">
                      Manage your saved payment methods
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAddCardDialog(true)}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingMethods ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500 font-medium">
                      Loading payment methods...
                    </p>
                  </div>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 p-6 mb-4">
                    <CreditCard className="h-12 w-12 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Payment Methods
                  </h3>
                  <p className="text-gray-500 text-center max-w-sm mb-4">
                    Add a card to enable quick payments and auto-pay.
                  </p>
                  <Button
                    onClick={() => setShowAddCardDialog(true)}
                    className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Your First Card
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-5 hover:bg-purple-50/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-3 rounded-xl ${
                            method.isDefault
                              ? "bg-gradient-to-br from-purple-100 to-indigo-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <CreditCard
                            className={`h-6 w-6 ${
                              method.isDefault
                                ? "text-purple-600"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 flex items-center gap-2">
                            {method.cardBrand} •••• {method.cardLast4}
                            {method.isDefault && (
                              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 font-semibold text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-gray-500 font-medium">
                            Expires {method.cardExpMonth}/{method.cardExpYear}
                          </p>
                          {method.bank && (
                            <p className="text-xs text-gray-400">
                              {method.bank}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const result = await setDefaultPaymentMethod(
                                method.id
                              );
                              if (result.error) {
                                toast.error("Failed to set default card");
                              } else {
                                toast.success("Default card updated");
                                loadPaymentMethods();
                              }
                            }}
                            className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
                          onClick={async () => {
                            if (
                              confirm(
                                "Are you sure you want to remove this card?"
                              )
                            ) {
                              const result = await removePaymentMethod(
                                method.id
                              );
                              if (result.error) {
                                toast.error("Failed to remove card");
                              } else {
                                toast.success("Card removed successfully");
                                loadPaymentMethods();
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto-Pay Settings */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2.5 shadow-lg shadow-green-500/25">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">
                    Auto-Pay Settings
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Automatically pay rent each{" "}
                    {autopaySettings?.rentFrequency === "annual"
                      ? "year"
                      : "month"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="font-bold text-gray-900">Enable Auto-Pay</p>
                  <p className="text-sm text-gray-500 font-medium">
                    Automatically charge your selected payment method on your
                    chosen day
                  </p>
                </div>
                <Button
                  onClick={handleToggleAutoPay}
                  disabled={autopayLoading}
                  className={
                    autopaySettings?.enabled
                      ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-red-500/25"
                      : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-green-500/25"
                  }
                >
                  {autopayLoading
                    ? "Updating..."
                    : autopaySettings?.enabled
                    ? "Disable"
                    : "Enable"}
                </Button>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Card</Label>
                {paymentMethods.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 border rounded-lg bg-muted/50">
                    <p>No payment methods added yet.</p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary"
                      onClick={() => setShowAddCardDialog(true)}
                    >
                      Add a card to enable auto-pay
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={selectedAutopayCard}
                    onValueChange={handleUpdateAutopayCard}
                    disabled={!autopaySettings?.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a card for auto-pay" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>
                              {method.cardBrand || "Card"} ••••{" "}
                              {method.cardLast4}
                            </span>
                            {method.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Payment Day Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Day</Label>
                <Select
                  value={autopayDay.toString()}
                  onValueChange={(val) => handleUpdateAutopayDay(parseInt(val))}
                  disabled={!autopaySettings?.enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day of month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        Day {day} of each{" "}
                        {autopaySettings?.rentFrequency === "annual"
                          ? "year"
                          : "month"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  We limit to day 28 to ensure consistent payments across all
                  months
                </p>
              </div>

              {/* Status Alert */}
              {autopaySettings?.enabled && selectedAutopayCard && (
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-green-900 mb-1">
                        Auto-Pay Active
                      </p>
                      <p className="text-sm text-green-700">
                        Your{" "}
                        {autopaySettings?.rentFrequency === "annual"
                          ? "annual"
                          : "monthly"}{" "}
                        rent of{" "}
                        <strong>
                          ₦{(autopaySettings?.amount || 0).toLocaleString()}
                        </strong>{" "}
                        will be automatically charged to{" "}
                        <strong>
                          {paymentMethods.find(
                            (m) => m.id === selectedAutopayCard
                          )?.cardBrand || "Card"}{" "}
                          ••••{" "}
                          {
                            paymentMethods.find(
                              (m) => m.id === selectedAutopayCard
                            )?.cardLast4
                          }
                        </strong>{" "}
                        on day {autopayDay} of each{" "}
                        {autopaySettings?.rentFrequency === "annual"
                          ? "year"
                          : "month"}
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!autopaySettings?.enabled && (
                <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                      <AlertCircle className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">
                        Auto-Pay Disabled
                      </p>
                      <p className="text-sm text-gray-600">
                        You will need to manually pay your rent each{" "}
                        {autopaySettings?.rentFrequency === "annual"
                          ? "year"
                          : "month"}
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Make Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -m-6 mb-0 p-6 rounded-t-lg">
            <DialogTitle className="text-2xl font-bold text-white">
              Make a Payment
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium">
              {selectedPaymentType === "full"
                ? "Pay your rent securely online"
                : "Make a custom payment amount"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPaymentType === "custom" && (
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={
                      paymentAmount === currentRent.amount.toString()
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setPaymentAmount(currentRent.amount.toString())
                    }
                    type="button"
                  >
                    Full Rent (₦{currentRent.amount.toLocaleString()})
                  </Button>
                  <Button
                    variant={
                      paymentAmount !== currentRent.amount.toString()
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setPaymentAmount("")}
                    type="button"
                  >
                    Partial/Other
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₦
                </span>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  readOnly={selectedPaymentType === "full"}
                  className="pl-7"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {selectedPaymentType === "custom" && currentRent.balance > 0 && (
                <p className="text-sm text-muted-foreground">
                  Outstanding balance: ₦{currentRent.balance.toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="paystack" id="method-paystack" />
                  <Label
                    htmlFor="method-paystack"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Pay Online (Card/Bank)</p>
                        <p className="text-xs text-muted-foreground">
                          Pay online with card or bank transfer
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="bank_transfer" id="method-bank" />
                  <Label
                    htmlFor="method-bank"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">Bank Transfer</p>
                        <p className="text-xs text-muted-foreground">
                          Transfer directly to property account
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="cash" id="method-cash" />
                  <Label
                    htmlFor="method-cash"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-medium">Cash</p>
                        <p className="text-xs text-muted-foreground">
                          Pay in person at property office
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Alert>
              {paymentMethod === "paystack" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    You'll be redirected to complete your payment securely. A
                    receipt will be emailed after confirmation.
                  </AlertDescription>
                </>
              ) : paymentMethod === "bank_transfer" && bankTransferTemplate ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Bank Transfer Instructions:</p>
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border">
                        {bankTransferTemplate}
                      </pre>
                      <p className="text-xs text-muted-foreground mt-2">
                        After completing the transfer, contact your property
                        manager to record the transaction.
                      </p>
                    </div>
                  </AlertDescription>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {paymentMethod === "cash"
                      ? "After making cash payment, contact your property manager to record the transaction."
                      : "After completing bank transfer, contact your property manager to record the transaction."}
                  </AlertDescription>
                </>
              )}
            </Alert>
          </div>
          <DialogFooter className="pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              className="font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMakePayment}
              disabled={
                isSubmitting || !paymentAmount || parseFloat(paymentAmount) <= 0
              }
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25 disabled:opacity-50"
            >
              {isSubmitting
                ? "Processing…"
                : paymentMethod === "paystack"
                ? `Pay ₦${
                    paymentAmount
                      ? parseFloat(paymentAmount).toLocaleString()
                      : "0.00"
                  }`
                : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Card Dialog */}
      <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -m-6 mb-0 p-6 rounded-t-lg">
            <DialogTitle className="text-2xl font-bold text-white">
              Add Payment Method
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium">
              Securely add a credit or debit card via Paystack
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>A secure Paystack payment window will open</li>
                  <li>Enter your card details securely</li>
                  <li>A ₦50 verification charge will be made</li>
                  <li>Your card will be saved for future payments</li>
                  <li>The ₦50 will be refunded within 24 hours</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Your card information is processed securely by Paystack. We
                never see or store your full card details.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setShowAddCardDialog(false)}
              className="font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCard}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Continue to Paystack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantPaymentsPage;
