import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { ScrollArea } from "../../../components/ui/scroll-area";
import {
  Search,
  Filter,
  FileText,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Paperclip,
  Upload,
  Plus,
  MoreVertical,
  Calendar,
  DollarSign,
  Calculator,
  X,
  Edit,
  Loader2,
  Building2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { KPICard } from "./KPICard";
import { toast } from "sonner";
import {
  getPurchaseOrders,
  getPurchaseOrderInvoices,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  deletePurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  type PurchaseOrder as APIPurchaseOrder,
} from "../../../lib/api/purchase-orders";
import { createProjectInvoice, markInvoiceAsPaid, deleteProjectInvoice } from "../../../lib/api/invoices";
import {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  type Vendor,
  type CreateVendorData,
} from "../../../lib/api/vendors";
import { apiClient } from "../../../lib/api-client";
import { getProjectById } from "../services/developerDashboard.api";
import { getCurrencySymbol as getCurrencySymbolFromLib } from "../../../lib/currency";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  vendorId?: string;
  amount: number;
  status: "Approved" | "Pending" | "Matched" | "Rejected" | "draft" | "closed";
  date: string;
  items: number;
  description?: string;
  budgetLine?: string;
  category?: string;
  terms?: string;
  notes?: string;
  expiryDate?: string;
  deliveryDate?: string;
  currency?: string;
  lineItems?: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit?: string;
    category?: string;
    notes?: string;
  }>;
}

interface Invoice {
  id: string; // Database UUID
  invoiceNumber: string; // Display number (e.g., INV-2025-001)
  poRef: string;
  vendor: string;
  amount: number;
  status: "Approved" | "Pending" | "Matched" | "Rejected" | "Paid";
  date: string;
  budgetLine: string;
  attachments: number;
  description?: string;
  dueDate?: string;
  paymentMethod?: string;
  notes?: string;
  approvalSteps?: {
    step: string;
    status: "completed" | "pending" | "not-started";
    completedBy?: string;
  }[];
}

interface InvoiceAttachment {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  uploadedPath?: string;
  error?: string;
}

interface InvoiceAttachmentDetail {
  id: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  fileType: string;
  mimeType: string;
  uploadedAt: string;
  uploadedBy?: {
    id: string;
    email: string;
    name?: string;
  } | null;
  url: string;
  metadata?: any;
}

export const PurchaseOrdersPage: React.FC<{ projectId: string; canApproveInvoices?: boolean }> = ({ projectId, canApproveInvoices = true }) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPODetailOpen, setIsPODetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [isEditPOOpen, setIsEditPOOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<string[]>([]);
  const [projectCurrency, setProjectCurrency] = useState<string>('NGN');

  // Vendor management state
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorFormData, setVendorFormData] = useState<CreateVendorData>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    vendorType: 'contractor',
    specialization: '',
    rating: undefined,
    status: 'active',
    notes: '',
  });
  const [vendorFormErrors, setVendorFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);

  // Create PO form state
  const [poFormData, setPoFormData] = useState({
    vendorId: '',
    vendorName: '',
    description: '',
    category: '',
    totalAmount: '',
    currency: projectCurrency,
    terms: '',
    notes: '',
    expiryDate: '',
    deliveryDate: '',
    items: [] as Array<{
      description: string;
      quantity: string;
      unitPrice: string;
      unit: string;
      category: string;
    }>,
  });
  const [poFormErrors, setPoFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);

  // Create Invoice form state
  const [invoiceFormData, setInvoiceFormData] = useState({
    purchaseOrderId: '',
    description: '',
    category: '',
    amount: '',
    currency: projectCurrency,
    dueDate: '',
    paymentMethod: '',
    notes: '',
  });
  const [invoiceFormErrors, setInvoiceFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  const [invoiceAttachments, setInvoiceAttachments] = useState<InvoiceAttachment[]>([]);
  const [isDraggingInvoiceAttachment, setIsDraggingInvoiceAttachment] = useState(false);
  const [invoiceAttachmentsDetail, setInvoiceAttachmentsDetail] = useState<InvoiceAttachmentDetail[]>([]);
  const [loadingInvoiceAttachments, setLoadingInvoiceAttachments] = useState(false);

  // Payment form state for marking invoice as paid
  const [paymentFormData, setPaymentFormData] = useState({
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    paidDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Fetch vendors for the project
  useEffect(() => {
    fetchVendorsList();
  }, [projectId]);

  const fetchVendorsList = async () => {
    try {
      const response = await getVendors({ status: 'active' });
      if (response.error) {
        console.error('Error fetching vendors:', response.error);
        setVendors([]);
      } else if (response.data) {
        setVendors(response.data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    }
  };

  const fetchInvoiceAttachmentsDetail = async (invoiceId: string) => {
    try {
      setLoadingInvoiceAttachments(true);
      const response = await apiClient.get<any>(
        `/api/developer-dashboard/projects/${projectId}/invoices/${invoiceId}/attachments`
      );

      if (response.error) {
        console.error(
          "[PurchaseOrdersPage] Failed to fetch invoice attachments:",
          response.error
        );
        setInvoiceAttachmentsDetail([]);
        return;
      }

      const payload = response.data as any;
      if (payload?.success && Array.isArray(payload.data)) {
        setInvoiceAttachmentsDetail(payload.data as InvoiceAttachmentDetail[]);
      } else {
        setInvoiceAttachmentsDetail([]);
      }
    } catch (error) {
      console.error("[PurchaseOrdersPage] Error fetching invoice attachments:", error);
      setInvoiceAttachmentsDetail([]);
    } finally {
      setLoadingInvoiceAttachments(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleInvoiceFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: InvoiceAttachment[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: "pending",
      uploadedPath: undefined,
      error: undefined,
    }));

    setInvoiceAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleInvoiceDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingInvoiceAttachment(true);
  };

  const handleInvoiceDragLeave = () => {
    setIsDraggingInvoiceAttachment(false);
  };

  const handleInvoiceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingInvoiceAttachment(false);
    handleInvoiceFileSelect(e.dataTransfer.files);
  };

  const removeInvoiceAttachment = (id: string) => {
    setInvoiceAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const uploadInvoiceAttachment = async (attachment: InvoiceAttachment): Promise<string | null> => {
    // Mark as uploading
    setInvoiceAttachments((prev) =>
      prev.map((att) =>
        att.id === attachment.id ? { ...att, status: "uploading", error: undefined } : att
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", attachment.file);
      formData.append("description", `Invoice attachment: ${attachment.file.name}`);

      const response = await apiClient.post<any>("/api/storage/upload-invoice-attachment", formData);

      if (response.error) {
        const message =
          response.error.message ||
          response.error.error ||
          "Failed to upload attachment";

        setInvoiceAttachments((prev) =>
          prev.map((att) =>
            att.id === attachment.id
              ? { ...att, status: "error", error: message }
              : att
          )
        );
        return null;
      }

      const result = response.data as any;

      if (!result?.success) {
        const message = result?.error || "Failed to upload attachment";
        setInvoiceAttachments((prev) =>
          prev.map((att) =>
            att.id === attachment.id
              ? { ...att, status: "error", error: message }
              : att
          )
        );
        return null;
      }

      const filePath = result.data?.filePath as string | undefined;

      setInvoiceAttachments((prev) =>
        prev.map((att) =>
          att.id === attachment.id
            ? { ...att, status: "success", uploadedPath: filePath, error: undefined }
            : att
        )
      );

      return filePath || null;
    } catch (error: any) {
      console.error("Error uploading invoice attachment:", error);
      setInvoiceAttachments((prev) =>
        prev.map((att) =>
          att.id === attachment.id
            ? {
                ...att,
                status: "error",
                error: error?.message || "Failed to upload attachment",
              }
            : att
        )
      );
      return null;
    }
  };

  const uploadAllInvoiceAttachments = async (): Promise<{ paths: string[]; failed: number }> => {
    const existingPaths = invoiceAttachments
      .filter((att) => att.status === "success" && att.uploadedPath)
      .map((att) => att.uploadedPath!) as string[];

    const pending = invoiceAttachments.filter((att) => att.status === "pending");

    const paths: string[] = [...existingPaths];
    let failed = 0;

    for (const attachment of pending) {
      const filePath = await uploadInvoiceAttachment(attachment);
      if (filePath) {
        paths.push(filePath);
      } else {
        failed++;
      }
    }

    return { paths, failed };
  };

  // Fetch project currency
  useEffect(() => {
    const fetchProjectCurrency = async () => {
      try {
        const response = await getProjectById(projectId);
        if (response.success && response.data) {
          const currency = response.data.currency || 'NGN';
          setProjectCurrency(currency);
          // Update form defaults with project currency
          setPoFormData(prev => ({ ...prev, currency }));
          setInvoiceFormData(prev => ({ ...prev, currency }));
        }
      } catch (error) {
        console.error('Failed to fetch project currency:', error);
        // Keep default 'NGN' if fetch fails
      }
    };

    if (projectId) {
      fetchProjectCurrency();
    }
  }, [projectId]);

  // Fetch budget categories from project budget
  useEffect(() => {
    const fetchBudgetCategories = async () => {
      try {
        // TODO: Fetch from project budget API
        // For now, use common construction categories
        setBudgetCategories([
          'Foundation & Structure',
          'MEP Systems',
          'Finishes & Fixtures',
          'Landscaping',
          'Professional Fees',
          'Permits & Approvals',
          'Contingency',
          'Other',
        ]);
      } catch (error) {
        console.error('Error fetching budget categories:', error);
      }
    };

    fetchBudgetCategories();
  }, [projectId]);

  // Fetch invoices for a purchase order
  const fetchInvoicesForPO = async (poId: string) => {
    try {
      const response = await getPurchaseOrderInvoices(poId);

      if (response.error) {
        console.error('Error fetching invoices:', response.error);
        setInvoices([]);
        return;
      }

      if (response.data) {
        // Map API response to component interface
        const mappedInvoices: Invoice[] = response.data.data.map((inv: any) => {
          // Fallback to PO vendor if invoice doesn't have vendor
          const vendorName = inv.vendor?.name || inv.purchaseOrder?.vendor?.name || 'Unknown Vendor';
          const poRef = inv.purchaseOrder?.poNumber || 'N/A';

          return {
            id: inv.id, // Database UUID for API calls
            invoiceNumber: inv.invoiceNumber || inv.id, // Display number
            poRef: poRef,
            vendor: vendorName,
            amount: inv.amount,
            status: inv.status === 'paid' ? 'Paid' :
                   inv.status === 'approved' ? 'Approved' :
                   inv.status === 'pending' ? 'Pending' :
                   inv.status === 'rejected' ? 'Rejected' :
                   inv.status === 'matched' ? 'Matched' : 'Pending',
            date: inv.createdAt,
            budgetLine: inv.category,
            attachments: Array.isArray(inv.attachments) ? inv.attachments.length : 0,
            description: inv.description,
            dueDate: inv.dueDate,
            paymentMethod: inv.paymentMethod,
            notes: inv.notes,
            approvalSteps: [], // TODO: Map from approval workflow if available
          };
        });

        setInvoices(mappedInvoices);
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    }
  };

  // Fetch purchase orders from API
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        setLoading(true);
        const response = await getPurchaseOrders(projectId);

        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch purchase orders');
        }

        if (response.data) {
          // Map API response to component interface
          const mappedPOs: PurchaseOrder[] = response.data.data.map(mapAPIPurchaseOrder);

          setPurchaseOrders(mappedPOs);

          // Set first PO as selected if available
          if (mappedPOs.length > 0) {
            setSelectedPO(mappedPOs[0]);
            // Fetch invoices for selected PO
            fetchInvoicesForPO(mappedPOs[0].id);
          }
        }
      } catch (error: any) {
        console.error('Error fetching purchase orders:', error);
        toast.error(error?.message || 'Failed to load purchase orders');
        setPurchaseOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, [projectId]);

  // Update invoices when selected PO changes
  useEffect(() => {
    if (selectedPO) {
      fetchInvoicesForPO(selectedPO.id);
    } else {
      setInvoices([]);
    }
  }, [selectedPO]);

  // Helper function to map API PO to component PO
  const mapAPIPurchaseOrder = (po: APIPurchaseOrder): PurchaseOrder => ({
    id: po.id,
    poNumber: po.poNumber,
    vendor: po.vendor?.name || 'Unknown Vendor',
    vendorId: po.vendorId,
    amount: po.totalAmount,
    status: po.status === 'approved' ? 'Approved' :
           po.status === 'pending' ? 'Pending' :
           po.status === 'rejected' ? 'Rejected' :
           po.status === 'closed' ? 'Matched' :
           po.status === 'draft' ? 'Pending' : 'Pending',
    date: po.createdAt,
    items: po.itemCount,
    description: po.description,
    budgetLine: po.category,
    category: po.category,
    terms: po.terms,
    notes: po.notes,
    expiryDate: po.expiryDate,
    deliveryDate: po.deliveryDate,
    currency: po.currency,
    lineItems: po.items?.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      unit: item.unit,
      category: item.category,
      notes: item.notes,
    })),
  });

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "paid":
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
            <CheckCircle className="w-3 h-3" />
            Paid
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
          </Badge>
        );
      case "pending":
      case "draft":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "matched":
      case "closed":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white gap-1">
            <CheckCircle className="w-3 h-3" />
            Matched
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get currency symbol for labels
  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: Record<string, string> = {
      NGN: '₦',
      XOF: 'CFA',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return symbols[currencyCode] || currencyCode;
  };

  const formatCurrency = (value: number) => {
    // Use centralized currency symbol to avoid "F CFA" issue with Intl.NumberFormat
    const symbol = getCurrencySymbolFromLib(projectCurrency);
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${symbol}${formatted}`;
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (po.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || po.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Invoices are already filtered by API when selectedPO changes, so use invoices directly
  const relatedInvoices = invoices;

  // Calculate KPIs
  const totalPOValue = purchaseOrders.reduce((sum, po) => sum + po.amount, 0);
  const approvedPOs = purchaseOrders.filter(po => po.status === "Approved").length;
  const pendingPOs = purchaseOrders.filter(po => po.status === "Pending").length;
  const totalInvoiceValue = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  const handleApprovePO = async (poId: string) => {
    try {
      const response = await approvePurchaseOrder(poId);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to approve purchase order');
      }

      toast.success('Purchase order approved successfully');

      // Refresh purchase orders list
      const refreshResponse = await getPurchaseOrders(projectId);
      if (refreshResponse.data) {
        const mappedPOs: PurchaseOrder[] = refreshResponse.data.data.map(mapAPIPurchaseOrder);
        setPurchaseOrders(mappedPOs);
      }
    } catch (error: any) {
      console.error('Error approving purchase order:', error);
      toast.error(error?.message || 'Failed to approve purchase order');
    }
  };

  const handleRejectPO = async (poId: string, reason?: string) => {
    try {
      const response = await rejectPurchaseOrder(poId, reason);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to reject purchase order');
      }

      toast.success('Purchase order rejected');

      // Refresh purchase orders list
      const refreshResponse = await getPurchaseOrders(projectId);
      if (refreshResponse.data) {
        const mappedPOs: PurchaseOrder[] = refreshResponse.data.data.map(mapAPIPurchaseOrder);
        setPurchaseOrders(mappedPOs);
      }
    } catch (error: any) {
      console.error('Error rejecting purchase order:', error);
      toast.error(error?.message || 'Failed to reject purchase order');
    }
  };

  const handleApproveInvoice = (invId: string) => {
    // TODO: Implement invoice approval API call
    setInvoices(prev => prev.map(inv =>
      inv.id === invId ? { ...inv, status: "Approved" as const } : inv
    ));
    toast.success('Invoice approved');
  };

  const handleMatchInvoice = (invId: string) => {
    // TODO: Implement invoice matching API call
    setInvoices(prev => prev.map(inv =>
      inv.id === invId ? { ...inv, status: "Matched" as const } : inv
    ));
    toast.success('Invoice matched to purchase order');
  };

  // Vendor management handlers
  const handleOpenVendorDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setVendorFormData({
        name: vendor.name,
        contactPerson: vendor.contactPerson || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        vendorType: vendor.vendorType,
        specialization: vendor.specialization || '',
        rating: vendor.rating,
        status: vendor.status,
        notes: vendor.notes || '',
      });
    } else {
      setEditingVendor(null);
      setVendorFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        vendorType: 'contractor',
        specialization: '',
        rating: undefined,
        status: 'active',
        notes: '',
      });
    }
    setVendorFormErrors({});
    setIsVendorDialogOpen(true);
  };

  const validateVendorForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!vendorFormData.name.trim()) {
      errors.name = 'Vendor name is required';
    }

    if (!vendorFormData.vendorType) {
      errors.vendorType = 'Vendor type is required';
    }

    if (vendorFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorFormData.email)) {
      errors.email = 'Invalid email format';
    }

    if (vendorFormData.rating !== undefined && (vendorFormData.rating < 0 || vendorFormData.rating > 5)) {
      errors.rating = 'Rating must be between 0 and 5';
    }

    setVendorFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveVendor = async () => {
    if (!validateVendorForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingVendor(true);

    try {
      if (editingVendor) {
        // Update existing vendor
        const response = await updateVendor(editingVendor.id, vendorFormData);
        if (response.error) {
          throw new Error(response.error.message || 'Failed to update vendor');
        }
        toast.success('Vendor updated successfully');
      } else {
        // Create new vendor
        const response = await createVendor(vendorFormData);
        if (response.error) {
          throw new Error(response.error.message || 'Failed to create vendor');
        }
        toast.success('Vendor created successfully');
      }

      setIsVendorDialogOpen(false);
      await fetchVendorsList();
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast.error(error?.message || 'Failed to save vendor');
    } finally {
      setIsSubmittingVendor(false);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await deleteVendor(vendorId);
      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete vendor');
      }
      toast.success('Vendor deleted successfully');
      await fetchVendorsList();
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast.error(error?.message || 'Failed to delete vendor');
    }
  };

  // Handle Edit PO
  const handleOpenEditPO = (po: PurchaseOrder) => {
    setEditingPO(po);

    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateString?: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    setPoFormData({
      vendorId: po.vendorId || '',
      vendorName: po.vendor,
      description: po.description || '',
      category: po.category || po.budgetLine || '',
      totalAmount: po.amount.toString(),
      currency: po.currency || 'NGN',
      terms: po.terms || '',
      notes: po.notes || '',
      expiryDate: formatDateForInput(po.expiryDate),
      deliveryDate: formatDateForInput(po.deliveryDate),
      items: po.lineItems?.map(item => ({
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        unit: item.unit || 'pcs',
        category: item.category || po.category || '',
      })) || [],
    });
    setIsEditPOOpen(true);
  };

  const handleUpdatePO = async () => {
    if (!validatePOForm() || !editingPO) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingPO(true);

    try {
      const response = await updatePurchaseOrder(editingPO.id, {
        vendorId: poFormData.vendorId || undefined,
        description: poFormData.description,
        category: poFormData.category,
        totalAmount: parseFloat(poFormData.totalAmount),
        terms: poFormData.terms || undefined,
        notes: poFormData.notes || undefined,
        expiryDate: poFormData.expiryDate || undefined,
        deliveryDate: poFormData.deliveryDate || undefined,
        items: poFormData.items.length > 0
          ? poFormData.items.map(item => ({
              description: item.description,
              quantity: parseFloat(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              unit: item.unit || undefined,
              category: item.category || undefined,
            }))
          : undefined,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update purchase order');
      }

      toast.success('Purchase order updated successfully');
      setIsEditPOOpen(false);
      setEditingPO(null);

      // Refresh PO list
      const refreshResponse = await getPurchaseOrders(projectId);
      if (refreshResponse.data) {
        const mappedPOs: PurchaseOrder[] = refreshResponse.data.data.map(mapAPIPurchaseOrder);
        setPurchaseOrders(mappedPOs);

        // Update the selected PO if it's the one we just edited
        const updatedPO = mappedPOs.find(po => po.id === editingPO.id);
        if (updatedPO) {
          setSelectedPO(updatedPO);
        }
      }
    } catch (error: any) {
      console.error('Error updating purchase order:', error);
      toast.error(error?.message || 'Failed to update purchase order');
    } finally {
      setIsSubmittingPO(false);
    }
  };

  // Handle Invoice Detail View
  const handleOpenInvoiceDetail = (invoice: Invoice) => {
    setSelectedInvoiceForDetail(invoice);
    setIsInvoiceDetailOpen(true);
    // Fetch attachments for this invoice
    fetchInvoiceAttachmentsDetail(invoice.id);
  };

  // Handle Mark Invoice as Paid
  const handleMarkInvoiceAsPaid = async (invoiceId: string, paymentDetails: {
    paymentMethod: string;
    paymentReference?: string;
    paidDate?: string;
    notes?: string;
  }) => {
    try {
      const response = await markInvoiceAsPaid(projectId, invoiceId, paymentDetails);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to mark invoice as paid');
      }

      toast.success('Invoice marked as paid and expense created automatically');

      // Update the selected invoice status to 'Paid' immediately
      if (selectedInvoiceForDetail) {
        setSelectedInvoiceForDetail({
          ...selectedInvoiceForDetail,
          status: 'Paid',
        });
      }

      // Reset payment form
      setPaymentFormData({
        paymentMethod: 'bank_transfer',
        paymentReference: '',
        paidDate: new Date().toISOString().split('T')[0],
        notes: '',
      });

      // Refresh invoices in the background
      if (selectedPO) {
        await fetchInvoicesForPO(selectedPO.id);
      }

      // Note: Dialog stays open so user can see the status change
      // User can close it manually by clicking "Close" button
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      toast.error(error?.message || 'Failed to mark invoice as paid');
    }
  };

  // Handle Delete Invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const response = await deleteProjectInvoice(projectId, invoiceId);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete invoice');
      }

      toast.success('Invoice deleted successfully');

      // Close the detail dialog
      setIsInvoiceDetailOpen(false);
      setSelectedInvoiceForDetail(null);

      // Refresh invoices list
      if (selectedPO) {
        await fetchInvoicesForPO(selectedPO.id);
      }
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error(error?.message || 'Failed to delete invoice');
    }
  };

  // Validate PO form
  const validatePOForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!poFormData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!poFormData.category) {
      errors.category = 'Budget category is required';
    }

    if (!poFormData.totalAmount || parseFloat(poFormData.totalAmount) <= 0) {
      errors.totalAmount = 'Amount must be greater than 0';
    }

    if (!poFormData.vendorId && !poFormData.vendorName.trim()) {
      errors.vendor = 'Vendor is required';
    }

    setPoFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle PO form submission
  const handleCreatePO = async () => {
    if (!validatePOForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingPO(true);

    try {
      const response = await createPurchaseOrder(projectId, {
        vendorId: poFormData.vendorId || undefined,
        description: poFormData.description,
        category: poFormData.category,
        totalAmount: parseFloat(poFormData.totalAmount),
        currency: poFormData.currency,
        terms: poFormData.terms || undefined,
        notes: poFormData.notes || undefined,
        expiryDate: poFormData.expiryDate || undefined,
        deliveryDate: poFormData.deliveryDate || undefined,
        items: poFormData.items.length > 0
          ? poFormData.items.map(item => ({
              description: item.description,
              quantity: parseFloat(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
              unit: item.unit || undefined,
              category: item.category || undefined,
            }))
          : undefined,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create purchase order');
      }

      toast.success('Purchase order created successfully');
      setIsCreatePOOpen(false);

      // Reset form
      setPoFormData({
        vendorId: '',
        vendorName: '',
        description: '',
        category: '',
        totalAmount: '',
        currency: 'NGN',
        terms: '',
        notes: '',
        expiryDate: '',
        deliveryDate: '',
        items: [],
      });
      setPoFormErrors({});

      // Refresh purchase orders list
      const refreshResponse = await getPurchaseOrders(projectId);
      if (refreshResponse.data) {
        const mappedPOs: PurchaseOrder[] = refreshResponse.data.data.map(mapAPIPurchaseOrder);
        setPurchaseOrders(mappedPOs);

        // Select the newly created PO
        if (mappedPOs.length > 0) {
          setSelectedPO(mappedPOs[0]);
        }
      }
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      toast.error(error?.message || 'Failed to create purchase order');
    } finally {
      setIsSubmittingPO(false);
    }
  };

  // Add line item to PO
  const handleAddLineItem = () => {
    setPoFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantity: '1',
          unitPrice: '0',
          unit: 'pcs',
          category: prev.category,
        },
      ],
    }));
  };

  // Remove line item from PO
  const handleRemoveLineItem = (index: number) => {
    setPoFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Update line item
  const handleUpdateLineItem = (index: number, field: string, value: string) => {
    setPoFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Calculate total from line items
  const calculateTotalFromItems = () => {
    const total = poFormData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    setPoFormData(prev => ({
      ...prev,
      totalAmount: total.toString(),
    }));
  };

  // Validate Invoice form
  const validateInvoiceForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!invoiceFormData.purchaseOrderId) {
      errors.purchaseOrder = 'Purchase order is required';
    }

    if (!invoiceFormData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!invoiceFormData.category) {
      errors.category = 'Category is required';
    }

    if (!invoiceFormData.amount || parseFloat(invoiceFormData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    setInvoiceFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Invoice form submission
  const handleCreateInvoice = async () => {
    if (!validateInvoiceForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingInvoice(true);

    try {
      // 1. Upload attachments (if any)
      const { paths, failed } = await uploadAllInvoiceAttachments();

      if (failed > 0) {
        toast.error(
          `${failed} attachment(s) failed to upload. Please remove them or try again before creating the invoice.`
        );
        setIsSubmittingInvoice(false);
        return;
      }

      // 2. Create invoice with attachment paths
      const response = await createProjectInvoice(projectId, {
        purchaseOrderId: invoiceFormData.purchaseOrderId,
        vendorId: selectedPO?.vendorId || undefined,
        description: invoiceFormData.description,
        category: invoiceFormData.category,
        amount: parseFloat(invoiceFormData.amount),
        currency: invoiceFormData.currency,
        dueDate: invoiceFormData.dueDate || undefined,
        paymentMethod: invoiceFormData.paymentMethod || undefined,
        notes: invoiceFormData.notes || undefined,
        attachments: paths.length > 0 ? paths : undefined,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create invoice');
      }

      toast.success('Invoice created successfully');
      setIsCreateInvoiceOpen(false);

      // Reset form
      setInvoiceFormData({
        purchaseOrderId: '',
        description: '',
        category: '',
        amount: '',
        currency: 'NGN',
        dueDate: '',
        paymentMethod: '',
        notes: '',
      });
      setInvoiceFormErrors({});
      setInvoiceAttachments([]);

      // Refresh invoices for selected PO
      if (selectedPO) {
        fetchInvoicesForPO(selectedPO.id);
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error?.message || 'Failed to create invoice');
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  // Pre-fill invoice form when dialog opens
  const handleOpenInvoiceDialog = () => {
    if (selectedPO) {
      setInvoiceFormData(prev => ({
        ...prev,
        purchaseOrderId: selectedPO.id,
        category: selectedPO.category || '',
        amount: selectedPO.amount.toString(),
      }));
    }
    setIsCreateInvoiceOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-5 md:space-y-6 animate-in fade-in duration-500">
        {/* Hero Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 h-32 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-xl overflow-hidden animate-in fade-in duration-500" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] p-6 md:p-8 shadow-xl animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FileText className="h-8 w-8 text-white" />
              Purchase Orders
            </h1>
            <p className="text-white/80 font-medium">Manage purchase orders and track invoice approvals</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleOpenVendorDialog()}
              variant="outline"
              className="gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </Button>
            <Button
              onClick={() => setIsCreatePOOpen(true)}
              className="gap-2 bg-white hover:bg-gray-50 text-[#7C3AED] font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Purchase Order
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '0ms' }}>
          <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Total PO Value</CardTitle>
              <DollarSign className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalPOValue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '50ms' }}>
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Approved POs</CardTitle>
              <CheckCircle className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {approvedPOs}
              </p>
              <p className="text-xs text-gray-600">
                of {purchaseOrders.length} total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '100ms' }}>
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Pending Approval</CardTitle>
              <Clock className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {pendingPOs}
              </p>
              <p className="text-xs text-gray-600">
                requires action
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '150ms' }}>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/90">Total Invoiced</CardTitle>
              <FileText className="h-5 w-5 text-white/80" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalInvoiceValue)}
              </p>
              <p className="text-xs text-gray-600">
                {invoices.length} invoices
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendors Section */}
      <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
        <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold">Vendors</CardTitle>
            <Button
              onClick={() => handleOpenVendorDialog()}
              size="sm"
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 font-semibold gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <div className="text-center py-16 animate-in fade-in duration-500">
              <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Click "Add Vendor" to create your first vendor</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor, index) => (
                    <tr
                      key={vendor.id}
                      className="border-b hover:bg-gray-50 transition-colors duration-200 animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{vendor.name}</div>
                        {vendor.specialization && (
                          <div className="text-xs text-gray-500">{vendor.specialization}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {vendor.vendorType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {vendor.contactPerson || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {vendor.email || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {vendor.phone || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            vendor.status === 'active'
                              ? 'default'
                              : vendor.status === 'inactive'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="capitalize"
                        >
                          {vendor.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenVendorDialog(vendor)}
                            className="h-8 px-2"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteVendor(vendor.id)}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card className="border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '250ms' }}>
        <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold">Purchase Orders</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                <Input
                  placeholder="Search POs..."
                  className="pl-10 w-64 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
                  <Filter className="w-4 h-4 mr-2 text-white/80" />
                  <SelectValue className="text-white" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">PO Number</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vendor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Items</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.map((po, index) => (
                  <tr
                    key={po.id}
                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors duration-200 animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => { setSelectedPO(po); setIsPODetailOpen(true); }}
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{po.poNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-700">{po.vendor}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600 text-sm line-clamp-1">{po.description || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">{formatCurrency(po.amount)}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{new Date(po.date).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{po.items}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] transition-colors duration-200"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditPO(po);
                            }}>
                              <FileText className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {canApproveInvoices && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprovePO(po.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRejectPO(po.id, 'Rejected by user')}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleDeletePO(po.id)}>
                              <XCircle className="w-4 h-4 mr-2 text-red-500" />
                              <span className="text-red-500">Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPOs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16 animate-in fade-in duration-500">
                      <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <FileText className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No purchase orders found</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {searchTerm || statusFilter !== "all"
                          ? "Try adjusting your search or filters to see more results"
                          : "Click 'New Purchase Order' to create your first purchase order"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* PO Detail Dialog */}
      <Dialog open={isPODetailOpen} onOpenChange={(o) => { setIsPODetailOpen(o); if (!o) setSelectedPO(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              {selectedPO?.poNumber} - {selectedPO?.vendor}
            </DialogDescription>
          </DialogHeader>
          {selectedPO && (
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">PO Number</p>
                    <p className="text-base font-semibold text-gray-900">{selectedPO.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedPO.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vendor</p>
                    <p className="text-base font-medium text-gray-900">{selectedPO.vendor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="text-base font-bold text-gray-900">{formatCurrency(selectedPO.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date Created</p>
                    <p className="text-base text-gray-900">{new Date(selectedPO.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Line Items</p>
                    <p className="text-base text-gray-900">{selectedPO.items} items</p>
                  </div>
                </div>

                <Separator />

                {selectedPO.description && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Description</p>
                      <p className="text-sm text-gray-700">{selectedPO.description}</p>
                    </div>
                    <Separator />
                  </>
                )}

                {(selectedPO.category || selectedPO.budgetLine) && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Budget Category</p>
                      <p className="text-sm text-gray-700">{selectedPO.category || selectedPO.budgetLine}</p>
                    </div>
                    <Separator />
                  </>
                )}

                {selectedPO.lineItems && selectedPO.lineItems.length > 0 && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-3">Line Items</p>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left text-xs font-medium text-gray-600 px-4 py-2">Description</th>
                              <th className="text-right text-xs font-medium text-gray-600 px-4 py-2">Qty</th>
                              <th className="text-right text-xs font-medium text-gray-600 px-4 py-2">Unit</th>
                              <th className="text-right text-xs font-medium text-gray-600 px-4 py-2">Unit Price</th>
                              <th className="text-right text-xs font-medium text-gray-600 px-4 py-2">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedPO.lineItems.map((item, index) => (
                              <tr key={item.id || index} className="hover:bg-gray-50">
                                <td className="text-sm text-gray-900 px-4 py-3">
                                  {item.description}
                                  {item.category && (
                                    <span className="block text-xs text-gray-500 mt-1">{item.category}</span>
                                  )}
                                </td>
                                <td className="text-sm text-gray-900 px-4 py-3 text-right">{item.quantity}</td>
                                <td className="text-sm text-gray-500 px-4 py-3 text-right">{item.unit || 'pcs'}</td>
                                <td className="text-sm text-gray-900 px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                                <td className="text-sm font-medium text-gray-900 px-4 py-3 text-right">{formatCurrency(item.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                            <tr>
                              <td colSpan={4} className="text-sm font-semibold text-gray-900 px-4 py-3 text-right">Total:</td>
                              <td className="text-sm font-bold text-gray-900 px-4 py-3 text-right">{formatCurrency(selectedPO.amount)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {(selectedPO.terms || selectedPO.notes || selectedPO.expiryDate || selectedPO.deliveryDate) && (
                  <>
                    <div className="space-y-4">
                      {selectedPO.terms && (
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">Terms & Conditions</p>
                          <p className="text-sm text-gray-700">{selectedPO.terms}</p>
                        </div>
                      )}
                      {selectedPO.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">Notes</p>
                          <p className="text-sm text-gray-700">{selectedPO.notes}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {selectedPO.expiryDate && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
                            <p className="text-sm text-gray-900">{new Date(selectedPO.expiryDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {selectedPO.deliveryDate && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Delivery Date</p>
                            <p className="text-sm text-gray-900">{new Date(selectedPO.deliveryDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-gray-900">Related Invoices</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditPO(selectedPO)}
                        className="gap-2"
                      >
                        Edit PO
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenInvoiceDialog}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Create Invoice
                      </Button>
                    </div>
                  </div>
                  {relatedInvoices.length > 0 ? (
                    <div className="space-y-3">
                      {relatedInvoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                              {getStatusBadge(invoice.status)}
                            </div>
                            <span className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="text-gray-600">{invoice.vendor}</span>
                            <span className="text-gray-500">{new Date(invoice.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenInvoiceDetail(invoice)}
                              className="flex-1"
                            >
                              View Details
                            </Button>
                            {invoice.status !== 'paid' && invoice.status !== 'Matched' && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenInvoiceDetail(invoice)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark as Paid
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No invoices linked to this PO yet</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleOpenInvoiceDialog}
                        className="mt-2"
                      >
                        Create first invoice
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create PO Dialog */}
      <Dialog open={isCreatePOOpen} onOpenChange={setIsCreatePOOpen}>
        <DialogContent className="max-w-3xl border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <DialogTitle className="text-white text-2xl font-bold flex items-center space-x-2">
              <FileText className="h-6 w-6 text-white" />
              <span>Create New Purchase Order</span>
            </DialogTitle>
            <DialogDescription className="text-purple-100 mt-2">
              Create a new purchase order for this project
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-6 pl-8">
              {/* Vendor and Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="po-vendor" className="text-sm font-semibold text-gray-700">
                      Vendor <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenVendorDialog()}
                      className="h-6 text-xs text-[#7C3AED] hover:text-[#6D28D9] hover:bg-[#7C3AED]/10"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      New Vendor
                    </Button>
                  </div>
                  <Select
                    value={poFormData.vendorId}
                    onValueChange={(value) => {
                      const vendor = vendors.find(v => v.id === value);
                      setPoFormData({
                        ...poFormData,
                        vendorId: value,
                        vendorName: vendor?.name || ''
                      });
                    }}
                  >
                    <SelectTrigger id="po-vendor" className={`h-11 ${poFormErrors.vendor ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name} {vendor.vendorType && `(${vendor.vendorType})`}
                        </SelectItem>
                      ))}
                      {vendors.length === 0 && (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          No vendors available. Click "New Vendor" to add one.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {poFormErrors.vendor && (
                    <p className="text-sm text-red-500">{poFormErrors.vendor}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="po-amount" className="text-sm font-semibold text-gray-700">
                    Total Amount ({getCurrencySymbol(projectCurrency)}) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="po-amount"
                    type="number"
                    placeholder="0.00"
                    value={poFormData.totalAmount}
                    onChange={(e) => setPoFormData({ ...poFormData, totalAmount: e.target.value })}
                    className={`h-11 ${poFormErrors.totalAmount ? 'border-red-500' : ''}`}
                  />
                  {poFormErrors.totalAmount && (
                    <p className="text-sm text-red-500">{poFormErrors.totalAmount}</p>
                  )}
                </div>
              </div>

              {/* Budget Category */}
              <div className="space-y-2">
                <Label htmlFor="po-budget-line" className="text-sm font-semibold text-gray-700">
                  Budget Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={poFormData.category}
                  onValueChange={(value) => setPoFormData({ ...poFormData, category: value })}
                >
                  <SelectTrigger id="po-budget-line" className={`h-11 ${poFormErrors.category ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select budget category" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {poFormErrors.category && (
                  <p className="text-sm text-red-500">{poFormErrors.category}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="po-description" className="text-sm font-semibold text-gray-700">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="po-description"
                  placeholder="Enter purchase order description"
                  rows={4}
                  value={poFormData.description}
                  onChange={(e) => setPoFormData({ ...poFormData, description: e.target.value })}
                  className={`resize-none ${poFormErrors.description ? 'border-red-500' : ''}`}
                />
                {poFormErrors.description && (
                  <p className="text-sm text-red-500">{poFormErrors.description}</p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="po-delivery-date" className="text-sm font-semibold text-gray-700">Delivery Date</Label>
                  <Input
                    id="po-delivery-date"
                    type="date"
                    value={poFormData.deliveryDate}
                    onChange={(e) => setPoFormData({ ...poFormData, deliveryDate: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="po-expiry-date" className="text-sm font-semibold text-gray-700">Expiry Date</Label>
                  <Input
                    id="po-expiry-date"
                    type="date"
                    value={poFormData.expiryDate}
                    onChange={(e) => setPoFormData({ ...poFormData, expiryDate: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <Label htmlFor="po-terms" className="text-sm font-semibold text-gray-700">Payment Terms</Label>
                <Input
                  id="po-terms"
                  placeholder="e.g., Net 30, 50% upfront"
                  value={poFormData.terms}
                  onChange={(e) => setPoFormData({ ...poFormData, terms: e.target.value })}
                  className="h-11"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="po-notes" className="text-sm font-semibold text-gray-700">Notes</Label>
                <Textarea
                  id="po-notes"
                  placeholder="Additional notes or instructions"
                  rows={3}
                  value={poFormData.notes}
                  onChange={(e) => setPoFormData({ ...poFormData, notes: e.target.value })}
                  className="resize-none"
                />
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Line Items (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLineItem}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>

                {poFormData.items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <Label className="text-sm font-medium">Item {index + 1}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLineItem(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem(index, 'description', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit</Label>
                          <Input
                            placeholder="e.g., pcs, kg, m2"
                            value={item.unit}
                            onChange={(e) => handleUpdateLineItem(index, 'unit', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.quantity}
                            onChange={(e) => {
                              handleUpdateLineItem(index, 'quantity', e.target.value);
                              setTimeout(calculateTotalFromItems, 0);
                            }}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit Price ({getCurrencySymbol(projectCurrency)})</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={item.unitPrice}
                            onChange={(e) => {
                              handleUpdateLineItem(index, 'unitPrice', e.target.value);
                              setTimeout(calculateTotalFromItems, 0);
                            }}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Total</Label>
                          <Input
                            type="text"
                            value={formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                            disabled
                            className="text-sm bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {poFormData.items.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={calculateTotalFromItems}
                      className="gap-2"
                    >
                      <Calculator className="w-4 h-4" />
                      Calculate Total from Items
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
            <Button
              variant="outline"
              onClick={() => setIsCreatePOOpen(false)}
              disabled={isSubmittingPO}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md hover:shadow-lg transition-all duration-200"
              onClick={handleCreatePO}
              disabled={isSubmittingPO}
            >
              {isSubmittingPO ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Purchase Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice linked to a purchase order
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              {/* Purchase Order */}
              <div className="space-y-2">
                <Label htmlFor="inv-po">
                  Purchase Order <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={invoiceFormData.purchaseOrderId}
                  onValueChange={(value) => {
                    const selectedPO = purchaseOrders.find(po => po.id === value);
                    setInvoiceFormData({
                      ...invoiceFormData,
                      purchaseOrderId: value,
                      category: selectedPO?.category || '',
                      amount: selectedPO?.amount.toString() || '',
                    });
                  }}
                >
                  <SelectTrigger id="inv-po" className={invoiceFormErrors.purchaseOrder ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select purchase order" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map(po => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.poNumber} - {po.vendor} - {formatCurrency(po.amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {invoiceFormErrors.purchaseOrder && (
                  <p className="text-sm text-red-500">{invoiceFormErrors.purchaseOrder}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="inv-description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="inv-description"
                  placeholder="Enter invoice description"
                  rows={3}
                  value={invoiceFormData.description}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
                  className={invoiceFormErrors.description ? 'border-red-500' : ''}
                />
                {invoiceFormErrors.description && (
                  <p className="text-sm text-red-500">{invoiceFormErrors.description}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="inv-category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={invoiceFormData.category}
                  onValueChange={(value) => setInvoiceFormData({ ...invoiceFormData, category: value })}
                >
                  <SelectTrigger id="inv-category" className={invoiceFormErrors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {invoiceFormErrors.category && (
                  <p className="text-sm text-red-500">{invoiceFormErrors.category}</p>
                )}
              </div>

              {/* Amount and Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inv-amount">
                    Amount ({getCurrencySymbol(projectCurrency)}) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="inv-amount"
                    type="number"
                    placeholder="0.00"
                    value={invoiceFormData.amount}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, amount: e.target.value })}
                    className={invoiceFormErrors.amount ? 'border-red-500' : ''}
                  />
                  {invoiceFormErrors.amount && (
                    <p className="text-sm text-red-500">{invoiceFormErrors.amount}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-due-date">Due Date</Label>
                  <Input
                    id="inv-due-date"
                    type="date"
                    value={invoiceFormData.dueDate}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="inv-payment-method">Payment Method</Label>
                <Input
                  id="inv-payment-method"
                  placeholder="e.g., Bank Transfer, Cash, Cheque"
                  value={invoiceFormData.paymentMethod}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, paymentMethod: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="inv-notes">Notes</Label>
                <Textarea
                  id="inv-notes"
                  placeholder="Additional notes"
                  rows={2}
                  value={invoiceFormData.notes}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })}
                />
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label htmlFor="inv-attachments">Attachments (Optional)</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDraggingInvoiceAttachment
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={handleInvoiceDragOver}
                  onDragLeave={handleInvoiceDragLeave}
                  onDrop={handleInvoiceDrop}
                  onClick={() => document.getElementById("inv-file-input")?.click()}
                >
                  <input
                    id="inv-file-input"
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => handleInvoiceFileSelect(e.target.files)}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOCX, JPEG up to 50MB per file
                  </p>
                </div>

                {invoiceAttachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {invoiceAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatBytes(attachment.file.size)}
                            </p>
                            {attachment.error && (
                              <p className="text-xs text-red-600 mt-1">
                                {attachment.error}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {attachment.status === "pending" && (
                            <span className="text-xs text-gray-500">Pending</span>
                          )}
                          {attachment.status === "uploading" && (
                            <span className="text-xs text-blue-600">Uploading...</span>
                          )}
                          {attachment.status === "success" && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {attachment.status === "error" && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeInvoiceAttachment(attachment.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-gray-600">
                        Total:{" "}
                        {formatBytes(
                          invoiceAttachments.reduce(
                            (total, att) => total + att.file.size,
                            0
                          )
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {invoiceAttachments.length} file(s)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)} disabled={isSubmittingInvoice}>
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleCreateInvoice}
              disabled={isSubmittingInvoice}
            >
              {isSubmittingInvoice ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PO Dialog */}
      <Dialog open={isEditPOOpen} onOpenChange={setIsEditPOOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order</DialogTitle>
            <DialogDescription>
              Update purchase order details
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-6">
              {/* Vendor and Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-po-vendor">
                      Vendor <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <Select
                    value={poFormData.vendorId}
                    onValueChange={(value) => {
                      const vendor = vendors.find(v => v.id === value);
                      setPoFormData({
                        ...poFormData,
                        vendorId: value,
                        vendorName: vendor?.name || ''
                      });
                    }}
                  >
                    <SelectTrigger id="edit-po-vendor" className={poFormErrors.vendor ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name} {vendor.vendorType && `(${vendor.vendorType})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {poFormErrors.vendor && (
                    <p className="text-sm text-red-500">{poFormErrors.vendor}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-po-amount">
                    Total Amount ({getCurrencySymbol(projectCurrency)}) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-po-amount"
                    type="number"
                    placeholder="0.00"
                    value={poFormData.totalAmount}
                    onChange={(e) => setPoFormData({ ...poFormData, totalAmount: e.target.value })}
                    className={poFormErrors.totalAmount ? 'border-red-500' : ''}
                  />
                  {poFormErrors.totalAmount && (
                    <p className="text-sm text-red-500">{poFormErrors.totalAmount}</p>
                  )}
                </div>
              </div>

              {/* Budget Category */}
              <div className="space-y-2">
                <Label htmlFor="edit-po-budget-line">
                  Budget Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={poFormData.category}
                  onValueChange={(value) => setPoFormData({ ...poFormData, category: value })}
                >
                  <SelectTrigger id="edit-po-budget-line" className={poFormErrors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select budget category" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {poFormErrors.category && (
                  <p className="text-sm text-red-500">{poFormErrors.category}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-po-description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="edit-po-description"
                  placeholder="Enter purchase order description"
                  rows={3}
                  value={poFormData.description}
                  onChange={(e) => setPoFormData({ ...poFormData, description: e.target.value })}
                  className={poFormErrors.description ? 'border-red-500' : ''}
                />
                {poFormErrors.description && (
                  <p className="text-sm text-red-500">{poFormErrors.description}</p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-po-delivery-date">Delivery Date</Label>
                  <Input
                    id="edit-po-delivery-date"
                    type="date"
                    value={poFormData.deliveryDate}
                    onChange={(e) => setPoFormData({ ...poFormData, deliveryDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-po-expiry-date">Expiry Date</Label>
                  <Input
                    id="edit-po-expiry-date"
                    type="date"
                    value={poFormData.expiryDate}
                    onChange={(e) => setPoFormData({ ...poFormData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <Label htmlFor="edit-po-terms">Payment Terms</Label>
                <Input
                  id="edit-po-terms"
                  placeholder="e.g., Net 30, 50% upfront"
                  value={poFormData.terms}
                  onChange={(e) => setPoFormData({ ...poFormData, terms: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="edit-po-notes">Notes</Label>
                <Textarea
                  id="edit-po-notes"
                  placeholder="Additional notes or instructions"
                  rows={2}
                  value={poFormData.notes}
                  onChange={(e) => setPoFormData({ ...poFormData, notes: e.target.value })}
                />
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Line Items (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLineItem}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>

                {poFormData.items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <Label className="text-sm font-medium">Item {index + 1}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLineItem(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem(index, 'description', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit</Label>
                          <Input
                            placeholder="e.g., pcs, kg, m2"
                            value={item.unit}
                            onChange={(e) => handleUpdateLineItem(index, 'unit', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.quantity}
                            onChange={(e) => {
                              handleUpdateLineItem(index, 'quantity', e.target.value);
                              setTimeout(calculateTotalFromItems, 0);
                            }}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit Price ({getCurrencySymbol(projectCurrency)})</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={item.unitPrice}
                            onChange={(e) => {
                              handleUpdateLineItem(index, 'unitPrice', e.target.value);
                              setTimeout(calculateTotalFromItems, 0);
                            }}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Total</Label>
                          <Input
                            type="text"
                            value={formatCurrency(parseFloat(item.quantity || '0') * parseFloat(item.unitPrice || '0'))}
                            disabled
                            className="text-sm bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {poFormData.items.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-gray-500">No line items added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Item" to add line items</p>
                  </div>
                )}

                {poFormData.items.length > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Calculated Total:</span>
                    <span className="text-lg font-bold">{formatCurrency(
                      poFormData.items.reduce((sum, item) =>
                        sum + (parseFloat(item.quantity || '0') * parseFloat(item.unitPrice || '0')), 0
                      )
                    )}</span>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPOOpen(false)} disabled={isSubmittingPO}>
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleUpdatePO}
              disabled={isSubmittingPO}
            >
              {isSubmittingPO ? 'Updating...' : 'Update Purchase Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={isInvoiceDetailOpen} onOpenChange={setIsInvoiceDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoiceForDetail?.invoiceNumber} - {selectedInvoiceForDetail?.vendor}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoiceForDetail && (
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-6 py-4">
              {/* Invoice Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                  <p className="text-base font-semibold text-gray-900">{selectedInvoiceForDetail.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedInvoiceForDetail.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vendor</p>
                  <p className="text-base font-medium text-gray-900">{selectedInvoiceForDetail.vendor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount</p>
                  <p className="text-base font-bold text-gray-900">{formatCurrency(selectedInvoiceForDetail.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">PO Reference</p>
                  <p className="text-base text-gray-900">{selectedInvoiceForDetail.poRef}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date</p>
                  <p className="text-base text-gray-900">{new Date(selectedInvoiceForDetail.date).toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              {/* Description */}
              {selectedInvoiceForDetail.description && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Description</p>
                    <p className="text-sm text-gray-700">{selectedInvoiceForDetail.description}</p>
                  </div>
                  <Separator />
                </>
              )}

              {/* Budget Line */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Budget Category</p>
                <p className="text-sm text-gray-700">{selectedInvoiceForDetail.budgetLine}</p>
              </div>

              {/* Additional Invoice Details */}
              {(selectedInvoiceForDetail.dueDate || selectedInvoiceForDetail.paymentMethod || selectedInvoiceForDetail.notes) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {selectedInvoiceForDetail.dueDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">Due Date</p>
                        <p className="text-sm text-gray-700">{new Date(selectedInvoiceForDetail.dueDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedInvoiceForDetail.paymentMethod && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">Payment Method</p>
                        <p className="text-sm text-gray-700">{selectedInvoiceForDetail.paymentMethod}</p>
                      </div>
                    )}
                  </div>
                  {selectedInvoiceForDetail.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Notes</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedInvoiceForDetail.notes}</p>
                    </div>
                  )}
                </>
              )}

              {/* Attachments */}
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Attachments</p>
                {loadingInvoiceAttachments ? (
                  <p className="text-sm text-gray-500">Loading attachments...</p>
                ) : invoiceAttachmentsDetail.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No attachments have been uploaded for this invoice.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {invoiceAttachmentsDetail.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {att.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {att.fileSizeFormatted} •{" "}
                              {new Date(att.uploadedAt).toLocaleString()}{" "}
                              {att.uploadedBy?.email && `• ${att.uploadedBy.email}`}
                            </p>
                          </div>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          View / Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mark as Paid Section */}
              {selectedInvoiceForDetail.status !== 'Paid' && selectedInvoiceForDetail.status !== 'paid' && selectedInvoiceForDetail.status !== 'Matched' && (
                <>
                  <Separator />
                  <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      <p className="font-semibold">Mark Invoice as Paid</p>
                    </div>
                    <p className="text-sm text-green-700">
                      When you mark this invoice as paid, the system will automatically:
                    </p>
                    <ul className="text-sm text-green-700 space-y-1 ml-6 list-disc">
                      <li>Update invoice status to "Paid"</li>
                      <li>Create an expense record automatically</li>
                      <li>Link the expense to this invoice and PO</li>
                      <li>Update project actual spend</li>
                    </ul>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="payment-method">Payment Method <span className="text-red-500">*</span></Label>
                        <Select
                          value={paymentFormData.paymentMethod}
                          onValueChange={(value) => setPaymentFormData({ ...paymentFormData, paymentMethod: value })}
                        >
                          <SelectTrigger id="payment-method">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            <SelectItem value="card">Card Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment-reference">Payment Reference (Optional)</Label>
                        <Input
                          id="payment-reference"
                          placeholder="e.g., TRX123456, CHQ001"
                          value={paymentFormData.paymentReference}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentReference: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paid-date">Payment Date</Label>
                        <Input
                          id="paid-date"
                          type="date"
                          value={paymentFormData.paidDate}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, paidDate: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment-notes">Notes (Optional)</Label>
                        <Textarea
                          id="payment-notes"
                          placeholder="Additional payment notes"
                          rows={2}
                          value={paymentFormData.notes}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          )}
          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t">
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsInvoiceDetailOpen(false)}>
                  Close
                </Button>
                {selectedInvoiceForDetail?.status !== 'Paid' && selectedInvoiceForDetail?.status !== 'paid' && selectedInvoiceForDetail?.status !== 'Matched' && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete invoice ${selectedInvoiceForDetail.invoiceNumber}? This action cannot be undone.`)) {
                        handleDeleteInvoice(selectedInvoiceForDetail.id);
                      }
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Delete Invoice
                  </Button>
                )}
              </div>
              {selectedInvoiceForDetail?.status !== 'Paid' && selectedInvoiceForDetail?.status !== 'paid' && selectedInvoiceForDetail?.status !== 'Matched' && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleMarkInvoiceAsPaid(selectedInvoiceForDetail.id, {
                      paymentMethod: paymentFormData.paymentMethod,
                      paymentReference: paymentFormData.paymentReference || undefined,
                      paidDate: paymentFormData.paidDate || undefined,
                      notes: paymentFormData.notes || undefined,
                    });
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Payment & Create Expense
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor Management Dialog */}
      <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
        <DialogContent className="max-w-2xl border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-lg">
            <DialogTitle className="text-white text-2xl font-bold flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-white" />
              <span>{editingVendor ? 'Edit Vendor' : 'Create New Vendor'}</span>
            </DialogTitle>
            <DialogDescription className="text-purple-100 mt-2">
              {editingVendor ? 'Update vendor information' : 'Add a new vendor to your list'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6 pl-8">
            {/* Vendor Name and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-name" className="text-sm font-semibold text-gray-700">
                  Vendor Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vendor-name"
                  placeholder="Enter vendor name"
                  value={vendorFormData.name}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                  className={`h-11 ${vendorFormErrors.name ? 'border-red-500' : ''}`}
                />
                {vendorFormErrors.name && (
                  <p className="text-sm text-red-500">{vendorFormErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-type" className="text-sm font-semibold text-gray-700">
                  Vendor Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={vendorFormData.vendorType}
                  onValueChange={(value: any) => setVendorFormData({ ...vendorFormData, vendorType: value })}
                >
                  <SelectTrigger id="vendor-type" className={`h-11 ${vendorFormErrors.vendorType ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="subcontractor">Subcontractor</SelectItem>
                  </SelectContent>
                </Select>
                {vendorFormErrors.vendorType && (
                  <p className="text-sm text-red-500">{vendorFormErrors.vendorType}</p>
                )}
              </div>
            </div>

            {/* Contact Person and Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-contact" className="text-sm font-semibold text-gray-700">Contact Person</Label>
                <Input
                  id="vendor-contact"
                  placeholder="Enter contact person"
                  value={vendorFormData.contactPerson}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, contactPerson: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-email" className="text-sm font-semibold text-gray-700">Email</Label>
                <Input
                  id="vendor-email"
                  type="email"
                  placeholder="vendor@example.com"
                  value={vendorFormData.email}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                  className={`h-11 ${vendorFormErrors.email ? 'border-red-500' : ''}`}
                />
                {vendorFormErrors.email && (
                  <p className="text-sm text-red-500">{vendorFormErrors.email}</p>
                )}
              </div>
            </div>

            {/* Phone and Specialization */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-phone" className="text-sm font-semibold text-gray-700">Phone</Label>
                <Input
                  id="vendor-phone"
                  placeholder="+234 XXX XXX XXXX"
                  value={vendorFormData.phone}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-specialization" className="text-sm font-semibold text-gray-700">Specialization</Label>
                <Input
                  id="vendor-specialization"
                  placeholder="e.g., Electrical, Plumbing"
                  value={vendorFormData.specialization}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, specialization: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="vendor-address" className="text-sm font-semibold text-gray-700">Address</Label>
              <Textarea
                id="vendor-address"
                placeholder="Enter vendor address"
                rows={3}
                value={vendorFormData.address}
                onChange={(e) => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                className="resize-none"
              />
            </div>

            {/* Rating and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-rating" className="text-sm font-semibold text-gray-700">Rating (0-5)</Label>
                <Input
                  id="vendor-rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="0.0"
                  value={vendorFormData.rating || ''}
                  onChange={(e) => setVendorFormData({
                    ...vendorFormData,
                    rating: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  className={`h-11 ${vendorFormErrors.rating ? 'border-red-500' : ''}`}
                />
                {vendorFormErrors.rating && (
                  <p className="text-sm text-red-500">{vendorFormErrors.rating}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-status" className="text-sm font-semibold text-gray-700">Status</Label>
                <Select
                  value={vendorFormData.status}
                  onValueChange={(value: any) => setVendorFormData({ ...vendorFormData, status: value })}
                >
                  <SelectTrigger id="vendor-status" className="h-11">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blacklisted">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="vendor-notes" className="text-sm font-semibold text-gray-700">Notes</Label>
              <Textarea
                id="vendor-notes"
                placeholder="Additional notes about the vendor"
                rows={3}
                value={vendorFormData.notes}
                onChange={(e) => setVendorFormData({ ...vendorFormData, notes: e.target.value })}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
            <Button
              variant="outline"
              onClick={() => setIsVendorDialogOpen(false)}
              disabled={isSubmittingVendor}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md hover:shadow-lg transition-all duration-200"
              onClick={handleSaveVendor}
              disabled={isSubmittingVendor}
            >
              {isSubmittingVendor ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingVendor ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Vendor
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Vendor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

