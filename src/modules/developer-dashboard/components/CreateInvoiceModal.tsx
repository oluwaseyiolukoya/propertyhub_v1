import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  HardDrive,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Progress } from "../../../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Calendar } from "../../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import type { CreateInvoiceRequest } from "../types";
import { getVendors } from "../../../lib/api/vendors";
import { apiClient } from "../../../lib/api-client";
import { updateProjectInvoice } from "../../../lib/api/invoices";

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId?: string;
  invoiceToEdit?: any; // ProjectInvoice type for edit mode
}

interface AttachmentFile {
  id: string;
  file: File;
  uploadStatus: "pending" | "uploading" | "success" | "error";
  uploadProgress: number;
  uploadedPath?: string;
  error?: string;
}

interface StorageQuota {
  used: number;
  limit: number;
  available: number;
  percentage: number;
  usedFormatted: string;
  limitFormatted: string;
  availableFormatted: string;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  open,
  onClose,
  onSuccess,
  projectId,
  invoiceToEdit,
}) => {
  const isEditMode = !!invoiceToEdit;
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    invoiceNumber: "",
    description: "",
    category: "materials",
    amount: 0,
    vendorId: undefined,
    dueDate: undefined,
    notes: undefined,
  });
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Attachment state
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [loadingExistingAttachments, setLoadingExistingAttachments] =
    useState(false);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Vendors state - fetched from API
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>(
    []
  );

  // Mock data - will be replaced with API calls
  const projects = [
    { id: "proj-1", name: "Lekki Heights Residential" },
    { id: "proj-2", name: "Victoria Island Tower" },
    { id: "proj-3", name: "Ikoyi Gardens Estate" },
  ];

  // Fetch existing attachments in edit mode
  const fetchExistingAttachments = async () => {
    if (!invoiceToEdit?.projectId || !invoiceToEdit?.id) return;

    setLoadingExistingAttachments(true);
    try {
      const response = await apiClient.get<any>(
        `/api/developer-dashboard/projects/${invoiceToEdit.projectId}/invoices/${invoiceToEdit.id}/attachments`
      );

      if (response.error) {
        console.error("Failed to fetch existing attachments:", response.error);
        setExistingAttachments([]);
        return;
      }

      const payload = response.data as any;
      if (payload?.success && Array.isArray(payload.data)) {
        setExistingAttachments(payload.data);
      } else {
        setExistingAttachments([]);
      }
    } catch (error) {
      console.error("Error fetching existing attachments:", error);
      setExistingAttachments([]);
    } finally {
      setLoadingExistingAttachments(false);
    }
  };

  // Populate form data when in edit mode
  useEffect(() => {
    if (open && isEditMode && invoiceToEdit) {
      setFormData({
        invoiceNumber: invoiceToEdit.invoiceNumber || "",
        description: invoiceToEdit.description || "",
        category: invoiceToEdit.category || "materials",
        amount: invoiceToEdit.amount || 0,
        vendorId: invoiceToEdit.vendorId || invoiceToEdit.vendor?.id,
        dueDate: invoiceToEdit.dueDate,
        notes: invoiceToEdit.notes,
      });
      if (invoiceToEdit.projectId) {
        setSelectedProject(invoiceToEdit.projectId);
      }
      if (invoiceToEdit.dueDate) {
        setDueDate(new Date(invoiceToEdit.dueDate));
      }
      // Fetch existing attachments
      fetchExistingAttachments();
    } else if (open && !isEditMode) {
      // Reset form for create mode
      setFormData({
        invoiceNumber: "",
        description: "",
        category: "materials",
        amount: 0,
        vendorId: undefined,
        dueDate: undefined,
        notes: undefined,
      });
      setDueDate(undefined);
      setAttachments([]);
      setExistingAttachments([]);
    }
  }, [open, isEditMode, invoiceToEdit]);

  // Fetch storage quota when modal opens
  useEffect(() => {
    if (open) {
      fetchQuota();
    }
  }, [open]);

  // Also fetch vendors and auto-generate invoice number on open
  useEffect(() => {
    if (!open) return;
    // Fetch vendors
    (async () => {
      try {
        const response: any = await getVendors();
        if (response?.data) {
          const list = response.data.map((v: any) => ({
            id: v.id,
            name: v.name,
          }));
          setVendors(list);
        } else {
          setVendors([]);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
        setVendors([]);
      }
    })();

    // Generate invoice number when project is known (only in create mode)
    if (!isEditMode) {
      const proj = projectId || selectedProject;
      if (proj) {
        (async () => {
          try {
            const resp = await apiClient.get<any>(
              `/api/developer-dashboard/projects/${proj}/invoices`
            );
            const invoices: any[] = Array.isArray(resp?.data)
              ? resp.data
              : Array.isArray(resp?.data?.data)
              ? resp.data.data
              : [];
            const year = new Date().getFullYear();
            const re = new RegExp(`^INV-${year}-\\d{3}$`);
            const nums = invoices
              .map((inv) => inv?.invoiceNumber)
              .filter((s) => typeof s === "string" && re.test(s as string))
              .map((s) => parseInt(String(s).split("-")[2], 10))
              .filter((n) => !isNaN(n));
            const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
            const nextStr = `INV-${year}-${String(nextNum).padStart(3, "0")}`;
            setFormData((prev) => ({ ...prev, invoiceNumber: nextStr }));
          } catch {
            const year = new Date().getFullYear();
            setFormData((prev) => ({
              ...prev,
              invoiceNumber: `INV-${year}-001`,
            }));
          }
        })();
      }
    }
  }, [open]);

  // When project selection changes (global invoices flow), regenerate invoice number
  useEffect(() => {
    if (!open || projectId) return;
    if (!selectedProject) return;
    (async () => {
      try {
        const resp = await apiClient.get<any>(
          `/api/developer-dashboard/projects/${selectedProject}/invoices`
        );
        const invoices: any[] = Array.isArray(resp?.data)
          ? resp.data
          : Array.isArray(resp?.data?.data)
          ? resp.data.data
          : [];
        const year = new Date().getFullYear();
        const re = new RegExp(`^INV-${year}-\\d{3}$`);
        const nums = invoices
          .map((inv) => inv?.invoiceNumber)
          .filter((s) => typeof s === "string" && re.test(s as string))
          .map((s) => parseInt(String(s).split("-")[2], 10))
          .filter((n) => !isNaN(n));
        const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
        const nextStr = `INV-${year}-${String(nextNum).padStart(3, "0")}`;
        setFormData((prev) => ({ ...prev, invoiceNumber: nextStr }));
      } catch {
        const year = new Date().getFullYear();
        setFormData((prev) => ({ ...prev, invoiceNumber: `INV-${year}-001` }));
      }
    })();
  }, [selectedProject, open, projectId]);

  const fetchQuota = async () => {
    setQuotaLoading(true);
    try {
      const response = await fetch("/api/storage/quota", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setQuota(data.data);
      }
    } catch (error) {
      console.error("Error fetching quota:", error);
    } finally {
      setQuotaLoading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      uploadStatus: "pending",
      uploadProgress: 0,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const uploadAttachment = async (attachment: AttachmentFile) => {
    // Check quota before upload
    if (quota && attachment.file.size > quota.available) {
      setAttachments((prev) =>
        prev.map((att) =>
          att.id === attachment.id
            ? {
                ...att,
                uploadStatus: "error",
                error: `File size exceeds available storage (${quota.availableFormatted} remaining)`,
              }
            : att
        )
      );
      return;
    }

    setAttachments((prev) =>
      prev.map((att) =>
        att.id === attachment.id ? { ...att, uploadStatus: "uploading" } : att
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", attachment.file);
      formData.append(
        "description",
        `Invoice attachment: ${attachment.file.name}`
      );

      const response = await fetch("/api/storage/upload-invoice-attachment", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Upload failed");
      }

      setAttachments((prev) =>
        prev.map((att) =>
          att.id === attachment.id
            ? {
                ...att,
                uploadStatus: "success",
                uploadProgress: 100,
                uploadedPath: result.data.filePath,
              }
            : att
        )
      );

      // Update quota
      if (result.data.quota) {
        setQuota(result.data.quota);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setAttachments((prev) =>
        prev.map((att) =>
          att.id === attachment.id
            ? {
                ...att,
                uploadStatus: "error",
                error: error.message || "Upload failed",
              }
            : att
        )
      );
    }
  };

  const uploadAllAttachments = async () => {
    const pendingAttachments = attachments.filter(
      (att) => att.uploadStatus === "pending"
    );

    for (const attachment of pendingAttachments) {
      await uploadAttachment(attachment);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode && invoiceToEdit) {
        // Edit mode - update existing invoice
        const updateData = {
          description: formData.description,
          category: formData.category,
          amount: formData.amount,
          currency: "NGN",
          dueDate: dueDate?.toISOString(),
          notes: formData.notes,
          vendorId: formData.vendorId,
        };

        const response = await updateProjectInvoice(
          invoiceToEdit.projectId,
          invoiceToEdit.id,
          updateData
        );

        if (response.error) {
          alert(response.error.message || "Failed to update invoice");
          setLoading(false);
          return;
        }

        onSuccess();
      } else {
        // Create mode - upload attachments and create new invoice
        // 1. Upload all pending attachments first
        await uploadAllAttachments();

        // 2. Check if all uploads succeeded
        const failedUploads = attachments.filter(
          (att) => att.uploadStatus === "error"
        );

        if (failedUploads.length > 0) {
          alert(
            `${failedUploads.length} file(s) failed to upload. Please remove them or try again.`
          );
          setLoading(false);
          return;
        }

        // 3. Create invoice with attachment paths
        const attachmentPaths = attachments
          .filter((att) => att.uploadStatus === "success")
          .map((att) => att.uploadedPath);

        const invoiceData = {
          ...formData,
          projectId: selectedProject,
          attachments: attachmentPaths,
        };

        // TODO: Call invoice creation API
        console.log("Creating invoice with data:", invoiceData);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        onSuccess();
      }
    } catch (error) {
      console.error(
        isEditMode ? "Error updating invoice:" : "Error creating invoice:",
        error
      );
      alert(
        isEditMode ? "Failed to update invoice" : "Failed to create invoice"
      );
    } finally {
      setLoading(false);
    }
  };

  const getTotalAttachmentSize = () => {
    return attachments.reduce((total, att) => total + att.file.size, 0);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const isValid = () => {
    return (
      (projectId || selectedProject) &&
      formData.vendorId &&
      formData.description &&
      formData.amount > 0
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Invoice" : "Create New Invoice"}
          </DialogTitle>
          <DialogDescription>
            Add a new invoice for project expenses and vendor payments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Storage Quota Display */}
          {quota && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-700" />
                  <span className="text-sm font-medium text-blue-900">
                    Storage Usage
                  </span>
                </div>
                <span className="text-sm text-blue-700">
                  {quota.usedFormatted} / {quota.limitFormatted}
                </span>
              </div>
              <Progress
                value={quota.percentage}
                className={`h-2 ${
                  quota.percentage > 90
                    ? "bg-red-100"
                    : quota.percentage > 75
                    ? "bg-yellow-100"
                    : "bg-blue-100"
                }`}
              />
              {quota.percentage > 90 && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Storage almost full. Consider upgrading your plan.
                </p>
              )}
            </div>
          )}

          {/* Project Selection */}
          {!projectId && (
            <div className="space-y-2">
              <Label htmlFor="project">
                Project <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Invoice Number (Auto-generated) */}
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number (auto)</Label>
            <Input
              id="invoiceNumber"
              value={formData.invoiceNumber || "Will be assigned automatically"}
              readOnly
              disabled
            />
          </div>

          {/* Vendor (from vendor list) */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Select
              value={formData.vendorId}
              onValueChange={(value) =>
                setFormData({ ...formData, vendorId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(vendors) && vendors.length > 0 ? (
                  vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No vendors found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the invoice items or services..."
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Category and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="permits">Permits</SelectItem>
                  <SelectItem value="professional-fees">
                    Professional Fees
                  </SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="contingency">Contingency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount (₦) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setFormData({
                      ...formData,
                      dueDate: date?.toISOString(),
                    });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information or notes..."
              rows={2}
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>

            {/* Existing Attachments (Edit Mode) */}
            {isEditMode && (
              <div className="mb-4">
                {loadingExistingAttachments ? (
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Loading attachments...
                    </span>
                  </div>
                ) : existingAttachments.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Current Attachments:
                    </p>
                    {existingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatBytes(attachment.fileSize)} • Uploaded{" "}
                              {new Date(
                                attachment.uploadedAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border text-center">
                    <p className="text-sm text-gray-500">
                      No attachments for this invoice
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Drag & Drop Zone (Create Mode Only) */}
            {!isEditMode && (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, PNG, JPG, DOC, XLS up to 50MB per file
                </p>
              </div>
            )}

            {/* Attachment List (Create Mode Only) */}
            {!isEditMode && attachments.length > 0 && (
              <div className="space-y-2 mt-4">
                {attachments.map((attachment) => (
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
                      {attachment.uploadStatus === "pending" && (
                        <span className="text-xs text-gray-500">Pending</span>
                      )}
                      {attachment.uploadStatus === "uploading" && (
                        <span className="text-xs text-blue-600">
                          Uploading...
                        </span>
                      )}
                      {attachment.uploadStatus === "success" && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {attachment.uploadStatus === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">
                    Total: {formatBytes(getTotalAttachmentSize())}
                  </span>
                  <span className="text-xs text-gray-500">
                    {attachments.length} file(s)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid() || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Invoice"
                : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceModal;
