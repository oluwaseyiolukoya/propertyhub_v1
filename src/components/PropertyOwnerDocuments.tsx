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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
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
  DialogFooter,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import {
  FileText,
  Download,
  Upload,
  Search,
  Plus,
  Eye,
  Share2,
  Trash2,
  FileCheck,
  FileClock,
  FileWarning,
  Send,
  FileSignature,
  Receipt,
  AlertTriangle,
  Shield,
  ClipboardList,
  Loader2,
  MoreHorizontal,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner";
import DocumentTemplateManager from "./DocumentTemplateManager";
import RichTextEditor from "./RichTextEditor";
import {
  getDocuments,
  createDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats,
  Document,
  DocumentStats,
} from "../lib/api";
import { getProperties } from "../lib/api";
import { format } from "date-fns";
import { cn } from "../lib/utils";

const PropertyOwnerDocuments: React.FC = () => {
  const [activeTab, setActiveTab] = useState("manager-contracts");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [shareForm, setShareForm] = useState({
    sharedWith: [] as string[],
    message: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPropertyId, setFilterPropertyId] = useState("all");
  const [filterTenantId, setFilterTenantId] = useState("all");
  const [dialogType, setDialogType] = useState("manager-contract");
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editableContent, setEditableContent] = useState("");

  // Data state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);

  // Form states
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    name: "",
    type: "lease",
    category: "Legal Documents",
    description: "",
    propertyId: "",
    unitId: "",
    tenantId: "",
    managerId: "",
    isShared: false,
  });

  // Form states for generating contracts
  const [contractForm, setContractForm] = useState({
    managerId: "",
    tenantId: "",
    propertyId: "", // Single property for manager contract
    templateType: "standard",
    startDate: "",
    endDate: "",
    compensation: "",
    compensationType: "fixed", // 'fixed' or 'percentage'
    responsibilities: "",
    propertyIds: [] as string[], // Kept for compatibility
    unitId: "",
  });

  // Load documents and stats on mount
  useEffect(() => {
    loadDocuments();
    loadStats();
    loadProperties();
    loadManagers();
    loadTenants();
  }, []);

  const loadManagers = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // Load all managers with their property assignments
      const managersResponse = await fetch(`${API_URL}/api/property-managers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (managersResponse.ok) {
        const managersData = await managersResponse.json();
        setManagers(Array.isArray(managersData) ? managersData : []);
      }
    } catch (error) {
      console.error("Failed to load managers:", error);
      setManagers([]); // Set empty array on error
    }
  };

  const loadUnitsForProperty = async (propertyId: string) => {
    if (!propertyId) {
      setPropertyUnits([]);
      setPropertyManagerAssignments([]);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // Load units for the property
      const unitsResponse = await fetch(
        `${API_URL}/api/units?propertyId=${propertyId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      if (unitsResponse.ok) {
        const unitsData = await unitsResponse.json();
        setPropertyUnits(Array.isArray(unitsData) ? unitsData : []);
      }

      // Use cached managers data instead of refetching (prevents infinite loop)
      // Filter managers assigned to this specific property from already-loaded managers
      const assignedManagers = Array.isArray(managers)
        ? managers.filter((m: any) =>
            m.property_managers?.some(
              (pm: any) => pm.propertyId === propertyId && pm.isActive
            )
          )
        : [];
      setPropertyManagerAssignments(assignedManagers);
    } catch (error) {
      console.error("Failed to load units/managers:", error);
      setPropertyUnits([]);
      setPropertyManagerAssignments([]);
    }
  };

  const getTenantForUnit = (
    unitId: string,
    formType: "contract" | "upload" = "contract"
  ) => {
    if (!unitId || !Array.isArray(propertyUnits)) return null;

    const unit = propertyUnits.find((u) => u.id === unitId);
    if (!unit) return null;

    // Auto-populate monthly rent from unit
    const monthlyRent = unit.monthlyRent ? unit.monthlyRent.toString() : "";

    // Find tenant from leases through the unit
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    fetch(`${API_URL}/api/tenant/all`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        const leases = result.data || [];
        const lease = leases.find(
          (l: any) => l.unitId === unitId && l.status === "active"
        );
        if (lease && lease.users) {
          // Auto-populate tenant ID
          if (formType === "contract") {
            setContractForm((prev) => ({
              ...prev,
              tenantId: lease.users.id,
              compensation: monthlyRent,
            }));
            console.log(
              "[Contract Form] Auto-populated tenantId:",
              lease.users.id,
              "for unit:",
              unitId
            );
          } else {
            // For upload form
            setUploadForm((prev) => ({
              ...prev,
              tenantId: lease.users.id,
            }));
          }
        } else {
          // If no active lease, clear tenantId and show warning for contract form
          if (formType === "contract") {
            setContractForm((prev) => ({
              ...prev,
              tenantId: "", // Clear tenantId if no active lease
              compensation: monthlyRent,
            }));
            console.warn(
              "[Contract Form] No active lease found for unit:",
              unitId,
              "- tenantId cleared"
            );
            toast.warning(
              "No active tenant found for this unit. Please manually select a tenant."
            );
          } else {
            // For upload form
            setUploadForm((prev) => ({
              ...prev,
              tenantId: "",
            }));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to get tenant for unit:", err);
        // Clear tenantId on error for contract form
        if (formType === "contract") {
          setContractForm((prev) => ({
            ...prev,
            tenantId: "", // Clear tenantId on error
            compensation: monthlyRent,
          }));
          toast.error(
            "Failed to load tenant information. Please manually select a tenant."
          );
        } else {
          setUploadForm((prev) => ({
            ...prev,
            tenantId: "",
          }));
        }
      });

    return unit;
  };

  const loadTenants = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/tenant/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        // Extract tenants from leases data
        const leases = result.data || [];
        const uniqueTenants = leases
          .map((lease: any) => lease.users)
          .filter((tenant: any) => tenant !== null)
          .reduce((acc: any[], tenant: any) => {
            if (!acc.find((t) => t.id === tenant.id)) {
              acc.push(tenant);
            }
            return acc;
          }, []);
        setTenants(uniqueTenants);
      }
    } catch (error) {
      console.error("Failed to load tenants:", error);
      setTenants([]); // Set empty array on error
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Fetch all documents without status filter to include drafts
      const { data, error } = await getDocuments({ status: "" });
      if (error) {
        console.error("Failed to load documents:", error);
        toast.error("Failed to load documents");
      } else if (data) {
        console.log("Documents loaded:", data.length);
        console.log("Sample document:", data[0]);
        setDocuments(data);
      }
    } catch (error) {
      console.error("Load documents error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await getDocumentStats();
      if (error) {
        console.error("Failed to load stats:", error);
      } else if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error("Load stats error:", error);
    }
  };

  const loadProperties = async () => {
    try {
      const { data, error } = await getProperties();
      if (error) {
        console.error("Failed to load properties:", error);
        setProperties([]);
      } else if (data) {
        setProperties(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Load properties error:", error);
      setProperties([]);
    }
  };

  // Get managers assigned to a specific property
  const getManagersForProperty = (propertyId: string) => {
    if (!propertyId || !Array.isArray(managers)) return [];

    // Filter managers who have an active assignment to this property
    // Each manager has a property_managers array with their property assignments
    return managers.filter((manager: any) => {
      return manager.property_managers?.some(
        (assignment: any) =>
          assignment.propertyId === propertyId && assignment.isActive
      );
    });
  };

  // Get currency symbol for a property
  const getPropertyCurrency = (propertyId: string) => {
    if (!Array.isArray(properties)) return "₦";
    const property = properties.find((p) => p.id === propertyId);
    const currencyMap: { [key: string]: string } = {
      USD: "$",
      NGN: "₦",
      EUR: "€",
      GBP: "£",
    };
    return property?.currency
      ? currencyMap[property.currency] || property.currency
      : "₦";
  };

  // Filter documents based on active tab and search
  const getFilteredDocuments = () => {
    let filtered = documents;

    console.log("Total documents:", documents.length);
    console.log("Active tab:", activeTab);

    // Filter by tab
    if (activeTab !== "all") {
      if (activeTab === "manager-contracts") {
        filtered = filtered.filter(
          (doc) =>
            (doc.type === "contract" ||
              doc.type === "manager-contract" ||
              doc.type === "tenant-contract" ||
              doc.category === "Contracts") &&
            doc.type !== "receipt" &&
            doc.category !== "Receipts" &&
            doc.category !== "Financial Records"
        );
      } else if (activeTab === "leases-inspections") {
        const beforeFilter = filtered.length;
        filtered = filtered.filter(
          (doc) =>
            // Primary lease / inspection docs
            doc.type === "lease" ||
            doc.type === "inspection" ||
            // Tenant contracts should also show under Leases & Inspections
            doc.type === "tenant-contract" ||
            // Category-based grouping
            doc.category === "Leases & Inspections" ||
            doc.category === "Leases" ||
            doc.category === "Inspections" ||
            doc.category === "Property Documents" ||
            // Some tenant contracts may use this category instead
            doc.category === "Tenant Documents"
        );
        console.log(
          `Leases & Inspections filter: ${beforeFilter} -> ${filtered.length} documents`
        );
        console.log("Sample filtered doc:", filtered[0]);
      } else if (activeTab === "receipts") {
        filtered = filtered.filter(
          (doc) =>
            doc.type === "receipt" ||
            doc.category === "Receipts" ||
            doc.category === "Financial Records"
        );
      } else if (activeTab === "policies-notices") {
        filtered = filtered.filter(
          (doc) =>
            doc.type === "policy" ||
            doc.type === "notice" ||
            doc.category === "Policies & Notices" ||
            doc.category === "Policies" ||
            doc.category === "Notices"
        );
      } else if (activeTab === "insurance") {
        filtered = filtered.filter(
          (doc) => doc.type === "insurance" || doc.category === "Insurance"
        );
      }
    }

    // Filter by property
    if (filterPropertyId && filterPropertyId !== "all") {
      filtered = filtered.filter((doc) => doc.propertyId === filterPropertyId);
    }

    // Filter by tenant
    if (filterTenantId && filterTenantId !== "all") {
      filtered = filtered.filter((doc) => doc.tenantId === filterTenantId);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.type.toLowerCase().includes(query) ||
          doc.category.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.properties?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Handler functions
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name) {
      toast.error("Please select a file and enter a document name");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("name", uploadForm.name);
      formData.append("type", uploadForm.type);
      formData.append("category", uploadForm.category);
      formData.append("description", uploadForm.description);
      if (uploadForm.propertyId)
        formData.append("propertyId", uploadForm.propertyId);
      if (uploadForm.unitId) formData.append("unitId", uploadForm.unitId);
      if (uploadForm.tenantId) formData.append("tenantId", uploadForm.tenantId);
      if (uploadForm.managerId)
        formData.append("managerId", uploadForm.managerId);
      formData.append("isShared", String(uploadForm.isShared));

      const { data, error } = await uploadDocument(formData);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Document uploaded successfully");
        setShowUploadDialog(false);
        setUploadForm({
          file: null,
          name: "",
          type: "lease",
          category: "Legal Documents",
          description: "",
          propertyId: "",
          unitId: "",
          tenantId: "",
          managerId: "",
          isShared: false,
        });
        loadDocuments();
        loadStats();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;

    try {
      const { data, error } = await deleteDocument(selectedDocument.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Document deleted successfully");
        setShowDeleteDialog(false);
        setSelectedDocument(null);
        loadDocuments();
        loadStats();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewDialog(true);
  };

  const handleDownload = async (doc: Document) => {
    try {
      setSelectedDocument(doc);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("auth_token");

      // Determine the download format based on the document
      const fileExtension = doc.fileUrl
        ? doc.format?.toLowerCase() ||
          doc.fileUrl.split(".").pop()?.toLowerCase() ||
          "pdf"
        : "pdf";

      // Use the actual file extension for uploaded files, or pdf/docx for generated content
      const downloadFormat = doc.fileUrl ? fileExtension : "pdf";

      console.log("Downloading document via API:", {
        id: doc.id,
        format: downloadFormat,
        originalFormat: fileExtension,
      });

      const response = await fetch(
        `${API_URL}/api/documents/${doc.id}/download/${downloadFormat}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Download failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use status text
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.name}.${downloadFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Document downloaded");
      setShowDownloadDialog(false);
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(error.message || "Failed to download document");
    }
  };

  const handleDownloadInFormat = async (format: "pdf" | "docx") => {
    if (!selectedDocument) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("auth_token");

      const response = await fetch(
        `${API_URL}/api/documents/${selectedDocument.id}/download/${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedDocument.name}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Document downloaded as ${format.toUpperCase()}`);
      setShowDownloadDialog(false);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return "Unknown";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredDocuments = getFilteredDocuments();

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Helper function to get type icon
  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "contract":
        return <FileSignature className="h-4 w-4" />;
      case "lease":
        return <FileText className="h-4 w-4" />;
      case "inspection":
        return <ClipboardList className="h-4 w-4" />;
      case "receipt":
        return <Receipt className="h-4 w-4" />;
      case "report":
        return <FileText className="h-4 w-4" />;
      case "insurance":
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Mock data kept for unused sections - will be removed in complete refactor
  const insurance: any[] = [
    {
      id: 12,
      name: "Property Insurance Policy - Sunset Apartments",
      type: "Insurance Policy",
      status: "active",
      uploadDate: "2023-11-01",
      expiryDate: "2024-11-01",
      size: "450 KB",
      signedBy: "Insurance Corp",
      property: "Sunset Apartments",
      policyNumber: "PI-123456",
    },
    {
      id: 13,
      name: "Liability Insurance - Ocean View Complex",
      type: "Insurance Policy",
      status: "expiring_soon",
      uploadDate: "2023-10-15",
      expiryDate: "2024-10-28",
      size: "390 KB",
      signedBy: "General Insurance Co.",
      property: "Ocean View Complex",
      policyNumber: "LI-789012",
    },
    {
      id: 14,
      name: "Umbrella Policy - All Properties",
      type: "Insurance Policy",
      status: "active",
      uploadDate: "2024-01-10",
      expiryDate: "2025-01-10",
      size: "520 KB",
      signedBy: "Premium Insurance",
      property: "All Properties",
      policyNumber: "UP-345678",
    },
  ];

  // Mock data for dropdowns (will be replaced with real data from properties state)
  const mockPropertyList = (properties || []).map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const [managers, setManagers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [propertyManagerAssignments, setPropertyManagerAssignments] = useState<
    any[]
  >([]);
  const [units, setUnits] = useState<any[]>([]);
  const [propertyUnits, setPropertyUnits] = useState<any[]>([]);

  const contractTemplates = {
    manager: [
      {
        id: "standard",
        name: "Standard Manager Agreement",
        description: "Standard contract for property managers",
      },
      {
        id: "premium",
        name: "Premium Manager Agreement",
        description: "Enhanced agreement with additional benefits",
      },
      {
        id: "temporary",
        name: "Temporary Manager Agreement",
        description: "Short-term or temporary management contract",
      },
    ],
    tenant: [
      {
        id: "standard",
        name: "Standard Lease Agreement",
        description: "Standard residential lease contract",
      },
      {
        id: "short-term",
        name: "Short-term Lease",
        description: "Short-term or temporary lease agreement",
      },
      {
        id: "commercial",
        name: "Commercial Lease",
        description: "Commercial property lease agreement",
      },
    ],
  };

  const responsibilityTemplates = [
    {
      id: "full-service",
      name: "Full-Service Management",
      responsibilities: `• Oversee all day-to-day property operations
• Screen and approve tenant applications
• Collect rent payments and manage delinquencies
• Coordinate property maintenance and repairs
• Conduct regular property inspections
• Handle tenant complaints and resolve disputes
• Maintain accurate records and financial reports
• Ensure compliance with all local housing regulations
• Manage vendor relationships and contracts
• Provide monthly financial and operational reports`,
    },
    {
      id: "maintenance-focused",
      name: "Maintenance & Operations",
      responsibilities: `• Schedule and oversee all property maintenance
• Coordinate emergency repair services
• Conduct quarterly property inspections
• Manage relationships with contractors and vendors
• Ensure property meets all safety standards
• Maintain common areas and facilities
• Handle tenant maintenance requests promptly
• Monitor and report on property condition
• Manage inventory of maintenance supplies
• Provide monthly maintenance reports`,
    },
    {
      id: "tenant-relations",
      name: "Tenant Relations & Leasing",
      responsibilities: `• Market available units and show properties
• Screen potential tenants and process applications
• Prepare and execute lease agreements
• Conduct move-in and move-out inspections
• Handle tenant inquiries and complaints
• Enforce lease terms and property rules
• Coordinate lease renewals
• Manage tenant communications
• Resolve tenant disputes professionally
• Maintain tenant satisfaction and retention`,
    },
    {
      id: "financial-admin",
      name: "Financial & Administrative",
      responsibilities: `• Collect monthly rent and other fees
• Track and deposit all rental income
• Manage property operating budget
• Pay property expenses and vendor invoices
• Maintain detailed financial records
• Prepare monthly financial statements
• Handle delinquent rent collection
• Coordinate with accountants on tax matters
• Process security deposit accounting
• Provide quarterly financial analysis reports`,
    },
    {
      id: "basic",
      name: "Basic Management",
      responsibilities: `• Collect monthly rent payments
• Coordinate basic property maintenance
• Respond to tenant inquiries
• Conduct periodic property inspections
• Maintain records of property activities
• Report on property status monthly`,
    },
  ];

  const termsTemplates = [
    {
      id: "standard-residential",
      name: "Standard Residential Terms",
      terms: `• Tenant shall use the premises for residential purposes only
• No subletting or assignment of lease without written landlord approval
• Tenant is responsible for keeping the premises clean and sanitary
• Tenant shall not make any alterations without written consent
• Pets are not permitted without prior written approval
• Tenant must maintain renters insurance throughout the lease term
• Noise levels must be kept reasonable, especially between 10 PM - 7 AM
• Common areas must be kept clear and accessible at all times`,
    },
    {
      id: "with-utilities",
      name: "Terms Including Utilities",
      terms: `• Rent includes water, electricity, and waste disposal services
• Tenant is responsible for excessive utility usage beyond normal levels
• Internet and cable services are tenant's responsibility
• Landlord reserves right to adjust rent if utility costs increase significantly
• Tenant must report any utility issues or outages immediately
• No tampering with utility meters or connections
• Energy conservation practices are encouraged`,
    },
    {
      id: "furnished-unit",
      name: "Furnished Unit Terms",
      terms: `• Property is rented as fully furnished - inventory list attached
• Tenant is responsible for any damage to furnishings beyond normal wear
• All furniture and fixtures must remain in the unit
• Tenant may not remove or replace any provided furnishings
• Deep cleaning of all furnishings required at move-out
• Any missing or damaged items will be charged to security deposit
• Tenant must report any furniture damage within 48 hours`,
    },
    {
      id: "pet-friendly",
      name: "Pet-Friendly Terms",
      terms: `• Maximum of 2 pets allowed with additional pet deposit
• Pet deposit is non-refundable and covers potential damages
• Dogs must be kept on leash in common areas
• Tenant must clean up after pets immediately
• Excessive noise or disturbance from pets may result in lease termination
• Tenant is liable for any injuries or damage caused by pets
• Proper pet waste disposal is mandatory
• Service animals are exempt from pet fees per applicable laws`,
    },
    {
      id: "short-term",
      name: "Short-Term Lease Terms",
      terms: `• Minimum lease term of 3 months applies
• 60-day notice required for non-renewal or early termination
• Early termination fee equals 2 months rent if lease broken early
• No rent concessions or discounts for short-term leases
• Monthly inspections may be conducted with 24-hour notice
• Tenant must maintain property in move-in ready condition at all times
• Security deposit is due in full at lease signing`,
    },
    {
      id: "maintenance-included",
      name: "Maintenance Package Included",
      terms: `• Routine maintenance and repairs are covered by landlord
• Tenant must report all maintenance issues within 24 hours
• Emergency maintenance contact information provided separately
• Scheduled maintenance visits require 24-hour notice
• Tenant damage or negligence is tenant's financial responsibility
• Air conditioning filters must be changed monthly by tenant
• Landlord provides quarterly pest control services
• Annual HVAC servicing included in rent`,
    },
  ];

  // duplicate getStatusColor removed (using the earlier definition)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <FileCheck className="h-4 w-4" />;
      case "expiring_soon":
        return <FileClock className="h-4 w-4" />;
      case "expired":
        return <FileWarning className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleGenerateContract = async () => {
    try {
      setUploading(true);
      const contractType =
        dialogType === "manager-contract" ? "Manager" : "Tenant";

      // Get manager or tenant details
      let recipientName = "";
      let recipientId = "";
      let propertyName = "";

      if (dialogType === "manager-contract") {
        const manager = managers.find((m) => m.id === contractForm.managerId);
        recipientName = manager?.name || "Manager";
        recipientId = contractForm.managerId;

        // Validate manager ID is provided
        if (!recipientId) {
          toast.error("Please select a manager");
          setUploading(false);
          return;
        }
      } else {
        // For tenant contracts, validate tenantId is provided
        if (!contractForm.tenantId) {
          toast.error(
            "Please select a unit with an active tenant, or manually select a tenant"
          );
          setUploading(false);
          return;
        }

        const tenant = tenants.find((t) => t.id === contractForm.tenantId);
        recipientName = tenant?.name || "Tenant";
        recipientId = contractForm.tenantId;

        // Double-check tenant exists
        if (!tenant) {
          toast.error(
            "Selected tenant not found. Please select a valid tenant."
          );
          setUploading(false);
          return;
        }
      }

      const property = properties.find((p) => p.id === contractForm.propertyId);
      propertyName = property?.name || "Property";

      // Generate contract document content
      const contractContent = generateContractContent();

      // Create document data
      const documentData = {
        name: `${contractType} Contract - ${recipientName} - ${propertyName}`,
        type: "contract",
        category: "Contracts",
        description: `${
          contractForm.templateType.charAt(0).toUpperCase() +
          contractForm.templateType.slice(1)
        } ${contractType} Contract`,
        propertyId: contractForm.propertyId,
        managerId: dialogType === "manager-contract" ? recipientId : null,
        tenantId: dialogType === "tenant-contract" ? recipientId : null, // CRITICAL: Ensure tenantId is set for tenant contracts
        unitId: contractForm.unitId || null,
        status: "draft",
        expiresAt: contractForm.endDate || null,
        metadata: {
          contractType: dialogType,
          templateType: contractForm.templateType,
          startDate: contractForm.startDate,
          endDate: contractForm.endDate,
          compensation: contractForm.compensation,
          compensationType: contractForm.compensationType,
          responsibilities: contractForm.responsibilities,
          content: contractContent,
        },
        isShared: false,
      };

      // Final validation: For tenant contracts, ensure tenantId is set
      if (dialogType === "tenant-contract" && !documentData.tenantId) {
        console.error(
          "[Contract Generation] tenantId is missing for tenant contract:",
          documentData
        );
        toast.error(
          "Failed to create contract: Tenant ID is missing. Please select a unit with an active tenant."
        );
        setUploading(false);
        return;
      }

      // Save document to database
      const { data, error } = await createDocument(documentData as any);

      if (error) {
        console.error("Failed to save contract:", error);
        toast.error("Failed to generate contract");
        return;
      }

      console.log(`Generated ${contractType} contract:`, data);
      setShowGenerateDialog(false);
      toast.success(
        `${contractType} contract generated successfully! You can now preview, edit, and send it when ready.`
      );

      // Reset form
      setContractForm({
        managerId: "",
        tenantId: "",
        propertyId: "",
        templateType: "standard",
        startDate: "",
        endDate: "",
        compensation: "",
        compensationType: "fixed",
        responsibilities: "",
        propertyIds: [],
        unitId: "",
      });

      // Reload documents to show the new contract
      await loadDocuments();
    } catch (error) {
      console.error("Generate contract error:", error);
      toast.error("Failed to generate contract");
    } finally {
      setUploading(false);
    }
  };

  const generateContractContent = () => {
    const contractType =
      dialogType === "manager-contract" ? "Property Management" : "Lease";
    const property = properties.find((p) => p.id === contractForm.propertyId);
    const currencySymbol = getPropertyCurrency(contractForm.propertyId);

    let recipient = "";
    if (dialogType === "manager-contract") {
      const manager = managers.find((m) => m.id === contractForm.managerId);
      recipient = manager?.name || "Manager";
    } else {
      const tenant = tenants.find((t) => t.id === contractForm.tenantId);
      recipient = tenant?.name || "Tenant";
    }

    const compensationText =
      dialogType === "manager-contract"
        ? contractForm.compensationType === "fixed"
          ? `${currencySymbol}${contractForm.compensation} per month`
          : `${contractForm.compensation}% of monthly property revenue`
        : `${currencySymbol}${contractForm.compensation} per month`;

    // Parse responsibilities to create proper list items
    const responsibilitiesLines = (
      contractForm.responsibilities || "To be specified"
    )
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        // Remove existing bullet points or numbers
        const cleanedLine = line
          .replace(/^[•\-\*]\s*/, "")
          .replace(/^\d+\.\s*/, "")
          .trim();
        return `<li>${cleanedLine}</li>`;
      })
      .join("");

    // Generate HTML content with proper formatting
    return `
<h1>${contractType.toUpperCase()} AGREEMENT</h1>

<p>This ${contractType} Agreement ("<strong>Agreement</strong>") is entered into on <strong>${new Date().toLocaleDateString()}</strong> by and between:</p>

<h2>PROPERTY OWNER (Landlord/Principal)</h2>
<p>[Owner Name]<br>[Owner Address]</p>

<p style="text-align: center;"><strong>AND</strong></p>

<h2>${dialogType === "manager-contract" ? "PROPERTY MANAGER" : "TENANT"} (${
      dialogType === "manager-contract" ? "Agent" : "Lessee"
    })</h2>
<p>${recipient}</p>

<h2>PROPERTY DETAILS</h2>
<p><strong>Property:</strong> ${property?.name || "N/A"}<br>
<strong>Address:</strong> ${property?.address || "N/A"}, ${
      property?.city || "N/A"
    }, ${property?.state || "N/A"}</p>

<h2>TERM OF AGREEMENT</h2>
<p><strong>Start Date:</strong> ${contractForm.startDate || "TBD"}<br>
<strong>End Date:</strong> ${contractForm.endDate || "TBD"}</p>

<h2>${
      dialogType === "manager-contract" ? "MANAGEMENT" : "RENT"
    } COMPENSATION</h2>
<p><strong>Amount:</strong> ${compensationText}</p>
${
  dialogType === "manager-contract" &&
  contractForm.compensationType === "percentage"
    ? "<p><em>Calculated as a percentage of the gross rental income collected from the property.</em></p>"
    : ""
}

<h2>${
      dialogType === "manager-contract"
        ? "KEY RESPONSIBILITIES"
        : "TENANT OBLIGATIONS"
    }</h2>
<ul>
${responsibilitiesLines}
</ul>

<h2>TERMS AND CONDITIONS</h2>
${
  dialogType === "manager-contract"
    ? `
<ol>
<li>The Property Manager agrees to manage the property in accordance with applicable laws and regulations.</li>
<li>The Property Manager shall maintain accurate records of all transactions related to the property.</li>
<li>The Property Manager shall provide monthly reports to the Property Owner.</li>
<li>Either party may terminate this agreement with 30 days written notice.</li>
</ol>
`
    : `
<ol>
<li>The Tenant agrees to pay rent on time and maintain the property in good condition.</li>
<li>The Tenant shall not sublet the property without written consent from the Landlord.</li>
<li>The Tenant is responsible for utilities and routine maintenance.</li>
<li>The Landlord reserves the right to inspect the property with reasonable notice.</li>
</ol>
`
}

<h2>SIGNATURES</h2>
<p>This agreement shall be binding upon signature by both parties.</p>

<p><strong>Property Owner:</strong> _____________________ <strong>Date:</strong> _________</p>

<p><strong>${
      dialogType === "manager-contract" ? "Property Manager" : "Tenant"
    }:</strong> _____________________ <strong>Date:</strong> _________</p>

<hr>
<p style="text-align: center;"><em>Generated: ${new Date().toLocaleString()}</em><br>
<em>Status: Draft - Not yet sent for signature</em></p>
`;
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDocument(doc);
    setShowViewDialog(true);
  };

  const handleEditContract = (doc: Document) => {
    setSelectedDocument(doc);
    setEditableContent(doc.metadata?.content || "");
    setShowEditDialog(true);
  };

  const handleSaveEditedContract = async () => {
    if (!selectedDocument) return;

    try {
      setUploading(true);

      const updatedMetadata = {
        ...selectedDocument.metadata,
        content: editableContent,
        lastEdited: new Date().toISOString(),
      };

      const { error } = await updateDocument(selectedDocument.id, {
        metadata: updatedMetadata,
      });

      if (error) {
        toast.error("Failed to save changes");
        return;
      }

      toast.success("Contract updated successfully!");
      setShowEditDialog(false);
      await loadDocuments();
    } catch (error) {
      console.error("Save contract error:", error);
      toast.error("Failed to save contract");
    } finally {
      setUploading(false);
    }
  };

  const handleSendContract = async (doc: Document) => {
    try {
      setUploading(true);

      // Update document status to 'pending' (sent for signature)
      const { error } = await updateDocument(doc.id, {
        status: "pending",
        metadata: {
          ...doc.metadata,
          sentAt: new Date().toISOString(),
          sentBy: localStorage.getItem("user_name") || "Owner",
        },
      });

      if (error) {
        toast.error("Failed to send contract");
        return;
      }

      const recipientType =
        doc.metadata?.contractType === "manager-contract"
          ? "manager"
          : "tenant";
      toast.success(`Contract sent to ${recipientType} for e-signature!`);

      await loadDocuments();
    } catch (error) {
      console.error("Send contract error:", error);
      toast.error("Failed to send contract");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = (doc: any) => {
    setSelectedDocument(doc);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;

    try {
      setUploading(true);
      const { error } = await deleteDocument(selectedDocument.id);

      if (error) {
        toast.error("Failed to delete document");
        return;
      }

      toast.success("Document deleted successfully!");
      setShowDeleteDialog(false);
      setSelectedDocument(null);

      // Reload documents to update the list
      await loadDocuments();
    } catch (error) {
      console.error("Delete document error:", error);
      toast.error("Failed to delete document");
    } finally {
      setUploading(false);
    }
  };

  const openGenerateDialog = (type: string) => {
    setDialogType(type);
    setShowGenerateDialog(true);
  };

  const openUploadDialog = (type: string, category: string) => {
    setUploadForm({
      file: null,
      name: "",
      type,
      category,
      description: "",
      propertyId: "",
      unitId: "",
      tenantId: "",
      managerId: "",
      isShared: false,
    });
    setShowUploadDialog(true);
  };

  // duplicate handleDownload removed (using the earlier implementation)

  const handleShare = (doc: any) => {
    setSelectedDocument(doc);
    setShareForm({
      sharedWith: doc.sharedWith || [],
      message: "",
    });
    setShowShareDialog(true);
  };

  const handleShareDocument = async () => {
    if (!selectedDocument) return;

    try {
      const isUnsharing = shareForm.sharedWith.length === 0;
      const { error } = await updateDocument(selectedDocument.id, {
        isShared: !isUnsharing,
        sharedWith: shareForm.sharedWith,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success(
          isUnsharing
            ? "Document sharing removed successfully"
            : "Document shared successfully"
        );
        setShowShareDialog(false);
        setShareForm({ sharedWith: [], message: "" });
        await loadDocuments();
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to update document sharing");
    }
  };

  // duplicate handleUpload removed (using the async implementation above)

  // Show template manager if active
  if (showTemplateManager) {
    return (
      <DocumentTemplateManager onClose={() => setShowTemplateManager(false)} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Documents</h1>
            </div>
            <p className="text-purple-100 text-lg">
              Manage contracts, leases, receipts, policies, and insurance
              documents
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplateManager(true)}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Manage Templates
            </Button>
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="bg-white text-[#7C3AED] hover:bg-purple-50 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="ml-3 text-sm text-gray-600">Loading documents...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Total Documents Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-600 opacity-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Total
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-gray-600">
                  {stats?.total || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">All documents</p>
              </CardContent>
            </Card>

            {/* Recent Documents Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Recent
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-blue-600">
                  {stats?.recent || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </CardContent>
            </Card>

            {/* Contracts Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <FileSignature className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Contracts
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-purple-600">
                  {(() => {
                    const contractTypes = [
                      "contract",
                      "manager-contract",
                      "tenant-contract",
                    ];
                    return (
                      stats?.byType?.reduce((sum: number, t: any) => {
                        return contractTypes.includes(t.type)
                          ? sum + t._count
                          : sum;
                      }, 0) || 0
                    );
                  })()}
                </div>
                <p className="text-xs text-gray-500 mt-1">Active contracts</p>
              </CardContent>
            </Card>

            {/* Leases Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Leases
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-green-600">
                  {stats?.byType?.find((t: any) => t.type === "lease")
                    ?._count || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Lease agreements</p>
              </CardContent>
            </Card>

            {/* Receipts Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Receipts
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-amber-600">
                  {stats?.byType?.find((t: any) => t.type === "receipt")
                    ?._count || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Payment receipts</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Document Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-white border border-gray-200 rounded-lg shadow-sm grid w-full grid-cols-5">
          <TabsTrigger
            value="manager-contracts"
            className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all duration-200 text-gray-700 hover:text-[#7C3AED] hover:bg-purple-50"
          >
            <FileSignature className="h-4 w-4 mr-2" />
            Contracts
          </TabsTrigger>
          <TabsTrigger
            value="leases-inspections"
            className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all duration-200 text-gray-700 hover:text-[#7C3AED] hover:bg-purple-50"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Lease & Inspections
          </TabsTrigger>
          <TabsTrigger
            value="receipts"
            className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all duration-200 text-gray-700 hover:text-[#7C3AED] hover:bg-purple-50"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Receipts
          </TabsTrigger>
          <TabsTrigger
            value="policies-notices"
            className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all duration-200 text-gray-700 hover:text-[#7C3AED] hover:bg-purple-50"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Policies & Notices
          </TabsTrigger>
          <TabsTrigger
            value="insurance"
            className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all duration-200 text-gray-700 hover:text-[#7C3AED] hover:bg-purple-50"
          >
            <Shield className="h-4 w-4 mr-2" />
            Insurance
          </TabsTrigger>
        </TabsList>

        {/* Contracts Tab */}
        <TabsContent value="manager-contracts" className="space-y-4">
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileSignature className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">Contracts</CardTitle>
                    <CardDescription className="text-gray-600">
                      Generate and manage property manager and tenant agreements
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => openGenerateDialog("manager-contract")}
                    className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Manager Contract
                  </Button>
                  <Button
                    onClick={() => openGenerateDialog("tenant-contract")}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-purple-50 hover:text-[#7C3AED] hover:border-[#7C3AED]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tenant Contract
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <Select
                    value={filterPropertyId}
                    onValueChange={setFilterPropertyId}
                  >
                    <SelectTrigger className="w-full md:w-[250px] border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Filter by Property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {Array.isArray(properties) &&
                        properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterTenantId}
                    onValueChange={setFilterTenantId}
                  >
                    <SelectTrigger className="w-full md:w-[250px] border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Filter by Tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      {Array.isArray(tenants) &&
                        tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {(filterPropertyId !== "all" || filterTenantId !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterPropertyId("all");
                        setFilterTenantId("all");
                      }}
                      className="text-[#7C3AED] hover:bg-purple-50"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-auto rounded-xl border-0 shadow-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Document Name
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Upload Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          No contracts found.{" "}
                          {filterPropertyId !== "all" ||
                          filterTenantId !== "all"
                            ? "Try adjusting your filters."
                            : "Create your first contract to get started."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc, index) => (
                        <TableRow
                          key={doc.id}
                          className={
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50/50 hover:bg-[#7C3AED]/5"
                          }
                        >
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(doc.status)}
                              <span className="font-medium text-gray-900">
                                {doc.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(doc.status)}
                            >
                              {doc.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(doc.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {doc.expiresAt ? formatDate(doc.expiresAt) : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Actions"
                                    className="hover:bg-purple-50"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="rounded-lg shadow-lg"
                                >
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => handleViewDocument(doc)}
                                    className="hover:bg-purple-50"
                                  >
                                    <Eye className="h-4 w-4 mr-2" /> View
                                    Details
                                  </DropdownMenuItem>
                                  {doc.status === "draft" &&
                                  doc.type === "contract" ? (
                                    <DropdownMenuItem
                                      onClick={() => handleEditContract(doc)}
                                      className="hover:bg-purple-50"
                                    >
                                      <FileSignature className="h-4 w-4 mr-2" />{" "}
                                      Edit Contract
                                    </DropdownMenuItem>
                                  ) : null}
                                  <DropdownMenuItem
                                    onClick={() => handleDownload(doc)}
                                    className="hover:bg-purple-50"
                                  >
                                    <Download className="h-4 w-4 mr-2" />{" "}
                                    Download
                                  </DropdownMenuItem>
                                  {doc.status !== "draft" && (
                                    <DropdownMenuItem
                                      onClick={() => handleShare(doc)}
                                      className="hover:bg-purple-50"
                                    >
                                      <Share2 className="h-4 w-4 mr-2" /> Share
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      const newStatus =
                                        doc.status === "active"
                                          ? "inactive"
                                          : "active";
                                      const { error } = await updateDocument(
                                        doc.id,
                                        { status: newStatus }
                                      );
                                      if (error) {
                                        toast.error("Failed to update status");
                                      } else {
                                        toast.success(
                                          `Document marked as ${newStatus}`
                                        );
                                        await loadDocuments();
                                      }
                                    }}
                                    className="hover:bg-purple-50"
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    {doc.status === "active"
                                      ? "Make Inactive"
                                      : "Make Active"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteDocument(doc)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
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

        {/* Lease & Inspections Tab */}
        <TabsContent value="leases-inspections" className="space-y-4">
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">
                      Lease Agreements & Inspections
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Master leases and property inspection reports
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    openUploadDialog("lease", "Leases & Inspections")
                  }
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                  <Input
                    placeholder="Search leases and inspections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <Select
                    value={filterPropertyId}
                    onValueChange={setFilterPropertyId}
                  >
                    <SelectTrigger className="w-full md:w-[250px] border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Filter by Property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {Array.isArray(properties) &&
                        properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterTenantId}
                    onValueChange={setFilterTenantId}
                  >
                    <SelectTrigger className="w-full md:w-[250px] border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Filter by Tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      {Array.isArray(tenants) &&
                        tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {(filterPropertyId !== "all" || filterTenantId !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterPropertyId("all");
                        setFilterTenantId("all");
                      }}
                      className="text-[#7C3AED] hover:bg-purple-50"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-auto rounded-xl border-0 shadow-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Document Name
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Type
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Property
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Upload Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          No documents found. Upload your first lease or
                          inspection report to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc, index) => (
                        <TableRow
                          key={doc.id}
                          className={
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50/50 hover:bg-[#7C3AED]/5"
                          }
                        >
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(doc.status)}
                              <span className="font-medium text-gray-900">
                                {doc.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {doc.type}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {doc.properties?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(doc.status)}
                            >
                              {doc.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(doc.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {doc.expiresAt ? formatDate(doc.expiresAt) : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDocument(doc)}
                                className="hover:bg-purple-50"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                className="hover:bg-purple-50"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShare(doc)}
                                className="hover:bg-purple-50"
                                title="Share"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc)}
                                className="hover:bg-red-50 text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-4">
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">Receipts</CardTitle>
                    <CardDescription className="text-gray-600">
                      Tax receipts, payment confirmations, and financial records
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => openUploadDialog("receipt", "Receipts")}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Receipt
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                  <Input
                    placeholder="Search receipts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <Select
                    value={filterPropertyId}
                    onValueChange={setFilterPropertyId}
                  >
                    <SelectTrigger className="w-full md:w-[250px] border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Filter by Property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {Array.isArray(properties) &&
                        properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterTenantId}
                    onValueChange={setFilterTenantId}
                  >
                    <SelectTrigger className="w-full md:w-[250px] border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Filter by Tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      {Array.isArray(tenants) &&
                        tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {(filterPropertyId !== "all" || filterTenantId !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterPropertyId("all");
                        setFilterTenantId("all");
                      }}
                      className="text-[#7C3AED] hover:bg-purple-50"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-auto rounded-xl border-0 shadow-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Document Name
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Type
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Property
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Amount
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Upload Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-gray-500"
                        >
                          No receipts found. Upload your first receipt to get
                          started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc: any, index: number) => (
                        <TableRow
                          key={doc.id}
                          className={
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50/50 hover:bg-[#7C3AED]/5"
                          }
                        >
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Receipt className="h-4 w-4 text-amber-600" />
                              <span className="font-medium text-gray-900">
                                {doc.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {doc.type}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {doc.property}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {doc.amount}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(doc.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDocument(doc)}
                                className="hover:bg-purple-50"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                className="hover:bg-purple-50"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShare(doc)}
                                className="hover:bg-purple-50"
                                title="Share"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc)}
                                className="hover:bg-red-50 text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* Policies & Notices Tab */}
        <TabsContent value="policies-notices" className="space-y-4">
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">
                      Policies & Notices
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Company policies, notice templates, and compliance
                      documents
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    openUploadDialog("policy", "Policies & Notices")
                  }
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy/Notice
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                  <Input
                    placeholder="Search policies and notices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <Select
                    value={filterPropertyId}
                    onValueChange={setFilterPropertyId}
                  >
                    <SelectTrigger className="w-full md:w-[250px] border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Filter by Property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {Array.isArray(properties) &&
                        properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterTenantId}
                    onValueChange={setFilterTenantId}
                  >
                    <SelectTrigger className="w-full md:w-[250px] border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Filter by Tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      {Array.isArray(tenants) &&
                        tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {(filterPropertyId !== "all" || filterTenantId !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterPropertyId("all");
                        setFilterTenantId("all");
                      }}
                      className="text-[#7C3AED] hover:bg-purple-50"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-auto rounded-xl border-0 shadow-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Document Name
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Type
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Property
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-gray-500"
                        >
                          No policies or notices found. Upload your first
                          document to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc, index) => (
                        <TableRow
                          key={doc.id}
                          className={
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50/50 hover:bg-[#7C3AED]/5"
                          }
                        >
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              <span className="font-medium text-gray-900">
                                {doc.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {doc.type}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {doc.properties?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(doc.status)}
                            >
                              {doc.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(doc.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDocument(doc)}
                                className="hover:bg-purple-50"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                className="hover:bg-purple-50"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShare(doc)}
                                className="hover:bg-purple-50"
                                title="Share"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc)}
                                className="hover:bg-red-50 text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="space-y-4">
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">
                      Insurance Documents
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Property insurance, liability coverage, and policy
                      documents
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => openUploadDialog("insurance", "Insurance")}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Insurance Doc
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C3AED]" />
                  <Input
                    placeholder="Search insurance documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <Select
                    value={filterPropertyId}
                    onValueChange={setFilterPropertyId}
                  >
                    <SelectTrigger className="w-full md:w-[250px] border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Filter by Property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {Array.isArray(properties) &&
                        properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterTenantId}
                    onValueChange={setFilterTenantId}
                  >
                    <SelectTrigger className="w-full md:w-[250px] border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                      <SelectValue placeholder="Filter by Tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      {Array.isArray(tenants) &&
                        tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {(filterPropertyId !== "all" || filterTenantId !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterPropertyId("all");
                        setFilterTenantId("all");
                      }}
                      className="text-[#7C3AED] hover:bg-purple-50"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-auto rounded-xl border-0 shadow-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Document Name
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Policy Number
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Property
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-gray-500"
                        >
                          No insurance documents found. Upload your first policy
                          document to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc: any, index: number) => (
                        <TableRow
                          key={doc.id}
                          className={
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50/50 hover:bg-[#7C3AED]/5"
                          }
                        >
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {doc.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-gray-700">
                            {doc.policyNumber}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {doc.property}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(doc.status)}
                            >
                              {doc.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {doc.expiryDate}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDocument(doc)}
                                className="hover:bg-purple-50"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                className="hover:bg-purple-50"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShare(doc)}
                                className="hover:bg-purple-50"
                                title="Share"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc)}
                                className="hover:bg-red-50 text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
      </Tabs>

      {/* Generate Manager Contract Dialog */}
      <Dialog
        open={showGenerateDialog && dialogType === "manager-contract"}
        onOpenChange={setShowGenerateDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-xl">
            <DialogTitle className="text-white text-2xl font-bold">
              Generate Manager Contract
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Create a new property manager agreement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <div className="space-y-2">
              <Label
                htmlFor="contract-property"
                className="text-sm font-semibold text-gray-700"
              >
                Select Property *
              </Label>
              <Select
                value={contractForm.propertyId}
                onValueChange={(value) =>
                  setContractForm({
                    ...contractForm,
                    propertyId: value,
                    managerId: "",
                  })
                }
              >
                <SelectTrigger
                  id="contract-property"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                >
                  <SelectValue placeholder="Choose a property first" />
                </SelectTrigger>
                <SelectContent>
                  {(properties || []).map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex flex-col">
                        <span>{property.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {property.address}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="manager"
                className="text-sm font-semibold text-gray-700"
              >
                Select Manager *
              </Label>
              <Select
                value={contractForm.managerId}
                onValueChange={(value) =>
                  setContractForm({ ...contractForm, managerId: value })
                }
                disabled={!contractForm.propertyId}
              >
                <SelectTrigger
                  id="manager"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                >
                  <SelectValue
                    placeholder={
                      contractForm.propertyId
                        ? "Choose a manager"
                        : "Select a property first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {getManagersForProperty(contractForm.propertyId).map(
                    (manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        <div className="flex flex-col">
                          <span>{manager.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {manager.email}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  )}
                  {contractForm.propertyId &&
                    getManagersForProperty(contractForm.propertyId).length ===
                      0 && (
                      <div className="px-2 py-1 text-sm text-amber-600">
                        No managers assigned to this property
                      </div>
                    )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="template"
                className="text-sm font-semibold text-gray-700"
              >
                Contract Template *
              </Label>
              <Select
                value={contractForm.templateType}
                onValueChange={(value) =>
                  setContractForm({ ...contractForm, templateType: value })
                }
              >
                <SelectTrigger
                  id="template"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contractTemplates.manager.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col">
                        <span>{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {template.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="startDate"
                  className="text-sm font-semibold text-gray-700"
                >
                  Start Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]",
                        !contractForm.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#7C3AED]" />
                      {contractForm.startDate ? (
                        format(new Date(contractForm.startDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 rounded-xl shadow-xl"
                    align="start"
                  >
                    <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] px-4 py-3 rounded-t-xl">
                      <p className="text-white font-semibold text-sm">
                        Select Start Date
                      </p>
                    </div>
                    <div className="p-3 bg-white">
                      <CalendarComponent
                        mode="single"
                        selected={
                          contractForm.startDate
                            ? new Date(contractForm.startDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setContractForm({
                            ...contractForm,
                            startDate: date ? format(date, "yyyy-MM-dd") : "",
                          })
                        }
                        initialFocus
                        classNames={{
                          caption_label: "text-gray-900 font-semibold",
                          nav_button:
                            "border-gray-300 hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED]",
                          day_selected:
                            "bg-[#7C3AED] text-white font-bold shadow-md hover:bg-[#6D28D9]",
                          day_today:
                            "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                          day: "hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]",
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="endDate"
                  className="text-sm font-semibold text-gray-700"
                >
                  End Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]",
                        !contractForm.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#7C3AED]" />
                      {contractForm.endDate ? (
                        format(new Date(contractForm.endDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 rounded-xl shadow-xl"
                    align="start"
                  >
                    <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] px-4 py-3 rounded-t-xl">
                      <p className="text-white font-semibold text-sm">
                        Select End Date
                      </p>
                    </div>
                    <div className="p-3 bg-white">
                      <CalendarComponent
                        mode="single"
                        selected={
                          contractForm.endDate
                            ? new Date(contractForm.endDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setContractForm({
                            ...contractForm,
                            endDate: date ? format(date, "yyyy-MM-dd") : "",
                          })
                        }
                        initialFocus
                        classNames={{
                          caption_label: "text-gray-900 font-semibold",
                          nav_button:
                            "border-gray-300 hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED]",
                          day_selected:
                            "bg-[#7C3AED] text-white font-bold shadow-md hover:bg-[#6D28D9]",
                          day_today:
                            "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                          day: "hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]",
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="compensationType"
                className="text-sm font-semibold text-gray-700"
              >
                Compensation Type *
              </Label>
              <Select
                value={contractForm.compensationType}
                onValueChange={(value) =>
                  setContractForm({
                    ...contractForm,
                    compensationType: value,
                    compensation: "",
                  })
                }
              >
                <SelectTrigger
                  id="compensationType"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">
                    <div className="flex flex-col">
                      <span>Fixed Monthly Amount</span>
                      <span className="text-xs text-muted-foreground">
                        Set amount paid each month
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="percentage">
                    <div className="flex flex-col">
                      <span>Percentage of Revenue</span>
                      <span className="text-xs text-muted-foreground">
                        Percentage of monthly property revenue
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="compensation"
                className="text-sm font-semibold text-gray-700"
              >
                {contractForm.compensationType === "fixed"
                  ? `Monthly Compensation ${
                      contractForm.propertyId
                        ? `(${getPropertyCurrency(contractForm.propertyId)})`
                        : ""
                    } *`
                  : "Compensation Percentage (%) *"}
              </Label>
              <div className="relative">
                <Input
                  id="compensation"
                  type="number"
                  placeholder={
                    contractForm.compensationType === "fixed" ? "5000" : "10"
                  }
                  value={contractForm.compensation}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      compensation: e.target.value,
                    })
                  }
                  min={
                    contractForm.compensationType === "percentage"
                      ? "0"
                      : undefined
                  }
                  max={
                    contractForm.compensationType === "percentage"
                      ? "100"
                      : undefined
                  }
                  step={
                    contractForm.compensationType === "percentage" ? "0.1" : "1"
                  }
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                />
                {contractForm.compensationType === "percentage" &&
                  contractForm.compensation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED] font-semibold">
                      %
                    </div>
                  )}
              </div>
              {contractForm.compensationType === "percentage" && (
                <p className="text-xs text-gray-600">
                  Manager will receive {contractForm.compensation || "0"}% of
                  the property's monthly revenue
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="responsibilities"
                  className="text-sm font-semibold text-gray-700"
                >
                  Key Responsibilities *
                </Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const template = responsibilityTemplates.find(
                      (t) => t.id === value
                    );
                    if (template) {
                      setContractForm({
                        ...contractForm,
                        responsibilities: template.responsibilities,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px] h-8 border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                    <SelectValue placeholder="Quick Fill" />
                  </SelectTrigger>
                  <SelectContent>
                    {responsibilityTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                id="responsibilities"
                placeholder="List the manager's key responsibilities..."
                value={contractForm.responsibilities}
                onChange={(e) =>
                  setContractForm({
                    ...contractForm,
                    responsibilities: e.target.value,
                  })
                }
                rows={8}
                className="font-mono text-sm resize-none border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
              <p className="text-xs text-gray-600">
                Use Quick Fill to populate common responsibilities, then
                customize as needed
              </p>
            </div>

            <Alert className="bg-blue-50 border-blue-200 text-blue-800 rounded-xl shadow-sm">
              <FileCheck className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Draft Mode:</strong> The contract will be saved as a
                draft. You can preview, edit, and send it when ready.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="px-6 pb-6 border-t pt-6">
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateContract}
              disabled={uploading}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Contract"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Tenant Contract Dialog */}
      <Dialog
        open={showGenerateDialog && dialogType === "tenant-contract"}
        onOpenChange={setShowGenerateDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-xl">
            <DialogTitle className="text-white text-2xl font-bold">
              Generate Tenant Contract
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Create a new tenant lease agreement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <div className="space-y-2">
              <Label
                htmlFor="tenantProperty"
                className="text-sm font-semibold text-gray-700"
              >
                Property *
              </Label>
              <Select
                value={contractForm.propertyIds[0] || ""}
                onValueChange={(value) => {
                  setContractForm({
                    ...contractForm,
                    propertyIds: [value],
                    propertyId: value,
                    unitId: "",
                    tenantId: "",
                  });
                  loadUnitsForProperty(value);
                }}
              >
                <SelectTrigger
                  id="tenantProperty"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                >
                  <SelectValue placeholder="Choose a property first" />
                </SelectTrigger>
                <SelectContent>
                  {(properties || []).map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex flex-col">
                        <span>{property.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {property.address}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="tenantUnit"
                className="text-sm font-semibold text-gray-700"
              >
                Unit/Apartment *
              </Label>
              <Select
                value={contractForm.unitId}
                onValueChange={(value) => {
                  setContractForm({ ...contractForm, unitId: value });
                  getTenantForUnit(value);
                }}
                disabled={!contractForm.propertyIds[0]}
              >
                <SelectTrigger
                  id="tenantUnit"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                >
                  <SelectValue
                    placeholder={
                      !contractForm.propertyIds[0]
                        ? "Select property first"
                        : "Select unit"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {propertyUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      <div className="flex flex-col">
                        <span>{unit.unitNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          {unit.type} • {unit.bedrooms} bed
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="tenantSelect"
                className="text-sm font-semibold text-gray-700"
              >
                Tenant {contractForm.tenantId ? "(Auto-selected)" : "*"}
              </Label>
              <Select
                value={contractForm.tenantId || ""}
                onValueChange={(value) => {
                  setContractForm({ ...contractForm, tenantId: value });
                }}
              >
                <SelectTrigger
                  id="tenantSelect"
                  className={`border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${
                    !contractForm.tenantId ? "border-red-300" : ""
                  }`}
                >
                  <SelectValue placeholder="Select tenant (or will auto-populate from unit)" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(tenants) && tenants.length > 0 ? (
                    tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        <div className="flex flex-col">
                          <span>{tenant.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {tenant.email}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No tenants available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                {contractForm.tenantId
                  ? "Tenant selected. You can change it manually if needed."
                  : "Tenant will auto-populate when unit is selected, or select manually"}
              </p>
              {!contractForm.tenantId && contractForm.unitId && (
                <p className="text-xs text-amber-600 font-medium">
                  ⚠️ No active tenant found for this unit. Please select a
                  tenant manually.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="tenantTemplate"
                className="text-sm font-semibold text-gray-700"
              >
                Contract Template *
              </Label>
              <Select
                value={contractForm.templateType}
                onValueChange={(value) =>
                  setContractForm({ ...contractForm, templateType: value })
                }
              >
                <SelectTrigger
                  id="tenantTemplate"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contractTemplates.tenant.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col">
                        <span>{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {template.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="tenantStartDate"
                  className="text-sm font-semibold text-gray-700"
                >
                  Start Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]",
                        !contractForm.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#7C3AED]" />
                      {contractForm.startDate ? (
                        format(new Date(contractForm.startDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 rounded-xl shadow-xl"
                    align="start"
                  >
                    <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] px-4 py-3 rounded-t-xl">
                      <p className="text-white font-semibold text-sm">
                        Select Lease Start Date
                      </p>
                    </div>
                    <div className="p-3 bg-white">
                      <CalendarComponent
                        mode="single"
                        selected={
                          contractForm.startDate
                            ? new Date(contractForm.startDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setContractForm({
                            ...contractForm,
                            startDate: date ? format(date, "yyyy-MM-dd") : "",
                          })
                        }
                        initialFocus
                        classNames={{
                          caption_label: "text-gray-900 font-semibold",
                          nav_button:
                            "border-gray-300 hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED]",
                          day_selected:
                            "bg-[#7C3AED] text-white font-bold shadow-md hover:bg-[#6D28D9]",
                          day_today:
                            "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                          day: "hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]",
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="tenantEndDate"
                  className="text-sm font-semibold text-gray-700"
                >
                  End Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]",
                        !contractForm.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#7C3AED]" />
                      {contractForm.endDate ? (
                        format(new Date(contractForm.endDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 rounded-xl shadow-xl"
                    align="start"
                  >
                    <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] px-4 py-3 rounded-t-xl">
                      <p className="text-white font-semibold text-sm">
                        Select Lease End Date
                      </p>
                    </div>
                    <div className="p-3 bg-white">
                      <CalendarComponent
                        mode="single"
                        selected={
                          contractForm.endDate
                            ? new Date(contractForm.endDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setContractForm({
                            ...contractForm,
                            endDate: date ? format(date, "yyyy-MM-dd") : "",
                          })
                        }
                        initialFocus
                        classNames={{
                          caption_label: "text-gray-900 font-semibold",
                          nav_button:
                            "border-gray-300 hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED]",
                          day_selected:
                            "bg-[#7C3AED] text-white font-bold shadow-md hover:bg-[#6D28D9]",
                          day_today:
                            "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                          day: "hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]",
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="rentAmount"
                className="text-sm font-semibold text-gray-700"
              >
                Monthly Rent *
              </Label>
              <Input
                id="rentAmount"
                type="number"
                placeholder="Auto-filled from selected unit"
                value={contractForm.compensation}
                disabled
                className="bg-gray-50 border-gray-300 cursor-not-allowed"
              />
              <p className="text-xs text-gray-600">
                Monthly rent is automatically populated from the selected unit
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="tenantTermsTemplate"
                className="text-sm font-semibold text-gray-700"
              >
                Special Terms & Conditions Template
              </Label>
              <Select
                onValueChange={(value) => {
                  const template = termsTemplates.find((t) => t.id === value);
                  if (template) {
                    setContractForm({
                      ...contractForm,
                      responsibilities: template.terms,
                    });
                  }
                }}
              >
                <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
                  <SelectValue placeholder="Quick Fill - Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {termsTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="tenantNotes"
                className="text-sm font-semibold text-gray-700"
              >
                Special Terms & Conditions
              </Label>
              <Textarea
                id="tenantNotes"
                placeholder="Enter any special terms or conditions for this lease..."
                rows={8}
                className="font-mono text-sm resize-none border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                value={contractForm.responsibilities}
                onChange={(e) =>
                  setContractForm({
                    ...contractForm,
                    responsibilities: e.target.value,
                  })
                }
              />
              <p className="text-xs text-gray-600">
                You can use the template above to quick-fill, then customize as
                needed
              </p>
            </div>

            <Alert className="bg-blue-50 border-blue-200 text-blue-800 rounded-xl shadow-sm">
              <FileCheck className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Draft Mode:</strong> The lease agreement will be saved
                as a draft. You can preview, edit, and send it when ready.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="px-6 pb-6 border-t pt-6">
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateContract}
              disabled={uploading}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Contract"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-6 rounded-t-xl">
            <DialogTitle className="text-white text-2xl font-bold">
              Upload Document
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Upload a pre-existing document (contract, lease, receipt, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <div className="space-y-2">
              <Label
                htmlFor="uploadFile"
                className="text-sm font-semibold text-gray-700"
              >
                Select File *
              </Label>
              <Input
                id="uploadFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setUploadForm({
                    ...uploadForm,
                    file,
                    name: file?.name.replace(/\.[^/.]+$/, "") || "",
                  });
                }}
                className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
              />
              <p className="text-xs text-gray-600">
                Supported formats: PDF, DOC, DOCX (Max 10MB)
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="uploadDocName"
                className="text-sm font-semibold text-gray-700"
              >
                Document Name *
              </Label>
              <Input
                id="uploadDocName"
                placeholder="Enter document name"
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, name: e.target.value })
                }
                className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="uploadType"
                  className="text-sm font-semibold text-gray-700"
                >
                  Document Type *
                </Label>
                <Select
                  value={uploadForm.type}
                  onValueChange={(value) =>
                    setUploadForm({ ...uploadForm, type: value })
                  }
                >
                  <SelectTrigger
                    id="uploadType"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager-contract">
                      Manager Contract
                    </SelectItem>
                    <SelectItem value="tenant-contract">
                      Tenant Contract
                    </SelectItem>
                    <SelectItem value="lease">Lease Agreement</SelectItem>
                    <SelectItem value="inspection">
                      Inspection Report
                    </SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="policy">Policy/Notice</SelectItem>
                    <SelectItem value="insurance">
                      Insurance Document
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="uploadCategory"
                  className="text-sm font-semibold text-gray-700"
                >
                  Category
                </Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(value) =>
                    setUploadForm({ ...uploadForm, category: value })
                  }
                >
                  <SelectTrigger
                    id="uploadCategory"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Legal Documents">
                      Legal Documents
                    </SelectItem>
                    <SelectItem value="Financial Records">
                      Financial Records
                    </SelectItem>
                    <SelectItem value="Property Documents">
                      Property Documents
                    </SelectItem>
                    <SelectItem value="Tenant Documents">
                      Tenant Documents
                    </SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="uploadProperty"
                className="text-sm font-semibold text-gray-700"
              >
                Property
              </Label>
              <Select
                value={uploadForm.propertyId || "none"}
                onValueChange={(value) => {
                  const finalValue = value === "none" ? "" : value;
                  setUploadForm({
                    ...uploadForm,
                    propertyId: finalValue,
                    unitId: "",
                    tenantId: "",
                  });
                  if (finalValue) loadUnitsForProperty(finalValue);
                }}
              >
                <SelectTrigger
                  id="uploadProperty"
                  className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                >
                  <SelectValue placeholder="Select property (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (optional)</SelectItem>
                  {Array.isArray(properties) && properties.length > 0 ? (
                    properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-properties" disabled>
                      No properties available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {(uploadForm.type === "tenant-contract" ||
              uploadForm.type === "manager-contract") &&
              uploadForm.propertyId && (
                <>
                  {uploadForm.type === "tenant-contract" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="uploadUnit"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Unit/Apartment
                      </Label>
                      <Select
                        value={uploadForm.unitId}
                        onValueChange={(value) => {
                          setUploadForm({ ...uploadForm, unitId: value });
                          getTenantForUnit(value, "upload");
                        }}
                        disabled={!uploadForm.propertyId}
                      >
                        <SelectTrigger
                          id="uploadUnit"
                          className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                        >
                          <SelectValue placeholder="Select unit (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(propertyUnits) &&
                            propertyUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.unitNumber} - {unit.type}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="uploadPerson"
                      className="text-sm font-semibold text-gray-700"
                    >
                      {uploadForm.type === "manager-contract"
                        ? "Manager"
                        : "Tenant"}
                    </Label>
                    <Select
                      value={
                        uploadForm.type === "manager-contract"
                          ? uploadForm.managerId
                          : uploadForm.tenantId
                      }
                      onValueChange={(value) => {
                        if (uploadForm.type === "manager-contract") {
                          setUploadForm({ ...uploadForm, managerId: value });
                        } else {
                          setUploadForm({ ...uploadForm, tenantId: value });
                        }
                      }}
                    >
                      <SelectTrigger
                        id="uploadPerson"
                        className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                      >
                        <SelectValue
                          placeholder={`Select ${
                            uploadForm.type === "manager-contract"
                              ? "manager"
                              : "tenant"
                          } (optional)`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {uploadForm.type === "manager-contract"
                          ? Array.isArray(propertyManagerAssignments) &&
                            propertyManagerAssignments.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name}
                              </SelectItem>
                            ))
                          : Array.isArray(tenants) &&
                            tenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.name}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

            <div className="space-y-2">
              <Label
                htmlFor="uploadDescription"
                className="text-sm font-semibold text-gray-700"
              >
                Description/Notes
              </Label>
              <Textarea
                id="uploadDescription"
                placeholder="Add any notes or description about this document..."
                rows={3}
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, description: e.target.value })
                }
                className="resize-none border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
              />
            </div>

            <Alert className="bg-blue-50 border-blue-200 text-blue-800 rounded-xl shadow-sm">
              <Upload className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>File Upload:</strong> The document will be securely
                stored and associated with the selected property and
                tenant/manager if applicable.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="px-6 pb-6 border-t pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setUploadForm({
                  file: null,
                  name: "",
                  type: "lease",
                  category: "Legal Documents",
                  description: "",
                  propertyId: "",
                  unitId: "",
                  tenantId: "",
                  managerId: "",
                  isShared: false,
                });
              }}
              disabled={uploading}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadForm.file || !uploadForm.name || uploading}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Document Name</Label>
                  <p className="font-medium">{selectedDocument.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedDocument.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedDocument.status)}
                  >
                    {selectedDocument.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Upload Date</Label>
                  <p className="font-medium">
                    {formatDate(selectedDocument.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p className="font-medium">
                    {selectedDocument.expiresAt
                      ? formatDate(selectedDocument.expiresAt)
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">File Size</Label>
                  <p className="font-medium">{selectedDocument.size}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Signed By</Label>
                  <p className="font-medium">{selectedDocument.signedBy}</p>
                </div>
              </div>

              {/* Show contract content preview for contracts */}
              {selectedDocument.type === "contract" &&
                selectedDocument.metadata?.content && (
                  <div className="mt-4">
                    <Label className="text-muted-foreground">
                      Contract Preview
                    </Label>
                    <div className="mt-2 p-4 border rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {selectedDocument.metadata.content}
                      </pre>
                    </div>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() =>
                selectedDocument && handleDownload(selectedDocument)
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Make changes to the contract before sending it for signature
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {selectedDocument && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">
                        {selectedDocument.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedDocument.metadata?.contractType ===
                        "manager-contract"
                          ? "Manager Contract"
                          : "Tenant Contract"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white">
                    Draft
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="contract-content">Contract Content</Label>

                {/* Rich Text Editor with Real-time Formatting */}
                <RichTextEditor
                  content={editableContent}
                  onChange={(content) => setEditableContent(content)}
                />
                <p className="text-xs text-muted-foreground">
                  Use the formatting toolbar to apply bold, italic, headings,
                  lists and more. Changes are applied in real-time.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEditedContract} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Format Selection Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Document
            </DialogTitle>
            <DialogDescription>
              Choose the format you want to download this document in
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Document:{" "}
                <span className="font-medium text-foreground">
                  {selectedDocument?.name}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 hover:bg-red-50 hover:border-red-300"
                onClick={() => handleDownloadInFormat("pdf")}
              >
                <FileText className="h-8 w-8 text-red-600" />
                <div className="text-center">
                  <div className="font-semibold">PDF</div>
                  <div className="text-xs text-muted-foreground">
                    Portable Document
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => handleDownloadInFormat("docx")}
              >
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold">Word</div>
                  <div className="text-xs text-muted-foreground">
                    Editable Document
                  </div>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDownloadDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Document Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Share "{selectedDocument?.name}" with managers and tenants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Share with Managers</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !shareForm.sharedWith.includes(value)) {
                    setShareForm({
                      ...shareForm,
                      sharedWith: [...shareForm.sharedWith, value],
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager to share with" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(managers) &&
                    managers
                      .filter((m) => !shareForm.sharedWith.includes(m.id))
                      .map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} - {manager.email}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Share with Tenants</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !shareForm.sharedWith.includes(value)) {
                    setShareForm({
                      ...shareForm,
                      sharedWith: [...shareForm.sharedWith, value],
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant to share with" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(tenants) &&
                    tenants
                      .filter((t) => !shareForm.sharedWith.includes(t.id))
                      .map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} - {tenant.email}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            {/* Display selected users */}
            {shareForm.sharedWith.length > 0 && (
              <div className="space-y-2">
                <Label>Shared with:</Label>
                <div className="flex flex-wrap gap-2">
                  {shareForm.sharedWith.map((userId) => {
                    const manager = managers.find((m) => m.id === userId);
                    const tenant = tenants.find((t) => t.id === userId);
                    const user = manager || tenant;

                    return user ? (
                      <Badge
                        key={userId}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {user.name}
                        <button
                          onClick={() => {
                            setShareForm({
                              ...shareForm,
                              sharedWith: shareForm.sharedWith.filter(
                                (id) => id !== userId
                              ),
                            });
                          }}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="shareMessage">Message (Optional)</Label>
              <Textarea
                id="shareMessage"
                placeholder="Add a message about this document..."
                rows={3}
                value={shareForm.message}
                onChange={(e) =>
                  setShareForm({ ...shareForm, message: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowShareDialog(false);
                setShareForm({ sharedWith: [], message: "" });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleShareDocument}>
              <Share2 className="h-4 w-4 mr-2" />
              {shareForm.sharedWith.length === 0
                ? "Remove Sharing"
                : "Share Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedDocument?.name}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PropertyOwnerDocuments;
