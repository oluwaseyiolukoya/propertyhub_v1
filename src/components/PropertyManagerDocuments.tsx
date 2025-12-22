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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  FileText,
  Download,
  Search,
  Plus,
  Eye,
  Share2,
  Trash2,
  FileCheck,
  FileClock,
  FileWarning,
  FileSignature,
  Receipt,
  ClipboardList,
  MoreHorizontal,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDocuments,
  createDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats,
  Document,
  DocumentStats,
} from "../lib/api/documents";
import { getProperties } from "../lib/api/properties";
import { getUnits } from "../lib/api/units";
import RichTextEditor from "./RichTextEditor";
import DocumentTemplateManager from "./DocumentTemplateManager";
import { getAuthToken } from "../lib/api-client";
import { API_BASE_URL } from "../lib/api-config";
import {
  subscribeToDocumentEvents,
  unsubscribeFromDocumentEvents,
} from "../lib/socket";

const PropertyManagerDocuments: React.FC = () => {
  // Dialog states
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
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
  const [activeTab, setActiveTab] = useState("all");
  const [editableContent, setEditableContent] = useState("");

  // Data state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [propertyUnits, setPropertyUnits] = useState<any[]>([]);

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
    isShared: false,
  });

  // Form states for generating contracts
  const [contractForm, setContractForm] = useState({
    tenantId: "",
    propertyId: "",
    unitId: "",
    startDate: "",
    endDate: "",
    compensation: "",
    responsibilities: "",
    specialTerms: "",
  });

  // Predefined tenant responsibilities templates
  const responsibilityTemplates = [
    {
      name: "Standard Residential",
      content: `• Pay rent on time by the due date each month
• Maintain the property in good condition
• Report any damages or maintenance issues promptly
• Keep the property clean and sanitary
• Not make any structural changes without written permission
• Comply with all building rules and regulations
• Not disturb other tenants or neighbors
• Allow landlord access for inspections with proper notice`,
    },
    {
      name: "Commercial Property",
      content: `• Pay rent and all utilities on time
• Maintain business insurance as required
• Keep the premises clean and in good repair
• Comply with all zoning and business regulations
• Not make alterations without landlord approval
• Maintain proper signage as per lease agreement
• Ensure proper waste disposal
• Allow landlord access for inspections`,
    },
    {
      name: "Short-term Rental",
      content: `• Pay rent in full before occupancy
• Respect property rules and quiet hours
• Report any damages immediately
• Keep the property clean during stay
• Not exceed maximum occupancy limit
• Not host parties without permission
• Return keys and leave property clean at checkout
• Responsible for any damages beyond normal wear`,
    },
    {
      name: "Student Housing",
      content: `• Pay rent on time each month
• Maintain quiet hours (10 PM - 8 AM)
• Keep common areas clean and tidy
• Not host large gatherings without permission
• Attend to personal hygiene and cleanliness
• Report maintenance issues promptly
• Not sublet without written permission
• Follow all dormitory/housing rules`,
    },
    {
      name: "Luxury/High-End",
      content: `• Pay rent and service charges on time
• Maintain the property to high standards
• Use amenities responsibly and respectfully
• Report any issues to property management immediately
• Comply with building security protocols
• Not make modifications without approval
• Maintain appropriate insurance coverage
• Respect community guidelines and standards`,
    },
  ];

  // Predefined special terms & conditions templates
  const specialTermsTemplates = [
    {
      name: "Standard Terms",
      content: `• Security Deposit: Refundable upon satisfactory inspection at lease end
• Late Payment: A fee of 5% will be charged for payments received after the due date
• Maintenance: Tenant responsible for minor repairs under $100
• Pets: Not allowed without prior written consent and additional deposit
• Smoking: Strictly prohibited inside the property
• Subletting: Not permitted without landlord's written approval
• Utilities: Tenant responsible for electricity, water, and internet
• Notice Period: 30 days written notice required for lease termination`,
    },
    {
      name: "Pet-Friendly",
      content: `• Pets Allowed: Maximum of 2 pets (dogs/cats) with additional deposit
• Pet Deposit: Non-refundable deposit of $500 per pet
• Pet Damage: Tenant liable for any damage caused by pets
• Pet Rules: Pets must be leashed in common areas
• Noise: Pet noise must not disturb neighbors
• Cleaning: Professional carpet cleaning required at move-out
• Breed Restrictions: Certain aggressive breeds not permitted
• Vaccination: Proof of current vaccinations required`,
    },
    {
      name: "Furnished Property",
      content: `• Furniture Included: Property comes fully furnished as per inventory list
• Inventory Check: Tenant to sign inventory list at move-in
• Furniture Care: Tenant responsible for maintaining furniture condition
• Replacements: Damaged furniture must be replaced with equivalent quality
• No Removal: Furniture cannot be removed from property
• Additional Items: No personal furniture without approval
• Cleaning: Professional cleaning required at lease end
• Depreciation: Normal wear and tear accepted`,
    },
    {
      name: "Commercial Lease",
      content: `• Business Use: Property to be used only for approved business activities
• Operating Hours: Business hours as per zoning regulations
• Signage: All signage subject to landlord approval
• Modifications: No structural changes without written permission
• Insurance: Commercial liability insurance required (minimum $1M)
• Maintenance: Tenant responsible for interior maintenance
• Common Area: Shared maintenance costs for common areas
• Renewal: 90 days notice required for lease renewal`,
    },
    {
      name: "Short-Term Rental",
      content: `• Minimum Stay: 30 days minimum rental period
• Utilities Included: All utilities included in rent
• Cleaning: Weekly cleaning service provided
• Check-in/Check-out: Flexible timing with 24-hour notice
• House Rules: Quiet hours from 10 PM to 8 AM
• Guest Policy: Maximum occupancy strictly enforced
• Damage Waiver: $100 non-refundable damage waiver
• Early Termination: 7 days notice with penalty fee`,
    },
    {
      name: "Student Housing",
      content: `• Academic Year: Lease aligned with academic calendar
• Roommates: Shared responsibility for common areas
• Quiet Hours: Strictly enforced during exam periods
• Guests: Overnight guests limited to 3 nights per week
• Parties: Large gatherings require 48-hour notice
• Parking: One parking space per unit
• Study Areas: Common study rooms available 24/7
• Summer Break: Option to sublet during summer with approval`,
    },
  ];

  // Load data on mount
  useEffect(() => {
    loadDocuments();
    loadStats();
    loadProperties();
    loadTenants();
  }, []);

  // Subscribe to real-time document updates
  useEffect(() => {
    const handleDocumentUpdate = (data: {
      documentId: string;
      action: string;
      reason?: string;
      timestamp: string;
    }) => {
      console.log("[Documents] Real-time update received:", data);

      if (data.action === "removed") {
        // Document was removed from sharing or made inactive
        // Remove it from local state immediately for instant UI update
        setDocuments((prev) =>
          prev.filter((doc) => doc.id !== data.documentId)
        );

        // Show appropriate notification
        if (data.reason === "document_inactive") {
          toast.info("A shared document has been made inactive by the owner");
        } else if (data.reason === "sharing_removed") {
          toast.info("A document is no longer shared with you");
        } else if (data.reason === "document_deleted") {
          toast.info("A shared document has been deleted by the owner");
        }

        // Reload stats to update counts
        loadStats();
      } else if (data.action === "updated") {
        // Document was updated, reload to get latest data
        loadDocuments();
        loadStats();
      }
    };

    subscribeToDocumentEvents({
      onUpdated: handleDocumentUpdate,
    });

    return () => {
      unsubscribeFromDocumentEvents();
    };
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await getDocuments({ status: "" });

      if (error) {
        console.error("Error loading documents:", error);
        toast.error("Failed to load documents");
      } else {
        const docs = Array.isArray(data) ? data : [];
        setDocuments(docs);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await getDocumentStats();
      if (error) {
        console.error("Error loading stats:", error);
      } else {
        setStats(data as DocumentStats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadProperties = async () => {
    try {
      const { data, error } = await getProperties();
      if (error) {
        console.error("Error loading properties:", error);
      } else {
        setProperties(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading properties:", error);
    }
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
              acc.push({
                id: tenant.id,
                name: tenant.name,
                email: tenant.email,
              });
            }
            return acc;
          }, []);
        setTenants(uniqueTenants);
      } else {
        setTenants([]);
      }
    } catch (error) {
      console.error("Error loading tenants:", error);
      setTenants([]);
    }
  };

  const loadUnitsForProperty = async (propertyId: string) => {
    if (!propertyId) {
      setPropertyUnits([]);
      return;
    }

    try {
      const { data, error } = await getUnits({ propertyId });
      if (error) {
        console.error("Error loading units:", error);
        toast.error("Failed to load units");
      } else {
        setPropertyUnits(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading units:", error);
      toast.error("Failed to load units");
    }
  };

  const getTenantForUnit = (unitId: string) => {
    const unit = propertyUnits.find((u) => u.id === unitId);
    if (unit) {
      // Auto-populate monthly rent from unit
      const monthlyRent = unit.monthlyRent ? unit.monthlyRent.toString() : "";

      // Auto-populate tenant if unit has one
      if (unit.currentTenantId) {
        const tenant = tenants.find((t) => t.id === unit.currentTenantId);
        if (tenant) {
          setContractForm((prev) => ({
            ...prev,
            tenantId: tenant.id,
            compensation: monthlyRent,
          }));
        } else {
          setContractForm((prev) => ({ ...prev, compensation: monthlyRent }));
        }
      } else {
        setContractForm((prev) => ({ ...prev, compensation: monthlyRent }));
      }
    }
  };

  // Filter documents based on active tab and filters
  const getFilteredDocuments = () => {
    let filtered = documents;

    // Filter by tab (shared documents appear in the tab matching their type)
    // "all" tab shows all documents without type filtering
    if (activeTab === "all") {
      // No type filtering - show all documents
    } else if (activeTab === "tenant-contracts") {
      filtered = filtered.filter(
        (doc) =>
          doc.type === "tenant-contract" ||
          doc.type === "contract" ||
          doc.category === "Tenant Contracts"
      );
    } else if (activeTab === "leases-inspections") {
      filtered = filtered.filter(
        (doc) =>
          doc.type === "lease" ||
          doc.type === "inspection" ||
          doc.category === "Leases & Inspections"
      );
    } else if (activeTab === "receipts") {
      filtered = filtered.filter(
        (doc) =>
          doc.type === "receipt" ||
          doc.category === "Receipts" ||
          doc.category === "Financial Records"
      );
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
      formData.append("isShared", uploadForm.isShared.toString());

      const { error } = await uploadDocument(formData);

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
          isShared: false,
        });
        await loadDocuments();
        await loadStats();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (
      !confirm(
        "Are you sure you want to delete this document? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await deleteDocument(doc.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Document deleted successfully");
        await loadDocuments();
        await loadStats();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewDialog(true);
  };

  const handleDownload = async (doc: Document) => {
    try {
      console.log("Starting download for document:", doc.id, doc.name);

      const API_URL = API_BASE_URL;
      const token = getAuthToken();

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
        token
          ? {
              headers: { Authorization: `Bearer ${token}` },
            }
          : {}
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

      // Create a properly typed blob if needed
      const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
      const mimeType =
        mimeTypes[downloadFormat] || blob.type || "application/octet-stream";
      const typedBlob = new Blob([blob], { type: mimeType });

      const url = window.URL.createObjectURL(typedBlob);
      const a = document.createElement("a");
      a.href = url;

      // Ensure filename has the correct extension
      let downloadName = doc.name;
      if (!downloadName.toLowerCase().endsWith(`.${downloadFormat}`)) {
        downloadName = `${downloadName}.${downloadFormat}`;
      }
      a.download = downloadName;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Document downloaded successfully");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(error.message || "Failed to download document");
    }
  };

  const handleShare = (doc: Document) => {
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

  const handleSaveDocument = async (doc: Document) => {
    try {
      // Check if document is shared
      if (!doc.isShared || !doc.sharedWith || doc.sharedWith.length === 0) {
        toast.error("This document is not shared");
        return;
      }

      // Get current user ID from JWT token
      const token = getAuthToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      // Decode JWT to get user ID
      let currentUserId: string | null = null;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        currentUserId = payload.id;
      } catch (e) {
        console.error("Failed to decode token:", e);
        toast.error("Unable to identify current user");
        return;
      }

      // Verify document is shared with current manager
      if (!currentUserId || !doc.sharedWith.includes(currentUserId)) {
        toast.error("This document is not shared with you");
        return;
      }

      // For documents with fileUrl (uploaded files), download via API and re-upload
      if (doc.fileUrl) {
        const API_URL = API_BASE_URL;
        const authToken = getAuthToken();

        // Determine the file format
        const fileExtension =
          doc.format?.toLowerCase() ||
          doc.fileUrl.split(".").pop()?.toLowerCase() ||
          "pdf";

        // Download via API endpoint (handles auth and file not found properly)
        const response = await fetch(
          `${API_URL}/api/documents/${doc.id}/download/${fileExtension}`,
          authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}
        );

        if (!response.ok) {
          let errorMessage = `Failed to download file: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // Use status text
          }
          throw new Error(errorMessage);
        }

        const blob = await response.blob();

        // Ensure filename has correct extension
        let filename = doc.name;
        if (!filename.toLowerCase().endsWith(`.${fileExtension}`)) {
          filename = `${filename}.${fileExtension}`;
        }

        const file = new File([blob], filename, {
          type: blob.type || "application/octet-stream",
        });

        // Upload as new document owned by manager
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", `${doc.name} (Saved Copy)`);
        formData.append("type", doc.type);
        formData.append("category", doc.category);
        formData.append("description", doc.description || "");
        if (doc.propertyId) formData.append("propertyId", doc.propertyId);
        if (doc.unitId) formData.append("unitId", doc.unitId);
        if (doc.tenantId) formData.append("tenantId", doc.tenantId);
        formData.append("isShared", "false");

        const { error } = await uploadDocument(formData);

        if (error) {
          toast.error(error);
        } else {
          toast.success("Document saved successfully");
          await loadDocuments();
        }
      } else {
        // For generated contracts (no fileUrl), create a copy with same metadata
        const documentData = {
          name: `${doc.name} (Saved Copy)`,
          type: doc.type,
          category: doc.category,
          description: doc.description || "",
          propertyId: doc.propertyId || null,
          unitId: doc.unitId || null,
          tenantId: doc.tenantId || null,
          status: doc.status,
          metadata: doc.metadata || {},
          isShared: false,
        };

        const { error } = await createDocument(documentData);

        if (error) {
          toast.error(error);
        } else {
          toast.success("Document saved successfully");
          await loadDocuments();
        }
      }
    } catch (error) {
      console.error("Save document error:", error);
      toast.error("Failed to save document");
    }
  };

  const handleEditContract = (doc: Document) => {
    setSelectedDocument(doc);
    setEditableContent(doc.metadata?.content || "");
    setShowEditDialog(true);
  };

  const handleSaveEditedContract = async () => {
    if (!selectedDocument) return;

    try {
      const { error } = await updateDocument(selectedDocument.id, {
        metadata: {
          ...selectedDocument.metadata,
          content: editableContent,
        },
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success("Contract updated successfully");
        setShowEditDialog(false);
        await loadDocuments();
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save contract");
    }
  };

  const handleMakeActive = async (doc: Document) => {
    if (
      !confirm(
        "Are you sure you want to make this contract active? This will send it to the tenant for signature."
      )
    ) {
      return;
    }

    try {
      const { error } = await updateDocument(doc.id, {
        status: "active",
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success("Contract activated successfully");
        await loadDocuments();
        await loadStats();
      }
    } catch (error) {
      console.error("Activate contract error:", error);
      toast.error("Failed to activate contract");
    }
  };

  const handleMakeInactive = async (doc: Document) => {
    if (
      !confirm(
        "Are you sure you want to make this document inactive? It will be hidden from the tenant."
      )
    ) {
      return;
    }

    try {
      const { error } = await updateDocument(doc.id, {
        status: "inactive",
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success("Document marked as inactive");
        await loadDocuments();
        await loadStats();
      }
    } catch (error) {
      console.error("Make inactive error:", error);
      toast.error("Failed to make document inactive");
    }
  };

  const openGenerateDialog = () => {
    setContractForm({
      tenantId: "",
      propertyId: "",
      unitId: "",
      startDate: "",
      endDate: "",
      compensation: "",
      responsibilities: "",
      specialTerms: "",
    });
    setShowGenerateDialog(true);
  };

  const handleTemplateSelect = (template: any) => {
    setContractForm((prev) => ({
      ...prev,
      responsibilities:
        template.content || template.defaultResponsibilities || "",
      specialTerms: template.defaultTerms || "",
    }));
    setShowTemplateManager(false);
    toast.success("Template applied successfully");
  };

  const openUploadDialog = (type: string, category: string) => {
    setUploadForm((prev) => ({
      ...prev,
      type,
      category,
    }));
    setShowUploadDialog(true);
  };

  const generateContractContent = () => {
    const property = properties.find((p) => p.id === contractForm.propertyId);
    const tenant = tenants.find((t) => t.id === contractForm.tenantId);
    const unit = propertyUnits.find((u) => u.id === contractForm.unitId);
    const currencySymbol = property?.currency === "USD" ? "$" : "₦";

    const compensationText = `${currencySymbol}${contractForm.compensation} per month`;

    // Parse responsibilities to create proper list items
    const responsibilitiesLines = (
      contractForm.responsibilities || "To be specified"
    )
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const cleanedLine = line
          .replace(/^[•\-\*]\s*/, "")
          .replace(/^\d+\.\s*/, "")
          .trim();
        return `<li>${cleanedLine}</li>`;
      })
      .join("");

    // Generate HTML content with proper formatting
    return `
<h1>LEASE AGREEMENT</h1>

<p>This Lease Agreement ("<strong>Agreement</strong>") is entered into on <strong>${new Date().toLocaleDateString()}</strong> by and between:</p>

<h2>PROPERTY OWNER (Landlord)</h2>
<p>[Owner Name]<br>[Owner Address]</p>

<p style="text-align: center;"><strong>AND</strong></p>

<h2>TENANT (Lessee)</h2>
<p>${tenant?.name || "N/A"}<br>${tenant?.email || ""}</p>

<h2>PROPERTY DETAILS</h2>
<p><strong>Property:</strong> ${property?.name || "N/A"}<br>
<strong>Address:</strong> ${property?.address || "N/A"}, ${
      property?.city || "N/A"
    }, ${property?.state || "N/A"}<br>
<strong>Unit:</strong> ${unit?.unitNumber || "N/A"}</p>

<h2>TERM OF LEASE</h2>
<p><strong>Start Date:</strong> ${contractForm.startDate || "TBD"}<br>
<strong>End Date:</strong> ${contractForm.endDate || "TBD"}</p>

<h2>RENT</h2>
<p><strong>Monthly Rent:</strong> ${compensationText}</p>

<h2>TENANT OBLIGATIONS</h2>
<ul>
${responsibilitiesLines}
</ul>

<h2>TERMS AND CONDITIONS</h2>
<ol>
<li>The Tenant agrees to pay rent on time and maintain the property in good condition.</li>
<li>The Tenant shall not sublet the property without written consent from the Landlord.</li>
<li>The Tenant is responsible for utilities and routine maintenance.</li>
<li>The Landlord reserves the right to inspect the property with reasonable notice.</li>
</ol>

${
  contractForm.specialTerms
    ? `
<h2>SPECIAL TERMS & CONDITIONS</h2>
<p>${contractForm.specialTerms}</p>
`
    : ""
}

<h2>SIGNATURES</h2>
<p>This agreement shall be binding upon signature by both parties.</p>

<p><strong>Property Owner:</strong> _____________________ <strong>Date:</strong> _________</p>

<p><strong>Tenant:</strong> _____________________ <strong>Date:</strong> _________</p>

<hr>
<p style="text-align: center;"><em>Generated: ${new Date().toLocaleString()}</em><br>
<em>Status: Draft - Not yet sent for signature</em></p>
`;
  };

  const handleGenerateContract = async () => {
    if (
      !contractForm.tenantId ||
      !contractForm.propertyId ||
      !contractForm.startDate ||
      !contractForm.endDate ||
      !contractForm.compensation
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const content = generateContractContent();
      const tenant = tenants.find((t) => t.id === contractForm.tenantId);
      const property = properties.find((p) => p.id === contractForm.propertyId);

      const documentData = {
        name: `Lease Agreement - ${tenant?.name} - ${property?.name}`,
        type: "tenant-contract",
        category: "Tenant Contracts",
        description: `Lease agreement for ${tenant?.name}`,
        propertyId: contractForm.propertyId,
        unitId: contractForm.unitId || null,
        tenantId: contractForm.tenantId,
        status: "draft",
        metadata: {
          content,
          startDate: contractForm.startDate,
          endDate: contractForm.endDate,
          monthlyRent: contractForm.compensation,
          responsibilities: contractForm.responsibilities,
          specialTerms: contractForm.specialTerms,
        },
        expiresAt: contractForm.endDate ? contractForm.endDate : null,
      };

      console.log("Creating contract document:", documentData);
      const { data, error } = await createDocument(documentData);

      if (error) {
        console.error("Contract creation error:", error);
        toast.error(error);
      } else {
        console.log("Contract created successfully:", data);
        toast.success("Contract generated successfully");
        setShowGenerateDialog(false);
        await loadDocuments();
        await loadStats();
      }
    } catch (error) {
      console.error("Generate error:", error);
      toast.error("Failed to generate contract");
    }
  };

  // Helper functions
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "expired":
        return "bg-red-100 text-red-800 border-red-300";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <FileCheck className="h-4 w-4 text-green-600" />;
      case "draft":
        return <FileClock className="h-4 w-4 text-yellow-600" />;
      case "expired":
        return <FileWarning className="h-4 w-4 text-red-600" />;
      case "pending":
        return <FileClock className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredDocuments = getFilteredDocuments();

  // Show Template Manager as full page
  if (showTemplateManager) {
    return (
      <div className="space-y-6">
        <DocumentTemplateManager
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplateManager(false)}
        />
      </div>
    );
  }

  // Show Documents List
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All document types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tenant Contracts
            </CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byType?.find(
                (t: any) =>
                  t.type === "tenant-contract" || t.type === "contract"
              )?._count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active agreements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leases</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byType?.find((t: any) => t.type === "lease")?._count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Lease documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recent || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            <FileText className="h-4 w-4 mr-2" />
            All Documents
          </TabsTrigger>
          <TabsTrigger value="tenant-contracts">
            <FileSignature className="h-4 w-4 mr-2" />
            Tenant Contracts
          </TabsTrigger>
          <TabsTrigger value="leases-inspections">
            <ClipboardList className="h-4 w-4 mr-2" />
            Lease & Inspections
          </TabsTrigger>
          <TabsTrigger value="receipts">
            <Receipt className="h-4 w-4 mr-2" />
            Receipts
          </TabsTrigger>
        </TabsList>

        {/* All Documents Tab */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Documents</CardTitle>
                  <CardDescription>
                    View all documents including shared documents
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                  <Select
                    value={filterPropertyId}
                    onValueChange={setFilterPropertyId}
                  >
                    <SelectTrigger className="w-[250px]">
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
                    <SelectTrigger className="w-[250px]">
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
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
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
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Property
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Shared
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading documents...
                      </TableCell>
                    </TableRow>
                  ) : getFilteredDocuments().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No documents found
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total in state: {documents.length} documents
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredDocuments().map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            {doc.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{doc.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              doc.status === "active"
                                ? "bg-green-100 text-green-800"
                                : doc.status === "draft"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.properties?.name || "N/A"}</TableCell>
                        <TableCell>
                          {doc.isShared ? (
                            <Badge className="bg-blue-100 text-blue-800">
                              Shared
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleViewDocument(doc)}
                              >
                                <Eye className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="h-4 w-4 mr-2" /> Download
                              </DropdownMenuItem>
                              {/* Show Save option for shared documents */}
                              {doc.isShared &&
                                doc.sharedWith &&
                                doc.sharedWith.length > 0 && (
                                  <DropdownMenuItem
                                    onClick={() => handleSaveDocument(doc)}
                                    className="text-blue-600"
                                  >
                                    <Save className="h-4 w-4 mr-2" /> Save Copy
                                  </DropdownMenuItem>
                                )}
                              <DropdownMenuItem
                                onClick={() => handleShare(doc)}
                              >
                                <Share2 className="h-4 w-4 mr-2" /> Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteDocument(doc)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenant Contracts Tab */}
        <TabsContent value="tenant-contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tenant Contracts</CardTitle>
                  <CardDescription>
                    Generate and manage tenant lease agreements
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowTemplateManager(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Templates
                  </Button>
                  <Button onClick={openGenerateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Contract
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                  <Select
                    value={filterPropertyId}
                    onValueChange={setFilterPropertyId}
                  >
                    <SelectTrigger className="w-[250px]">
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
                    <SelectTrigger className="w-[250px]">
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
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
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
                      Property
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tenant
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
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Loading documents...
                      </TableCell>
                    </TableRow>
                  ) : filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No contracts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc, index) => (
                      <TableRow
                        key={doc.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        } hover:bg-purple-50/50 transition-colors`}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(doc.status)}
                            <span className="font-medium">{doc.name}</span>
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
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.properties?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.tenant?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.expiresAt ? formatDate(doc.expiresAt) : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" title="Actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleViewDocument(doc)}
                              >
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              {doc.status === "draft" &&
                              doc.type === "tenant-contract" ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleEditContract(doc)}
                                  >
                                    <FileSignature className="h-4 w-4 mr-2" />{" "}
                                    Edit Contract
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleMakeActive(doc)}
                                    className="text-green-600"
                                  >
                                    <FileCheck className="h-4 w-4 mr-2" /> Make
                                    Active
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                              <DropdownMenuItem
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="h-4 w-4 mr-2" /> Download
                              </DropdownMenuItem>
                              {/* Show Save option for shared documents */}
                              {doc.isShared &&
                                doc.sharedWith &&
                                doc.sharedWith.length > 0 && (
                                  <DropdownMenuItem
                                    onClick={() => handleSaveDocument(doc)}
                                    className="text-blue-600"
                                  >
                                    <Save className="h-4 w-4 mr-2" /> Save Copy
                                  </DropdownMenuItem>
                                )}
                              {doc.status !== "draft" && (
                                <DropdownMenuItem
                                  onClick={() => handleShare(doc)}
                                >
                                  <Share2 className="h-4 w-4 mr-2" /> Share
                                </DropdownMenuItem>
                              )}
                              {/* Only show Make Active/Inactive for generated contracts (no fileUrl) */}
                              {!doc.fileUrl && doc.status === "active" && (
                                <DropdownMenuItem
                                  onClick={() => handleMakeInactive(doc)}
                                  className="text-orange-600"
                                >
                                  <FileWarning className="h-4 w-4 mr-2" /> Make
                                  Inactive
                                </DropdownMenuItem>
                              )}
                              {!doc.fileUrl && doc.status === "inactive" && (
                                <DropdownMenuItem
                                  onClick={() => handleMakeActive(doc)}
                                  className="text-green-600"
                                >
                                  <FileCheck className="h-4 w-4 mr-2" /> Make
                                  Active
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteDocument(doc)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lease & Inspections Tab */}
        <TabsContent value="leases-inspections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lease Agreements & Inspections</CardTitle>
                  <CardDescription>
                    Manage lease documents and inspection reports
                  </CardDescription>
                </div>
                <Button
                  onClick={() =>
                    openUploadDialog("lease", "Leases & Inspections")
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search leases and inspections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                  <Select
                    value={filterPropertyId}
                    onValueChange={setFilterPropertyId}
                  >
                    <SelectTrigger className="w-[250px]">
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
                    <SelectTrigger className="w-[250px]">
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
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
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
                      Tenant
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
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Loading documents...
                      </TableCell>
                    </TableRow>
                  ) : filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No documents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc, index) => (
                      <TableRow
                        key={doc.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        } hover:bg-purple-50/50 transition-colors`}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(doc.status)}
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.properties?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.tenant?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" title="Actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleViewDocument(doc)}
                              >
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="h-4 w-4 mr-2" /> Download
                              </DropdownMenuItem>
                              {/* Show Save option for shared documents */}
                              {doc.isShared &&
                                doc.sharedWith &&
                                doc.sharedWith.length > 0 && (
                                  <DropdownMenuItem
                                    onClick={() => handleSaveDocument(doc)}
                                    className="text-blue-600"
                                  >
                                    <Save className="h-4 w-4 mr-2" /> Save Copy
                                  </DropdownMenuItem>
                                )}
                              <DropdownMenuItem
                                onClick={() => handleShare(doc)}
                              >
                                <Share2 className="h-4 w-4 mr-2" /> Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteDocument(doc)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Receipts</CardTitle>
                  <CardDescription>
                    Payment receipts and financial records
                  </CardDescription>
                </div>
                <Button onClick={() => openUploadDialog("receipt", "Receipts")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Receipt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search receipts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                  <Select
                    value={filterPropertyId}
                    onValueChange={setFilterPropertyId}
                  >
                    <SelectTrigger className="w-[250px]">
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
                    <SelectTrigger className="w-[250px]">
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
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
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
                      Tenant
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
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Loading documents...
                      </TableCell>
                    </TableRow>
                  ) : filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No receipts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc, index) => (
                      <TableRow
                        key={doc.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        } hover:bg-purple-50/50 transition-colors`}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Receipt className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.properties?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.tenant?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" title="Actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleViewDocument(doc)}
                              >
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="h-4 w-4 mr-2" /> Download
                              </DropdownMenuItem>
                              {/* Show Save option for shared documents */}
                              {doc.isShared &&
                                doc.sharedWith &&
                                doc.sharedWith.length > 0 && (
                                  <DropdownMenuItem
                                    onClick={() => handleSaveDocument(doc)}
                                    className="text-blue-600"
                                  >
                                    <Save className="h-4 w-4 mr-2" /> Save Copy
                                  </DropdownMenuItem>
                                )}
                              <DropdownMenuItem
                                onClick={() => handleShare(doc)}
                              >
                                <Share2 className="h-4 w-4 mr-2" /> Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteDocument(doc)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Contract Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Tenant Lease Agreement</DialogTitle>
            <DialogDescription>
              Create a new lease agreement for a tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property *</Label>
              <Select
                value={contractForm.propertyId}
                onValueChange={(value) => {
                  setContractForm({
                    ...contractForm,
                    propertyId: value,
                    unitId: "",
                  });
                  loadUnitsForProperty(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(properties) &&
                    properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit/Apartment</Label>
              <Select
                value={contractForm.unitId}
                onValueChange={(value) => {
                  setContractForm({ ...contractForm, unitId: value });
                  getTenantForUnit(value);
                }}
                disabled={!contractForm.propertyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {propertyUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unitNumber} - {unit.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant *</Label>
              <Select
                value={contractForm.tenantId}
                onValueChange={(value) =>
                  setContractForm({ ...contractForm, tenantId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(tenants) &&
                    tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} - {tenant.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={contractForm.startDate}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={contractForm.endDate}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensation">Monthly Rent *</Label>
              <Input
                id="compensation"
                type="number"
                placeholder="Auto-filled from selected unit"
                value={contractForm.compensation}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Monthly rent is automatically populated from the selected unit
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="responsibilities">
                  Tenant Responsibilities
                </Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && value !== "custom") {
                      const template = responsibilityTemplates.find(
                        (t) => t.name === value
                      );
                      if (template) {
                        setContractForm({
                          ...contractForm,
                          responsibilities: template.content,
                        });
                        toast.success(`${template.name} template applied`);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="Use Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {responsibilityTemplates.map((template) => (
                      <SelectItem key={template.name} value={template.name}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                id="responsibilities"
                placeholder="Enter tenant responsibilities (one per line) or use a template above"
                rows={6}
                value={contractForm.responsibilities}
                onChange={(e) =>
                  setContractForm({
                    ...contractForm,
                    responsibilities: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="specialTerms">Special Terms & Conditions</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && value !== "custom") {
                      const template = specialTermsTemplates.find(
                        (t) => t.name === value
                      );
                      if (template) {
                        setContractForm({
                          ...contractForm,
                          specialTerms: template.content,
                        });
                        toast.success(`${template.name} template applied`);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="Use Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialTermsTemplates.map((template) => (
                      <SelectItem key={template.name} value={template.name}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                id="specialTerms"
                placeholder="Enter any special terms or conditions or use a template above"
                rows={6}
                value={contractForm.specialTerms}
                onChange={(e) =>
                  setContractForm({
                    ...contractForm,
                    specialTerms: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateContract}>Generate Contract</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadForm({
                      ...uploadForm,
                      file,
                      name: file.name.replace(/\.[^/.]+$/, ""),
                    });
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                placeholder="Enter document name"
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Document Type</Label>
              <Select
                value={uploadForm.type}
                onValueChange={(value) =>
                  setUploadForm({ ...uploadForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lease">Lease Agreement</SelectItem>
                  <SelectItem value="inspection">Inspection Report</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select
                value={uploadForm.propertyId}
                onValueChange={(value) => {
                  setUploadForm({
                    ...uploadForm,
                    propertyId: value,
                    unitId: "",
                  });
                  loadUnitsForProperty(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(properties) &&
                    properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant</Label>
              <Select
                value={uploadForm.tenantId}
                onValueChange={(value) =>
                  setUploadForm({ ...uploadForm, tenantId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(tenants) &&
                    tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter document description"
                rows={3}
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Document Name</Label>
                  <p className="font-medium">{selectedDocument.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium capitalize">
                    {selectedDocument.type}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedDocument.status)}
                  >
                    {selectedDocument.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedDocument.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Property</Label>
                  <p className="font-medium">
                    {selectedDocument.properties?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tenant</Label>
                  <p className="font-medium">
                    {selectedDocument.tenant?.name || "N/A"}
                  </p>
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
              </div>
              {selectedDocument.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{selectedDocument.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {selectedDocument && (
              <Button onClick={() => handleDownload(selectedDocument)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Make changes to the contract content
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RichTextEditor
              content={editableContent}
              onChange={(content) => setEditableContent(content)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedContract}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Document Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Share "{selectedDocument?.name}" with tenants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                    const tenant = tenants.find((t) => t.id === userId);

                    return tenant ? (
                      <Badge
                        key={userId}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {tenant.name}
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
    </div>
  );
};

export default PropertyManagerDocuments;
